import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { PwaControls } from './PwaControls'
import { registerUpdateGuard } from './guards'

afterEach(() => {
  cleanup()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

it('requires an explicit unguarded click and sends just one activation request', async () => {
  vi.stubEnv('PROD', true)
  const postMessage = vi.fn()
  const reg = Object.assign(new EventTarget(), { waiting: { postMessage } })
  const register = vi.fn().mockResolvedValue(reg)
  vi.stubGlobal('navigator', { serviceWorker: Object.assign(new EventTarget(), { controller: {}, register }) })
  render(<PwaControls />)
  const button = await screen.findByRole<HTMLButtonElement>('button', { name: 'Update and reload' })
  const release = registerUpdateGuard('draft')
  await waitFor(() => expect(button.disabled).toBe(true))
  fireEvent.click(button)
  expect(postMessage).not.toHaveBeenCalled()
  act(release)
  fireEvent.click(button)
  fireEvent.click(button)
  expect(postMessage).toHaveBeenCalledTimes(1)
  expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
})
