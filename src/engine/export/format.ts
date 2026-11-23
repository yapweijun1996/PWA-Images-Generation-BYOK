import { z } from '@engine/schema'

const id = z.string().min(1).max(512)
const timestamp = z.iso.datetime()
const draft = z.object({
  prompt: z.string(), referenceAssetIds: z.array(id),
  edit: z.object({ maskAssetId: id.optional(), promptHint: z.string().optional(), count: z.number().int().min(1).max(4) }).optional(),
  modelId: z.string(), size: id, quality: id, parentVersionId: id.optional(), stageId: z.string(),
})
const project = z.object({ draft: draft.optional(), board: z.object({ panels: z.array(z.object({assetId: id, caption: z.string().max(100)})).max(12), reviewed: z.boolean() }).optional(), reviewedAssetIds: z.array(id).optional(), id, name: z.string(), studioId: id, createdAt: timestamp, updatedAt: timestamp })
export const assetRecord = z.object({
  id, projectId: id, source: z.enum(['imported', 'generated', 'edited']),
  mediaType: z.enum(['image/png', 'image/jpeg', 'image/webp']), byteLength: z.number().int().positive(),
  dimensions: z.object({ width: z.number().int().positive(), height: z.number().int().positive() }).optional(),
  createdAt: timestamp,
})
const version = z.object({
  id, projectId: id, assetId: id, parentVersionId: id.optional(), createdAt: timestamp,
  provenance: z.object({
    providerId: id, model: id, prompt: z.string(),
    settings: z.object({ size: id, quality: id.optional(), count: z.number().int().positive() }),
    referenceAssetIds: z.array(id), maskAssetId: id.optional(), providerRequestId: id.optional(),
  }),
})
export const manifest = z.object({
  format: z.literal('pwa-images-project'), version: z.literal(1), project,
  assets: z.array(assetRecord.extend({ sha256: z.string().regex(/^[a-f0-9]{64}$/) })),
  versions: z.array(version),
})
export type Backup = z.infer<typeof manifest>

export function validateLinks(data: Backup) {
  const assets = new Set(data.assets.map(a => a.id))
  const ancestors = new Map(data.versions.map(v => [v.id, v.parentVersionId]))
  if (assets.size !== data.assets.length || ancestors.size !== data.versions.length) throw new Error('Duplicate backup IDs.')
  const projectLinks = [...(data.project.board?.panels.map(p => p.assetId) ?? []), ...(data.project.reviewedAssetIds ?? [])]
  const draft = data.project.draft
  if (draft) {
    projectLinks.push(...draft.referenceAssetIds)
    if (draft.edit?.maskAssetId) {
      if (!draft.referenceAssetIds.length) throw new Error('Draft mask requires a reference image.')
      projectLinks.push(draft.edit.maskAssetId)
    }
    if (draft.parentVersionId && !ancestors.has(draft.parentVersionId)) throw new Error('Missing draft parent version.')
  }
  if (projectLinks.some(link => !assets.has(link))) throw new Error('Missing project image.')
  const complete = new Set<string>()
  for (const item of [...data.assets, ...data.versions]) {
    if (item.projectId !== data.project.id) throw new Error('Backup contains a different project.')
  }
  for (const v of data.versions) {
    const required = [v.assetId, ...v.provenance.referenceAssetIds]
    if (v.provenance.maskAssetId) required.push(v.provenance.maskAssetId)
    if (required.some(a => !assets.has(a))) throw new Error('Backup image reference is missing.')
    const path = new Set<string>()
    let current: string | undefined = v.id
    while (current && !complete.has(current)) {
      if (!ancestors.has(current) || path.has(current)) throw new Error('Invalid backup version history.')
      path.add(current)
      current = ancestors.get(current)
    }
    for (const ancestor of path) complete.add(ancestor)
  }
}
