import { afterEach, expect, it, vi } from 'vitest'
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { InstallHelp } from './InstallHelp'

afterEach(cleanup)

it('shows instructions when native install is unavailable, including Safari steps in Chinese', () => {
  render(<InstallHelp locale="zh-CN" />)
  const dialog = document.querySelector('dialog')!
  dialog.showModal = () => dialog.setAttribute('open','')
  fireEvent.click(screen.getByRole('button', {name:'帮助与安装'}))
  expect(screen.getByRole('dialog', {name:'帮助与安装'})).toBeTruthy()
  const safariHelp = screen.getByText(/iPhone 或 iPad/)
  expect(safariHelp.textContent).toContain('页面菜单')
  expect(safariHelp.textContent).toContain('添加到主屏幕')
  expect(screen.queryByRole('button', {name:'安装应用'})).toBeNull()
})

it('keeps the offer across project remounts and consumes it only after activation', async () => {
  const prompt = vi.fn(async () => {})
  const event = Object.assign(new Event('beforeinstallprompt', {cancelable:true}), {prompt, userChoice:Promise.resolve({outcome:'dismissed'})})
  act(() => { window.dispatchEvent(event) })
  expect(event.defaultPrevented).toBe(true)
  const first = render(<InstallHelp locale="en" />)
  first.unmount()
  render(<InstallHelp locale="en" />)
  const dialog = document.querySelector('dialog')!
  dialog.showModal = () => dialog.setAttribute('open','')
  fireEvent.click(screen.getByRole('button', {name:'Help and installation'}))
  expect(screen.getByText(/On iPhone or iPad/).textContent).toContain('Add to Home Screen')
  expect(prompt).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', {name:'Install app'}))
  await waitFor(() => expect(screen.getByRole('status').textContent).toContain('Installation dismissed'))
  expect(prompt).toHaveBeenCalledTimes(1)
  expect(screen.queryByRole('button', {name:'Install app'})).toBeNull()
  act(() => { window.dispatchEvent(new Event('appinstalled')) })
  expect(screen.getByRole('status').textContent).toContain('Installation requested')
})
