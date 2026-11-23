import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { Workspace } from '@ui'

afterEach(cleanup)

it('renders the product heading and the configured build identity', () => {
  render(<Workspace productName={__PRODUCT_NAME__} buildId={__BUILD_ID__} />)

  expect(screen.getByRole('heading', { level: 1, name: 'PWA Images Studio' })).toBeTruthy()
  expect(screen.getByText(`Build ${__BUILD_ID__}`)).toBeTruthy()
  expect(__BUILD_ID__).toMatch(/^v\d+\.\d+\.\d+ · /)
})
