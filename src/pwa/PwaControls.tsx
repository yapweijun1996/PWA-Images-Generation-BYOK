import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { requestSafeActivation, updateBlocker, useUpdateBlocker } from './guards'

function subscribeLanguage(notify: () => void) {
  const observer = new MutationObserver(notify)
  observer.observe(document.documentElement, { attributeFilter: ['lang'] })
  return () => observer.disconnect()
}

export function PwaControls() {
  const chinese = useSyncExternalStore(subscribeLanguage, () => document.documentElement.lang.startsWith('zh'))
  const t = (en: string, zh: string) => chinese ? zh : en
  const [waiting, setWaiting] = useState<ServiceWorker | null>(null)
  const [applying, setApplying] = useState(false)
  const requested = useRef<ServiceWorker | null>(null)
  const [otherTab, setOtherTab] = useState(false)
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
      if (location.pathname.startsWith(base) && ![base, base + 'index.html'].includes(location.pathname)) checkForUpdate()
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
    setOtherTab(false)
    void requestSafeActivation(() => waiting.postMessage({ type: 'SKIP_WAITING' })).then(sent => {
      if (!sent) {
        requested.current = null
        setOtherTab(true)
        setApplying(false)
      }
    }).catch(() => { requested.current = null; setApplying(false); setOtherTab(true) })
  }
  return <aside aria-label={t('Application update', '应用更新')}>
    <p role="status">{blocker === 'draft' ? t('Save or discard your draft before updating.', '更新前请先保存或放弃草稿。')
      : blocker === 'job' ? t('An update is ready. Wait for your generation to finish.', '新版本已就绪，请等待生成完成。')
      : otherTab ? t('Finish or save work in other tabs, then try again.', '请先完成或保存其他标签页的工作，再重试。')
      : applying ? t('Updating…', '正在更新…') : t('An update is ready.', '新版本已就绪。')}</p>
    <button type="button" disabled={Boolean(blocker) || applying} onClick={apply}>{t('Update and reload', '更新并重新加载')}</button>
  </aside>
}
