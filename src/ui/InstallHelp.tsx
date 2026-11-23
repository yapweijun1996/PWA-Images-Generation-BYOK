import { CircleHelp } from 'lucide-react'
import { useId, useRef, useState, useSyncExternalStore } from 'react'
import './install-help.css'

interface InstallOffer extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let offer: InstallOffer | null = null
type Status = 'idle' | 'accepted' | 'dismissed' | 'unavailable'
let status: Status = 'idle'
const subscribers = new Set<() => void>()
const notify = () => subscribers.forEach(listener => listener())
const subscribe = (listener: () => void) => {
  subscribers.add(listener)
  return () => { subscribers.delete(listener) }
}

// Chrome's offer is single-use and can arrive before a project mounts or while switching projects.
window.addEventListener('beforeinstallprompt', event => {
  event.preventDefault()
  offer = event as InstallOffer
  status = 'idle'
  notify()
})
window.addEventListener('appinstalled', () => {
  offer = null
  // Chrome can acknowledge the request before Android finishes launcher setup.
  status = 'accepted'
  notify()
})
const snapshot = () => window.matchMedia?.('(display-mode: standalone)').matches ||
  (navigator as Navigator & { standalone?: boolean }).standalone ? 'installed' : offer ? 'available' : status

async function requestInstall() {
  const current = offer
  if (!current) return
  offer = null
  notify()
  try {
    await current.prompt()
    const choice = await current.userChoice
    status = choice.outcome
  } catch { status = 'unavailable' }
  notify()
}

export function InstallHelp({ locale }: { locale: 'en' | 'zh-CN' }) {
  const t = (en: string, zh: string) => locale === 'en' ? en : zh
  const state = useSyncExternalStore(subscribe, snapshot)
  const dialog = useRef<HTMLDialogElement>(null)
  const opener = useRef<HTMLButtonElement>(null)
  const [open, setOpen] = useState(false)
  const title = useId()
  return <>
    <button type="button" ref={opener} className="studio-icon-button" aria-haspopup="dialog" aria-expanded={open}
      aria-label={t('Help and installation', '帮助与安装')} onClick={() => { dialog.current?.showModal(); setOpen(true) }}>
      <CircleHelp size={19} aria-hidden="true"/>
    </button>
    <dialog ref={dialog} aria-labelledby={title} className="install-help"
      onClose={() => { setOpen(false); opener.current?.focus() }}>
      <header><h2 id={title}>{t('Help and installation', '帮助与安装')}</h2>
        <button type="button" onClick={() => dialog.current?.close()}>{t('Close', '关闭')}</button></header>
      <h3>{t('Install the studio', '安装工作室')}</h3>
      {state === 'available' && <button type="button" onClick={() => void requestInstall()}>{t('Install app', '安装应用')}</button>}
      <div role="status">
        {state === 'installed' && t('Installed on this device.', '已安装在此设备上。')}
        {state === 'dismissed' && t('Installation dismissed. You can keep using the studio in this tab.', '已取消安装。你可以继续在此标签页使用工作室。')}
        {state === 'accepted' && t('Installation requested. Complete any remaining browser or system prompts.', '已请求安装。请完成浏览器或系统显示的后续确认。')}
        {state === 'unavailable' && t('The browser could not start installation. Try the browser menu.', '浏览器无法启动安装，请尝试浏览器菜单。')}
      </div>
      {state !== 'installed' && <ul>
        <li>{t(
          'On iPhone or iPad, open Share in Safari. On iPhone, tap More (⋯) first if Share is hidden. Scroll or tap View More to find Add to Home Screen. Turn on Open as Web App if shown, then tap Add.',
          '在 iPhone 或 iPad 上，打开 Safari 的“分享”。如果 iPhone 上没有显示“分享”，请先轻点“更多（⋯）”。向下滚动或轻点“查看更多”，找到“添加到主屏幕”。如有“作为网页 App 打开”选项，请启用并轻点“添加”。',
        )}</li>
        <li>{t('Chrome or Edge: look for Install in the address bar or browser menu. When installation is unavailable, bookmark this page and use it in your browser.', 'Chrome 或 Edge：在地址栏或浏览器菜单中查找安装选项。如果无法安装，可将此页加入书签并在浏览器中使用。')}</li>
      </ul>}
      <h3>{t('Projects and offline use', '项目与离线使用')}</h3>
      <p>{t('After the first online load, reopen the studio to view your saved projects offline. Generating images and enhancing prompts require an internet connection.', '首次联网加载后，可离线重新打开工作室查看已保存的项目。生成图片和优化提示词需要联网。')}</p>
      <p>{t('Projects stay in this browser. Before clearing site data or moving devices, open Projects and choose Back up project. Use Restore backup on the destination device.', '项目保存在当前浏览器中。清除站点数据或更换设备前，请在“项目”中选择“备份项目”，再于目标设备选择“恢复备份”。')}</p>
      <p>{t('The studio has no account or hosted proxy. Your browser sends generation requests directly to OpenAI using your own key. Project backups exclude the key.', '工作室无需注册，也不提供托管代理。浏览器会使用你的密钥直接向 OpenAI 发送生成请求。项目备份不含密钥。')}</p>
    </dialog>
  </>
}
