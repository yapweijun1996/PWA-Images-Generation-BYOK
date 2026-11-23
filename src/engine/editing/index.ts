import { canvas, png } from './canvas'
import { openStorage } from '@engine/storage'
import type { Asset } from '@engine/types'

export interface PreparedEdit {
  referenceAssetIds: string[]
  maskAssetId?: string
  promptHint?: string
  count: number
}

export interface Point { x: number; y: number }
export interface Stroke { points: Point[]; radius: number }
export type Expansion = 'left' | 'right' | 'top' | 'bottom' | 'all'

export function frame(width: number, height: number, edge: Expansion, fraction: number) {
  if (!(fraction > 0 && fraction <= 1)) throw new Error('Invalid expansion size.')
  const horizontal = Math.max(1, Math.round(width * fraction))
  const vertical = Math.max(1, Math.round(height * fraction))
  const x = edge === 'left' || edge === 'all' ? horizontal : 0
  const y = edge === 'top' || edge === 'all' ? vertical : 0
  return { x, y, width: width + x + (edge === 'right' || edge === 'all' ? horizontal : 0),
    height: height + y + (edge === 'bottom' || edge === 'all' ? vertical : 0) }
}

export async function renderEdit(source: ImageBitmap, region: Stroke[] | { edge: Expansion; fraction: number }) {
  if (!Array.isArray(region)) {
    const expanded = frame(source.width, source.height, region.edge, region.fraction)
    const image = canvas(expanded.width, expanded.height)
    image.drawImage(source, expanded.x, expanded.y)
    const mask = canvas(expanded.width, expanded.height)
    mask.fillRect(expanded.x, expanded.y, source.width, source.height)
    return { width: expanded.width, height: expanded.height, image: await png(image), mask: await png(mask) }
  }
  if (!region.some(stroke => stroke.points.length)) throw new Error('Select an area to edit.')
  const { width, height } = source
  const mask = canvas(width, height)
  mask.fillRect(0, 0, width, height)
  mask.globalCompositeOperation = 'destination-out'
  mask.lineCap = 'round'
  mask.lineJoin = 'round'
  for (const { points, radius } of region) {
    if (!points.length) continue
    mask.beginPath()
    const first = points[0]
    const pixels = radius * Math.min(width, height)
    mask.arc(first.x * width, first.y * height, pixels, 0, 2 * Math.PI)
    mask.fill()
    mask.beginPath()
    mask.moveTo(first.x * width, first.y * height)
    for (const point of points.slice(1)) mask.lineTo(point.x * width, point.y * height)
    mask.lineWidth = pixels * 2
    mask.stroke()
  }
  return { width, height, image: undefined, mask: await png(mask) }
}

export async function saveEdit(projectId: string, sourceId: string, region: Parameters<typeof renderEdit>[1]) {
  const store = await openStorage()
  try {
    const original = await store.db.get('assets', sourceId)
    if (original?.projectId !== projectId) throw new Error('Select an image from this project.')
    const bitmap = await createImageBitmap(await store.readAsset(sourceId))
    let result
    try { result = await renderEdit(bitmap, region) } finally { bitmap.close() }
    if (result.mask.size >= 4_000_000 || (result.image && result.image.size >= 50_000_000)) {
      throw new Error('The prepared image or mask exceeds the provider size limit.')
    }
    const tx = store.db.transaction(['assets', 'blobs'], 'readwrite')
    const save = async (blob: Blob) => {
      const asset: Asset = { id: crypto.randomUUID(), projectId, source: 'edited', mediaType: blob.type,
        byteLength: blob.size, dimensions: { width: result.width, height: result.height }, createdAt: new Date().toISOString() }
      await Promise.all([tx.objectStore('assets').add(asset), tx.objectStore('blobs').add(blob, asset.id)])
      return asset.id
    }
    const [maskAssetId, referenceId] = await Promise.all([save(result.mask), result.image ? save(result.image) : sourceId, tx.done])
    return { maskAssetId, referenceId }
  } finally { store.db.close() }
}
