import type { PreparedEdit } from '@engine/editing'
import { qualityLabel } from './workspaceLocale'
import { PromptEnhancer } from './PromptEnhancer'
import { useEffect, useRef, useState } from 'react'
import type { ModelCapabilities } from '@engine/types'
import { importReference } from '@engine/assets'
import { registerUpdateGuard } from '@pwa'
import { useProjectDraft } from './useProjectDraft'
import { provider, useStudio } from './useStudio'

export type StudioState = ReturnType<typeof useStudio>
type Text = (en: string, zh: string) => string

export function useCreation(studio: StudioState, projectId: string, t: Text, locale: 'en' | 'zh-CN', fallbackParentId?: string) {
  const [models, setModels] = useState<readonly ModelCapabilities[]>([])
  const { draft, change, flush } = useProjectDraft(projectId, Boolean(studio.project), studio.setError)
  const modelId = draft?.modelId || models[0]?.id || ''
  const size = draft?.size ?? '1024x1024'
  const quality = draft?.quality ?? 'low'
  const prompt = draft?.prompt ?? ''
  const references = draft?.referenceAssetIds ?? []
  const edit = draft?.edit
  const count = edit?.count ?? 1
  const [busy, setBusy] = useState(false)
  const importing = useRef<Promise<void> | null>(null)
  const submitting = useRef(false)
  useEffect(() => { void provider.getCapabilities().then(({ models }) => setModels(models)) }, [])
  const model = models.find(m => m.id === modelId)
  async function flushDraft() {
    if (importing.current) await importing.current
    await flush()
  }
  const setPrompt = (value: string) => change({ prompt: value })
  const estimate = model?.prices?.find(price => price.size === size && price.quality === quality)
  const submit = async () => {
    if (submitting.current || !prompt.trim() || !studio.project) return
    submitting.current = true
    setBusy(true)
    try {
      await flushDraft()
      await studio.generate({ providerId: provider.id, model: modelId, prompt: [prompt.trim(), edit?.promptHint].filter(Boolean).join('\n'),
        settings: { size, quality, count: 1 }, parentVersionId: draft?.parentVersionId ?? fallbackParentId, referenceAssetIds: references, maskAssetId: edit?.maskAssetId }, count)
    } catch (error) { studio.setError((error as Error).message) }
    finally { submitting.current = false; setBusy(false) }
  }
  const inspector = <section>
    <label>{t('Model','模型')}<select disabled={!draft} value={modelId} onChange={e => change({modelId:e.target.value})}>{models.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}</select></label>
    <label>{t('Image size','图片尺寸')}<select disabled={!draft} value={size} onChange={e => change({size:e.target.value})}>{model?.sizes.map(s => <option key={s.id} value={s.id}>{s.id === 'auto' ? t('Auto','自动') : s.label}</option>)}</select></label>
    <label>{t('Quality','画质')}<select disabled={!draft} value={quality} onChange={e => change({quality:e.target.value})}>{model?.qualityLevels.map(q => <option key={q} value={q}>{qualityLabel(q,locale)}</option>)}</select></label>
    {estimate && <output>{t('Estimated image output','预计图片输出费用')} · {estimate.currency} {(estimate.amountPerImage * count).toFixed(5)} {t('(excludes input)','（不含输入费用）')}</output>}
    <p>{t('Usage is billed to your OpenAI account.','费用由你的 OpenAI 账户支付。')}</p>
  </section>
  const composer = <form onSubmit={e => { e.preventDefault(); void submit() }}>
    <label>{t('Prompt','提示词')}<textarea disabled={!draft} value={prompt} onChange={e => setPrompt(e.target.value)} required rows={3}
      placeholder={t('Describe your image…','描述你想生成的图片…')} /></label>
    <PromptEnhancer prompt={prompt} locale={locale} onApply={setPrompt} />
    <label>{t('Add reference','添加参考图')}<input type="file" accept="image/png,image/jpeg,image/webp" multiple disabled={busy || !draft} onChange={e => {
      const files = Array.from(e.target.files ?? [])
      e.target.value = ''
      if (!files.length || importing.current) return
      if (files.length + references.length > (model?.maxReferenceImages ?? 0)) { studio.setError('Too many references.'); return }
      setBusy(true)
      const release = registerUpdateGuard('draft')
      importing.current = (async () => {
        const ids = [...references]
        for (const file of files) {
          const asset = await importReference(projectId,file)
          ids.push(asset.id)
          change({ edit: undefined, referenceAssetIds: [...ids] })
        }
      })().catch(error => studio.setError(error.message)).finally(() => {
        release()
        importing.current = null
        setBusy(false)
        studio.refresh()
      })
    }} /></label>
    {references.map((id,index) => <button key={id} disabled={busy} type="button" onClick={() => change({ edit: undefined, referenceAssetIds: references.filter(item => item !== id) })}>{t('Remove reference','移除参考图')} {index + 1}</button>)}
    <button type="submit" disabled={busy || !prompt.trim() || !model || !studio.project}>{busy ? t('Generating…','生成中…') : t('Generate image','生成图片')}{count > 1 && ' × '+count}</button>
  </form>
  return {
    composer, inspector, setPrompt, draft, changeDraft: change, flushDraft,
    prepareEdit: (value: PreparedEdit) => {
      const { referenceAssetIds, ...prepared } = value
      change({ edit: prepared, referenceAssetIds })
    },
  }
}
