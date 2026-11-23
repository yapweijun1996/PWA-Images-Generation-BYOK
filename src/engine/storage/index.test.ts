// @vitest-environment node
import 'fake-indexeddb/auto'
import { deleteDB, openDB } from 'idb'
import { afterEach, expect, it, vi } from 'vitest'
import { DATABASE_NAME, openStorage, type StudioSchema } from './index'
import type { Asset } from '@engine/types'

const blob = new Blob(['pixels'], { type: 'image/png' })
const asset: Asset = { id: 'a', projectId: 'p', source: 'imported', mediaType: blob.type, byteLength: blob.size, createdAt: '2026-11-23' }

afterEach(async () => {
  vi.unstubAllGlobals()
  await deleteDB(DATABASE_NAME)
})

it('upgrades v1 data in place and indexes existing assets', async () => {
  const old = await openDB<StudioSchema>(DATABASE_NAME, 1, { upgrade(db) {
    db.createObjectStore('projects', { keyPath: 'id' })
    db.createObjectStore('assets', { keyPath: 'id' })
    db.createObjectStore('versions', { keyPath: 'id' })
    db.createObjectStore('blobs')
  } })
  await old.add('assets', asset)
  await old.add('blobs', blob, asset.id)
  old.close()
  const store = await openStorage()
  try {
    expect(await store.db.getAllKeysFromIndex('assets', 'byProject', 'p')).toEqual(['a'])
    expect(await (await store.readAsset('a')).text()).toBe('pixels')
  } finally { store.db.close() }
})

it('preserves existing data on duplicate insert and reports an evicted blob', async () => {
  const store = await openStorage()
  try {
    await store.saveAsset(asset, blob)
    await expect(store.saveAsset(asset, blob)).rejects.toThrow()
    expect(await (await store.readAsset('a')).text()).toBe('pixels')
    await store.db.delete('blobs', 'a')
    await expect(store.readAsset('a')).rejects.toMatchObject({ code: 'missing' })
  } finally { store.db.close() }
})

it('explains an OPFS quota failure without publishing partial metadata', async () => {
  const removeEntry = vi.fn().mockResolvedValue(undefined)
  const directory = { removeEntry, getFileHandle: async () => { throw new DOMException('Full', 'QuotaExceededError') } }
  vi.stubGlobal('navigator', { storage: { getDirectory: async () => ({ getDirectoryHandle: async () => directory }) } })
  const store = await openStorage()
  try {
    await expect(store.saveAsset(asset, blob)).rejects.toMatchObject({ code: 'quota' })
    expect(await store.db.count('assets')).toBe(0)
  } finally { store.db.close() }
})

it.each([{}, { createWritable: async () => { throw new DOMException('Transient failure', 'UnknownError') } }])(
  'stores bytes in IndexedDB when OPFS writes are unavailable', async handle => {
  const directory = { removeEntry: vi.fn().mockResolvedValue(undefined), getFileHandle: async () => handle }
  vi.stubGlobal('navigator', { storage: { getDirectory: async () => ({ getDirectoryHandle: async () => directory }) } })
  const store = await openStorage()
  try {
    await store.saveAsset(asset, blob)
    expect(directory.removeEntry).toHaveBeenCalledOnce()
    expect(await store.db.get('blobs', asset.id)).toBeInstanceOf(ArrayBuffer)
    expect(await (await store.readAsset(asset.id)).text()).toBe('pixels')
  } finally { store.db.close() }
})
