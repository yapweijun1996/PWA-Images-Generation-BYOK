import { ConnectionStatus } from '../ui/ConnectionStatus'
import { PwaControls } from '@pwa'
import { Workspace } from '@ui'

export function App() {
  const base = import.meta.env.BASE_URL
  const path = location.pathname
  if (path !== base && path !== base + 'index.html') {
    const chinese = localStorage.getItem('ui-language') === 'zh-CN'
    return <main>
      <h1>{chinese ? '页面不存在' : 'Page not found'}</h1>
      <a href={base}>{chinese ? '返回工作区' : 'Return to workspace'}</a>
      <PwaControls />
    </main>
  }
  return (
    <Workspace productName={__PRODUCT_NAME__} buildId={__BUILD_ID__}
      connectionStatus={<ConnectionStatus />} updateControls={<PwaControls />} />
  )
}
