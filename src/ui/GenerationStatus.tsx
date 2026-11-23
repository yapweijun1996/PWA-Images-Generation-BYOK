import { useEffect, useRef, useState } from 'react'
import { batchStoppedMessage, type GenerationJob } from '@engine/queue'
import { feedback, type Locale } from './workspaceLocale'

function announcement(jobs: readonly GenerationJob[], locale: Locale) {
  const t = (en: string, zh: string) => locale === 'en' ? en : zh
  const completed = jobs.filter(job => job.status === 'succeeded').length
  const unsent = jobs.filter(job => job.message === batchStoppedMessage).length
  const messages = []
  if (completed) messages.push(completed === 1
    ? t('Image generation completed. The image is available in Assets.', '图片生成已完成，可在素材中查看。')
    : t(`${completed} images completed. They are available in Assets.`, `${completed} 张图片已生成，可在素材中查看。`))
  for (const job of jobs) {
    if (job.status === 'uncertain') messages.push(t('Image generation result unconfirmed.', '图片生成结果待确认。'), feedback(job.message ?? '', locale))
    if (job.status === 'failed' && job.message !== batchStoppedMessage) {
      messages.push(t('Image generation failed.', '图片生成失败。'), feedback(job.message ?? '', locale))
    }
  }
  if (unsent) messages.push(unsent === 1
    ? t('One queued image request was not sent.', '一项排队中的图片请求未发送。')
    : t(`${unsent} queued image requests were not sent.`, `${unsent} 项排队中的图片请求未发送。`))
  if (jobs.some(job => job.status === 'running')) messages.push(t('Image generation started.', '已开始生成图片。'))
  return messages.filter(Boolean).join(locale === 'en' ? ' ' : '')
}

export function GenerationStatus({ jobs, locale, paused }: {
  jobs: readonly GenerationJob[] | undefined
  locale: Locale
  paused: boolean
}) {
  const previous = useRef<readonly GenerationJob[] | undefined>(undefined)
  const [activity, setActivity] = useState<readonly GenerationJob[]>([])

  useEffect(() => {
    if (!jobs || (paused && previous.current)) return
    const earlier = previous.current
    previous.current = jobs
    if (!earlier || earlier === jobs) return

    const previousStatuses = new Map(earlier.map(job => [job.id, job.status]))
    const changed = jobs.filter(job => job.status !== 'queued' && previousStatuses.get(job.id) !== job.status)
    if (changed.length) setActivity(changed)
  }, [jobs, paused])

  return <p className="studio-visually-hidden" role="status" aria-live="polite" aria-atomic="true" inert={paused}>
    {activity.length > 0 && <span key={activity.map(job => `${job.id}:${job.status}`).join(',')}>{announcement(activity, locale)}</span>}
  </p>
}
