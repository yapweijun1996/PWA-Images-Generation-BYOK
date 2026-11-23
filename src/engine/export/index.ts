import { Zip, ZipPassThrough, strToU8 } from 'fflate'
import { openStorage } from '@engine/storage'
import type { Project } from '@engine/types'
import { MAX_BYTES, MAX_ENTRIES, checksum, imagePath, manifest, validateLinks } from './format'
const extensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' }

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
    const chunks: Blob[] = []
    let size = 0
    const archive = new Zip((error, chunk) => {
      if (error) throw error
      size += chunk.byteLength
      if (size > MAX_BYTES) throw new Error('Project backup exceeds 256 MiB.')
      chunks.push(new Blob([chunk]))
    })
    function append(name: string, bytes: Uint8Array<ArrayBuffer>) {
      const entry = new ZipPassThrough(name)
      archive.add(entry)
      entry.push(bytes, true)
    }

    const records = []
    for (const [i, asset] of assets.entries()) {
      const bytes = new Uint8Array(await (await storage.readAsset(asset.id)).arrayBuffer())
      records.push({ ...asset, sha256: await checksum(bytes) })
      append(imagePath(i), bytes)
    }
    const data = manifest.parse({ format: 'pwa-images-project', version: 1, project, assets: records, versions })
    validateLinks(data)
    append('manifest.json', strToU8(JSON.stringify(data)))
    archive.end()
    return new Blob(chunks, { type: 'application/zip' })
  } finally { storage.db.close() }
}

export async function downloadProjectBackup(projectId: string) {
  download(await exportProjectBackup(projectId), 'project-' + projectId + '.zip')
}

export async function importProjectBackup(file: Blob): Promise<Project> {
  if (typeof Worker !== 'function') {
    const { restoreProjectBackup } = await import('./restore')
    return restoreProjectBackup(file)
  }
  return new Promise((resolve, reject) => {
    const worker = new Worker(new URL('./restore.worker.ts', import.meta.url), { type: 'module' })
    function failed() {
      worker.terminate()
      reject(new Error('Restore could not finish. Check the project list before trying again.'))
    }
    worker.onmessage = ({ data }: MessageEvent<{ project: Project } | { error: string }>) => {
      worker.terminate()
      if ('error' in data) reject(new Error(data.error))
      else resolve(data.project)
    }
    worker.onerror = failed
    worker.onmessageerror = failed
    try { worker.postMessage(file) } catch { failed() }
  })
}
