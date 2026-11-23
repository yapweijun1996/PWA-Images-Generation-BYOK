import type { Project } from '@engine/types'
import { openStorage } from './index'

export interface ProjectDraft {
  prompt: string
  referenceAssetIds: string[]
  edit?: { maskAssetId?: string; promptHint?: string; count: number }
  modelId: string
  size: string
  quality: string
  parentVersionId?: string
  stageId: string
}

type StoredProject = Project & { draft?: ProjectDraft }
type ProjectPatch = Partial<Pick<Project, 'name' | 'studioId' | 'board' | 'reviewedAssetIds' | 'trashedAssetIds' | 'referenceLocks'>>

function initialDraft(projectId: string): ProjectDraft {
  let prompt = ''
  try { prompt = globalThis.localStorage?.getItem('draft:' + projectId) ?? '' } catch { /* Storage may be restricted. */ }
  return { prompt, referenceAssetIds: [], modelId: '', size: '1024x1024', quality: 'low', stageId: '' }
}

export async function loadDraft(projectId: string): Promise<ProjectDraft> {
  const { db } = await openStorage()
  try {
    const project: StoredProject | undefined = await db.get('projects', projectId)
    if (!project) throw new Error('The project no longer exists.')
    return project.draft ?? initialDraft(projectId)
  } finally { db.close() }
}

async function updateProject(projectId: string, update: (current: StoredProject) => StoredProject) {
  const { db } = await openStorage()
  try {
    const tx = db.transaction('projects', 'readwrite')
    const current: StoredProject | undefined = await tx.store.get(projectId)
    if (!current) throw new Error('The project no longer exists.')
    const project = { ...update(current), updatedAt: new Date().toISOString() }
    await Promise.all([tx.done, tx.store.put(project)])
    return project
  } finally { db.close() }
}

export function patchProject(projectId: string, patch: ProjectPatch | ((current: Readonly<Project>) => ProjectPatch)): Promise<Project> {
  return updateProject(projectId, current => {
    const delta = typeof patch === 'function' ? patch(current) : patch
    // Only copy mutable project metadata. Draft and identity stay under their own writers.
    const next = { ...current }
    if (delta.name !== undefined) { next.name = delta.name; next.defaultName = false }
    if (delta.studioId !== undefined) next.studioId = delta.studioId
    if ('referenceLocks' in delta) next.referenceLocks = delta.referenceLocks
    if ('board' in delta) next.board = delta.board
    if ('trashedAssetIds' in delta) next.trashedAssetIds = delta.trashedAssetIds
    if ('reviewedAssetIds' in delta) next.reviewedAssetIds = delta.reviewedAssetIds
    return next
  })
}

export async function saveDraft(projectId: string, patch: Partial<ProjectDraft>): Promise<ProjectDraft> {
  const project = await updateProject(projectId, current => {
    const draft = { ...(current.draft ?? initialDraft(projectId)), ...patch }
    return { ...current, draft }
  })
  return project.draft!
}
