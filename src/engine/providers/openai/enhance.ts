import { z } from 'zod'

const message = z.object({
  type: z.literal('message'),
  role: z.literal('assistant'),
  content: z.array(z.unknown()),
})
const textPart = z.object({ type: z.literal('output_text'), text: z.string() })
const responseBody = z.object({ status: z.literal('completed'), output: z.array(z.unknown()) })

export class EnhancementError extends Error {
  constructor(readonly kind: 'key' | 'input' | 'provider' | 'uncertain' | 'noText') {
    super(kind)
  }
}

export async function enhancePrompt(prompt: string, key: string | null, signal: AbortSignal) {
  if (!key?.trim()) throw new EnhancementError('key')
  if (!prompt.trim() || prompt.length > 32_000) throw new EnhancementError('input')
  try {
    const response = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST', credentials: 'omit', redirect: 'error', cache: 'no-store', signal,
      headers: { Authorization: 'Bearer ' + key.trim(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'gpt-5.4-mini', store: false, max_output_tokens: 1200,
        instructions: 'Rewrite the user input as one concise image generation prompt in its original language. Preserve the subject, literal text, identity and explicit constraints. Clarify composition, light and visual detail where helpful. Return only the proposed prompt.',
        input: prompt,
      }),
    })
    if (!response.ok) throw new EnhancementError(response.status >= 500 || response.status === 408 ? 'uncertain' : 'provider')
    const parsed = responseBody.safeParse(await response.json())
    if (!parsed.success) throw new EnhancementError('noText')
    const parts: string[] = []
    for (const item of parsed.data.output) {
      const msg = message.safeParse(item)
      if (msg.success) for (const part of msg.data.content) {
        const text = textPart.safeParse(part)
        if (text.success) parts.push(text.data.text)
      }
    }
    const result = parts.join('\n').trim()
    if (!result) throw new EnhancementError('noText')
    return result
  } catch (error) {
    if (error instanceof EnhancementError) throw error
    throw new EnhancementError('uncertain')
  }
}
