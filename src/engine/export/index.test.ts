// @vitest-environment node
import 'fake-indexeddb/auto'
import { deleteDB } from 'idb'
import { zipSync, unzipSync, strFromU8, strToU8 } from 'fflate'
import { expect, it, afterEach, beforeEach } from 'vitest'
import { loadDraft, saveDraft, patchProject } from '@engine/storage/draft'
import { DATABASE_NAME, openStorage } from '@engine/storage'
import { exportImage, exportProjectBackup, importProjectBackup } from './index'

const timestamp = '2026-11-23T12:00:00.000Z'
const secret = 'excluded-key-test'
beforeEach(async () => {
  const storage = await openStorage()
  try {
    for (const id of ['source', 'other']) {
      const project = { id, name: id, studioId: 'manga', createdAt: timestamp, updatedAt: timestamp, apiKey: secret }
      await storage.db.add('projects', project)
    }
    for (const [id, projectId] of [['output', 'source'], ['ref', 'source'], ['private', 'other']]) {
      const blob = new Blob([id], { type: 'image/png' })
      await storage.saveAsset({ id, projectId, source: 'generated', byteLength: blob.size, mediaType: blob.type, createdAt: timestamp }, blob)
    }
    for (const id of ['v1', 'v2']) {
      const record = { id, projectId: 'source', assetId: 'output', createdAt: timestamp,
        parentVersionId: id === 'v2' ? 'v1' : undefined,
        provenance: { providerId: 'openai', model: 'image', prompt: 'sky', settings: { size: 'auto', count: 1, secret },
          referenceAssetIds: ['ref'], maskAssetId: 'ref', apiKey: secret } }
      await storage.db.add('versions', record)
    }
  } finally { storage.db.close() }
})
afterEach(() => deleteDB(DATABASE_NAME))

it('round-trips native bytes and lineage into independent copies without keys or unrelated records', async () => {
  const archive = await exportProjectBackup('source')
  const files = unzipSync(new Uint8Array(await archive.arrayBuffer()))
  const metadata = strFromU8(files['manifest.json'])
  expect(metadata).not.toContain(secret)
  expect(metadata).not.toContain('private')
  const p = await importProjectBackup(archive)
  const legacy = new Blob([zipSync(files, { level: 0 })], { type: 'application/zip' })
  const copy = await importProjectBackup(legacy)
  expect(new Set(['source', p.id, copy.id]).size).toBe(3)
  const storage = await openStorage()
  try {
    const assets = await storage.db.getAllFromIndex('assets', 'byProject', p.id)
    const versions = await storage.db.getAllFromIndex('versions', 'byProject', p.id)
    expect(await storage.db.countFromIndex('assets', 'byProject', copy.id)).toBe(2)
    expect(assets).toHaveLength(2)
    expect(versions).toHaveLength(2)
    const edit = versions.find(v => v.parentVersionId)!
    const parent = versions.find(v => !v.parentVersionId)!
    expect(edit.parentVersionId).toBe(parent.id)
    expect(edit.parentVersionId).not.toBe('v1')
    expect(edit.provenance.maskAssetId).toBe(edit.provenance.referenceAssetIds[0])
    expect(await (await exportImage(edit.assetId)).text()).toBe('output')
    expect(await (await exportImage(edit.provenance.maskAssetId!)).text()).toBe('ref')
    expect((await storage.db.get('versions', 'v2'))?.parentVersionId).toBe('v1')
  } finally { storage.db.close() }
})

it('rejects damaged bytes, unknown entries and invalid references before restoring anything', async () => {
  const archive = await exportProjectBackup('source')
  const bytes = new Uint8Array(await archive.arrayBuffer())
  for (const defect of ['integrity', 'entry', 'reference', 'cycle']) {
    const files = unzipSync(bytes)
    if (defect === 'integrity') files['images/0'][0] ^= 1
    if (defect === 'entry') files['other.json'] = strToU8('{}')
    const data = JSON.parse(strFromU8(files['manifest.json']))
    if (defect === 'reference') data.versions[0].assetId = 'private'
    if (defect === 'cycle') data.versions[0].parentVersionId = data.versions[0].id
    files['manifest.json'] = strToU8(JSON.stringify(data))
    await expect(importProjectBackup(new Blob([zipSync(files, { level: 0 })]))).rejects.toThrow()
  }
  const storage = await openStorage()
  try {
    expect(await storage.db.count('projects')).toBe(2)
    expect(await storage.db.count('assets')).toBe(3)
  } finally { storage.db.close() }
})

it('restores an unfinished masked batch with references and lineage remapped into its own project', async () => {
  const draft = { prompt: 'Change the sky', modelId: 'model', size: 'auto', quality: 'high', stageId: 'panel',
    referenceAssetIds: ['ref'], edit: { maskAssetId: 'output', promptHint: 'Keep the lighting', background: 'opaque' as const, count: 3 }, parentVersionId: 'v2' }
  await patchProject('source', { referenceLocks: {character:'ref',style:'output'}, trashedAssetIds:['output'] })
  await saveDraft('source', draft)
  const restored = await importProjectBackup(await exportProjectBackup('source'))
  const copy = await loadDraft(restored.id)
  expect(copy.prompt).toBe(draft.prompt)
  expect(restored.referenceLocks?.character).toBe(copy.referenceAssetIds[0])
  expect(restored.referenceLocks?.style).toBe(copy.edit?.maskAssetId)
  expect(restored.trashedAssetIds).toEqual([copy.edit?.maskAssetId])
  expect(copy.stageId).toBe(draft.stageId)
  expect(copy.edit?.count).toBe(3)
  expect(copy.edit?.background).toBe('opaque')
  expect(copy.parentVersionId).not.toBe(draft.parentVersionId)
  const { db } = await openStorage()
  try {
    for (const id of [copy.edit!.maskAssetId!, ...copy.referenceAssetIds]) {
      expect((await db.get('assets', id))?.projectId).toBe(restored.id)
    }
    expect((await db.get('versions', copy.parentVersionId!))?.projectId).toBe(restored.id)
  } finally { db.close() }
  expect(await loadDraft('source')).toEqual(draft)
})
