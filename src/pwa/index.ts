import { useEffect } from 'react'
import { registerSW } from 'virtual:pwa-register'

export function PwaControls() {
  useEffect(() => {
    if (import.meta.env.PROD) {
      // T-102 owns the accessible prompt and the guarded activation callback.
      registerSW()
    }
  }, [])

  return null
}
