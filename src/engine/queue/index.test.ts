// @vitest-environment node
import 'fake-indexeddb/auto'
import { deleteDB } from 'idb'
import { afterEach, expect, it, vi } from 'vitest'
import { DATABASE_NAME, openStorage } from '@engine/storage'
import { enqueueBatch, enqueueGeneration, processJob } from './index'

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
