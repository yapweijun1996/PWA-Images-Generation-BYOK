import type { GenerationRequest, ProviderAdapter } from '@engine/types'
import { models } from './catalog'

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
    || (mask && (!capability.supportsMask || !references.length)) || !prompt.trim() || prompt.length > 32_000) {
    throw new ImageRequestError('Check the prompt, references and model settings.', 'failed')
  }
  const mediaTypes = ['image/png', 'image/webp', 'image/jpeg']
  if (references.some(({ blob }) => !mediaTypes.includes(blob.type) || !blob.size || blob.size >= 50_000_000)) {
    throw new ImageRequestError('Use PNG, JPEG or WebP references under 50 MB each.', 'failed')
  }
  if (mask && (mask.blob.type !== 'image/png' || !mask.blob.size || mask.blob.size >= 4_000_000)) {
    throw new ImageRequestError('Use a transparent PNG mask under 4 MB.', 'failed')
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
      if (navigator.onLine === false) throw new ImageRequestError('You are offline. Reconnect before generating.', 'failed')
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
