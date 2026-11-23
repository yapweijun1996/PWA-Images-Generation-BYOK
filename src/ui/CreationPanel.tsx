import type { PreparedEdit } from '@engine/editing'
import { PromptEnhancer } from './PromptEnhancer'
import { useEffect, useRef, useState } from 'react'
import type { ModelCapabilities } from '@engine/types'
import { importReference } from '@engine/assets'
import { registerUpdateGuard } from '@pwa'
import { provider, useStudio } from './useStudio'

export type StudioState = ReturnType<typeof useStudio>
type Text = (en: string, zh: string) => string

export function useCreation(studio: StudioState, projectId: string, t: Text, locale: 'en' | 'zh-CN', parentVersionId?: string) {
  const [models, setModels] = useState<readonly ModelCapabilities[]>([])
  const [modelId, setModelId] = useState('')
  const [quality, setQuality] = useState('low')
  const [size, setSize] = useState('1024x1024')
  const draftKey = 'draft:' + projectId
  const [prompt, setPrompt] = useState(() => localStorage.getItem(draftKey) || '')
  const [references, setReferences] = useState<string[]>([])
  const [edit,setEdit] = useState<PreparedEdit>()
  const count = edit?.count ?? 1
  const [busy, setBusy] = useState(false)
  const submitting = useRef(false)
  useEffect(() => { void provider.getCapabilities().then(({ models }) => { setModels(models); setModelId(models[0].id) }) }, [])
  useEffect(() => {
    try { localStorage.setItem(draftKey, prompt) }
    catch { return registerUpdateGuard('draft') }
  }, [draftKey, prompt])
  useEffect(() => {
    if (references.length) return registerUpdateGuard('draft')
  }, [references.length])
  const model = models.find(m => m.id === modelId)
  const estimate = model?.prices?.find(price => price.size === size && price.quality === quality)
  const submit = async () => {
    if (submitting.current || !prompt.trim() || !studio.project) return
    submitting.current = true
    setBusy(true)
    try {
      await studio.generate({ providerId: provider.id, model: modelId, prompt: [prompt.trim(), edit?.promptHint].filter(Boolean).join('\n'),
        settings: { size, quality, count: 1 }, parentVersionId, referenceAssetIds: references, maskAssetId: edit?.maskAssetId }, count)
    } catch (error) { studio.setError((error as Error).message) }
    finally { submitting.current = false; setBusy(false) }
  }
  const inspector = <section>
    <label>{t('Model','模型')}<select value={modelId} onChange={e => setModelId(e.target.value)}>{models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
    <label>{t('Image size','图片尺寸')}<select value={size} onChange={e => setSize(e.target.value)}>{model?.sizes.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
    <label>{t('Quality','画质')}<select value={quality} onChange={e => setQuality(e.target.value)}>{model?.qualityLevels.map(q => <option key={q}>{q}</option>)}</select></label>
    {estimate && <output>{t('Estimated image output','预计图片输出费用')} · {estimate.currency} {(estimate.amountPerImage * count).toFixed(5)} {t('(excludes input)','（不含输入费用）')}</output>}
    <p>{t('Usage is billed to your OpenAI account.','费用由你的 OpenAI 账户支付。')}</p>
  </section>
  const composer = <form onSubmit={e => { e.preventDefault(); void submit() }}>
    <label>{t('Prompt','提示词')}<textarea value={prompt} onChange={e => setPrompt(e.target.value)} required rows={3}
      placeholder={t('Describe your image…','描述你想生成的图片…')} /></label>
    <PromptEnhancer prompt={prompt} locale={locale} onApply={setPrompt} />
    <label>{t('Add reference','添加参考图')}<input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={busy} onChange={async e => {
      setEdit(undefined)
      const files = Array.from(e.target.files ?? [])
      e.target.value = ''
      if (files.length + references.length > (model?.maxReferenceImages ?? 0)) { studio.setError(t('Too many references.','参考图过多。')); return }
      try {
        for (const file of files) {
          const asset = await importReference(projectId,file)
          setReferences(previous => [...previous,asset.id])
        }
      } catch (error) { studio.setError((error as Error).message) }
      studio.refresh()
    }} /></label>
    {references.map((id,index) => <button key={id} type="button" onClick={() => {setEdit(undefined);setReferences(previous => previous.filter(item => item !== id))}}>{t('Remove reference','移除参考图')} {index + 1}</button>)}
    <button type="submit" disabled={busy || !prompt.trim() || !model || !studio.project}>{busy ? t('Generating…','生成中…') : t('Generate image','生成图片')}{count > 1 && ' × '+count}</button>
  </form>
  return { composer, inspector, setPrompt, prepareEdit: (value: PreparedEdit) => { setEdit(value); setReferences(value.referenceAssetIds) } }
}
