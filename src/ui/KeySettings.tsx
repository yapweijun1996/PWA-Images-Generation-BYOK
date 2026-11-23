import { useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { clearProviderKey, readProviderKey, saveProviderKey } from '@engine/secrets'

export function KeySettings() {
  const input = useRef<HTMLInputElement>(null)
  const [remember, setRemember] = useState(true)
  const [message, setMessage] = useState(() => {
    try {
      return readProviderKey('openai') ? 'A key is available.' : 'No key configured.'
    } catch {
      return 'Device storage is unavailable.'
    }
  })

  function save(event: FormEvent) {
    event.preventDefault()
    if (!input.current) return
    const key = input.current.value.trim()
    if (!key || /\s/.test(key)) {
      setMessage('Enter a key without spaces.')
      return
    }
    try {
      saveProviderKey('openai', key, remember)
      input.current.value = ''
      setMessage(remember ? 'Key saved on this device.' : 'Key available until this page closes or reloads.')
    } catch {
      setMessage('Could not update the key. Check browser storage permissions.')
    }
  }

  function forget() {
    if (input.current) input.current.value = ''
    try {
      clearProviderKey('openai')
      setMessage('Key forgotten.')
    } catch {
      setMessage('Could not remove the stored key. Clear this site’s browser data.')
    }
  }

  return <section aria-labelledby="key-settings-heading">
    <h2 id="key-settings-heading">OpenAI key settings</h2>
    <form onSubmit={save}>
      <label htmlFor="openai-key">API key</label>
      <input id="openai-key" ref={input} type="password" autoComplete="off" spellCheck={false}
        autoCapitalize="none" required aria-describedby="key-warning" />
      <p id="key-warning">Scripts running on this site can read a saved key. Use a private device.</p>
      <label><input type="checkbox" checked={remember} onChange={event => setRemember(event.target.checked)} />
        Remember on this device</label>
      <button type="submit">Save key</button>
      <button type="button" onClick={forget}>Forget key</button>
    </form>
    <p role="status">{message}</p>
  </section>
}
