import { afterEach, expect, it, vi } from 'vitest'
import { createProviders } from './index'

const [adapter] = createProviders(() => 'test-only')
const signal = new AbortController().signal
const request = { model: 'gpt-image-2.6-sunburst', prompt: 'A leaf', settings: { size: '1024x1024', count: 1 } }
afterEach(() => vi.unstubAllGlobals())

it('uses an authenticated generation POST and decodes the returned PNG', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ data: [{ b64_json: 'iVBORw0KGgo=' }] }))
  vi.stubGlobal('fetch', fetcher)
  const result = await adapter.generate(request, signal)
  expect(fetcher).toHaveBeenCalledWith('https://api.openai.com/v1/images/generations',
    expect.objectContaining({ method: 'POST', cache: 'no-store', body: expect.stringContaining('A leaf'),
      headers: expect.objectContaining({ Authorization: 'Bearer test-only' }) }))
  expect(result.images[0].blob.type).toBe('image/png')
})

it('preserves reference order for edits and never retries a lost response', async () => {
  const fetcher = vi.fn().mockRejectedValue(new TypeError('Network unavailable'))
  vi.stubGlobal('fetch', fetcher)
  await expect(adapter.generate({ ...request, references: [
    { assetId: 'a', blob: new Blob(['a'], { type: 'image/jpeg' }) },
    { assetId: 'b', blob: new Blob(['b'], { type: 'image/png' }) },
  ] }, signal)).rejects.toMatchObject({ status: 'uncertain' })
  expect(fetcher).toHaveBeenCalledTimes(1)
  const [url, init] = fetcher.mock.calls[0]
  expect(url).toMatch(/\/edits$/)
  expect(init.body.getAll('image[]').map((file: File) => file.type)).toEqual(['image/jpeg', 'image/png'])
  expect(init.body.has('background')).toBe(false)
})

it('keeps the requested opacity and mask in an expansion edit', async () => {
  const fetcher = vi.fn().mockResolvedValue(Response.json({ data: [{ b64_json: 'iVBORw0KGgo=' }] }))
  vi.stubGlobal('fetch', fetcher)
  const png = (assetId: string) => ({ assetId, blob: new Blob(['png'], { type: 'image/png' }) })
  await adapter.generate({
    ...request,
    settings: { ...request.settings, background: 'opaque' },
    references: [png('source')],
    mask: png('mask'),
  }, signal)
  const [, init] = fetcher.mock.calls[0]
  expect(init.body.get('background')).toBe('opaque')
  expect(init.body.get('mask').type).toBe('image/png')
})

it('rejects unsupported settings before sending a billable request', async () => {
  const fetcher = vi.fn()
  vi.stubGlobal('fetch', fetcher)
  await expect(adapter.generate({ ...request, model: 'unknown' }, signal)).rejects.toMatchObject({ status: 'failed' })
  expect(fetcher).not.toHaveBeenCalled()
})
