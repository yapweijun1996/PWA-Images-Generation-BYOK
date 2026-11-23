import { useEffect, useRef, useState } from 'react'
import { updateBlocker, useUpdateBlocker } from './guards'

export function PwaControls() {
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)
  const [applying, setApplying] = useState(false)
  const requested = useRef<ServiceWorker | null>(null)
  const blocker = useUpdateBlocker()

  useEffect(() => {
    if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return
    const base = import.meta.env.BASE_URL
    const container = navigator.serviceWorker
    let active = true
    let registration: ServiceWorkerRegistration | undefined
    let installing: ServiceWorker | null = null

    function inspect() {
      if (!active || !registration) return
      if (container.controller && registration.waiting) setWaiting(registration.waiting)
      if (installing?.state === 'redundant' && !registration.waiting) {
        setWaiting(null)
        requested.current = null
        setApplying(false)
      }
    }
    function watch() {
      installing?.removeEventListener('statechange', inspect)
      installing = registration?.installing ?? null
      installing?.addEventListener('statechange', inspect)
      inspect()
    }
    function checkForUpdate() {
      if (document.visibilityState === 'visible') void registration?.update().catch(() => {})
    }
    function controlled() {
      if (requested.current && !updateBlocker()) {
        requested.current = null
        location.reload()
      } else {
        setWaiting(null)
        requested.current = null
        setApplying(false)
      }
    }
    container.addEventListener('controllerchange', controlled)
    document.addEventListener('visibilitychange', checkForUpdate)
    void container.register(base + 'sw.js', { scope: base, updateViaCache: 'none' }).then(reg => {
      if (!active) return
      registration = reg
      reg.addEventListener('updatefound', watch)
      watch()
    }).catch(() => {})
    return () => {
      active = false
      installing?.removeEventListener('statechange', inspect)
      registration?.removeEventListener('updatefound', watch)
      container.removeEventListener('controllerchange', controlled)
      document.removeEventListener('visibilitychange', checkForUpdate)
    }
  }, [])

  if (!waiting) return null
  function apply() {
    if (!waiting || requested.current || updateBlocker()) return
    requested.current = waiting
    setApplying(true)
    waiting.postMessage({ type: 'SKIP_WAITING' })
  }
  return <aside aria-label="Application update">
    <p role="status">{blocker === 'draft' ? 'Save or discard your draft before updating.'
      : blocker === 'job' ? 'An update is ready. Wait for your generation to finish.'
      : applying ? 'Updating…' : 'An update is ready.'}</p>
    <button type="button" disabled={Boolean(blocker) || applying} onClick={apply}>Update and reload</button>
  </aside>
}
