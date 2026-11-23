import { appendVersion } from '@engine/history'
import type { GenerationRequest, JobStatus, ProviderAdapter } from '@engine/types'
import type { StudioStorage } from '@engine/storage'
import { ImageRequestError } from '@engine/providers/openai'

export interface QueuedGenerationRequest extends Omit<GenerationRequest, 'references' | 'mask'> {
  providerId: string
  referenceAssetIds: readonly string[]
  maskAssetId?: string
  parentVersionId?: string
}

export interface GenerationJob {
  id: string
  projectId: string
  request: QueuedGenerationRequest
  status: JobStatus
  createdAt: string
  message?: string
  versionId?: string
}

export async function enqueueGeneration(storage: StudioStorage, projectId: string, request: QueuedGenerationRequest) {
  const job: GenerationJob = { id: crypto.randomUUID(), projectId, request, status: 'queued', createdAt: new Date().toISOString() }
  await storage.db.add('jobs', job)
  return job
}

// The lock is released by the browser on tab termination. Only its holder can send or recover the job.
export async function processJob(storage: StudioStorage, id: string, provider: ProviderAdapter) {
  return navigator.locks.request('image-generation:' + id, { ifAvailable: true }, async lock => {
    if (!lock) return
    const { db } = storage
    const job = await db.get('jobs', id)
    if (!job) return
    if (job.status === 'running') {
      await db.put('jobs', { ...job, status: 'uncertain', message: 'The previous session ended during generation. Check provider usage.' })
      return
    }
    if (job.status !== 'queued') return
    const { request, projectId } = job
    let sent = false
    try {
      if (request.providerId !== provider.id) throw new Error('Selected provider is unavailable.')
      const read = async (assetId: string) => {
        if ((await db.get('assets', assetId))?.projectId !== projectId) throw new Error('Reference image is unavailable.')
        return { assetId, blob: await storage.readAsset(assetId) }
      }
      const references = await Promise.all(request.referenceAssetIds.map(read))
      const mask = request.maskAssetId ? await read(request.maskAssetId) : undefined
      await db.put('jobs', { ...job, status: 'running' })
      sent = true
      const result = await provider.generate({ ...request, references, mask }, AbortSignal.timeout(300_000))
      const image = result.images[0]
      const assetId = crypto.randomUUID()
      const createdAt = new Date().toISOString()
      await storage.saveAsset({ id: assetId, projectId, source: references.length ? 'edited' : 'generated', mediaType: image.blob.type,
        byteLength: image.blob.size, dimensions: image.dimensions, createdAt }, image.blob)
      const version = await appendVersion({
        projectId, assetId, parentVersionId: request.parentVersionId,
        provenance: {
          providerId: provider.id, prompt: request.prompt, model: request.model,
          settings: request.settings, referenceAssetIds: request.referenceAssetIds,
          maskAssetId: request.maskAssetId, providerRequestId: result.providerRequestId,
        },
      })
      await db.put('jobs', { ...job, status: 'succeeded', versionId: version.id })
    } catch (error) {
      const status = error instanceof ImageRequestError ? error.status : sent ? 'uncertain' : 'failed'
      await db.put('jobs', { ...job, status, message: error instanceof Error ? error.message : 'Could not complete generation.' })
    }
  })
}
