import { act, cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { AssetThumbnail } from './AssetImage'

const { readAsset, close } = vi.hoisted(() => ({ readAsset: vi.fn(), close: vi.fn() }))
vi.mock('@engine/storage', () => ({ openStorage: async () => ({ readAsset, db: { close } }) }))

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.clearAllMocks()
})

it('reads a thumbnail only in view and releases its URL when it leaves', async () => {
  let reportIntersection: (entries: { isIntersecting: boolean }[]) => void = () => {}
  vi.stubGlobal('IntersectionObserver', class {
    constructor(callback: typeof reportIntersection) { reportIntersection = callback }
    observe() {}
    disconnect() {}
  })
  const createObjectURL = vi.fn(() => 'blob:thumbnail')
  const revokeObjectURL = vi.fn()
  vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }))
  readAsset.mockResolvedValue(new Blob(['image'], { type: 'image/png' }))

  const { container } = render(<AssetThumbnail id="image-a" />)
  expect(readAsset).not.toHaveBeenCalled()
  act(() => reportIntersection([{ isIntersecting: true }]))
  await waitFor(() => expect(container.querySelector('img')?.getAttribute('src')).toBe('blob:thumbnail'))
  expect(readAsset).toHaveBeenCalledExactlyOnceWith('image-a')
  expect(close).toHaveBeenCalledTimes(1)

  act(() => reportIntersection([{ isIntersecting: false }]))
  expect(container.querySelector('img')).toBeNull()
  expect(revokeObjectURL).toHaveBeenCalledExactlyOnceWith('blob:thumbnail')
})
