import type { GenerationRequest, ModelCapabilities, ProviderAdapter } from '@engine/types'

const sizes = [
  { id: '1024x1024', label: '1024 × 1024', dimensions: { width: 1024, height: 1024 } },
  { id: '1536x1024', label: '1536 × 1024', dimensions: { width: 1536, height: 1024 } },
  { id: '1024x1536', label: '1024 × 1536', dimensions: { width: 1024, height: 1536 } },
]
const models: ModelCapabilities[] = ['sunburst', 'flare'].map(variant => ({
  id: 'gpt-image-2.6-' + variant,
  label: 'GPT Image 2.6 ' + (variant === 'sunburst' ? 'Sunburst' : 'Flare'),
  sizes,
  qualityLevels: ['low', 'medium', 'high'],
  maxImagesPerRequest: 1,
  maxReferenceImages: 4,
  supportsMask: true,
}))

export class ImageRequestError extends Error {
  constructor(message: string, readonly status: 'failed' | 'uncertain') {
    super(message)
  }
}

function prepare(request: GenerationRequest) {
  const { model, settings, prompt, references = [], mask } = request
  const capability = models.find(option => option.id === model)
  if (!capability || !capability.sizes.some(size => size.id === settings.size)
    || !capability.qualityLevels.includes(settings.quality ?? 'medium')
    || settings.count !== 1 || references.length > capability.maxReferenceImages
    || (mask && !references.length) || !prompt.trim()) {
    throw new ImageRequestError('Check the prompt, references and model settings.', 'failed')
  }
  const fields = { model, prompt, quality: settings.quality ?? 'medium', size: settings.size }
  if (!references.length) return { path: 'generations', body: JSON.stringify(fields) }
  const body = new FormData()
  for (const [name, value] of Object.entries(fields)) body.append(name, value)
  for (const ref of references) body.append('image[]', ref.blob, 'reference.' + ref.blob.type.split('/')[1])
  if (mask) body.append('mask', mask.blob, 'mask.png')
  return { path: 'edits', body }
}

export function createOpenAIAdapter(getKey: () => string | null): ProviderAdapter {
  return {
    id: 'openai',
    async getCapabilities() { return { models } },
    async generate(request, signal) {
      const key = getKey()?.trim()
      if (!key) throw new ImageRequestError('Enter your OpenAI API key in Settings.', 'failed')
      const { path, body } = prepare(request)
      signal.throwIfAborted()
      try {
        const response = await fetch('https://api.openai.com/v1/images/' + path, {
          method: 'POST', body, signal, redirect: 'error', credentials: 'omit', cache: 'no-store',
          headers: {
            Authorization: 'Bearer ' + key,
            ...(typeof body === 'string' ? { 'Content-Type': 'application/json' } : {}),
          },
        })
        if (!response.ok) {
          const status = response.status
          throw new ImageRequestError('OpenAI returned HTTP ' + status + '.',
            status >= 500 || status === 408 ? 'uncertain' : 'failed')
        }
        const payload = await response.json()
        const encoded = payload?.data?.[0]?.b64_json
        if (typeof encoded !== 'string' || !encoded) throw new Error('Missing image')
        const bytes = Uint8Array.from(atob(encoded), char => char.charCodeAt(0))
        if (![137,80,78,71,13,10,26,10].every((byte, i) => bytes[i] === byte)) throw new Error('Invalid PNG')
        return { images: [{ blob: new Blob([bytes], { type: 'image/png' }) }],
          providerRequestId: response.headers.get('x-request-id') ?? undefined }
      } catch (error) {
        if (error instanceof ImageRequestError) throw error
        throw new ImageRequestError('The result could not be confirmed. Check your provider usage before trying again.', 'uncertain')
      }
    },
  }
}
