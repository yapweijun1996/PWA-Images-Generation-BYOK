import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { PwaControls } from './PwaControls'
import { registerUpdateGuard } from './guards'

afterEach(() => {
  cleanup()
  document.documentElement.lang = 'en'
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
  document.documentElement.lang = 'zh-CN'
  await screen.findByRole('button', { name: '更新并重新加载' })
  expect(screen.getByRole('status').textContent).toBe('更新前请先保存或放弃草稿。')
  act(release)
  fireEvent.click(button)
  fireEvent.click(button)
  expect(postMessage).toHaveBeenCalledTimes(1)
  expect(postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' })
})
