import { expect, it } from 'vitest'
import { registerUpdateGuard, updateBlocker } from './guards'

it('keeps activation blocked until every independent draft and job finishes', () => {
  const saved = registerUpdateGuard('draft')
  const first = registerUpdateGuard('job')
  const second = registerUpdateGuard('job')
  first()
  expect(updateBlocker()).toBe('job')
  second()
  expect(updateBlocker()).toBe('draft')
  saved()
  expect(updateBlocker()).toBeNull()
})

it('does not activate when another tab holds the shared work lock', async () => {
  const { vi } = await import('vitest')
  const { requestSafeActivation } = await import('./guards')
  const activate = vi.fn()
  try {
    vi.stubGlobal('navigator', {locks: {request: async (_name: string, _opts: object, callback: (lock: null) => boolean) => callback(null)}})
    expect(await requestSafeActivation(activate)).toBe(false)
    expect(activate).not.toHaveBeenCalled()
  } finally {vi.unstubAllGlobals()}
})
