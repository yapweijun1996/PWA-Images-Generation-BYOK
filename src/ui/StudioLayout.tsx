import { InstallHelp } from './InstallHelp'
import { DeviceStorage } from './DeviceStorage'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { FolderOpen, Home, Image, Menu, Moon, PanelRight, Sparkles, Sun, X } from 'lucide-react'
import './studio-layout.css'

export type StudioLocale = 'en' | 'zh-CN'
export type StudioTheme = 'dark' | 'light'
export type StudioTab = 'home' | 'create' | 'assets' | 'projects'

type StudioLayoutProps = {
  productName: string
  locale: StudioLocale
  onLocaleChange: (locale: StudioLocale) => void
  theme: StudioTheme
  onThemeChange: (theme: StudioTheme) => void
  activeTab: StudioTab
  onTabChange: (tab: StudioTab) => void
  navigation: ReactNode
  keySettings: ReactNode
  home: ReactNode
  canvas: ReactNode
  composer: ReactNode
  inspector: ReactNode
  library: ReactNode
}

const labels = {
  en: { home: 'Home', create: 'Create', assets: 'Assets', projects: 'Projects', menu: 'Open navigation', close: 'Close', settings: 'Generation settings', compose: 'Prompt', language: 'Language', light: 'Switch to light theme', dark: 'Switch to dark theme' },
  'zh-CN': { home: '首页', create: '创作', assets: '素材', projects: '项目', menu: '打开导航', close: '关闭', settings: '生成设置', compose: '提示词', language: '语言', light: '切换浅色主题', dark: '切换深色主题' },
} satisfies Record<StudioLocale, Record<string, string>>

const tabs = [
  { id: 'home', Icon: Home },
  { id: 'create', Icon: Sparkles },
  { id: 'assets', Icon: Image },
  { id: 'projects', Icon: FolderOpen },
] as const

