import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { PwaControls } from './PwaControls'
import { registerUpdateGuard } from './guards'

afterEach(() => {
  cleanup()
  document.documentElement.lang = 'en'
  vi.useRealTimers()
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

it('requires an explicit unguarded click and sends just one activation request', async () => {
  vi.stubEnv('PROD', true)
  const postMessage = vi.fn()
  const worker = Object.assign(new EventTarget(), { postMessage, state: 'installed' })
  const reg = Object.assign(new EventTarget(), { waiting: worker })
  const register = vi.fn().mockResolvedValue(reg)
  vi.stubGlobal('navigator', { serviceWorker: Object.assign(new EventTarget(), { controller: {}, register }) })
  render(<PwaControls />)
  const button = await screen.findByRole<HTMLButtonElement>('button', { name: 'Update and reload' })
  const release = registerUpdateGuard('draft')
  await waitFor(() => expect(button.disabled).toBe(true))
  fireEvent.click(button)
  expect(postMessage).not.toHaveBeenCalled()
  document.documentElement.lang = 'zh-CN'
  await screen.findByRole('button', { name: '更新并重新加载' })
  expect(screen.getByRole('status').textContent).toBe('更新前请先保存或放弃草稿。')
  act(release)
  fireEvent.click(button)
  fireEvent.click(button)
  expect(postMessage).toHaveBeenCalledTimes(1)
  expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
})

it('makes the update actionable again when a waiting worker does not take control', async () => {
  vi.stubEnv('PROD', true)
  const postMessage = vi.fn()
  const worker = Object.assign(new EventTarget(), { postMessage, state: 'installed' })
  const register = vi.fn().mockResolvedValue(Object.assign(new EventTarget(), { waiting: worker }))
  vi.stubGlobal('navigator', { serviceWorker: Object.assign(new EventTarget(), { controller: {}, register }) })
  render(<PwaControls />)
  const button = await screen.findByRole<HTMLButtonElement>('button', { name: 'Update and reload' })
  vi.useFakeTimers()
  fireEvent.click(button)
  expect(button.disabled).toBe(true)
  await act(async () => { await vi.advanceTimersByTimeAsync(15_000) })
  expect(screen.getByRole('status').textContent).toContain('The update could not finish.')
  expect(button.disabled).toBe(false)
  fireEvent.click(button)
  expect(postMessage).toHaveBeenCalledTimes(2)
})
