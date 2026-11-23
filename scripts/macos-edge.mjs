/* global URL, document, navigator, matchMedia, console */
// This harness only changes preferences in a disposable hosted macOS runner.
import assert from 'node:assert/strict'
import { execFileSync, spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises'
import { homedir, release, tmpdir } from 'node:os'
import path from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'

assert(process.platform === 'darwin' && process.env.GITHUB_ACTIONS === 'true')
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE)
const site = 'https://yapweijun1996.github.io/PWA-Images-Generation-BYOK/'
const edge = '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge'
const profile = await mkdtemp(path.join(tmpdir(), 'studio-edge-profile-'))
const out = 'macos-edge-evidence'
const domain = '/Library/Managed Preferences/com.microsoft.Edge'
const policy = 'WebAppInstallForceList'
const draft = 'macOS Edge offline installation check'
const evidence = { site, os: release(), time: new Date().toISOString(), steps: [] }
await mkdir(out, { recursive: true })

function appShim() {
  const apps = path.join(homedir(), 'Applications')
  if (!existsSync(apps)) return
  return execFileSync('/usr/bin/find', [apps, '-name', '*Images Studio*.app', '-type', 'd', '-print', '-quit'], { encoding:'utf8' }).trim()
}

let context, page, policyWritten = false
try {
  assert(existsSync(edge), 'Preinstalled Edge executable is unavailable')
  assert(!appShim(), 'The hosted macOS user already has an Images Studio app')
  const plist = '<dict><key>url</key><string>' + site + '</string><key>default_launch_container</key><string>window</string><key>create_desktop_shortcut</key><true/></dict>'
  execFileSync('sudo', ['/usr/bin/defaults', 'write', domain, policy, '-array', plist])
  policyWritten = true
  const args = ['--disable-features=msEdgeFirstRunExperience', '--window-size=1440,900']
  const launch = offline => chromium.launchPersistentContext(profile, {
    executablePath: edge, headless: false, viewport: { width:1440, height:900 },
    args: offline ? [...args, '--proxy-server=http://127.0.0.1:1', '--proxy-bypass-list=<-loopback>', '--disable-quic'] : args,
  })
  const expected = (await (await globalThis.fetch(new URL('build-info.json',site))).json()).buildId
  context = await launch(false)
  evidence.version = context.browser().version()
  page = await context.newPage()
  await page.goto(site)
  await page.waitForFunction(build => document.querySelector('footer')?.textContent.includes(build), expected)
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true))
  await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await page.getByRole('textbox',{name:'Prompt',exact:true}).fill(draft)
  const concurrent = await context.newPage()
  await concurrent.goto(site)
  await concurrent.waitForFunction(value => document.querySelector('.creation-prompt textarea')?.value === value, draft)
  await concurrent.close()
  evidence.build = expected
  evidence.steps.push('Public release opened in Edge and an independent tab recovered the stored draft')
  let shim
  for (let attempt=0; attempt<35 && !shim; attempt++) {
    shim = appShim()
    if (!shim) await delay(1000)
  }
  if (shim) evidence.steps.push('macOS app shim appeared after managed installation')
  await context.close()
  context = await launch(true)
  page = await context.newPage()
  await assert.rejects(page.goto(new URL('/macos-edge-network-test-' + Date.now(),site).href), /ERR_PROXY_CONNECTION_FAILED|ERR_TUNNEL_CONNECTION_FAILED/)
  await page.goto(site)
  await page.waitForFunction(value => document.querySelector('.creation-prompt textarea')?.value === value, draft)
  assert((await page.locator('footer').innerText()).includes(expected))
  assert(await page.evaluate(() => Boolean(navigator.serviceWorker.controller)))
  await page.screenshot({path:out+'/browser-offline.png'})
  evidence.steps.push('A fresh browser process recovered the build and draft with an uncached network probe blocked')
  assert(shim, 'Edge did not publish a managed application shim')
  const plistPath = path.join(shim, 'Contents', 'Info.plist')
  const appId = execFileSync('/usr/libexec/PlistBuddy',['-c','Print:CrAppModeShortcutID',plistPath],{encoding:'utf8'}).trim()
  assert.match(appId,/^[a-p]{32}$/)
  const opened = context.waitForEvent('page',{timeout:30000})
  spawn(edge,['--user-data-dir='+profile,'--profile-directory=Default','--app-id='+appId],{stdio:'ignore'})
  page = await opened
  await page.waitForFunction(value => document.querySelector('.creation-prompt textarea')?.value === value, draft)
  assert((await page.locator('footer').innerText()).includes(expected))
  assert(await page.evaluate(() => matchMedia('(display-mode: standalone)').matches && Boolean(navigator.serviceWorker.controller)))
  await page.screenshot({path:out+'/standalone-offline.png'})
  evidence.steps.push('Managed app opened as a fresh standalone window and recovered the same build and draft offline')
  evidence.result = 'PASS'
} catch (error) {
  evidence.result = 'FAIL'
  evidence.error = String(error)
  await page?.screenshot({path:out+'/failure.png',timeout:3000}).catch(()=>{})
  process.exitCode = 1
} finally {
  await writeFile(out + '/result.json',JSON.stringify(evidence,null,2))
  console.log(JSON.stringify(evidence,null,2))
  await context?.close().catch(()=>{})
  if (policyWritten) execFileSync('sudo',['/usr/bin/defaults','delete',domain,policy])
}
