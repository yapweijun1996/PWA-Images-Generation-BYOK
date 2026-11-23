import { openDB, type DBSchema, type IDBPDatabase } from 'idb'
import type { Asset, Project, Version } from '@engine/types'

export const DATABASE_NAME = 'pwa-images-generation-byok'
export interface StudioSchema extends DBSchema {
  jobs: { key: string; value: import('@engine/queue').GenerationJob; indexes: { byProject: string } }
  projects: { key: string; value: Project }
  assets: { key: string; value: Asset; indexes: { byProject: string } }
  versions: { key: string; value: Version; indexes: { byProject: string } }
  blobs: { key: string; value: Blob | { file: string } }
}

export class StorageError extends Error {
  constructor(readonly code: 'quota' | 'missing' | 'unavailable', message: string, cause?: unknown) {
    super(message, { cause })
  }
}

function errorName(error: unknown) {
  return typeof error === 'object' && error !== null && 'name' in error ? error.name : undefined
}

function translate(error: unknown): never {
  if (errorName(error) === 'QuotaExceededError') {
    throw new StorageError('quota', 'Device storage is full. Free space, then try saving again.', error)
  }
  throw error
}

function missing(): never {
  throw new StorageError('missing', 'This image is missing from device storage. Restore a project backup or import the image again.')
}

async function fileDirectory() {
  try {
    const root = await navigator.storage?.getDirectory?.()
    return await root?.getDirectoryHandle(DATABASE_NAME, { create: true })
  } catch (error) {
    if (errorName(error) === 'QuotaExceededError') translate(error)
    return undefined
  }
}

export async function openStorage() {
  let db: IDBPDatabase<StudioSchema>
  try {
    db = await openDB<StudioSchema>(DATABASE_NAME, 3, {
      upgrade(database, previous, _next, transaction) {
        if (previous < 1) {
          database.createObjectStore('projects', { keyPath: 'id' })
          database.createObjectStore('assets', { keyPath: 'id' })
          database.createObjectStore('versions', { keyPath: 'id' })
          database.createObjectStore('blobs')
        }
        if (previous < 3) database.createObjectStore('jobs', { keyPath: 'id' }).createIndex('byProject', 'projectId')
        if (previous < 2) {
          transaction.objectStore('assets').createIndex('byProject', 'projectId')
          transaction.objectStore('versions').createIndex('byProject', 'projectId')
        }
      },
      blocking() { db.close() },
    })
  } catch (error) {
    if (errorName(error) === 'QuotaExceededError') translate(error)
    throw new StorageError('unavailable', 'Device storage is unavailable. Check browser storage settings and reopen the app.', error)
  }
  return new StudioStorage(db)
}

export class StudioStorage {
  constructor(readonly db: IDBPDatabase<StudioSchema>) {}

  async saveAsset(asset: Asset, blob: Blob, completion?: {
    job: import('@engine/queue').GenerationJob; version: Version
  }) {
    if (asset.byteLength !== blob.size || asset.mediaType !== blob.type) {
      throw new Error('Asset metadata does not match image data.')
    }
    const directory = await fileDirectory()
    let file: string | undefined
    try {
      if (directory) {
        file = crypto.randomUUID()
        const handle = await directory.getFileHandle(file, { create: true })
        const writer = await handle.createWritable()
        try {
          await writer.write(blob)
          await writer.close()
        } catch (error) {
          await writer.abort().catch(() => {})
          throw error
        }
      }
      const tx = this.db.transaction(['assets', 'blobs', 'jobs', 'versions', 'projects'], 'readwrite')
      if (completion) {
        const { job, version } = completion
        const parent = version.parentVersionId ? await tx.objectStore('versions').get(version.parentVersionId) : undefined
        const current = await tx.objectStore('jobs').get(job.id)
        const project = await tx.objectStore('projects').getKey(asset.projectId)
        if (!project || current?.status !== 'running' || current.projectId !== asset.projectId ||
          version.projectId !== asset.projectId || version.assetId !== asset.id ||
          (version.parentVersionId && parent?.projectId !== asset.projectId)) {
          throw new Error('The generation record or project changed while the image was being created.')
        }
      }
      await Promise.all([
        tx.done,
        ...(completion ? [
          tx.objectStore('versions').add(completion.version),
          tx.objectStore('jobs').put({ ...completion.job, status: 'succeeded', versionId: completion.version.id }),
        ] : []),
        tx.objectStore('assets').add(asset),
        tx.objectStore('blobs').add(file ? { file } : blob, asset.id),
      ])
    } catch (error) {
      if (file && directory) await directory.removeEntry(file).catch(() => {})
      translate(error)
    }
  }

  async readAsset(id: string): Promise<Blob> {
    const [asset, entry] = await Promise.all([this.db.get('assets', id), this.db.get('blobs', id)])
    if (!asset || !entry) return missing()
    let blob: Blob
    if ('file' in entry) {
      const directory = await fileDirectory()
      if (!directory) throw new StorageError('unavailable', 'Image storage is unavailable. Reopen the app with device storage enabled.')
      try {
        const handle = await directory.getFileHandle(entry.file)
        blob = await handle.getFile()
      } catch (error) {
        if (errorName(error) === 'NotFoundError') return missing()
        throw error
      }
    } else {
      blob = entry
    }
    if (blob.size !== asset.byteLength) return missing()
    return blob.slice(0, blob.size, asset.mediaType)
  }
}
