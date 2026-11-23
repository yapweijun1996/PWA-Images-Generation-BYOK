import { ArrowRight, BookOpen, BriefcaseBusiness, Building2, Clapperboard, Download, FolderOpen, GraduationCap, Maximize, PanelsTopLeft, Trash2, ZoomIn } from 'lucide-react'
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

const studioIcons = { manga: BookOpen, commercial: BriefcaseBusiness, interior: Building2, uiux: PanelsTopLeft, movie: Clapperboard, education: GraduationCap }

type Locale = 'en' | 'zh-CN'
type Tab = 'home' | 'create' | 'assets' | 'projects'
interface WorkspaceProps { productName: string; buildId: string }
export function Workspace(props: WorkspaceProps) {
  const [projectId, setProjectId] = useState(() => localStorage.getItem('active-project') || 'first-project')
  const [tab, setTab] = useState<Tab>(() => window.matchMedia('(max-width: 767px)').matches ? 'home' : 'create')
  return <ProjectWorkspace {...props} tab={tab} setTab={setTab} key={projectId} projectId={projectId} switchProject={id => { localStorage.setItem('active-project', id); setProjectId(id); setTab('create') }} />
}

function ProjectWorkspace({ productName, buildId, projectId, switchProject, tab, setTab }: WorkspaceProps & { tab: Tab; setTab: (tab: Tab) => void; projectId: string; switchProject: (id: string) => void }) {
  const [locale, setLocale] = useState<Locale>(() => localStorage.getItem('ui-language') === 'zh-CN' ? 'zh-CN' : 'en')
  const [theme, setTheme] = useState<'light'|'dark'>(() => localStorage.getItem('ui-theme') === 'light' ? 'light' : 'dark')
  useEffect(() => { document.documentElement.lang = locale }, [locale])
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
  }, [studio.project, tab])
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
  function selectStudio(id: typeof studioIds[number]) {
    perform(async () => {
      if (!studio.project) return
      await patchProject(projectId, {studioId: id})
      creation.changeDraft({stageId: ''}); studio.refresh(); setTab('create')
    })
  }
  const studioLinks = studioIds.map(id => {
    const Icon = studioIcons[id]
    return <button type="button" key={id} aria-pressed={id === activeStudio.id} onClick={() => selectStudio(id)}>
      <Icon size={20} aria-hidden="true"/>{getStudio(id, locale).name}</button>
  })
  const navigation = <nav aria-label={t('Studios','工作室')}>{studioLinks}</nav>
  const recentProjects = projects.filter(p => p.id !== 'first-project' || p.name !== 'Untitled project' || p.createdAt !== p.updatedAt ||
    (p.id === projectId && (studio.assets.length || studio.jobs.length || creation.draft?.prompt)))
    .sort((a,b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0,4)
  const home = <section className="studio-home">
    <h2>{t('Recent projects','最近项目')}</h2>
    {recentProjects.length ? <ul>{recentProjects.map(p => <li key={p.id}>
      <button type="button" onClick={() => perform(() => leave(p.id))}><FolderOpen size={19} aria-hidden="true"/><span>{p.name}</span><ArrowRight size={16} aria-hidden="true"/></button>
    </li>)}</ul> : <p>{t('Choose a studio, add your OpenAI key in navigation, then describe your first image.', '选择工作室，在导航中添加 OpenAI 密钥，然后描述你的第一张图片。')}</p>}
    <button className="home-continue" type="button" onClick={() => setTab('create')}>{t('Continue creating','继续创作')}<ArrowRight size={18} aria-hidden="true"/></button>
    <h2>{t('Studios','工作室')}</h2><nav aria-label={t('Choose a studio','选择工作室')}>{studioLinks}</nav>
  </section>
  const version = studio.versions.find(v => v.assetId === selectedAsset)
  const [compareId, setCompareId] = useState('')
  const [zoom,setZoom] = useState(1)
  const needsReview = Boolean(version?.provenance.referenceAssetIds.length && selectedAsset && !studio.project?.reviewedAssetIds?.includes(selectedAsset))
  const canvas = <section className="artboard">
    <h2>{studio.project?.name || t('Canvas','画布')}</h2>
    {selectedAsset ? <><div className={'canvas-preview zoom-'+zoom}><AssetImage id={selectedAsset} alt={t('Selected project image','选中的项目图片')} />
      {compareId && compareId !== selectedAsset && <AssetImage id={compareId} alt={t('Comparison image','对照图片')} />}</div>
      <div className="image-actions" role="group" aria-label={t('Image tools','图像工具')}>
        <button onClick={() => setZoom(1)}><Maximize size={17} aria-hidden="true"/>{t('Fit','适应画布')}</button>
        <button onClick={() => setZoom(zoom === 1 ? 2 : 1)} aria-pressed={zoom === 2}><ZoomIn size={17} aria-hidden="true"/>{t('Zoom','放大')}</button>
        <button disabled={needsReview} aria-label={t('Download image','下载图片')} onClick={() => perform(() => downloadImage(selectedAsset))}><Download size={17} aria-hidden="true"/>{t('Export','导出')}</button>
        <button aria-label={t('Move to trash','移至回收站')} onClick={() => perform(()=>trash(selectedAsset))}><Trash2 size={17} aria-hidden="true"/>{t('Delete','删除')}</button>
      </div><div>
      <label>{t('Compare with','对照图片')}<select value={compareId} onChange={e=>setCompareId(e.target.value)}><option value="">{t('None','无')}</option>{visibleAssets.filter(a=>a.id!==selectedAsset).map((a,i)=><option key={a.id} value={a.id}>{i+1} · {a.source}</option>)}</select></label></div>
      {needsReview && <section><h3>{t('Review against references','对照参考图审核')}</h3>{version!.provenance.referenceAssetIds.map(id=><AssetImage key={id} id={id} alt={t('Source reference','原始参考图')}/>)}
      <ul>{activeStudio.reviewChecks.map(check=><li key={check.id}>{check.label}</li>)}</ul>
      <button onClick={()=>perform(async()=>{ await patchProject(projectId, current => ({reviewedAssetIds:[...new Set([...(current.reviewedAssetIds || []),selectedAsset])]})); studio.refresh() })}>{t('Accept after review','审核并接受')}</button></section>}
      </>
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
    home={home} canvas={canvas} composer={composer} inspector={creation.inspector} navigation={navigation} keySettings={<KeySettings locale={locale} />} library={library} />
    <footer>Build {buildId}</footer></>
}
