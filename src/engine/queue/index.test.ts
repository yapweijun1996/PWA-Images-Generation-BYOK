// @vitest-environment node
import 'fake-indexeddb/auto'
import { deleteDB } from 'idb'
import { afterEach, expect, it, vi } from 'vitest'
import { DATABASE_NAME, openStorage } from '@engine/storage'
import { enqueueGeneration, processJob } from './index'

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
