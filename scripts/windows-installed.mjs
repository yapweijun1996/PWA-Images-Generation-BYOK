/* global URL, document, navigator, matchMedia */
// This manual release check owns a disposable browser profile on a Windows hosted runner.
import assert from 'node:assert/strict'
import process from 'node:process'
import { execFileSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { tmpdir, release } from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { setTimeout as delay } from 'node:timers/promises'

const { chromium } = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE).href)
const channel = process.argv[2]
assert(['chrome','edge'].includes(channel))
const suffix = channel === 'chrome' ? 'Google/Chrome/Application/chrome.exe' : 'Microsoft/Edge/Application/msedge.exe'
const executable = [process.env.ProgramFiles, process.env['ProgramFiles(x86)'], process.env.LOCALAPPDATA]
  .filter(Boolean).map(base => path.join(base,suffix)).find(existsSync)
assert(executable, channel + ' installation not found on runner.')
const site = 'https://yapweijun1996.github.io/PWA-Images-Generation-BYOK/'
const profile = await mkdtemp(path.join(tmpdir(),'image-studio-install-'))
const out = path.resolve('windows-evidence',channel)
await mkdir(out,{recursive:true})
const evidence = { channel, windows: release(), startedAt: new Date().toISOString(), site, steps: [] }
const success = (name,details={}) => evidence.steps.push({name,...details})

let child, browser, page
async function start(offline) {
  const flags = ['--user-data-dir='+profile,'--remote-debugging-port=0','--no-first-run','--no-default-browser-check',
    '--disable-background-mode','--disable-features=msEdgeFirstRunExperience','--window-size=1440,900']
  if (offline) flags.push('--proxy-server=http://127.0.0.1:1','--proxy-bypass-list=<-loopback>','--disable-quic')
  child = spawn(executable,[...flags,'about:blank'],{stdio:'ignore'})
  const portFile = path.join(profile,'DevToolsActivePort')
  for (let n=0;n<100;n++) {
    assert(child.exitCode === null,'Browser exited before DevTools became available.')
    try {
      const port = (await readFile(portFile,'utf8')).split(/\r?\n/)[0]
      if (/^\d+$/.test(port)) {
        browser = await chromium.connectOverCDP('http://127.0.0.1:'+port,{timeout:3000})
        return browser.contexts()[0]
      }
    } catch { /* The browser writes the port file during initialization. */ }
    await delay(300)
  }
  throw new Error('Could not connect to the dedicated browser.')
}

async function stop() {
  if (!child) return
  if (browser) {
    const session = await browser.newBrowserCDPSession().catch(()=>null)
    await session?.send('Browser.close').catch(()=>{})
  }
  for(let n=0;n<50 && child.exitCode===null;n++) await delay(200)
  if (child.exitCode===null) execFileSync('taskkill',['/pid',String(child.pid),'/T','/F'],{stdio:'ignore'})
  browser=undefined
  child=undefined
  await unlink(path.join(profile,'DevToolsActivePort')).catch(()=>{})
}

try {
  const expected = (await (await globalThis.fetch(new URL('build-info.json',site))).json()).buildId
  const context = await start(false)
  evidence.browser = browser.version()
  page = await context.newPage()
  await page.goto(site,{waitUntil:'domcontentloaded'})
  await page.getByRole('heading',{name:'PWA Images Studio',exact:true}).waitFor()
  assert((await page.locator('footer').innerText()).includes(expected))
  await page.evaluate(()=>navigator.serviceWorker.ready.then(()=>true))
  await page.reload()
  await page.waitForFunction(()=>Boolean(navigator.serviceWorker.controller))
  const inspector=await context.newCDPSession(page)
  const {installabilityErrors}=await inspector.send('Page.getInstallabilityErrors')
  assert.deepEqual(installabilityErrors,[])
  success('Online deployed build under service-worker control',{build:expected,installabilityErrors})
  const draft='Windows offline draft '+channel
  await page.getByRole('textbox',{name:'Prompt',exact:true}).fill(draft)
  // Reload the actual project in a separate tab to verify autosave independently of layout.
  const readback=await context.newPage()
  await readback.goto(site,{waitUntil:'domcontentloaded'})
  const saved=readback.getByRole('textbox',{name:'Prompt',exact:true})
  await saved.waitFor()
  assert.equal(await saved.evaluate(async (field,expected) => {
    for(let n=0;n<100 && field.value!==expected;n++) await new Promise(resolve=>globalThis.setTimeout(resolve,50))
    return field.value
  },draft),draft)
  await readback.close()
  success('Fresh tab loaded the project draft from local storage')
  const cdp=await browser.newBrowserCDPSession()
  await cdp.send('PWA.install',{manifestId:site,installUrlOrBundleUrl:site})
  const osState=await cdp.send('PWA.getOsAppState',{manifestId:site})
  success('Installed deployed manifest through the browser PWA domain',{osState})
  await cdp.send('PWA.changeAppUserSettings',{manifestId:site,displayMode:'standalone'})
  success('Selected standalone launch preference')
  await stop()
  const cold=await start(true)
  const probe=await cold.newPage()
  let unavailable=false
  try { await probe.goto('https://yapweijun1996.github.io/windows-network-probe-'+Date.now(),{timeout:10000}) }
  catch(error){ unavailable=/ERR_PROXY_CONNECTION_FAILED|ERR_TUNNEL_CONNECTION_FAILED|ERR_NO_SUPPORTED_PROXIES/.test(String(error)) }
  assert(unavailable,'Uncached request did not prove the profile was offline.')
  success('Fresh browser process could not reach an uncached same-origin URL')
  const cdpCold=await browser.newBrowserCDPSession()
  const {targetId}=await cdpCold.send('PWA.launch',{manifestId:site})
  assert(targetId)
  // Exclude ordinary tabs that startup recovery may have restored.
  for(let n=0;n<100;n++){
    page=undefined
    for(const candidate of cold.pages()){
      if (!candidate.url().startsWith(site)) continue
      const target=await cold.newCDPSession(candidate)
      try {if((await target.send('Target.getTargetInfo')).targetInfo.targetId===targetId){page=candidate;break}}
      finally{await target.detach()}
    }
    if(page)break
    await delay(200)
  }
  assert(page,'The installed launch target was unavailable.')
  await page.getByRole('heading',{name:'PWA Images Studio',exact:true}).waitFor()
  const mode=await page.evaluate(()=>({standalone:matchMedia('(display-mode: standalone)').matches,
    browser:matchMedia('(display-mode: browser)').matches, controller:navigator.serviceWorker.controller?.scriptURL}))
  assert(mode.standalone && !mode.browser && mode.controller===site+'sw.js',JSON.stringify(mode))
  assert((await page.locator('footer').innerText()).includes(expected))
  const field=page.getByRole('textbox',{name:'Prompt',exact:true})
  await page.waitForFunction(expected=>document.querySelector('textarea')?.value===expected,draft)
  assert.equal(await field.inputValue(),draft)
  await page.screenshot({path:path.join(out,'offline-window.png')})
  success('Cold installed standalone launch rendered the same release and persisted project draft offline',mode)
  evidence.result='PASS'
} catch(error) {
  evidence.result='FAIL'
  evidence.error=String(error)
  await page?.screenshot({path:path.join(out,'failure.png'),timeout:3000}).catch(()=>{})
  process.exitCode=1
} finally {
  await writeFile(path.join(out,'result.json'),JSON.stringify(evidence,null,2))
  globalThis.console.log(JSON.stringify(evidence,null,2))
  await stop()
}
