import type { GenerationRequest, JobStatus, ProviderAdapter } from '@engine/types'
import type { StudioStorage } from '@engine/storage'
import { prepareMaskedFrame, preserveMaskedPixels } from '@engine/editing/composite'
import { ImageRequestError } from '@engine/providers/openai'
import { publishJobChange } from './changes'

export { subscribeToJobChanges } from './changes'

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
  dependsOn?: string
}

export async function enqueueGeneration(storage: StudioStorage, projectId: string, request: QueuedGenerationRequest) {
  return (await enqueueBatch(storage, projectId, request, 1))[0]
}

export async function enqueueBatch(storage: StudioStorage, projectId: string, request: QueuedGenerationRequest, count: number) {
  if (!Number.isInteger(count) || count < 1 || count > 4) throw new Error('Choose between one and four generations.')
  const jobs: GenerationJob[] = []
  const createdAt = new Date().toISOString()
  for (let i = 0; i < count; i++) {
    jobs.push({ id: crypto.randomUUID(), projectId, request, status: 'queued', createdAt, dependsOn: jobs.at(-1)?.id })
  }
  const tx = storage.db.transaction('jobs','readwrite')
  await Promise.all([tx.done, ...jobs.map(job => tx.store.add(job))])
  publishJobChange(projectId)
  return jobs
}

// The lock is released by the browser on tab termination. Only its holder can send or recover the job.
export async function processJob(storage: StudioStorage, id: string, provider: ProviderAdapter) {
  return navigator.locks.request('image-generation:' + id, { ifAvailable: true }, async lock => {
    if (!lock) return
    const { db } = storage
    const job = await db.get('jobs', id)
    if (!job) return
    const { request, projectId } = job
    const saveState = async (status: JobStatus, message?: string) => {
      await db.put('jobs', { ...job, status, message })
      publishJobChange(projectId)
    }
    if (job.status === 'running') {
      await saveState('uncertain', 'The previous session ended during generation. Check provider usage.')
      return
    }
    if (job.status !== 'queued') return
    if (job.dependsOn) {
      const previous = await db.get('jobs', job.dependsOn)
      if (previous?.status === 'queued' || previous?.status === 'running') return
      if (previous?.status !== 'succeeded') {
        await saveState('failed', 'Batch stopped after an earlier request. This item was not sent.')
        return
      }
    }
    let sent = false
    try {
      if (request.providerId !== provider.id) throw new Error('Selected provider is unavailable.')
      const read = async (assetId: string) => {
        if ((await db.get('assets', assetId))?.projectId !== projectId) throw new Error('Reference image is unavailable.')
        return { assetId, blob: await storage.readAsset(assetId) }
      }
      const references = await Promise.all(request.referenceAssetIds.map(read))
      const mask = request.maskAssetId ? await read(request.maskAssetId) : undefined
      if (mask && !references[0]) throw new Error('Choose a source image for the mask.')
      const model = mask ? (await provider.getCapabilities()).models.find(candidate => candidate.id === request.model) : undefined
      const frame = mask ? await prepareMaskedFrame(references[0].blob, mask.blob, request.settings.size, model?.sizes ?? []) : undefined
      const settings = frame ? { ...request.settings, size: frame.width + 'x' + frame.height } : request.settings
      if (frame && mask) {
        references[0].blob = frame.source
        mask.blob = frame.mask
      }
      await saveState('running')
      sent = true
      const result = await provider.generate({ ...request, settings, references, mask }, AbortSignal.timeout(300_000))
      const generated = result.images[0]
      const image = frame ? {
        blob: await preserveMaskedPixels(frame, generated.blob),
        dimensions: { width: frame.width, height: frame.height },
      } : generated
      const assetId = crypto.randomUUID()
      const createdAt = new Date().toISOString()
      await storage.saveAsset({
        id: assetId, projectId, source: references.length ? 'edited' : 'generated', mediaType: image.blob.type,
        byteLength: image.blob.size, dimensions: image.dimensions, createdAt,
      }, image.blob, { job, version: {
        id: crypto.randomUUID(), createdAt, projectId, assetId, parentVersionId: request.parentVersionId,
        provenance: { providerId: provider.id, prompt: request.prompt, model: request.model, settings,
          referenceAssetIds: request.referenceAssetIds, maskAssetId: request.maskAssetId, providerRequestId: result.providerRequestId },
      } })
      publishJobChange(projectId)
    } catch (error) {
      const status = error instanceof ImageRequestError ? error.status : sent ? 'uncertain' : 'failed'
      await saveState(status, error instanceof Error ? error.message : 'Could not complete generation.')
    }
  })
}
