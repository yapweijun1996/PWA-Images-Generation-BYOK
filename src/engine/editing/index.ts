import { canvas, png } from './canvas'
import { openStorage } from '@engine/storage'
import type { Asset, GenerationSettings } from '@engine/types'

export interface PreparedEdit {
  referenceAssetIds: string[]
  maskAssetId?: string
  promptHint?: string
  background?: GenerationSettings['background']
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

function sourceIsOpaque(context: CanvasRenderingContext2D, x: number, y: number, width: number, height: number) {
  // Read the source rectangle in strips to keep the temporary pixel buffer bounded.
  const stripHeight = 64
  for (let row = 0; row < height; row += stripHeight) {
    const pixels = context.getImageData(x, y + row, width, Math.min(stripHeight, height - row)).data
    for (let alpha = 3; alpha < pixels.length; alpha += 4) {
      if (pixels[alpha] !== 255) return false
    }
  }
  return true
}

export async function renderEdit(source: ImageBitmap, region: Stroke[] | { edge: Expansion; fraction: number }) {
  if (!Array.isArray(region)) {
    const expanded = frame(source.width, source.height, region.edge, region.fraction)
    const image = canvas(expanded.width, expanded.height)
    image.drawImage(source, expanded.x, expanded.y)
    const mask = canvas(expanded.width, expanded.height)
    mask.fillRect(expanded.x, expanded.y, source.width, source.height)
    const background = sourceIsOpaque(image, expanded.x, expanded.y, source.width, source.height) ? 'opaque' as const : undefined
    return { width: expanded.width, height: expanded.height, image: await png(image), mask: await png(mask), background }
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
  return { width, height, image: undefined, mask: await png(mask), background: undefined }
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
    const [maskBytes, imageBytes] = await Promise.all([result.mask.arrayBuffer(), result.image?.arrayBuffer()])
    const tx = store.db.transaction(['assets', 'blobs'], 'readwrite')
    const save = async (blob: Blob, bytes: ArrayBuffer) => {
      const asset: Asset = { id: crypto.randomUUID(), projectId, source: 'edited', mediaType: blob.type,
        byteLength: blob.size, dimensions: { width: result.width, height: result.height }, createdAt: new Date().toISOString() }
      await Promise.all([tx.objectStore('assets').add(asset), tx.objectStore('blobs').add(bytes, asset.id)])
      return asset.id
    }
    const [maskAssetId, referenceId] = await Promise.all([save(result.mask, maskBytes), result.image && imageBytes ? save(result.image, imageBytes) : sourceId, tx.done])
    return { maskAssetId, referenceId, background: result.background }
  } finally { store.db.close() }
}
