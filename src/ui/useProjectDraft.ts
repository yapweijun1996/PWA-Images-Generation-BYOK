import { useEffect, useRef, useState } from 'react'
import { loadDraft, saveDraft, type ProjectDraft } from '@engine/storage/draft'
import { registerUpdateGuard } from '@pwa'

export function useProjectDraft(projectId: string, projectReady: boolean, report: (message: string) => void) {
  const [draft, setDraft] = useState<ProjectDraft>()
  const latest = useRef<ProjectDraft | undefined>(undefined)
  const pending = useRef<Partial<ProjectDraft>>({})
  const writing = useRef<Promise<void> | undefined>(undefined)
  const release = useRef<(() => void) | undefined>(undefined)
  useEffect(() => {
    if (!projectReady) return
    let active = true
    void loadDraft(projectId).then(value => {
      if (active) { latest.current = value; setDraft(value) }
    }).catch(error => { if (active) report(error.message) })
    const warn = (event: BeforeUnloadEvent) => {
      if (release.current) event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => {
      active = false
      window.removeEventListener('beforeunload', warn)
      release.current?.()
      release.current = undefined
    }
  }, [projectId, projectReady, report])

  function flush(): Promise<void> {
    if (writing.current) return writing.current
    if (!Object.keys(pending.current).length) return Promise.resolve()
    writing.current = (async () => {
      while (Object.keys(pending.current).length) {
        const patch = pending.current
        pending.current = {}
        try { await saveDraft(projectId, patch) }
        catch (error) {
          pending.current = { ...patch, ...pending.current }
          throw error
        }
      }
      release.current?.()
      release.current = undefined
    })().finally(() => { writing.current = undefined })
    return writing.current
  }

  function change(patch: Partial<ProjectDraft>) {
    if (!latest.current) return
    latest.current = { ...latest.current, ...patch }
    setDraft(latest.current)
    Object.assign(pending.current, patch)
    release.current ??= registerUpdateGuard('draft')
    void flush().catch(error => report(error.message))
  }
  return { draft, change, flush }
}
