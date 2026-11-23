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

it('preserves an unsaved, conflicted board edit when switching projects', async () => {
  vi.stubGlobal('matchMedia', () => ({ matches: false, addEventListener() {}, removeEventListener() {} }))
  const timestamp = '2026-11-24T00:00:00.000Z'
  const project = {
    id: 'board-conflict', name: 'Current board', studioId: 'manga', createdAt: timestamp, updatedAt: timestamp,
    board: { panels: [{ assetId: 'board-fixture', caption: 'Original text' }], reviewed: true },
  }
  const other = { id: 'board-switch-target', name: 'Switch target', studioId: 'manga', createdAt: timestamp, updatedAt: timestamp }
  const { db } = await openStorage()
  try {
    await db.put('projects', project)
    await db.put('projects', other)
    localStorage.setItem('active-project', project.id)
    render(<Workspace productName={__PRODUCT_NAME__} buildId={__BUILD_ID__} />)
    const summary = await screen.findByText('Storyboard & annotations')
    fireEvent.click(summary)
    const board = within(summary.closest('details')!)
    const caption = board.getByRole<HTMLTextAreaElement>('textbox', { name: 'Panel text' })
    fireEvent.change(caption, { target: { value: 'My unsaved text' } })
    await db.put('projects', { ...project, board: { panels: [{ assetId: 'board-fixture', caption: 'Other tab text' }], reviewed: false } })
    fireEvent.blur(caption)
    const discard = await board.findByRole('button', { name: 'Discard caption changes' })

    const projects = within(screen.getByRole('navigation', { name: 'Assets' })).getByRole('button', { name: 'Projects' })
    fireEvent.click(projects)
    fireEvent.click(await screen.findByRole('button', { name: other.name }))
    expect(await screen.findByText('Save or discard your panel text changes before switching projects.', { exact: true })).toBeTruthy()
    expect(localStorage.getItem('active-project')).toBe(project.id)
    expect(caption.value).toBe('My unsaved text')

    fireEvent.click(discard)
    await waitFor(() => expect(caption.value).toBe('Other tab text'))
    fireEvent.click(projects)
    fireEvent.click(await screen.findByRole('button', { name: other.name }))
    await waitFor(() => expect(localStorage.getItem('active-project')).toBe(other.id))
  } finally {
    db.close()
  }
})
