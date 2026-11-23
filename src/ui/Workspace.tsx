import { ImageEditTools } from './ImageEditTools'
import { StudioBoard } from './StudioBoard'
import './workspace.css'
import { useEffect, useState } from 'react'
import { useStudio } from './useStudio'
import { useCreation } from './CreationPanel'
import { openStorage } from '@engine/storage'
import { patchProject } from '@engine/storage/draft'
import type { Project } from '@engine/types'
import { downloadImage, downloadProjectBackup, importProjectBackup } from '@engine/export'
import { AssetImage } from './AssetImage'
import { KeySettings } from './KeySettings'
import { StudioLayout } from './StudioLayout'
import { getStudio, isStudioId, studioIds } from '@studios/index'

type Locale = 'en' | 'zh-CN'
type Tab = 'home' | 'create' | 'assets' | 'projects'
interface WorkspaceProps { productName: string; buildId: string }
export function Workspace(props: WorkspaceProps) {
  const [projectId, setProjectId] = useState(() => localStorage.getItem('active-project') || 'first-project')
  return <ProjectWorkspace {...props} key={projectId} projectId={projectId} switchProject={id => { localStorage.setItem('active-project', id); setProjectId(id) }} />
}

function ProjectWorkspace({ productName, buildId, projectId, switchProject }: WorkspaceProps & { projectId: string; switchProject: (id: string) => void }) {
  const [locale, setLocale] = useState<Locale>(() => localStorage.getItem('ui-language') === 'zh-CN' ? 'zh-CN' : 'en')
  const [theme, setTheme] = useState<'light'|'dark'>(() => localStorage.getItem('ui-theme') === 'light' ? 'light' : 'dark')
  useEffect(() => { document.documentElement.lang = locale }, [locale])
  const [tab, setTab] = useState<Tab>('create')
  const t = (en: string, zh: string) => locale === 'en' ? en : zh
  const studio = useStudio(projectId)
  const [projects, setProjects] = useState<Project[]>([])
  const [selected, setSelected] = useState('')
  const [name, setName] = useState('')
  const trashed = new Set(studio.project?.trashedAssetIds ?? [])
  const visibleVersions = studio.versions.filter(v => !trashed.has(v.assetId))
  const visibleAssets = studio.assets.filter(asset => !trashed.has(asset.id))
  const creation = useCreation(studio, projectId, t, locale, !selected ? visibleVersions[0]?.id : undefined)
  const parent = studio.versions.find(v => v.id === creation.draft?.parentVersionId)
  const selectedAsset = [selected, parent?.assetId, visibleVersions[0]?.assetId].find(id => id && !trashed.has(id))
  const activeStudio = getStudio(isStudioId(studio.project?.studioId ?? '') ? studio.project!.studioId as typeof studioIds[number] : 'manga', locale)
  const stage = activeStudio.stages.find(s => s.id === creation.draft?.stageId) || activeStudio.stages[0]
  const perform = (action: () => Promise<unknown>) => { void action().catch(e => studio.setError(e.message)) }
  useEffect(() => {
    let current = true
    void (async () => {
      const store = await openStorage()
      try { const list = await store.db.getAll('projects'); if (current) setProjects(list) } finally { store.db.close() }
    })().catch(() => {})
    return () => { current = false }
  }, [studio.project])
  async function leave(id: string) {
    await creation.flushDraft()
    switchProject(id)
  }
  function selectAsset(id: string) {
    setSelected(id)
    creation.changeDraft({ parentVersionId: studio.versions.find(v => v.assetId === id)?.id })
  }
  async function trash(id: string, restore = false) {
    await patchProject(projectId, current => {
      const ids = new Set(current.trashedAssetIds)
      if (restore) ids.delete(id)
      else ids.add(id)
      return {trashedAssetIds: [...ids]}
    })
    if (!restore) selectAsset('')
    studio.refresh()
  }
  const navigation = <nav aria-label={t('Studios','工作室')}>{studioIds.map(id => <button type="button" key={id}
    aria-pressed={id === activeStudio.id} onClick={() => perform(async () => {
      if (!studio.project) return
      await patchProject(projectId, {studioId: id})
      creation.changeDraft({stageId: ''}); studio.refresh(); setTab('create')
    })}>{getStudio(id, locale).name}</button>)}</nav>
  const version = studio.versions.find(v => v.assetId === selectedAsset)
  const [compareId, setCompareId] = useState('')
  const [zoom,setZoom] = useState(1)
  const needsReview = Boolean(version?.provenance.referenceAssetIds.length && selectedAsset && !studio.project?.reviewedAssetIds?.includes(selectedAsset))
  const canvas = <section className="artboard">
    <h2>{studio.project?.name || t('Canvas','画布')}</h2>
    {selectedAsset ? <><div className={'canvas-preview zoom-'+zoom}><AssetImage id={selectedAsset} alt={t('Selected project image','选中的项目图片')} />
      {compareId && compareId !== selectedAsset && <AssetImage id={compareId} alt={t('Comparison image','对照图片')} />}</div>
      <div><button onClick={() => setZoom(zoom===1?2:1)}>{zoom===1 ? t('Zoom in','放大') : t('Fit','适应画布')}</button>
      <label>{t('Compare with','对照图片')}<select value={compareId} onChange={e=>setCompareId(e.target.value)}><option value="">{t('None','无')}</option>{visibleAssets.filter(a=>a.id!==selectedAsset).map((a,i)=><option key={a.id} value={a.id}>{i+1} · {a.source}</option>)}</select></label></div>
      {needsReview && <section><h3>{t('Review against references','对照参考图审核')}</h3>{version!.provenance.referenceAssetIds.map(id=><AssetImage key={id} id={id} alt={t('Source reference','原始参考图')}/>)}
      <ul>{activeStudio.reviewChecks.map(check=><li key={check.id}>{check.label}</li>)}</ul>
      <button onClick={()=>perform(async()=>{ await patchProject(projectId, current => ({reviewedAssetIds:[...new Set([...(current.reviewedAssetIds || []),selectedAsset])]})); studio.refresh() })}>{t('Accept after review','审核并接受')}</button></section>}
      <button disabled={needsReview} onClick={() => perform(() => downloadImage(selectedAsset))}>{t('Download image','下载图片')}</button><button onClick={()=>perform(()=>trash(selectedAsset))}>{t('Move to trash','移至回收站')}</button></>
      : <p>{t('Your image will appear here.','生成的图片将显示在这里。')}</p>}
    {studio.error && <p role="alert">{studio.error}</p>}
    {studio.jobs.slice(0,3).map(job => <p key={job.id} role="status">{job.status} {job.message}</p>)}
    {visibleVersions.length > 0 && <div aria-label={t('Version history','版本历史')}>{visibleVersions.map((v,i) =>
      <button key={v.id} title={v.provenance.prompt} onClick={() => selectAsset(v.assetId)}><AssetImage id={v.assetId} alt="" />V{visibleVersions.length-i}</button>)}</div>}
  </section>
  const composer = <><label>{t('Workflow stage','工作阶段')}<select disabled={!creation.draft} value={stage.id} onChange={e => creation.changeDraft({stageId:e.target.value})}>
    {activeStudio.stages.map(s => <option value={s.id} key={s.id}>{s.label}</option>)}</select></label>
    {activeStudio.templates.filter(template => template.stageId === stage.id).map(template => <button type="button" key={template.id} onClick={() => creation.setPrompt(template.prompt)}>{template.label}</button>)}
    {creation.composer}<details><summary>{t('Edit, lock references or batch','编辑、锁定参考图或批量生成')}</summary><ImageEditTools projectId={projectId} selectedAssetId={selectedAsset} locale={locale} onPrepared={creation.prepareEdit} /></details>{studio.project && <StudioBoard project={studio.project} selected={needsReview ? undefined : selectedAsset} locale={locale} onChange={studio.refresh} />}</>
  const library = tab === 'assets' ? <section><h2>{t('Assets','素材')}</h2>{visibleAssets.map(asset => <button key={asset.id} onClick={() => {selectAsset(asset.id);setTab('create')}}><AssetImage id={asset.id} alt={asset.source} /></button>)}{trashed.size>0 && <details><summary>{t('Trash','回收站')} ({trashed.size})</summary>{[...trashed].map((id,i)=><button key={id} onClick={()=>perform(()=>trash(id,true))}>{t('Restore image','恢复图片')} {i+1}</button>)}</details>}</section>
    : <section><h2>{t('Projects','项目')}</h2>{projects.map(p => <button key={p.id} onClick={() => perform(async () => { await leave(p.id);setTab('create') })}>{p.name}</button>)}
    <form onSubmit={e => {e.preventDefault();perform(async () => {
      if (!name.trim()) return
      const now = new Date().toISOString()
      const project = {id:crypto.randomUUID(), name:name.trim(), studioId:activeStudio.id, createdAt:now, updatedAt:now}
      await creation.flushDraft()
      const { db } = await openStorage()
      try { await db.add('projects', project) } finally { db.close() }
      switchProject(project.id)
    })}}><label>{t('Project name','项目名称')}<input required value={name} onChange={e => setName(e.target.value)} /></label><button>{t('New project','新建项目')}</button>
    <button type="button" disabled={!name.trim()} onClick={()=>perform(async()=>{await patchProject(projectId,{name:name.trim()});studio.refresh();setName('')})}>{t('Rename current project','重命名当前项目')}</button></form>
    <button onClick={() => perform(async () => { await creation.flushDraft(); await downloadProjectBackup(projectId) })}>{t('Back up project','备份项目')}</button>
    <label>{t('Restore backup','恢复备份')}<input type="file" accept=".zip" onChange={e => { const file=e.target.files?.[0]; if(file) perform(async () => { await creation.flushDraft();switchProject((await importProjectBackup(file)).id) }) }} /></label></section>
  return <><StudioLayout productName={productName} locale={locale} onLocaleChange={value => {localStorage.setItem('ui-language',value);setLocale(value)}} theme={theme}
    onThemeChange={value => {localStorage.setItem('ui-theme',value);setTheme(value)}} activeTab={tab} onTabChange={setTab}
    canvas={canvas} composer={composer} inspector={creation.inspector} navigation={navigation} keySettings={<KeySettings locale={locale} />} library={library} />
    <footer>Build {buildId}</footer></>
}
