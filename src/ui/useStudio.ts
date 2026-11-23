import { useCallback, useEffect, useState } from 'react'
import { openStorage } from '@engine/storage'
import { registerUpdateGuard } from '@pwa'
import { createProviders } from '@engine/providers'
import { readProviderKey } from '@engine/secrets'
import { enqueueBatch, processJob } from '@engine/queue'
import type { GenerationJob, QueuedGenerationRequest } from '@engine/queue'
import type { Project, Version, Asset } from '@engine/types'

export const [provider] = createProviders(() => readProviderKey('openai'))

export function useStudio(projectId: string) {
  const [project, setProject] = useState<Project>()
  const [versions, setVersions] = useState<Version[]>([])
  const [assets, setAssets] = useState<Asset[]>([])
  const [jobs, setJobs] = useState<GenerationJob[]>([])
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const refresh = useCallback(() => setRevision(value => value + 1), [])
  useEffect(() => {
    const check = () => { if (document.visibilityState === 'visible') refresh() }
    document.addEventListener('visibilitychange', check)
    return () => document.removeEventListener('visibilitychange', check)
  }, [refresh])
  const run = useCallback(async (id: string) => {
    const release = registerUpdateGuard('job')
    try {
      const store = await openStorage()
      try { await processJob(store, id, provider) } finally { store.db.close() }
    } finally { release(); refresh() }
  }, [refresh])

  useEffect(() => {
    let current = true
    async function load() {
      const store = await openStorage()
      try {
        const tx = store.db.transaction('projects', 'readwrite')
        let entry = await tx.store.get(projectId)
        if (!entry) {
          const now = new Date().toISOString()
          entry = { id: projectId, name: 'Untitled project', studioId: 'manga', createdAt: now, updatedAt: now }
          await tx.store.add(entry)
        }
        await tx.done
        const [timeline, images, queue] = await Promise.all([
          store.db.getAllFromIndex('versions', 'byProject', projectId),
          store.db.getAllFromIndex('assets', 'byProject', projectId),
          store.db.getAllFromIndex('jobs', 'byProject', projectId),
        ])
        if (current) {
          setProject(entry)
          setVersions(timeline.sort((a,b) => b.createdAt.localeCompare(a.createdAt)))
          setAssets(images)
          setJobs(queue.sort((a,b) => b.createdAt.localeCompare(a.createdAt)))
        }
      } finally { store.db.close() }
    }
    void load().catch(e => { if (current) setError(e.message) })
    return () => { current = false }
  }, [projectId, revision])

  // On entry, resume only jobs that could not have been sent. The lock protects other live tabs.
  useEffect(() => {
    let current = true
    void (async () => {
      const store = await openStorage()
      let pending: GenerationJob[]
      try { pending = await store.db.getAllFromIndex('jobs', 'byProject', projectId) }
      finally { store.db.close() }
      const byId = new Map(pending.map(job => [job.id, job]))
      const visited = new Set<string>()
      async function resume(job: GenerationJob) {
        if (!current || visited.has(job.id)) return
        visited.add(job.id)
        const previous = job.dependsOn && byId.get(job.dependsOn)
        if (previous) await resume(previous)
        if (job.status === 'queued' || job.status === 'running') await run(job.id)
      }
      for (const job of pending) await resume(job)
    })().catch(e => { if (current) setError(e.message) })
    return () => { current = false }
  }, [projectId, run])

  async function generate(request: QueuedGenerationRequest, count = 1) {
    const store = await openStorage()
    let jobs: GenerationJob[]
    try { jobs = await enqueueBatch(store, projectId, request, count) }
    finally { store.db.close() }
    refresh()
    for (const job of jobs) await run(job.id)
  }
  return { project, versions, assets, jobs, error, setError, refresh, generate }
}
