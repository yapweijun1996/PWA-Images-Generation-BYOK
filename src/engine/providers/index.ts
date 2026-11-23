import type { ProviderAdapter } from '@engine/types'
import { createOpenAIAdapter } from './openai'

export function createProviders(getOpenAIKey: () => string | null): readonly ProviderAdapter[] {
  return [createOpenAIAdapter(getOpenAIKey)]
}
