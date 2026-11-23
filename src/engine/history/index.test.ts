// @vitest-environment node
import 'fake-indexeddb/auto'
import { deleteDB } from 'idb'
import { afterEach, beforeEach, expect, it } from 'vitest'
import { DATABASE_NAME, openStorage } from '@engine/storage'
import { appendVersion, listVersions, type NewVersion } from './index'

const draft: NewVersion = {
  projectId: 'p', assetId: 'output',
  provenance: {
    providerId: 'openai', model: 'image', prompt: 'A blue sky',
    settings: { size: 'auto', count: 1 }, referenceAssetIds: ['reference'],
  },
}

beforeEach(async () => {
  const { db } = await openStorage()
  try {
    for (const id of ['p', 'other']) {
      await db.add('projects', { id, name: id, studioId: 'manga', createdAt: '', updatedAt: '' })
    }
    for (const [id, projectId] of [['output', 'p'], ['reference', 'p'], ['foreign', 'other']]) {
      await db.add('assets', { id, projectId, source: 'generated', mediaType: 'image/png', byteLength: 1, createdAt: '' })
    }
  } finally { db.close() }
})
afterEach(() => deleteDB(DATABASE_NAME))

it('preserves each generation and edit with detached provenance and project isolation', async () => {
  const original = { ...draft, provenance: { ...draft.provenance, apiKey: 'excluded-test-field' } }
  const first = await appendVersion(original)
  original.provenance.prompt = 'changed after persistence'
  const next = await appendVersion({ ...original, parentVersionId: first.id })
  expect(next.id).not.toBe(first.id)
  const history = await listVersions('p')
  expect(history).toHaveLength(2)
  expect(history.map(v => v.createdAt)).toEqual(history.map(v => v.createdAt).sort().reverse())
  expect(history.find(v => v.id === first.id)?.provenance).toEqual(draft.provenance)
  expect(history.find(v => v.id === next.id)?.parentVersionId).toBe(first.id)
  expect(await listVersions('other')).toEqual([])
})

it('rejects missing and cross-project lineage without inserting a partial version', async () => {
  const foreign = await appendVersion({ ...draft, assetId: 'foreign', projectId: 'other', provenance: { ...draft.provenance, referenceAssetIds: [] } })
  for (const changes of [
    { projectId: 'missing' }, { assetId: 'missing' }, { assetId: 'foreign' },
    { parentVersionId: 'missing' }, { parentVersionId: foreign.id },
    { provenance: { ...draft.provenance, referenceAssetIds: ['foreign'] } },
    { provenance: { ...draft.provenance, maskAssetId: 'foreign' } },
  ]) {
    await expect(appendVersion({ ...draft, ...changes })).rejects.toThrow()
  }
  expect(await listVersions('p')).toEqual([])
})
