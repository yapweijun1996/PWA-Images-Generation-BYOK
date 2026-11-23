import { useEffect, useRef, useState } from 'react'
import { feedback, type Locale } from './workspaceLocale'
import { canvas, png } from '@engine/editing/canvas'
import { openStorage } from '@engine/storage'

const thumbnailLimit = 240

async function thumbnailBlob(source: Blob) {
  if (typeof createImageBitmap !== 'function') return source
  const bitmap = await createImageBitmap(source)
  try {
    const longestSide = Math.max(bitmap.width, bitmap.height)
    if (longestSide <= thumbnailLimit) return source
    const scale = thumbnailLimit / longestSide
    const width = Math.max(1, Math.round(bitmap.width * scale))
    const height = Math.max(1, Math.round(bitmap.height * scale))
    const context = canvas(width, height)
    context.drawImage(bitmap, 0, 0, width, height)
    return png(context)
  } finally {
    bitmap.close()
  }
}

type AssetImageProps = { id: string; alt: string; locale?: Locale; onReady?: () => void; thumbnail?: boolean }

export function AssetImage({ id, alt, locale = 'en', onReady, thumbnail = false }: AssetImageProps) {
  const [source, setSource] = useState('')
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    let url: string | undefined
    setSource('')
    setError('')
    void (async () => {
      const store = await openStorage()
      let original: Blob
      try {
        original = await store.readAsset(id)
      } finally { store.db.close() }
      if (!active) return
      const blob = thumbnail ? await thumbnailBlob(original).catch(() => original) : original
      if (active) { url = URL.createObjectURL(blob); setSource(url) }
    })().catch(e => { if (active) setError(e.message) })
    return () => { active = false; if (url) URL.revokeObjectURL(url) }
  }, [id, thumbnail])
  return source ? <img src={source} alt={alt} onLoad={onReady} onError={() => {
    setSource('')
    setError('This image could not be decoded.')
  }} /> : error ? <span role="alert">{feedback(error,locale)}</span> : null
}

export function AssetThumbnail({ id, locale }: Pick<AssetImageProps, 'id' | 'locale'>) {
  const container = useRef<HTMLSpanElement>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const element = container.current
    if (!element || typeof IntersectionObserver !== 'function') {
      setVisible(true)
      return
    }
    const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { rootMargin: '64px' })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return <span className="asset-thumbnail" ref={container}>
    {visible && <AssetImage id={id} locale={locale} alt="" thumbnail />}
  </span>
}
