import { useSyncExternalStore } from 'react'

const guards = new Map<symbol, 'draft' | 'job'>()
const listeners = new Set<() => void>()

export function updateBlocker() {
  const reasons = [...guards.values()]
  return reasons.includes('job') ? 'job' : reasons.includes('draft') ? 'draft' : null
}

/** Register when work starts. Release only after saving, discarding, or settling. */
export function registerUpdateGuard(reason: 'draft' | 'job') {
  const token = Symbol(reason)
  guards.set(token, reason)
  listeners.forEach(notify => notify())
  return () => {
    guards.delete(token)
    listeners.forEach(notify => notify())
  }
}

function subscribe(notify: () => void) {
  listeners.add(notify)
  return () => { listeners.delete(notify) }
}

export function useUpdateBlocker() {
  return useSyncExternalStore(subscribe, updateBlocker)
}
