import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { patchProject } from '@engine/storage/draft'
import { openStorage } from '@engine/storage'
import { maxGenerationBatchSize } from '@engine/queue'
import { saveEdit, type Expansion, type PreparedEdit, type Stroke } from '@engine/editing'
import type { Asset } from '@engine/types'

export type { PreparedEdit } from '@engine/editing'
interface Props {
  projectId: string
  selectedAssetId?: string
  assetCount?: number
  locale: 'en' | 'zh-CN'
  onPrepared: (edit: PreparedEdit) => void
}

export function ImageEditTools(props: Props) {
  return <Editor key={JSON.stringify([props.projectId, props.selectedAssetId])} {...props} />
}

function Editor({ projectId, selectedAssetId, assetCount, locale, onPrepared }: Props) {
  const t = (en: string, zh: string) => locale === 'zh-CN' ? zh : en
  const [mode, setMode] = useState<'reference' | 'inpaint' | 'outpaint'>('reference')
  const [assets, setAssets] = useState<Asset[]>([])
  const [source, setSource] = useState(selectedAssetId ?? '')
  const [url, setUrl] = useState('')
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [strokes, setStrokes] = useState<Stroke[]>([])
  const [radius, setRadius] = useState(5)
  const [cursor, setCursor] = useState({ x: 50, y: 50 })
  const [edge, setEdge] = useState<Expansion>('all')
  const [margin, setMargin] = useState(25)
  const [count, setCount] = useState(1)
  const [character, setCharacter] = useState('')
  const [style, setStyle] = useState('')
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState<'idle' | 'ready' | 'error'>('idle')
  const drawing = useRef<number | null>(null)
  const live = useRef(false)

  useEffect(() => {
    live.current = true
    return () => { live.current = false }
  }, [])

  useEffect(() => {
    let current = true
    void (async () => {
      const store = await openStorage()
      try {
        const [items, project] = await Promise.all([
          store.db.getAllFromIndex('assets', 'byProject', projectId),
          store.db.get('projects', projectId),
        ])
        if (!current) return
        setAssets(items)
        for (const [name, set] of [['character', setCharacter], ['style', setStyle]] as const) {
          let saved = project?.referenceLocks?.[name]
          if (!project?.referenceLocks) {
            try { saved = localStorage.getItem('image-studio:lock:' + projectId + ':' + name) ?? undefined } catch { /* Legacy storage may be unavailable. */ }
          }
          set(saved && items.some(item => item.id === saved) ? saved : '')
        }
      } finally { store.db.close() }
    })().catch(() => { if (current) setStatus('error') })
    return () => { current = false }
  }, [projectId, assetCount])

  useEffect(() => {
    let current = true
    let objectUrl: string | undefined
    setUrl('')
    setSize({ width: 0, height: 0 })
    setStrokes([])
    if (source) void (async () => {
      const store = await openStorage()
      try {
        if ((await store.db.get('assets', source))?.projectId !== projectId) throw new Error()
        const blob = await store.readAsset(source)
        if (current) { objectUrl = URL.createObjectURL(blob); setUrl(objectUrl) }
      } finally { store.db.close() }
    })().catch(() => { if (current) setStatus('error') })
    return () => { current = false; if (objectUrl) URL.revokeObjectURL(objectUrl) }
  }, [source, projectId])

  function paint(event: PointerEvent<SVGSVGElement>, start: boolean) {
    if (start && (drawing.current !== null || event.button !== 0)) return
    if (!start && event.pointerId !== drawing.current) return
    const box = event.currentTarget.getBoundingClientRect()
    const point = { x: (event.clientX - box.left) / box.width, y: (event.clientY - box.top) / box.height }
    if (start) {
      event.currentTarget.setPointerCapture(event.pointerId)
      drawing.current = event.pointerId
      setStrokes(old => [...old, { points: [point], radius: radius / 100 }])
    } else {
      setStrokes(old => old.map((stroke, i) => i === old.length - 1 ? { ...stroke, points: [...stroke.points, point] } : stroke))
    }
  }

  function lock(kind: 'character' | 'style', id: string) {
    if (kind === 'character') setCharacter(id)
    else setStyle(id)
    void patchProject(projectId, current => ({
      referenceLocks: { character: character || undefined, style: style || undefined, ...current.referenceLocks, [kind]: id || undefined },
    })).catch(() => setStatus('error'))
  }

  async function prepare() {
    setBusy(true)
    setStatus('idle')
    try {
      let primary = source
      let maskAssetId
      let background: PreparedEdit['background']
      if (mode !== 'reference') {
        const saved = await saveEdit(projectId, source, mode === 'inpaint' ? strokes : { edge, fraction: margin / 100 })
        primary = saved.referenceId
        maskAssetId = saved.maskAssetId
        background = saved.background
      }
      const referenceAssetIds = [...new Set([primary, character, style].filter(Boolean))]
      const hints = []
      if (character) hints.push(t('Match the character appearance in reference ', '保持角色外观与参考图一致，参考图编号 ') + (referenceAssetIds.indexOf(character) + 1) + '.')
      if (style) hints.push(t('Match the visual style in reference ', '保持画风与参考图一致，参考图编号 ') + (referenceAssetIds.indexOf(style) + 1) + '.')
      if (mode === 'outpaint') hints.push(t('Extend the scene into the transparent border.', '将画面自然延伸至透明边缘。'))
      if (live.current) {
        onPrepared({ referenceAssetIds, maskAssetId, promptHint: hints.join(' ') || undefined, background, count })
        setStatus('ready')
      }
    } catch { if (live.current) setStatus('error') }
    finally { if (live.current) setBusy(false) }
  }

  const options = assets.map((a, i) => <option key={a.id} value={a.id}>
    {t('Image', '图像')} {i + 1} · {a.dimensions ? a.dimensions.width + '×' + a.dimensions.height : a.mediaType} · {a.id.slice(0, 6)}
  </option>)
  const none = <option value="">{t('None', '无')}</option>
  return <fieldset disabled={busy} className="image-edit-tools" onChange={() => setStatus('idle')}>
    <legend>{t('Image editing', '图像编辑')}</legend>
    <label>{t('Edit mode', '编辑模式')} <select value={mode} onChange={e => setMode(e.target.value as typeof mode)}>
      <option value="reference">{t('Reference and batch', '参考图与批量生成')}</option>
      <option value="inpaint">{t('Paint a region', '涂选区域')}</option><option value="outpaint">{t('Extend frame', '扩展画幅')}</option>
    </select></label>
    <label>{t('Source image', '原始图像')} <select value={source} onChange={e => setSource(e.target.value)}>{none}{options}</select></label>
    {url && <div style={{ position: 'relative', maxWidth: '100%', width: size.width || 'auto' }}>
      <img src={url} alt={t('Source image', '原始图像')} onLoad={e => setSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
        onError={() => setStatus('error')} style={{ display: 'block', width: '100%', height: 'auto' }} />
      {mode === 'inpaint' && size.width > 0 && <svg aria-label={t('Paint the edit region', '涂选编辑区域')}
        viewBox={'0 0 ' + size.width + ' ' + size.height} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', touchAction: 'none', cursor: 'crosshair' }}
        onPointerDown={e => paint(e, true)} onPointerMove={e => paint(e, false)} onLostPointerCapture={() => { drawing.current = null }}>
        {strokes.map((s, i) => {
          const r = s.radius * Math.min(size.width, size.height)
          return <g key={i} opacity=".55" fill="#ff3975" stroke="#ff3975">
            <circle cx={s.points[0].x * size.width} cy={s.points[0].y * size.height} r={r}/>
            <polyline points={s.points.map(p => p.x * size.width + ',' + p.y * size.height).join(' ')}
              fill="none" strokeWidth={2 * r} strokeLinecap="round" strokeLinejoin="round" />
          </g>
        })}
      </svg>}
    </div>}
    {mode === 'inpaint' && <div>
      <label>{t('Brush radius', '笔刷半径')} {radius}% <input type="range" min="1" max="25" value={radius} onChange={e => setRadius(+e.target.value)} /></label>
      <details><summary>{t('Position brush with keyboard', '使用键盘定位笔刷')}</summary>
        {(['x', 'y'] as const).map(axis => <label key={axis}>{axis.toUpperCase()} {cursor[axis]}%
          <input type="range" min="0" max="100" value={cursor[axis]} onChange={e => setCursor({ ...cursor, [axis]: +e.target.value })} /></label>)}
        <button type="button" disabled={!size.width} onClick={() => setStrokes([...strokes, { points: [{ x: cursor.x / 100, y: cursor.y / 100 }], radius: radius / 100 }])}>{t('Mark area', '标记区域')}</button>
      </details>
      <button type="button" disabled={!strokes.length} onClick={() => setStrokes(strokes.slice(0,-1))}>{t('Undo stroke', '撤销一笔')}</button>
    </div>}
    {mode === 'outpaint' && <div>
      <label>{t('Extend edge', '扩展边缘')} <select value={edge} onChange={e => setEdge(e.target.value as Expansion)}>
        {(['all','top','bottom','left','right'] as const).map((key, i) => <option key={key} value={key}>{t(['All sides','Top','Bottom','Left','Right'][i], ['四周','顶部','底部','左侧','右侧'][i])}</option>)}
      </select></label>
      <label>{t('Extension', '扩展比例')} {margin}% <input type="range" min="5" max="100" step="5" value={margin} onChange={e => setMargin(+e.target.value)} /></label>
    </div>}
    <label>{t('Character reference lock', '角色参考锁定')} <select value={character} onChange={e => lock('character', e.target.value)}>{none}{options}</select></label>
    <label>{t('Style reference lock', '风格参考锁定')} <select value={style} onChange={e => lock('style', e.target.value)}>{none}{options}</select></label>
    <label>{t('Images to generate', '生成张数')} <select value={count} onChange={e => setCount(+e.target.value)}>{Array.from({ length: maxGenerationBatchSize }, (_, index) => <option key={index}>{index + 1}</option>)}</select></label>
    <button type="button" disabled={busy || (mode !== 'reference' && !size.width) || (mode === 'inpaint' && !strokes.length)} onClick={() => void prepare()}>{t('Apply to prompt', '应用至提示词')}</button>
    {status === 'ready' && <p role="status">{t('Ready to generate.', '可开始生成。')}</p>}
    {status === 'error' && <p role="alert">{t('Could not prepare the edit. Check image size, device storage and source availability.', '无法准备编辑素材，请检查图像大小、设备空间及原图是否可用。')}</p>}
  </fieldset>
}
