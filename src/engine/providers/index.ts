import type { ProviderAdapter } from '@engine/types'

// T-104 populates the registry when the first adapter is verified.
export const providers: readonly ProviderAdapter[] = []
