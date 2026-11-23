export function canvas(width: number, height: number) {
  if (width * height > 24_000_000 || width > 8192 || height > 8192) throw new Error('Image exceeds the editing canvas limit.')
  const element = document.createElement('canvas')
  element.width = width
  element.height = height
  const context = element.getContext('2d')
  if (!context) throw new Error('Image editing is unavailable in this browser.')
  return context
}

export function png(ctx: CanvasRenderingContext2D) {
  return new Promise<Blob>((resolve, reject) => ctx.canvas.toBlob(blob =>
    blob ? resolve(blob) : reject(new Error('Could not save edited image.')), 'image/png'))
}
