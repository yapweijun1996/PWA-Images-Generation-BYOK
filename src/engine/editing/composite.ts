import { canvas, png } from './canvas'
import type { ImageDimensions, ProviderImageSize } from '@engine/types'

export interface MaskedFrame extends ImageDimensions {
  source: Blob
  mask: Blob
}

function resolveSize(width: number, height: number, selected: string, sizes: readonly ProviderImageSize[]) {
  if (selected !== 'auto') return sizes.find(size => size.id === selected)?.dimensions
  const ratio = width / height
  // First matching ratio wins: the catalog lists its smaller presets before UHD.
  return sizes.reduce<ImageDimensions | undefined>((best, size) => {
    const next = size.dimensions
    if (!next) return best
    const difference = (d: ImageDimensions) => Math.abs(Math.log(d.width / d.height / ratio))
    return !best || difference(next) < difference(best) ? next : best
  }, undefined)
}

export async function prepareMaskedFrame(source: Blob, mask: Blob, size: string, sizes: readonly ProviderImageSize[]): Promise<MaskedFrame> {
  const image = await createImageBitmap(source)
  try {
    const stencil = await createImageBitmap(mask)
    try {
      if (image.width !== stencil.width || image.height !== stencil.height) throw new Error('The mask and source must have the same dimensions.')
      const output = resolveSize(image.width, image.height, size, sizes)
      if (!output) throw new Error('Choose a supported image size.')
      const { width, height } = output
      if (width * image.height === height * image.width) return { source, mask, width, height }
      if (size !== 'auto') throw new Error('The selected size has a different aspect ratio from the edit frame. Choose Auto to fit the image with transparent padding, or choose a matching size.')
      const scale = Math.min(width / image.width, height / image.height)
      const w = image.width * scale, h = image.height * scale
      const x = (width - w) / 2, y = (height - h) / 2
      const fitted = canvas(width, height)
      fitted.drawImage(image, x, y, w, h)
      const fittedMask = canvas(width, height)
      // Padding is protected and transparent in the source. Copy the mask including its zero alpha.
      fittedMask.fillRect(0, 0, width, height)
      fittedMask.save()
      fittedMask.beginPath()
      fittedMask.rect(x, y, w, h)
      fittedMask.clip()
      fittedMask.globalCompositeOperation = 'copy'
      fittedMask.drawImage(stencil, x, y, w, h)
      fittedMask.restore()
      return { source: await png(fitted), mask: await png(fittedMask), width, height }
    } finally { stencil.close() }
  } finally { image.close() }
}

export async function preserveMaskedPixels(frame: MaskedFrame, generated: Blob) {
  const { width, height } = frame
  const output = await createImageBitmap(generated)
  try {
    if (width !== output.width || height !== output.height) throw new Error('Provider returned unexpected edit dimensions.')
    const result = canvas(width, height)
    result.drawImage(output, 0, 0)
    const mask = await createImageBitmap(frame.mask)
    try {
      result.globalCompositeOperation = 'destination-out'
      result.drawImage(mask, 0, 0, width, height)
      const retained = canvas(width, height)
      const source = await createImageBitmap(frame.source)
      try { retained.drawImage(source, 0, 0, width, height) } finally { source.close() }
      retained.globalCompositeOperation = 'destination-in'
      retained.drawImage(mask, 0, 0, width, height)
      // Add the complementary premultiplied samples, including the original alpha.
      result.globalCompositeOperation = 'lighter'
      result.drawImage(retained.canvas, 0, 0)
      return await png(result)
    } finally { mask.close() }
  } finally { output.close() }
}
