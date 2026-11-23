import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it } from 'vitest'
import { clearProviderKey, readProviderKey } from '@engine/secrets'
import { KeySettings } from './KeySettings'

afterEach(() => { cleanup(); clearProviderKey('openai') })

it('saves, replaces and forgets through the form without rendering a credential', () => {
  render(<KeySettings />)
  const field = screen.getByLabelText<HTMLInputElement>('API key')
  fireEvent.change(field, { target: { value: 'example-one' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save key' }))
  expect(field.value).toBe('')
  expect(readProviderKey('openai')).toBe('example-one')
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.change(field, { target: { value: 'example-two' } })
  fireEvent.click(screen.getByRole('button', { name: 'Save key' }))
  expect(document.body.textContent).not.toContain('example-two')
  expect(localStorage.length).toBe(0)
  expect(readProviderKey('openai')).toBe('example-two')
  fireEvent.click(screen.getByRole('button', { name: 'Forget key' }))
  expect(readProviderKey('openai')).toBeNull()
})

it('keeps dirty secrets guarded across locale changes and translates saved status', async () => {
  const { updateBlocker } = await import('@pwa/guards')
  const view = render(<KeySettings />)
  fireEvent.change(screen.getByLabelText('API key'), { target: { value: 'example-entry' } })
  expect(updateBlocker()).toBe('draft')
  view.rerender(<KeySettings locale="zh-CN" />)
  fireEvent.click(screen.getByRole('button', { name: '保存密钥' }))
  expect(updateBlocker()).toBeNull()
  expect(screen.getByRole('status').textContent).toBe('密钥已保存到此设备。')
  view.rerender(<KeySettings locale="en" />)
  expect(screen.getByRole('status').textContent).toBe('Key saved on this device.')
  fireEvent.change(screen.getByLabelText('API key'), { target: { value: 'unused-draft' } })
  view.unmount()
  expect(updateBlocker()).toBeNull()
})
