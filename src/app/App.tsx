import { ConnectionStatus } from '../ui/ConnectionStatus'
import { PwaControls } from '@pwa'
import { Workspace } from '@ui'

export function App() {
  return (
    <>
      <ConnectionStatus />
      <Workspace productName={__PRODUCT_NAME__} buildId={__BUILD_ID__} />
      <PwaControls />
    </>
  )
}
