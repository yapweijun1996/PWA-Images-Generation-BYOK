// @vitest-environment node
import 'fake-indexeddb/auto'
import { deleteDB } from 'idb'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { DATABASE_NAME, openStorage } from './index'
import { loadDraft, patchProject, saveDraft } from './draft'

beforeEach(async () => {
  const { db } = await openStorage()
  try {
    for (const id of ['p', 'other']) {
      await db.add('projects', { id, name: id, studioId: 'manga', createdAt: '2026-11-23', updatedAt: '2026-11-23' })
    }
  } finally { db.close() }
})
afterEach(async () => {
  vi.unstubAllGlobals()
  await deleteDB(DATABASE_NAME)
})

it('preserves a prepared generation across reopen and independently merges concurrent metadata changes', async () => {
  const edit = { maskAssetId: 'mask', promptHint: 'Extend this room.', count: 3 }
  const draft = { prompt: 'A room', referenceAssetIds: ['source', 'style'], edit, modelId: 'model',
    size: 'auto', quality: 'high', parentVersionId: 'v1', stageId: 'render' }
  await Promise.all([
    saveDraft('p', draft),
    patchProject('p', { board: { panels: [{ assetId: 'a', caption: 'hello' }], reviewed: true } }),
    ...['a', 'b'].map(asset => patchProject('p', current => ({ reviewedAssetIds: [...(current.reviewedAssetIds ?? []), asset] }))),
  ])
  const project = await patchProject('p', { studioId: 'interior' })
  expect(project.board?.panels[0].caption).toBe('hello')
  expect(new Set(project.reviewedAssetIds)).toEqual(new Set(['a','b']))
  expect(await loadDraft('p')).toEqual(draft)
  expect((await loadDraft('other')).referenceAssetIds).toEqual([])
  await Promise.all([saveDraft('p', { prompt: 'Updated room' }), saveDraft('p', { edit: undefined })])
  expect(await loadDraft('p')).toEqual({ ...draft, prompt: 'Updated room', edit: undefined })
})

it('migrates the legacy prompt on the first field edit and preserves an intentionally cleared draft', async () => {
  vi.stubGlobal('localStorage', { getItem: (key: string) => key === 'draft:p' ? 'Legacy prompt' : null })
  expect((await loadDraft('p')).prompt).toBe('Legacy prompt')
  expect((await saveDraft('p', { quality: 'high' })).prompt).toBe('Legacy prompt')
  await saveDraft('p', { prompt: '' })
  expect((await loadDraft('p')).prompt).toBe('')
  await expect(saveDraft('missing', { prompt: 'unassigned' })).rejects.toThrow('no longer exists')
})
