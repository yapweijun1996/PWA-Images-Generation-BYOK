import { useEffect, useRef, useState } from 'react'
import { openStorage } from '@engine/storage'
import type { Project } from '@engine/types'
import { registerUpdateGuard } from '@pwa'
import { feedback, type Locale } from './workspaceLocale'
import { AssetImage } from './AssetImage'

export interface BoardPanel { assetId: string; caption: string }
export interface BoardState { panels: BoardPanel[]; reviewed: boolean }
type BoardProject = Project & { board?: BoardState }
interface CaptionEdit {
  index: number
  text: string
  base: BoardState
  status: 'editing' | 'saving' | 'failed' | 'saved'
}

function releaseDraft(guard: {current: (() => void) | null}) {
  guard.current?.()
  guard.current = null
}

export function StudioBoard({ project, selected, locale, onChange }: {
  project: BoardProject; selected?: string; locale: Locale; onChange: () => void
}) {
  const t = (en: string, zh: string) => locale === 'en' ? en : zh
  const [message, setMessage] = useState('')
  const [caption, setCaption] = useState('')
  const [edit, setEdit] = useState<CaptionEdit>()
  const panelGuard = useRef<(() => void) | null>(null)
  const newPanelGuard = useRef<(() => void) | null>(null)
  const captionRevision = useRef(0)
  const board = project.board ?? { panels: [], reviewed: false }
  const panels = edit && edit.status !== 'saved' ? edit.base.panels : board.panels
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (panelGuard.current || newPanelGuard.current) event.preventDefault()
    }
    window.addEventListener('beforeunload', warn)
    return () => {
      window.removeEventListener('beforeunload', warn)
      releaseDraft(panelGuard)
      releaseDraft(newPanelGuard)
    }
  }, [])
  useEffect(() => {
    if (edit?.status === 'saved' && JSON.stringify(project.board) !== JSON.stringify(edit.base)) setEdit(undefined)
  }, [edit, project.board])

  const change = async (update: (current: BoardState) => BoardState, expected = board) => {
    const release = registerUpdateGuard('draft')
    setMessage('')
    try {
      const { db } = await openStorage()
      try {
        const tx = db.transaction('projects','readwrite')
        const current = await tx.store.get(project.id) as BoardProject
        const stored = current.board ?? { panels: [], reviewed: false }
        if (JSON.stringify(stored) !== JSON.stringify(expected)) {
          onChange()
          throw new Error('The board changed in another tab. Review its current panels and try again.')
        }
        await tx.store.put({ ...current, updatedAt: new Date().toISOString(), board: update(stored) } as BoardProject)
        await tx.done
      } finally { db.close() }
      onChange()
      return true
    } catch (e) {
      setMessage((e as Error).message)
      return false
    } finally { release() }
  }

  function changeCaption(index: number, text: string) {
    const base = edit?.base ?? board
    if (text === base.panels[index].caption) {
      releaseDraft(panelGuard)
      setEdit(undefined)
    } else {
      panelGuard.current ??= registerUpdateGuard('draft')
      setEdit({ index, text, base, status: 'editing' })
    }
  }

  async function saveCaption(draft: CaptionEdit) {
    setEdit({ ...draft, status: 'saving' })
    const saved = await change(current => ({
      ...current, reviewed: false,
      panels: current.panels.map((panel, index) => index === draft.index ? { ...panel, caption: draft.text } : panel),
    }), draft.base)
    if (saved) releaseDraft(panelGuard)
    setEdit({ ...draft, status: saved ? 'saved' : 'failed' })
  }

  async function addPanel(assetId: string) {
    const revision = captionRevision.current
    const saved = await change(current => ({ ...current, reviewed: false, panels: [...current.panels, { assetId, caption }] }))
    if (saved && captionRevision.current === revision) releaseDraft(newPanelGuard)
  }
  async function exportBoard() {
    const store = await openStorage()
    try {
      const canvas = document.createElement('canvas')
      const cols = Math.min(2,board.panels.length)
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas unavailable')
      const font = '22px sans-serif'
      ctx.font = font
      const captions = board.panels.map(panel => {
        const lines: string[] = []
        let line = ''
        for (const char of panel.caption) {
          if (char === '\n' || ctx.measureText(line + char).width > 606) {
            lines.push(line)
            line = ''
          }
          if (char !== '\n') line += char
        }
        return [...lines, line]
      })
      const rowOffsets: number[] = []
      let height = 0
      for (let start = 0; start < captions.length; start += cols) {
        rowOffsets.push(height)
        const lines = Math.max(...captions.slice(start, start + cols).map(text => text.length))
        height += Math.max(560, 464 + (lines - 1) * 26 + 24)
      }
      canvas.width = cols * 640
      canvas.height = height
      ctx.fillStyle = '#fff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.font = font
      for (const [i, panel] of board.panels.entries()) {
        const bitmap = await createImageBitmap(await store.readAsset(panel.assetId))
        const x = i % cols * 640
        const y = rowOffsets[Math.floor(i / cols)]
        const scale = Math.min(608 / bitmap.width, 420 / bitmap.height)
        ctx.drawImage(bitmap, x + (640 - bitmap.width * scale) / 2, y + 12, bitmap.width * scale, bitmap.height * scale)
        bitmap.close()
        ctx.fillStyle = '#171720'
        captions[i].forEach((line, row) => ctx.fillText(line, x + 16, y + 464 + row * 26))
      }
      const blob = await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Export failed'))))
      const url=URL.createObjectURL(blob),link=document.createElement('a')
      link.download='studio-board.png';link.href=url;link.click()
      setTimeout(()=>URL.revokeObjectURL(url),30000)
    } catch(e) {setMessage((e as Error).message)} finally {store.db.close()}
  }
  return <details><summary>{t('Storyboard & annotations','分镜与注释')}</summary>
    <label>{t('Dialogue or annotation','对白或注释')}<textarea value={caption} maxLength={100} disabled={Boolean(edit)} onChange={e => {
      const text = e.target.value
      captionRevision.current++
      setCaption(text)
      if (text) newPanelGuard.current ??= registerUpdateGuard('draft')
      else releaseDraft(newPanelGuard)
    }} /></label>
    <button disabled={Boolean(edit) || !selected || board.panels.length>=12} onClick={()=>{if(selected) void addPanel(selected)}}>{t('Add selected image','添加选中图片')}</button>
    <ol>{panels.map((panel,i)=><li key={i}><AssetImage locale={locale} id={panel.assetId} alt={t('Panel','画格')+' '+(i+1)} />
      <label>{t('Panel text','画格文字')}<textarea value={edit?.index === i ? edit.text : panel.caption} maxLength={100}
        readOnly={Boolean(edit && (edit.index !== i || edit.status === 'saving' || edit.status === 'saved'))}
        onChange={event => changeCaption(i, event.target.value)}
        onBlur={() => { if (edit?.index === i && edit.status === 'editing') void saveCaption(edit) }} /></label>
      <button disabled={Boolean(edit) || !i} onClick={()=>void change(b=>{const panels=[...b.panels];[panels[i-1],panels[i]]=[panels[i],panels[i-1]];return {panels,reviewed:false}})}>{t('Move earlier','前移')}</button>
      <button disabled={Boolean(edit)} onClick={()=>void change(b=>({reviewed:false,panels:b.panels.filter((_,n)=>n!==i)}))}>{t('Remove panel','移除画格')}</button></li>)}</ol>
    {edit?.status === 'failed' && <>
      <button onClick={() => void saveCaption(edit)}>{t('Retry saving caption','重试保存文字')}</button>
      <button onClick={() => { releaseDraft(panelGuard); setEdit(undefined); setMessage('') }}>{t('Discard caption changes','放弃文字改动')}</button>
    </>}
    <label><input type="checkbox" checked={!edit && board.reviewed} disabled={Boolean(edit)} onChange={e=>{const reviewed=e.target.checked;void change(b=>({...b,reviewed}))}} />{t('I reviewed the captions, accuracy and image continuity','我已审核文字、准确性和画面连续性')}</label>
    <button disabled={Boolean(edit) || !board.panels.length || !board.reviewed} onClick={()=>void exportBoard()}>{t('Export reviewed board','导出已审核的分镜')}</button><p role="status">{feedback(message,locale)}</p>
  </details>
}
