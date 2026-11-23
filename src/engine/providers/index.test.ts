import type { ProviderAdapter } from '@engine/types'
import { expect, expectTypeOf, it } from 'vitest'
import { providers } from './index'
import { createOpenAIAdapter } from './openai'

it('exposes the typed registry without advertising an unimplemented adapter', () => {
  expectTypeOf(providers).toEqualTypeOf<readonly ProviderAdapter[]>()
  expect(providers).toHaveLength(0)
  expect(createOpenAIAdapter).toThrow('not implemented: T-104')
})
