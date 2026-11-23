import { useSyncExternalStore } from 'react'

function subscribe(listener: () => void) {
  window.addEventListener('offline', listener)
  window.addEventListener('online', listener)
  const observer = new MutationObserver(listener)
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['lang'] })
  return () => {
    observer.disconnect()
    window.removeEventListener('offline', listener)
    window.removeEventListener('online', listener)
  }
}

export function ConnectionStatus() {
  const status = useSyncExternalStore(subscribe, () => navigator.onLine ? 'online' : document.documentElement.lang)
  if (status === 'online') return null
  return <aside role="status" className="connection-status">{status === 'zh-CN'
    ? '当前离线。仍可查看、编辑和备份本地项目。生成图片需要网络连接。'
    : 'Offline. You can view, edit and back up local projects. Image generation needs a connection.'}</aside>
}
