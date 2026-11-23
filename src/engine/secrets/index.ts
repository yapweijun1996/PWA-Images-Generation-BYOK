const temporary = new Map<string, string>()
const slot = (providerId: string) => 'pwa-images-byok:key:' + providerId

export function readProviderKey(providerId: string): string | null {
  return temporary.get(providerId) ?? localStorage.getItem(slot(providerId))
}

export function saveProviderKey(providerId: string, input: string, remember: boolean) {
  const key = input.trim()
  if (!key || /\s/.test(key)) throw new Error('Enter a key without spaces.')
  if (remember) {
    localStorage.setItem(slot(providerId), key)
    temporary.delete(providerId)
  } else {
    localStorage.removeItem(slot(providerId))
    temporary.set(providerId, key)
  }
}

export function clearProviderKey(providerId: string) {
  temporary.delete(providerId)
  localStorage.removeItem(slot(providerId))
}
