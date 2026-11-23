import type { GenerationPrice, ModelCapabilities, ProviderImageSize } from '@engine/types'

const qualities = ['low', 'medium', 'high', 'xhigh', 'max'] as const

// Output tokens from the GPT-Image-2.6 calculator (both variants), 2026-11-23.
// https://developers.openai.com/api/docs/guides/image-generation
// Each row follows the explicit quality order above. Rotating the canvas preserves cost.
const presets = [
  { width: 1024, height: 1024, tokens: [823, 1449, 1756, 3122, 7024] },
  { width: 1536, height: 1024, tokens: [664, 1132, 1372, 2459, 5488] },
  { width: 2048, height: 2048, tokens: [1667, 2944, 3568, 6343, 14272] },
  { width: 2048, height: 1152, tokens: [659, 1211, 1413, 2511, 5650] },
  { width: 3840, height: 2160, tokens: [1558, 2855, 3336, 5930, 13342] },
]

const sizes: ProviderImageSize[] = []
const prices: GenerationPrice[] = []
// Standard Images API, USD per million image output tokens. Input costs are separate.
// https://developers.openai.com/api/docs/pricing
const outputRate = 30
for (const preset of presets) {
  const { width, height, tokens } = preset
  const dimensions = [{ width, height }]
  if (width !== height) dimensions.push({ width: height, height: width })
  for (const size of dimensions) {
    const id = size.width + 'x' + size.height
    sizes.push({ id, dimensions: size, label: size.width + ' × ' + size.height })
    qualities.forEach((quality, i) => {
      prices.push({ size: id, quality, currency: 'USD', amountPerImage: tokens[i] * outputRate / 1_000_000 })
    })
  }
}
sizes.push({ id: 'auto', label: 'Auto' })

export const models: readonly ModelCapabilities[] = ['Sunburst', 'Flare'].map(variant => ({
  id: 'gpt-image-2.6-' + variant.toLowerCase(),
  label: 'GPT Image 2.6 ' + variant,
  sizes,
  prices,
  qualityLevels: [...qualities, 'auto'],
  maxImagesPerRequest: 1,
  maxReferenceImages: 4,
  supportsMask: true,
}))
