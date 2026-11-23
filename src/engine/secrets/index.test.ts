import { expect, it, vi } from 'vitest'
import { clearProviderKey, readProviderKey, saveProviderKey } from './index'

it('replaces a remembered credential with a transient one and forgets it on reload', async () => {
  saveProviderKey('openai', 'first-example', true)
  expect(readProviderKey('openai')).toBe('first-example')
  saveProviderKey('openai', 'second-example', false)
  expect(readProviderKey('openai')).toBe('second-example')
  expect(localStorage.length).toBe(0)
  vi.resetModules()
  expect((await import('./index')).readProviderKey('openai')).toBeNull()
  clearProviderKey('openai')
  expect(readProviderKey('openai')).toBeNull()
})
