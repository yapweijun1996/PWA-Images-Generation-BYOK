import { cleanup, render, screen } from '@testing-library/react'
import 'fake-indexeddb/auto'
import { afterEach, expect, it, vi } from 'vitest'
import { Workspace } from '@ui'

afterEach(cleanup)

it('renders the product heading and the configured build identity', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  render(<Workspace productName={__PRODUCT_NAME__} buildId={__BUILD_ID__} />)

  expect(screen.getByRole('heading', { level: 1, name: 'PWA Images Studio' })).toBeTruthy()
  expect(screen.getByText(`Build ${__BUILD_ID__}`)).toBeTruthy()
  expect(__BUILD_ID__).toMatch(/^v\d+\.\d+\.\d+ · /)
})
