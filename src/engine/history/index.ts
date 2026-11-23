import { z } from 'zod'
import { openStorage } from '@engine/storage'
import type { Version } from '@engine/types'

const id = z.string().min(1)
const record = z.object({
  projectId: id,
  assetId: id,
  parentVersionId: id.optional(),
  provenance: z.object({
    providerId: id,
    model: id,
    prompt: z.string().min(1),
    settings: z.object({ size: id, quality: id.optional(), count: z.number().int().positive() }),
    referenceAssetIds: z.array(id),
    maskAssetId: id.optional(),
    providerRequestId: id.optional(),
  }),
})

export type NewVersion = Omit<Version, 'id' | 'createdAt'>

export async function appendVersion(input: NewVersion): Promise<Version> {
  // Persist only schema fields even when the caller passes a larger provider request object.
  const entry: Version = { ...record.parse(input), id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  const { db } = await openStorage()
  try {
    const tx = db.transaction(['projects', 'assets', 'versions'], 'readwrite')
    const assets = tx.objectStore('assets')
    const versions = tx.objectStore('versions')
    const assetIds = new Set([entry.assetId, ...entry.provenance.referenceAssetIds])
    if (entry.provenance.maskAssetId) assetIds.add(entry.provenance.maskAssetId)
    const [project, linkedAssets, parent] = await Promise.all([
      tx.objectStore('projects').getKey(entry.projectId),
      Promise.all(Array.from(assetIds, assetId => assets.get(assetId))),
      entry.parentVersionId ? versions.get(entry.parentVersionId) : undefined,
    ])
    if (!project) throw new Error('The project no longer exists.')
    if (linkedAssets.some(asset => asset?.projectId !== entry.projectId)) {
      throw new Error('Each version image must belong to this project.')
    }
    if (entry.parentVersionId && parent?.projectId !== entry.projectId) {
      throw new Error('The parent version must belong to this project.')
    }
    await Promise.all([tx.done, versions.add(entry)])
    return entry
  } finally { db.close() }
}

export async function listVersions(projectId: string): Promise<readonly Version[]> {
  const { db } = await openStorage()
  try {
    const versions = await db.getAllFromIndex('versions', 'byProject', projectId)
    return versions.sort((a, b) => b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id))
  } finally { db.close() }
}
