import type { Asset } from '@engine/types'

export const listAssets: (projectId: string) => Promise<readonly Asset[]> = async () => {
  throw new Error('not implemented: T-107')
}
