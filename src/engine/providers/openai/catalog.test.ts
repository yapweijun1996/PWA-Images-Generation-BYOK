import { describe, expect, it } from 'vitest'
import { models } from './catalog'

describe.each(models)('$label', model => {
  it('publishes native UHD in both orientations and prices only explicit output settings', () => {
    expect(model.sizes.map(size => size.id)).toEqual(expect.arrayContaining(['3840x2160', '2160x3840']))
    for (const size of model.sizes) {
      for (const quality of model.qualityLevels) {
        const estimate = model.prices?.filter(p => p.size === size.id && p.quality === quality)
        expect(estimate).toHaveLength(size.id === 'auto' || quality === 'auto' ? 0 : 1)
      }
    }
    expect(model.prices?.find(p => p.size === '1024x1024' && p.quality === 'low')?.amountPerImage).toBe(0.02469)
    expect(model.prices?.find(p => p.size === '2160x3840' && p.quality === 'max')?.amountPerImage).toBe(0.40026)
  })
})

it('rejects unlisted dimensions and unsupported input formats for both models before network access', async () => {
  const { createOpenAIAdapter } = await import('./index')
  const adapter = createOpenAIAdapter(() => 'fixture')
  for (const model of models) {
    const request = { model: model.id, prompt: 'A landscape', settings: { size: '4000x4000', count: 1 } }
    const signal = new AbortController().signal
    await expect(adapter.generate(request, signal)).rejects.toMatchObject({ status: 'failed' })
    await expect(adapter.generate({ ...request, settings: { size: '3840x2160', count: 1 },
      references: [{ assetId: 'test', blob: new Blob(['invalid'], { type: 'text/plain' }) }] }, signal))
      .rejects.toMatchObject({ status: 'failed' })
  }
})
