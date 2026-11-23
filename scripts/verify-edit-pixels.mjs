/* global URL, document, createImageBitmap, console */
// Run against the localhost Vite dev server so the browser exercises the current engine source.
import assert from 'node:assert/strict'
import process from 'node:process'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const url = new URL(process.argv[2] || 'http://127.0.0.1:5173/PWA-Images-Generation-BYOK/')
assert(['localhost', '127.0.0.1'].includes(url.hostname))
const browser = await chromium.launch({ channel: 'chrome' })
try {
  const page = await browser.newPage()
  await page.goto(url.href)
  const result = await page.evaluate(async base => {
    const { renderEdit } = await import(base + 'src/engine/editing/index.ts')
    const { prepareMaskedFrame, preserveMaskedPixels } = await import(base + 'src/engine/editing/composite.ts')
    const { models } = await import(base + 'src/engine/providers/openai/catalog.ts')
    const sizes = models[0].sizes
    const surface = (width, height) => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      return canvas.getContext('2d')
    }
    const png = ctx => new Promise(resolve => ctx.canvas.toBlob(resolve))
    const pixel = (ctx, x, y) => [...ctx.getImageData(x, y, 1, 1).data]
    const source = surface(512, 512)
    source.fillStyle = '#15459f'
    source.fillRect(0, 0, 512, 512)
    source.clearRect(0, 0, 40, 40)
    source.clearRect(50, 50, 40, 40)
    source.fillStyle = 'rgba(20,200,40,.5)'
    source.fillRect(50, 50, 40, 40)
    const original = await png(source)
    const bitmap = await createImageBitmap(original)
    const { mask } = await renderEdit(bitmap, [{ points: [{ x: .5, y: .5 }], radius: .2 }])
    const frame = await prepareMaskedFrame(original, mask, '1024x1024', sizes)

    async function compose(frame) {
      const generated = surface(frame.width, frame.height)
      generated.fillStyle = '#fff000'
      generated.fillRect(0, 0, frame.width, frame.height)
      const blob = await preserveMaskedPixels(frame, await png(generated))
      const result = surface(frame.width, frame.height)
      result.drawImage(await createImageBitmap(blob), 0, 0)
      return result
    }
    const output = await compose(frame)
    const expected = surface(1024, 1024)
    expected.drawImage(bitmap, 0, 0, 1024, 1024)
    const oldBytes = expected.getImageData(0, 0, 1024, 1024).data
    const newBytes = output.getImageData(0, 0, 1024, 1024).data
    let changedOutside = 0
    for (let y = 0; y < 1024; y++) {
      for (let x = 0; x < 1024; x++) {
        if (Math.hypot(x - 512, y - 512) < 215) continue
        const i = (y * 1024 + x) * 4
        if ([0,1,2,3].some(k => oldBytes[i+k] !== newBytes[i+k])) changedOutside++
      }
    }
    const expanded = await renderEdit(bitmap, { edge: 'right', fraction: .25 })
    const fitted = await prepareMaskedFrame(expanded.image, expanded.mask, 'auto', sizes)
    const wide = await compose(fitted)
    return { changedOutside, center: pixel(output, 512, 512), padding: pixel(wide, 0, 0),
      retained: pixel(wide, wide.canvas.width * .4, wide.canvas.height * .5),
      extension: pixel(wide, wide.canvas.width * .9, wide.canvas.height * .5) }
  }, url.href)
  assert.equal(result.changedOutside, 0)
  assert.deepEqual(result.center, [255,240,0,255])
  assert.deepEqual(result.extension, [255,240,0,255])
  assert.deepEqual(result.retained, [21,69,159,255])
  assert.deepEqual(result.padding, [0,0,0,0])
  console.log('PASS: masked generation preserves source RGBA, editable pixels, and aligned outpaint padding')
} finally {
  await browser.close()
}
