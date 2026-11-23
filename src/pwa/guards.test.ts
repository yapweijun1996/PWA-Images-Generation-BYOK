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
