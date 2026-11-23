// @vitest-environment node
import 'fake-indexeddb/auto'
import { deleteDB } from 'idb'
import { afterEach, expect, it, vi } from 'vitest'
import { DATABASE_NAME, openStorage } from '@engine/storage'
import { enqueueBatch, enqueueGeneration, processJob, subscribeToJobChanges, watchRunningJob } from './index'

afterEach(async () => { vi.unstubAllGlobals(); await deleteDB(DATABASE_NAME) })

it('reopens a queued job, persists its image and history, and protects an interrupted request from resubmission', async () => {
  vi.stubGlobal('navigator', { locks: { request: async (_key: string, _options: object, callback: (lock: object) => Promise<void>) => callback({}) } })
  let storage = await openStorage()
  try {
    await storage.db.add('projects', { id: 'p', name: 'Example', studioId: 'manga', createdAt: '', updatedAt: '' })
    const job = await enqueueGeneration(storage, 'p', { model: 'test', providerId: 'test', prompt: 'Leaf', settings: { size: 'auto', count: 1 }, referenceAssetIds: [] })
    storage.db.close()
    storage = await openStorage()
    const generate = vi.fn(async () => ({ images: [{ blob: new Blob(['pixels'], { type: 'image/png' }) }] }))
    const provider = { id: 'test', generate, getCapabilities: async () => ({ models: [] }) }
    await processJob(storage, job.id, provider)
    const done = await storage.db.get('jobs', job.id)
    expect(done?.status).toBe('succeeded')
    expect((await storage.db.get('versions', done!.versionId!))?.provenance.prompt).toBe('Leaf')
    const interrupted = { ...job, id: 'interrupted', status: 'running' as const }
    await storage.db.add('jobs', interrupted)
    await processJob(storage, interrupted.id, provider)
    await processJob(storage, job.id, provider)
    expect(generate).toHaveBeenCalledTimes(1)
    expect((await storage.db.get('jobs', interrupted.id))?.status).toBe('uncertain')
  } finally { storage.db.close() }
})

it('persists all approved batch items and stops the remainder after an uncertain response', async () => {
  vi.stubGlobal('navigator', { locks: { request: async (_key: string, _options: object, callback: (lock: object) => Promise<void>) => callback({}) } })
  const store = await openStorage()
  try {
    const batch = await enqueueBatch(store, 'p', { model: 'test', providerId: 'test', prompt: 'Leaf', settings: { size: 'auto', count: 1 }, referenceAssetIds: [] }, 3)
    expect(await store.db.count('jobs')).toBe(3)
    const generate = vi.fn().mockRejectedValue(new Error('Connection lost'))
    const provider = { id: 'test', generate, getCapabilities: async () => ({ models: [] }) }
    for (const job of batch) await processJob(store, job.id, provider)
    expect(generate).toHaveBeenCalledTimes(1)
    expect(await Promise.all(batch.map(async job => (await store.db.get('jobs',job.id))?.status))).toEqual(['uncertain','failed','failed'])
  } finally {store.db.close()}
})

it('notifies project readers after commit, including the version saved with a completed job', async () => {
  vi.stubGlobal('window', new EventTarget())
  vi.stubGlobal('navigator', { locks: { request: async (_key: string, _options: object, callback: (lock: object) => Promise<void>) => callback({}) } })
  const store = await openStorage()
  const updates: Promise<unknown>[] = []
  const unrelated = vi.fn()
  const unsubscribe = subscribeToJobChanges('p', () => {
    const snapshot = store.db.transaction(['jobs', 'versions'])
    updates.push(Promise.all([snapshot.objectStore('jobs').getAll(), snapshot.objectStore('versions').count()])
      .then(([jobs, versions]) => ({ status: jobs[0]?.status, versions })))
  })
  const unsubscribeUnrelated = subscribeToJobChanges('other', unrelated)
  try {
    await store.db.add('projects', { id: 'p', name: 'Example', studioId: 'manga', createdAt: '', updatedAt: '' })
    const request = { model: 'test', providerId: 'test', prompt: 'Leaf', settings: { size: 'auto', count: 1 }, referenceAssetIds: [] }
    const job = await enqueueGeneration(store, 'p', request)
    const provider = { id: 'test', generate: async () => ({ images: [{ blob: new Blob(['pixels'], { type: 'image/png' }) }] }),
      getCapabilities: async () => ({ models: [] }) }
    await processJob(store, job.id, provider)
    expect(await Promise.all(updates)).toEqual([
      { status: 'queued', versions: 0 }, { status: 'running', versions: 0 }, { status: 'succeeded', versions: 1 },
    ])
    expect(unrelated).not.toHaveBeenCalled()
    unsubscribe()
    await enqueueGeneration(store, 'p', request)
    expect(updates).toHaveLength(3)
  } finally { unsubscribe(); unsubscribeUnrelated(); store.db.close() }
})

it('waits for the owner and settles only the interrupted batch and its unsent dependents', async () => {
  let releaseOwner!: () => void
  const released = new Promise<void>(resolve => { releaseOwner = resolve })
  const lock = vi.fn(async (_key: string, _options: object, callback: () => Promise<void>) => {
    await released
    await callback()
  })
  vi.stubGlobal('navigator', { locks: { request: lock } })
  const storage = await openStorage()
  let recovery: Promise<void> | undefined
  try {
    const request = { model: 'test', providerId: 'test', prompt: 'Leaf', settings: { size: 'auto', count: 1 }, referenceAssetIds: [] }
    const [running, ...remaining] = await enqueueBatch(storage, 'p', request, 4)
    await storage.db.put('jobs', { ...running, status: 'running' })
    const unrelated = await enqueueGeneration(storage, 'p', request)
    const signal = new AbortController().signal
    recovery = watchRunningJob(running.id, signal)
    expect(lock).toHaveBeenCalledWith('image-generation:' + running.id, { signal }, expect.any(Function))
    expect((await storage.db.get('jobs', running.id))?.status).toBe('running')

    releaseOwner()
    await recovery
    expect((await storage.db.get('jobs', running.id))?.status).toBe('uncertain')
    expect(await Promise.all(remaining.map(async job => (await storage.db.get('jobs', job.id))?.status)))
      .toEqual(['failed', 'failed', 'failed'])
    expect((await storage.db.get('jobs', unrelated.id))?.status).toBe('queued')
    expect(await storage.db.count('versions')).toBe(0)
  } finally { releaseOwner(); await recovery?.catch(() => {}); storage.db.close() }
})
