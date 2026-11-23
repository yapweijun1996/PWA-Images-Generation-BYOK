import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { requestSafeActivation, updateBlocker, useUpdateBlocker } from './guards'

const activationTimeoutMs = 15_000

function activateWorker(worker: ServiceWorker, signal: AbortSignal) {
  const container = navigator.serviceWorker
  return new Promise<void>((resolve, reject) => {
    function finish(error?: unknown) {
      clearTimeout(timeout)
      container.removeEventListener('controllerchange', inspect)
      worker.removeEventListener('statechange', inspect)
      signal.removeEventListener('abort', cancel)
      if (error) reject(error)
      else resolve()
    }
    function inspect() {
      if (worker === container.controller && worker.state === 'activated') finish()
      else if (worker.state === 'redundant') finish(new Error('The update worker was replaced.'))
    }
    function cancel() { finish(signal.reason) }
    const timeout = window.setTimeout(() => finish(new Error('The update did not activate in time.')), activationTimeoutMs)
    if (signal.aborted) { cancel(); return }
    signal.addEventListener('abort', cancel)
    container.addEventListener('controllerchange', inspect)
    worker.addEventListener('statechange', inspect)
    try {
      worker.postMessage({ type: 'SKIP_WAITING' })
      inspect()
    } catch (error) {
      finish(error)
    }
  })
}

function subscribeLanguage(notify: () => void) {
  const observer = new MutationObserver(notify)
  observer.observe(document.documentElement, { attributeFilter: ['lang'] })
  return () => observer.disconnect()
}

export function PwaControls() {
  const chinese = useSyncExternalStore(subscribeLanguage, () => document.documentElement.lang.startsWith('zh'))
  const t = (en: string, zh: string) => chinese ? zh : en
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)
  const [status, setStatus] = useState<'ready' | 'applying' | 'blocked' | 'failed' | 'reload'>('ready')
  const attempt = useRef<AbortController | null>(null)
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
      setWaiting(container.controller ? registration.waiting : null)
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
    container.addEventListener('controllerchange', inspect)
    document.addEventListener('visibilitychange', checkForUpdate)
    void container.register(base + 'sw.js', { scope: base, updateViaCache: 'none' }).then(reg => {
      if (!active) return
      registration = reg
      if (location.pathname.startsWith(base) && ![base, base + 'index.html'].includes(location.pathname)) checkForUpdate()
      reg.addEventListener('updatefound', watch)
      watch()
    }).catch(() => {})
    return () => {
      active = false
      attempt.current?.abort()
      installing?.removeEventListener('statechange', inspect)
      registration?.removeEventListener('updatefound', watch)
      container.removeEventListener('controllerchange', inspect)
      document.removeEventListener('visibilitychange', checkForUpdate)
    }
  }, [])

  if (!waiting && !['applying', 'failed', 'reload'].includes(status)) return null
  async function apply() {
    if (attempt.current || updateBlocker()) return
    if (status === 'reload') { location.reload(); return }
    if (!waiting) return
    const controller = new AbortController()
    attempt.current = controller
    setStatus('applying')
    try {
      const activated = await requestSafeActivation(() => activateWorker(waiting, controller.signal))
      if (controller.signal.aborted) return
      if (!activated) setStatus('blocked')
      else if (updateBlocker()) setStatus('reload')
      else location.reload()
    } catch {
      if (!controller.signal.aborted) setStatus('failed')
    } finally {
      if (attempt.current === controller) attempt.current = null
    }
  }
  return <aside aria-label={t('Application update', '应用更新')}>
    <p role="status">{blocker === 'draft' ? t('Save or discard your draft before updating.', '更新前请先保存或放弃草稿。')
      : blocker === 'job' ? t('An update is ready. Wait for your generation to finish.', '新版本已就绪，请等待生成完成。')
      : status === 'blocked' ? t('Finish or save work in other tabs, then try again.', '请先完成或保存其他标签页的工作，再重试。')
      : status === 'applying' ? t('Updating…', '正在更新…')
      : status === 'failed' ? t('The update could not finish. Try again when it is available.', '更新未能完成。新版本可用时请重试。')
      : status === 'reload' ? t('The update is installed. Reload to finish.', '新版本已安装。请重新加载以完成更新。')
      : t('An update is ready.', '新版本已就绪。')}</p>
    {(waiting || status === 'reload' || status === 'applying') &&
      <button type="button" disabled={Boolean(blocker) || status === 'applying'} onClick={() => void apply()}>{t('Update and reload', '更新并重新加载')}</button>}
  </aside>
}
