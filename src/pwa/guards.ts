import { useSyncExternalStore } from 'react'

const operationLock = 'pwa-images-byok:update-safety'

type UpdateReason = 'draft' | 'job' | 'backup'
const guards = new Map<symbol, UpdateReason>()
const listeners = new Set<() => void>()

export function updateBlocker() {
  const reasons = [...guards.values()]
  return reasons.includes('job') ? 'job' : reasons.includes('backup') ? 'backup' : reasons.includes('draft') ? 'draft' : null
}

/** Register when work starts. Release only after saving, discarding, or settling. */
export function registerUpdateGuard(reason: UpdateReason) {
  const token = Symbol(reason)
  let unlock: (() => void) | undefined
  const held = new Promise<void>(resolve => { unlock = resolve })
  if (globalThis.navigator?.locks) {
    void navigator.locks.request(operationLock, { mode: 'shared' }, () => held).catch(() => {})
  }
  guards.set(token, reason)
  listeners.forEach(notify => notify())
  return () => {
    unlock?.()
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


export async function requestSafeActivation(activate: () => void | Promise<void>): Promise<boolean> {
  if (updateBlocker()) return false
  if (!navigator.locks) {
    await activate()
    return true
  }
  return navigator.locks.request(operationLock, { mode: 'exclusive', ifAvailable: true }, async lock => {
    if (!lock || updateBlocker()) return false
    await activate()
    return true
  })
}
