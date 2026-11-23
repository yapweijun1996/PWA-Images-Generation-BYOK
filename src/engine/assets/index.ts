import { openStorage } from '@engine/storage'
import type { Asset } from '@engine/types'

export async function listAssets(projectId: string): Promise<readonly Asset[]> {
  const store = await openStorage()
  try { return await store.db.getAllFromIndex('assets', 'byProject', projectId) }
  finally { store.db.close() }
}

export async function importReference(projectId: string, file: File) {
  if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type) || file.size > 20 * 1024 * 1024) {
    throw new Error('Choose a PNG, JPEG or WebP image under 20 MB.')
  }
  const bitmap = await createImageBitmap(file)
  const dimensions = { width: bitmap.width, height: bitmap.height }
  bitmap.close()
  const asset: Asset = { id: crypto.randomUUID(), projectId, source: 'imported', mediaType: file.type,
    byteLength: file.size, createdAt: new Date().toISOString(), dimensions }
  const store = await openStorage()
  try { await store.saveAsset(asset, file); return asset } finally { store.db.close() }
}
