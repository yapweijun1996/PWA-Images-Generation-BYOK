import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { clearProviderKey, readProviderKey, saveProviderKey } from '@engine/secrets'

import { registerUpdateGuard } from '@pwa'

const strings = {
  en: {
    heading: 'OpenAI key settings', key: 'API key', warning: 'Scripts running on this site can read a saved key. Use a private device.',
    remember: 'Remember on this device', save: 'Save key', forget: 'Forget key',
    available: 'A key is available.', empty: 'No key configured.', unavailable: 'Device storage is unavailable.',
    invalid: 'Enter a key without spaces.', saved: 'Key saved on this device.', temporary: 'Key available until this page closes or reloads.',
    saveError: 'Could not update the key. Check browser storage permissions.', forgotten: 'Key forgotten.',
    forgetError: 'Could not remove the stored key. Clear this site’s browser data.',
  },
  'zh-CN': {
    heading: 'OpenAI 密钥设置', key: 'API 密钥', warning: '本站运行的脚本可以读取已保存的密钥。请使用私人设备。',
    remember: '在此设备上记住密钥', save: '保存密钥', forget: '忘记密钥',
    available: '密钥可用。', empty: '尚未设置密钥。', unavailable: '设备存储不可用。',
    invalid: '请输入不含空格的密钥。', saved: '密钥已保存到此设备。', temporary: '密钥仅在当前页面中可用，刷新或关闭后即清除。',
    saveError: '无法更新密钥，请检查浏览器存储权限。', forgotten: '密钥已清除。',
    forgetError: '无法删除已保存的密钥，请清除此站点的浏览器数据。',
  },
}

export function KeySettings({ locale = 'en' }: { locale?: keyof typeof strings }) {
  const t = strings[locale]
  const release = useRef<(() => void) | null>(null)
  function releaseDraft() {
    release.current?.()
    release.current = null
  }
  useEffect(() => releaseDraft, [])
  const input = useRef<HTMLInputElement>(null)
  const [remember, setRemember] = useState(true)
  const [message, setMessage] = useState<keyof typeof strings.en>(() => {
    try {
      return readProviderKey('openai') ? 'available' : 'empty'
    } catch {
      return 'unavailable'
    }
  })

  function save(event: FormEvent) {
    event.preventDefault()
    if (!input.current) return
    const key = input.current.value.trim()
    if (!key || /\s/.test(key)) {
      setMessage('invalid')
      return
    }
    try {
      saveProviderKey('openai', key, remember)
      input.current.value = ''
      releaseDraft()
      setMessage(remember ? 'saved' : 'temporary')
    } catch {
      setMessage('saveError')
    }
  }

  function forget() {
    if (input.current) input.current.value = ''
    releaseDraft()
    try {
      clearProviderKey('openai')
      setMessage('forgotten')
    } catch {
      setMessage('forgetError')
    }
  }

  return <section aria-labelledby="key-settings-heading">
    <h2 id="key-settings-heading">{t.heading}</h2>
    <form onSubmit={save}>
      <label htmlFor="openai-key">{t.key}</label>
      <input id="openai-key" ref={input} type="password" onChange={event => {
          if (event.target.value) release.current ??= registerUpdateGuard('draft')
          else releaseDraft()
        }} autoComplete="off" spellCheck={false}
        autoCapitalize="none" required aria-describedby="key-warning" />
      <p id="key-warning">{t.warning}</p>
      <label><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} />
        {t.remember}</label>
      <button type="submit">{t.save}</button>
      <button type="button" onClick={forget}>{t.forget}</button>
    </form>
    <p role="status">{t[message]}</p>
  </section>
}