/** Layout owns presentation only; the caller owns all content and persisted state. */
export function StudioLayout({ productName, locale, onLocaleChange, theme, onThemeChange, activeTab, onTabChange, navigation, keySettings, home, canvas, composer, inspector, library }: StudioLayoutProps) {
  const t = labels[locale]
  const [drawer, setDrawer] = useState<'navigation' | 'inspector' | null>(null)
  const [composerOpen, setComposerOpen] = useState(false)
  const drawerClose = useRef<HTMLButtonElement>(null)
  const sidebarRef = useRef<HTMLElement>(null)
  const inspectorRef = useRef<HTMLElement>(null)
  const opener = useRef<HTMLButtonElement | null>(null)

  useEffect(() => {
    if (!drawer) return
    drawerClose.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawer(null)
      if (event.key !== 'Tab') return
      const panel = drawer === 'navigation' ? sidebarRef.current : inspectorRef.current
      const focusable = [...(panel?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])') ?? [])].filter((element) => element.getClientRects().length > 0)
      if (!focusable.length) return
      const first = focusable[0]
      const last = focusable[focusable.length - 1]
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus() }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      opener.current?.focus()
    }
  }, [drawer])

  useEffect(() => {
    const media = window.matchMedia('(min-width: 1280px)')
    const closeOnDesktop = () => { if (media.matches) setDrawer(null) }
    media.addEventListener('change', closeOnDesktop)
    return () => media.removeEventListener('change', closeOnDesktop)
  }, [])

  const openDrawer = (name: 'navigation' | 'inspector', button: HTMLButtonElement) => {
    opener.current = button
    setDrawer(name)
  }
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 768px)')
    const adapt = () => { if (desktop.matches && activeTab === 'home') onTabChange('create') }
    adapt()
    desktop.addEventListener('change', adapt)
    return () => desktop.removeEventListener('change', adapt)
  }, [activeTab, onTabChange])

  const changeTab = (tab: StudioTab) => {
    setDrawer(null)
    onTabChange(tab)
  }

  return (
    <div className="studio-layout" data-theme={theme} data-tab={activeTab}>
      <header className="studio-header">
        <button className="studio-icon-button studio-drawer-trigger" type="button" aria-label={t.menu} aria-expanded={drawer === 'navigation'} onClick={(event) => openDrawer('navigation', event.currentTarget)}><Menu aria-hidden="true" size={19} /></button>
        <div className="studio-brand"><span className="studio-brand-mark"><Sparkles aria-hidden="true" size={18} /></span><h1>{productName}</h1><span className="studio-byok">BYOK</span></div>
        <div className="studio-header-actions">
          <InstallHelp locale={locale} />
          <label className="studio-language"><span className="studio-visually-hidden">{t.language}</span><select value={locale} onChange={(event) => onLocaleChange(event.target.value as StudioLocale)}><option value="en">EN</option><option value="zh-CN">中文</option></select></label>
          <button className="studio-icon-button" type="button" aria-label={theme === 'dark' ? t.light : t.dark} onClick={() => onThemeChange(theme === 'dark' ? 'light' : 'dark')}>{theme === 'dark' ? <Sun aria-hidden="true" size={19} /> : <Moon aria-hidden="true" size={19} />}</button>
          <button className="studio-icon-button studio-drawer-trigger" type="button" aria-label={t.settings} aria-expanded={drawer === 'inspector'} onClick={(event) => openDrawer('inspector', event.currentTarget)}><PanelRight aria-hidden="true" size={19} /></button>
        </div>
      </header>
      {drawer && <button className="studio-backdrop" type="button" aria-label={t.close} onClick={() => setDrawer(null)} />}
      <div className="studio-body">
        <aside ref={sidebarRef} className={`studio-sidebar${drawer === 'navigation' ? ' is-open' : ''}`} aria-label={t.menu} {...(drawer === 'navigation' ? { role: 'dialog', 'aria-modal': true } : {})}>
          {drawer === 'navigation' && <button ref={drawerClose} className="studio-drawer-close studio-icon-button" type="button" aria-label={t.close} onClick={() => setDrawer(null)}><X aria-hidden="true" size={19} /></button>}
          <div className="studio-sidebar-content">{navigation}
            <nav className="studio-library-nav" aria-label={t.assets}>
              {tabs.filter(({ id }) => id !== 'home').map(({ id, Icon }) => <button key={id} type="button" aria-current={activeTab === id ? 'page' : undefined} onClick={() => changeTab(id)}><Icon size={18} aria-hidden="true" />{t[id]}</button>)}
            </nav>
            <div className="studio-key-settings">{keySettings}<DeviceStorage locale={locale} /></div></div>
        </aside>
        <main className="studio-main">
          <div className="studio-home-region">{activeTab === 'home' && home}</div>
          <div className="studio-canvas-region">{canvas}</div>
          <div className="studio-library-region">{library}</div>
          <section className={`studio-composer${composerOpen ? ' is-open' : ''}`} aria-label={t.compose}>
            <button className="studio-composer-toggle" type="button" aria-expanded={composerOpen} onClick={() => setComposerOpen(!composerOpen)}>{t.compose}<span aria-hidden="true">{composerOpen ? '−' : '+'}</span></button>
            <div className="studio-composer-content">{composer}</div>
          </section>
        </main>
        <aside ref={inspectorRef} className={`studio-inspector${drawer === 'inspector' ? ' is-open' : ''}`} aria-label={t.settings} {...(drawer === 'inspector' ? { role: 'dialog', 'aria-modal': true } : {})}>
          {drawer === 'inspector' && <button ref={drawerClose} className="studio-drawer-close studio-icon-button" type="button" aria-label={t.close} onClick={() => setDrawer(null)}><X aria-hidden="true" size={19} /></button>}
          <div className="studio-inspector-content">{inspector}</div>
        </aside>
      </div>
      <nav className="studio-mobile-nav" aria-label={t.menu}>{tabs.map(({ id, Icon }) => <button key={id} type="button" aria-current={activeTab === id ? 'page' : undefined} onClick={() => changeTab(id)}><Icon size={19} aria-hidden="true" /><span>{t[id]}</span></button>)}</nav>
    </div>
  )
}
