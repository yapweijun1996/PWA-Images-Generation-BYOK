import { unzipSync, strFromU8 } from 'fflate'
import { openStorage } from '@engine/storage'
import { MAX_BYTES, MAX_ENTRIES, assetRecord, checksum, imagePath, manifest, validateLinks, type Backup } from './format'

async function unpack(file: Blob) {
  if (file.size > MAX_BYTES) throw new Error('Project backup exceeds 256 MiB.')
  const names = new Set<string>()
  let total = 0
  const files = unzipSync(new Uint8Array(await file.arrayBuffer()), { filter(entry) {
    if (entry.compression !== 0 || entry.originalSize !== entry.size ||
        !/^(manifest\.json|images\/(0|[1-9]\d*))$/.test(entry.name) || names.has(entry.name)) {
      throw new Error('Unsupported project backup entry.')
    }
    names.add(entry.name)
    total += entry.size
    if (total > MAX_BYTES || names.size > MAX_ENTRIES) throw new Error('Project backup exceeds size limits.')
    return true
  } })
  if (!files['manifest.json']) throw new Error('Backup manifest missing.')
  const data = manifest.parse(JSON.parse(strFromU8(files['manifest.json'])))
  if (names.size !== data.assets.length + 1) throw new Error('Backup file list does not match manifest.')
  validateLinks(data)
  const blobs = []
  for (const [i, asset] of data.assets.entries()) {
    const bytes = files[imagePath(i)]
    if (!bytes || bytes.length !== asset.byteLength || await checksum(bytes) !== asset.sha256) {
      throw new Error('Backup image is missing or damaged.')
    }
    blobs.push(bytes.byteOffset === 0 && bytes.byteLength === bytes.buffer.byteLength ? bytes.buffer : bytes.slice().buffer)
  }
  return { data, blobs }
}

function remap(data: Backup) {
  const project = { ...data.project, id: crypto.randomUUID(), defaultName: data.project.defaultName ?? (data.project.id === 'first-project' && data.project.name === 'Untitled project') }
  const assetIds = new Map(data.assets.map(a => [a.id, crypto.randomUUID()]))
  if (project.board) project.board = { ...project.board, panels: project.board.panels.map(p => ({ ...p, assetId: assetIds.get(p.assetId)! })) }
  if (project.referenceLocks) project.referenceLocks = {
    character: project.referenceLocks.character && assetIds.get(project.referenceLocks.character),
    style: project.referenceLocks.style && assetIds.get(project.referenceLocks.style),
  }
  if (project.trashedAssetIds) project.trashedAssetIds = project.trashedAssetIds.map(id => assetIds.get(id)!)
  if (project.reviewedAssetIds) project.reviewedAssetIds = project.reviewedAssetIds.map(id => assetIds.get(id)!)
  const versionIds = new Map(data.versions.map(v => [v.id, crypto.randomUUID()]))
  if (project.draft) {
    const draft = project.draft
    project.draft = { ...draft,
      referenceAssetIds: draft.referenceAssetIds.map(id => assetIds.get(id)!),
      parentVersionId: draft.parentVersionId && versionIds.get(draft.parentVersionId),
      edit: draft.edit && { ...draft.edit, maskAssetId: draft.edit.maskAssetId && assetIds.get(draft.edit.maskAssetId) },
    }
  }
  const assets = data.assets.map(asset => assetRecord.parse({
    ...asset, projectId: project.id, id: assetIds.get(asset.id)!,
  }))
  const versions = data.versions.map(v => ({
    ...v, id: versionIds.get(v.id)!, projectId: project.id, assetId: assetIds.get(v.assetId)!,
    parentVersionId: v.parentVersionId && versionIds.get(v.parentVersionId),
    provenance: {
      ...v.provenance, referenceAssetIds: v.provenance.referenceAssetIds.map(id => assetIds.get(id)!),
      maskAssetId: v.provenance.maskAssetId && assetIds.get(v.provenance.maskAssetId),
    },
  }))
  return { project, assets, versions }
}

export async function restoreProjectBackup(file: Blob) {
  const { data, blobs } = await unpack(file).catch(error => {
    // ZIP, JSON and schema libraries may include untrusted archive contents in diagnostics.
    if (error instanceof SyntaxError || error?.name === 'ZodError' || typeof error?.code === 'number') {
      throw new Error('Invalid project backup. Choose a ZIP exported by the studio.', { cause: error })
    }
    throw error
  })
  const { project, assets, versions } = remap(data)
  const { db } = await openStorage()
  try {
    // Inline blobs share this transaction with metadata so a failed restore leaves no partial project.
    const tx = db.transaction(['projects', 'assets', 'versions', 'blobs'], 'readwrite')
    await Promise.all([
      tx.done, tx.objectStore('projects').add(project),
      ...assets.flatMap((asset, i) => [tx.objectStore('assets').add(asset), tx.objectStore('blobs').add(blobs[i], asset.id)]),
      ...versions.map(version => tx.objectStore('versions').add(version)),
    ])
    return project
  } catch (error) {
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      throw new Error('Device storage is full. Free space and restore the backup again.', { cause: error })
    }
    throw error
  } finally { db.close() }
}
