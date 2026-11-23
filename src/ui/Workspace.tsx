import './workspace.css'

interface WorkspaceProps {
  productName: string
  buildId: string
}

// The T-101 shell provides the entry point for the T-111 workspace.
export function Workspace({ productName, buildId }: WorkspaceProps) {
  return (
    <main className="workspace-shell">
      <h1>{productName}</h1>
      <p>Build {buildId}</p>
    </main>
  )
}
