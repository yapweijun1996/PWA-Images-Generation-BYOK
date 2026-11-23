const eventName = (projectId: string) => `pwa-images-jobs:${import.meta.env.BASE_URL}:${projectId}`

function openChannel(name: string) {
  if (typeof window.BroadcastChannel !== 'function') return
  try { return new window.BroadcastChannel(name) } catch { return undefined }
}

// A notification carries no job data. Readers always reload the committed records.
export function publishJobChange(projectId: string) {
  if (typeof window === 'undefined') return
  const name = eventName(projectId)
  const channel = openChannel(name)
  if (channel) {
    try {
      channel.postMessage(null)
      return
    } catch {
      // Keep same-tab refreshes available if messaging is blocked.
    } finally { channel.close() }
  }
  window.dispatchEvent(new Event(name))
}

export function subscribeToJobChanges(projectId: string, refresh: () => void) {
  const name = eventName(projectId)
  const channel = openChannel(name)
  channel?.addEventListener('message', refresh)
  window.addEventListener(name, refresh)
  return () => {
    channel?.close()
    window.removeEventListener(name, refresh)
  }
}
