export interface ImageDimensions {
  width: number
  height: number
}

export interface ProviderImageSize {
  id: string
  label: string
  dimensions?: ImageDimensions
}

export interface GenerationPrice {
  size: string
  quality?: string
  currency: string
  amountPerImage: number
}

export interface ModelCapabilities {
  id: string
  label: string
  sizes: readonly ProviderImageSize[]
  qualityLevels: readonly string[]
  maxImagesPerRequest: number
  maxReferenceImages: number
  supportsMask: boolean
  prices?: readonly GenerationPrice[]
}

export interface ProviderCapabilities {
  models: readonly ModelCapabilities[]
}

export interface GenerationSettings {
  size: string
  quality?: string
  count: number
}

export interface GenerationReference {
  assetId: string
  blob: Blob
}

export interface GenerationRequest {
  model: string
  prompt: string
  settings: GenerationSettings
  references?: readonly GenerationReference[]
  mask?: GenerationReference
}

export interface GeneratedImage {
  blob: Blob
  dimensions?: ImageDimensions
}

export interface GenerationResult {
  images: readonly GeneratedImage[]
  providerRequestId?: string
}

export interface ProviderAdapter {
  readonly id: string
  getCapabilities(): Promise<ProviderCapabilities>
  generate(req: GenerationRequest, signal: AbortSignal): Promise<GenerationResult>
}

// An uncertain request may have been billed and must never be retried automatically.
export type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'uncertain'

export interface Project {
  board?: { panels: { assetId: string; caption: string }[]; reviewed: boolean }
  reviewedAssetIds?: string[]
  id: string
  name: string
  studioId: string
  createdAt: string
  updatedAt: string
}

export interface Asset {
  id: string
  projectId: string
  source: 'imported' | 'generated' | 'edited'
  mediaType: string
  byteLength: number
  dimensions?: ImageDimensions
  createdAt: string
}

export interface GenerationProvenance {
  providerId: string
  model: string
  prompt: string
  settings: GenerationSettings
  referenceAssetIds: readonly string[]
  maskAssetId?: string
  providerRequestId?: string
}

export interface Version {
  id: string
  projectId: string
  assetId: string
  parentVersionId?: string
  provenance: GenerationProvenance
  createdAt: string
}
