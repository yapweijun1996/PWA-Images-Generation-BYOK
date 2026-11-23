import 'fake-indexeddb/auto'
import { useState } from 'react'
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { openStorage } from '@engine/storage'
import type { Project } from '@engine/types'
import { updateBlocker } from '@pwa/guards'
import { StudioBoard } from './StudioBoard'

afterEach(cleanup)

const reviewedBoard = { panels: [{ assetId: 'panel-image', caption: 'Reviewed text' }], reviewed: true }

function fixture(id: string): Project {
  const timestamp = '2026-11-23T00:00:00.000Z'
  return { id, name: 'Test board', studioId: 'manga', createdAt: timestamp, updatedAt: timestamp, board: reviewedBoard }
}

function BoardView({ initial, readProject }: { initial: Project; readProject: () => Promise<Project | undefined> }) {
  const [project, setProject] = useState(initial)
  return <StudioBoard project={project} locale="en" onChange={() => { void readProject().then(saved => { if (saved) setProject(saved) }) }} />
}

it('guards a panel caption until its blur write commits and invalidates review', async () => {
  const { db } = await openStorage()
  const initial = fixture('board-caption-commit')
  try {
    await db.put('projects', initial)
    render(<BoardView initial={initial} readProject={() => db.get('projects', initial.id)} />)
    fireEvent.click(screen.getByText('Storyboard & annotations'))
    const field = screen.getByLabelText<HTMLTextAreaElement>('Panel text')
    const exportButton = screen.getByRole<HTMLButtonElement>('button', { name: 'Export reviewed board' })
    expect(exportButton.disabled).toBe(false)

    fireEvent.change(field, { target: { value: 'Edited text' } })
    expect(updateBlocker()).toBe('draft')
    expect(exportButton.disabled).toBe(true)
    fireEvent.blur(field)
    expect(updateBlocker()).toBe('draft')

    await waitFor(() => expect(updateBlocker()).toBeNull())
    expect((await db.get('projects', initial.id))?.board).toEqual({
      panels: [{ assetId: 'panel-image', caption: 'Edited text' }], reviewed: false,
    })
    await waitFor(() => expect(screen.getByRole<HTMLInputElement>('checkbox').disabled).toBe(false))
    expect(field.value).toBe('Edited text')
    expect(exportButton.disabled).toBe(true)
  } finally { db.close() }
})

it('retains an unsaved caption after a concurrent board change until it is discarded', async () => {
  const { db } = await openStorage()
  const initial = fixture('board-caption-conflict')
  try {
    await db.put('projects', initial)
    render(<BoardView initial={initial} readProject={() => db.get('projects', initial.id)} />)
    fireEvent.click(screen.getByText('Storyboard & annotations'))
    const field = screen.getByLabelText<HTMLTextAreaElement>('Panel text')
    fireEvent.change(field, { target: { value: 'Unsaved caption' } })
    const other = { ...initial, board: { panels: [{ assetId: 'panel-image', caption: 'Another tab' }], reviewed: false } }
    await db.put('projects', other)

    fireEvent.blur(field)
    const discard = await screen.findByRole('button', { name: 'Discard caption changes' })
    expect(updateBlocker()).toBe('draft')
    expect(field.value).toBe('Unsaved caption')
    expect(field.readOnly).toBe(true)
    expect(screen.queryByRole('button', { name: 'Retry saving caption' })).toBeNull()
    expect((await db.get('projects', initial.id))?.board).toEqual(other.board)
    fireEvent.click(discard)
    expect(updateBlocker()).toBeNull()
    expect(field.value).toBe('Another tab')
  } finally { db.close() }
})
