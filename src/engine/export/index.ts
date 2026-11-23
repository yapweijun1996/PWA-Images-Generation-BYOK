import { unzipSync, zipSync, strToU8, strFromU8 } from 'fflate'
import { openStorage } from '@engine/storage'
import { assetRecord, manifest, validateLinks, type Backup } from './format'

const MAX_BYTES = 256 * 1024 * 1024
const MAX_ENTRIES = 10001
const imagePath = (index: number) => 'images/' + index
const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

async function checksum(bytes: Uint8Array<ArrayBuffer>) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', bytes)), n => n.toString(16).padStart(2, '0')).join('')
}

export async function exportImage(assetId: string) {
  const storage = await openStorage()
  try { return await storage.readAsset(assetId) } finally { storage.db.close() }
}

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.append(link)
  try { link.click() } finally {
    link.remove()
    setTimeout(() => URL.revokeObjectURL(url), 60_000)
  }
}

export async function downloadImage(assetId: string) {
  const blob = await exportImage(assetId)
  const suffix = extensions[blob.type]
  if (!suffix) throw new Error('Unsupported image format.')
  download(blob, 'image-' + assetId + '.' + suffix)
}

export async function exportProjectBackup(projectId: string): Promise<Blob> {
  const storage = await openStorage()
  try {
    const tx = storage.db.transaction(['projects', 'assets', 'versions'])
    const [project, assets, versions] = await Promise.all([
      tx.objectStore('projects').get(projectId),
      tx.objectStore('assets').index('byProject').getAll(projectId),
      tx.objectStore('versions').index('byProject').getAll(projectId),
    ])
    if (!project) throw new Error('Project not found.')
    if (assets.length >= MAX_ENTRIES || assets.reduce((size, a) => size + a.byteLength, 0) > MAX_BYTES) {
      throw new Error('Project exceeds the 256 MiB or 10,000-image backup limit.')
    }
    const files: Record<string, Uint8Array<ArrayBuffer>> = {}
    const records = []
    for (const [i, asset] of assets.entries()) {
      const bytes = new Uint8Array(await (await storage.readAsset(asset.id)).arrayBuffer())
      files[imagePath(i)] = bytes
      records.push({ ...asset, sha256: await checksum(bytes) })
    }
    const data = manifest.parse({ format: 'pwa-images-project', version: 1, project, assets: records, versions })
    validateLinks(data)
    files['manifest.json'] = strToU8(JSON.stringify(data))
    const archive = zipSync(files, { level: 0 })
    if (archive.byteLength > MAX_BYTES) throw new Error('Project backup exceeds 256 MiB.')
    return new Blob([archive], { type: 'application/zip' })
  } finally { storage.db.close() }
}

export async function downloadProjectBackup(projectId: string) {
  download(await exportProjectBackup(projectId), 'project-' + projectId + '.zip')
}

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
    blobs.push(new Blob([bytes], { type: asset.mediaType }))
  }
  return { data, blobs }
}

function remap(data: Backup) {
  const project = { ...data.project, id: crypto.randomUUID() }
  const assetIds = new Map(data.assets.map(a => [a.id, crypto.randomUUID()]))
  if (project.board) project.board = { ...project.board, panels: project.board.panels.map(p => ({ ...p, assetId: assetIds.get(p.assetId)! })) }
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

export async function importProjectBackup(file: Blob) {
  const { data, blobs } = await unpack(file)
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
