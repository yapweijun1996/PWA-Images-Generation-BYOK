import { useEffect, useState } from 'react'
import { openStorage } from '@engine/storage'
import type { Project } from '@engine/types'
import { AssetImage } from './AssetImage'

export interface BoardPanel { assetId: string; caption: string }
export interface BoardState { panels: BoardPanel[]; reviewed: boolean }
type BoardProject = Project & { board?: BoardState }

export function StudioBoard({ project, selected, locale, onChange }: {
  project: BoardProject; selected?: string; locale: string; onChange: () => void
}) {
  const t = (en: string, zh: string) => locale === 'en' ? en : zh
  const [message, setMessage] = useState('')
  const [caption, setCaption] = useState('')
  const board = project.board ?? { panels: [], reviewed: false }
  useEffect(() => { setCaption('');setMessage('') }, [project.id])
  const change = async (update: (current: BoardState) => BoardState) => {
    try {
      const { db } = await openStorage()
      try {
        const tx = db.transaction('projects','readwrite')
        const current = await tx.store.get(project.id) as BoardProject
        const stored = current.board ?? { panels: [], reviewed: false }
        if (JSON.stringify(stored) !== JSON.stringify(board)) {
          onChange()
          throw new Error(t('The board changed in another tab. Review its current panels and try again.',
            '另一标签页已修改分镜。请查看最新画格后重试。'))
        }
        await tx.store.put({ ...current, updatedAt: new Date().toISOString(), board: update(stored) } as BoardProject)
        await tx.done
      } finally { db.close() }
      onChange()
    } catch (e) { setMessage((e as Error).message) }
  }
  async function exportBoard() {
    const store = await openStorage()
    try {
      const canvas = document.createElement('canvas')
      const cols = Math.min(2,board.panels.length)
      canvas.width = cols*640
      canvas.height = Math.ceil(board.panels.length/cols)*560
      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas unavailable')
      ctx.fillStyle = '#fff';ctx.fillRect(0,0,canvas.width,canvas.height)
      for (const [i,panel] of board.panels.entries()) {
        const bitmap = await createImageBitmap(await store.readAsset(panel.assetId))
        const x = i%cols*640, y = Math.floor(i/cols)*560
        const scale = Math.min(608/bitmap.width,420/bitmap.height)
        ctx.drawImage(bitmap,x+(640-bitmap.width*scale)/2,y+12,bitmap.width*scale,bitmap.height*scale)
        bitmap.close()
        ctx.font='22px sans-serif';ctx.fillStyle='#171720'
        let line='', row=0
        for (const char of panel.caption) {
          if (ctx.measureText(line+char).width > 606 || char === '\n') {
            ctx.fillText(line,x+16,y+464+row++*26);line=''
          }
          if (char!=='\n') line+=char
        }
        ctx.fillText(line,x+16,y+464+row*26)
      }
      const blob = await new Promise<Blob>((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('Export failed'))))
      const url=URL.createObjectURL(blob),link=document.createElement('a')
      link.download='studio-board.png';link.href=url;link.click()
      setTimeout(()=>URL.revokeObjectURL(url),30000)
    } catch(e) {setMessage((e as Error).message)} finally {store.db.close()}
  }
  return <details><summary>{t('Storyboard & annotations','分镜与注释')}</summary>
    <label>{t('Dialogue or annotation','对白或注释')}<textarea value={caption} maxLength={100} onChange={e=>setCaption(e.target.value)} /></label>
    <button disabled={!selected || board.panels.length>=12} onClick={()=>{if(selected) void change(b=>({...b,reviewed:false,panels:[...b.panels,{assetId:selected,caption}]}))}}>{t('Add selected image','添加选中图片')}</button>
    <ol>{board.panels.map((panel,i)=><li key={i}><AssetImage id={panel.assetId} alt={t('Panel','画格')+' '+(i+1)} />
      <label>{t('Panel text','画格文字')}<input key={panel.caption} defaultValue={panel.caption} maxLength={100} onBlur={e=>{const text=e.target.value;if(text!==panel.caption)void change(b=>({...b,reviewed:false,panels:b.panels.map((p,n)=>n===i?{...p,caption:text}:p)}))}} /></label>
      <button disabled={!i} onClick={()=>void change(b=>{const panels=[...b.panels];[panels[i-1],panels[i]]=[panels[i],panels[i-1]];return {panels,reviewed:false}})}>{t('Move earlier','前移')}</button>
      <button onClick={()=>void change(b=>({reviewed:false,panels:b.panels.filter((_,n)=>n!==i)}))}>{t('Remove panel','移除画格')}</button></li>)}</ol>
    <label><input type="checkbox" checked={board.reviewed} onChange={e=>{const reviewed=e.target.checked;void change(b=>({...b,reviewed}))}} />{t('I reviewed the captions, accuracy and image continuity','我已审核文字、准确性和画面连续性')}</label>
    <button disabled={!board.panels.length || !board.reviewed} onClick={()=>void exportBoard()}>{t('Export reviewed board','导出已审核的分镜')}</button><p role="status">{message}</p>
  </details>
}
