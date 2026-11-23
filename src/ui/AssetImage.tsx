import { useEffect, useState } from 'react'
import { openStorage } from '@engine/storage'

export function AssetImage({ id, alt }: { id: string; alt: string }) {
  const [source, setSource] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    let url: string | undefined
    setSource('')
    setError('')
    void (async () => {
      const store = await openStorage()
      try {
        const blob = await store.readAsset(id)
        if (active) { url = URL.createObjectURL(blob); setSource(url) }
      } finally { store.db.close() }
    })().catch(e => { if (active) setError(e.message) })
    return () => { active = false; if (url) URL.revokeObjectURL(url) }
  }, [id])
  return source ? <img src={source} alt={alt} /> : error ? <span role="alert">{error}</span> : null
}
