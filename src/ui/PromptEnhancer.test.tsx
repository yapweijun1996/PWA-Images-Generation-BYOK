import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { PromptEnhancer } from './PromptEnhancer'
import { clearProviderKey, saveProviderKey } from '@engine/secrets'
import { enhancePrompt } from '@engine/providers/openai/enhance'

afterEach(() => { cleanup(); clearProviderKey('openai'); vi.unstubAllGlobals() })

it('sends one explicit request, previews the suggestion and applies only on confirmation', async () => {
  saveProviderKey('openai', 'fixture-only', false)
  const request = vi.fn().mockResolvedValue(Response.json({ status: 'completed', output: [
    { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'A red fox at dusk' }] },
  ] }))
  vi.stubGlobal('fetch', request)
  const apply = vi.fn()
  render(<PromptEnhancer prompt="fox" locale="en" onApply={apply} />)
  expect(request).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Enhance with OpenAI' }))
  expect((await screen.findByLabelText<HTMLTextAreaElement>('Suggested prompt', { selector: 'textarea' })).value).toBe('A red fox at dusk')
  expect(request).toHaveBeenCalledTimes(1)
  const [url, init] = request.mock.calls[0]
  expect(url).toBe('https://api.openai.com/v1/responses')
  expect(JSON.parse(init.body)).toMatchObject({ input: 'fox', store: false })
  expect(init.body).not.toContain('fixture-only')
  expect(apply).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Use suggestion' }))
  expect(apply).toHaveBeenCalledWith('A red fox at dusk')
})

it('sanitizes a lost response and never retries', async () => {
  const request = vi.fn().mockRejectedValue(new Error('private fixture'))
  vi.stubGlobal('fetch', request)
  await expect(enhancePrompt('fox', 'fixture', new AbortController().signal)).rejects.toMatchObject({ message: 'uncertain' })
  expect(request).toHaveBeenCalledTimes(1)
})
