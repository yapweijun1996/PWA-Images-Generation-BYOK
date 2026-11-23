import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import 'fake-indexeddb/auto'
import { afterEach, expect, it, vi } from 'vitest'
import { Workspace } from '@ui'
import { openStorage } from '@engine/storage'
import type { GenerationJob } from '@engine/queue'
import { publishJobChange } from '../engine/queue/changes'

afterEach(() => {
  cleanup()
  localStorage.clear()
  vi.unstubAllGlobals()
})

it('renders the product heading and the configured build identity', () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  render(<Workspace productName={__PRODUCT_NAME__} buildId={__BUILD_ID__} />)

  expect(screen.getByRole('heading', { level: 1, name: 'PWA Images Studio' })).toBeTruthy()
  expect(screen.getByText(`Build ${__BUILD_ID__}`)).toBeTruthy()
  expect(__BUILD_ID__).toMatch(/^v\d+\.\d+\.\d+ · /)
})

it('announces new generation outcomes while the assets view has focus', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  const projectId = 'status-test-project'
  localStorage.setItem('active-project', projectId)
  const { db } = await openStorage()
  const job: GenerationJob = {
    id: 'status-old', projectId, status: 'succeeded', createdAt: '2026-01-01T00:00:00.000Z',
    request: { providerId: 'openai', model: 'gpt-image-test', prompt: 'Test image',
      settings: { size: '1024x1024', quality: 'low', count: 1 }, referenceAssetIds: [] },
  }

  try {
    await db.put('jobs', job)
    render(<Workspace productName={__PRODUCT_NAME__} buildId={__BUILD_ID__} />)
    await screen.findByText('Completed', { exact: true })
    const status = screen.getAllByRole('status').find(element => element.getAttribute('aria-live') === 'polite')
    expect(status?.textContent).toBe('')
    const library = screen.getByRole('navigation', { name: 'Assets' })
    const assets = within(library).getByRole('button', { name: 'Assets' })
    fireEvent.click(assets)
    assets.focus()

    await db.put('jobs', { ...job, id: 'status-new', status: 'succeeded', createdAt: '2026-01-02T00:00:00.000Z' })
    publishJobChange(projectId)
    await waitFor(() => expect(status?.textContent).toBe('Image generation completed. The image is available in Assets.'))
    expect(screen.getAllByRole('status')).toContain(status)
    expect(document.activeElement).toBe(assets)
  } finally {
    db.close()
  }
})
