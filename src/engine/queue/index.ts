import type { GenerationRequest } from '@engine/types'

export interface QueuedGenerationRequest extends Omit<GenerationRequest, 'references' | 'mask'> {
  providerId: string
  referenceAssetIds: readonly string[]
  maskAssetId?: string
}

export const enqueueGeneration: (projectId: string, request: QueuedGenerationRequest) => Promise<string> = async () => {
  throw new Error('not implemented: T-106')
}
