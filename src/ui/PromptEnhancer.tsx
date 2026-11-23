import { useEffect, useRef, useState } from 'react'
import { enhancePrompt, EnhancementError } from '@engine/providers/openai/enhance'
import { readProviderKey } from '@engine/secrets'

const copy = {
  en: { enhance: 'Enhance with OpenAI', cost: 'Sends this prompt to OpenAI. Text API charges apply.', busy: 'Enhancing…',
    review: 'Suggested prompt', apply: 'Use suggestion', discard: 'Discard suggestion', key: 'Enter an OpenAI key in Settings.',
    input: 'Enter a prompt of up to 32,000 characters.', provider: 'Request rejected. Check your key and provider access.',
    uncertain: 'Result unconfirmed. Check provider usage before trying again.', noText: 'No complete suggestion returned.' },
  'zh-CN': { enhance: '用 OpenAI 优化', cost: '将此提示词发送至 OpenAI，按文本 API 计费。', busy: '正在优化…',
    review: '建议提示词', apply: '采用建议', discard: '放弃建议', key: '请在设置中输入 OpenAI 密钥。',
    input: '请输入不超过 32,000 字的提示词。', provider: '请求被拒绝，请检查密钥和模型权限。',
    uncertain: '结果未确认，请先查看服务商用量再重试。', noText: '未收到完整建议。' },
}

interface Props { prompt: string; locale: keyof typeof copy; onApply: (prompt: string) => void }

export function PromptEnhancer({ prompt, locale, onApply }: Props) {
  const t = copy[locale]
  const pending = useRef<AbortController | null>(null)
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState<{ original: string; text: string } | null>(null)
  const [error, setError] = useState<EnhancementError['kind'] | null>(null)
  useEffect(() => () => pending.current?.abort(), [])

  async function enhance() {
    if (pending.current || !prompt.trim()) return
    const controller = new AbortController()
    pending.current = controller
    setBusy(true)
    setError(null)
    setPreview(null)
    try {
      const text = await enhancePrompt(prompt, readProviderKey('openai'), controller.signal)
      if (!controller.signal.aborted) setPreview({ original: prompt, text })
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof EnhancementError ? cause.kind : 'key')
    } finally {
      pending.current = null
      if (!controller.signal.aborted) setBusy(false)
    }
  }
  return <div>
    <button type="button" disabled={busy || !prompt.trim()} onClick={enhance}>{busy ? t.busy : t.enhance}</button>
    <small>{t.cost}</small>
    {error && <p role="alert">{t[error]}</p>}
    {preview?.original === prompt && <section aria-label={t.review}>
      <label>{t.review}<textarea readOnly value={preview.text} /></label>
      <button type="button" onClick={() => { onApply(preview.text); setPreview(null) }}>{t.apply}</button>
      <button type="button" onClick={() => setPreview(null)}>{t.discard}</button>
    </section>}
  </div>
}
