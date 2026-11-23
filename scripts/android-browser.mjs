/* global URL, document, navigator, innerWidth, innerHeight, visualViewport, matchMedia, console */
import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import process from 'node:process'

const { _android, chromium } = await import(process.env.PLAYWRIGHT_MODULE)
const site = 'https://yapweijun1996.github.io/PWA-Images-Generation-BYOK/'
const folder = 'android-evidence'
await mkdir(folder, { recursive: true })
const evidence = { time: new Date().toISOString(), site, steps: [] }
const [device, ...others] = await _android.devices()
assert(device && /^emulator-\d+$/.test(device.serial()) && !others.length, 'Expected exactly one isolated Android emulator')
const shell = async command => (await device.shell(command)).toString().trim()
const adb = (...args) => execFileSync('adb', ['-s', device.serial(), ...args], { encoding: 'utf8' }).trim()
const chromePackage = 'com.android.chrome'
const draft = 'Android offline workspace check'
const verifyInstall = process.env.VERIFY_INSTALL === 'true'
const readNativeWindow = () => shell('uiautomator dump /data/local/tmp/studio-window.xml >/dev/null && cat /data/local/tmp/studio-window.xml')

async function tapNativeControl(tree, label) {
  const node = tree.match(new RegExp('<node\\b[^>]*(?:text|content-desc)="(?:' + label + ')"[^>]*bounds="\\[(\\d+),(\\d+)\\]\\[(\\d+),(\\d+)\\]"'))
  if (!node) return false
  const [, left, top, right, bottom] = node.map(Number)
  await shell('input tap ' + Math.floor((left + right) / 2) + ' ' + Math.floor((top + bottom) / 2))
  return true
}

async function tapNativeLabel(label) {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (await tapNativeControl(await readNativeWindow(), label)) return
  }
  throw new Error('Android did not show the expected native control: ' + label)
}

async function installedPackages() {
  const packages = await shell('pm list packages org.chromium.webapk')
  return packages.split('\n').map(line => line.match(/^package:(org\.chromium\.webapk\.[a-zA-Z0-9._]+)$/)?.[1]).filter(Boolean)
}

async function installFromChrome(page) {
  const baseline = await installedPackages()
  await page.getByRole('button', { name: 'Help and installation' }).tap()
  const install = page.getByRole('button', { name: 'Install app', exact: true })
  if (await install.isVisible()) await install.tap()
  else {
    await page.keyboard.press('Escape')
    await tapNativeLabel('More options')
    await tapNativeLabel('Install app|Install web app|Add to Home screen')
  }
  await device.screenshot({ path: folder + '/install.png' })
  await tapNativeLabel('Install|Add')
  evidence.steps.push('Confirmed Chrome’s native installation dialog')
  for (let i = 0; i < 12; i++) {
    const installed = (await installedPackages()).filter(pkg => !baseline.includes(pkg))
    if (installed.length === 1) return { package: installed[0] }
    if (i < 4 && await tapNativeControl(await readNativeWindow(), 'Add to home screen|Add to Home screen')) {
      evidence.steps.push('Confirmed Android launcher pinning after Chrome offered a shortcut')
      return { package: null }
    }
    await delay(1000)
  }
  throw new Error('Chrome did not register a WebAPK or offer launcher pinning after confirmation')
}

async function launchInstalled(installation) {
  if (installation.package) {
    await shell('am force-stop ' + installation.package)
    const result = await shell('monkey -p ' + installation.package + ' -c android.intent.category.LAUNCHER 1')
    assert(result.includes('Events injected: 1'), 'Android did not launch the installed package')
  } else {
    await shell('input keyevent KEYCODE_HOME')
    await tapNativeLabel('(?:PWA )?Images Studio(?:, Web shortcut)?')
  }
}

async function dismissNotificationOffer() {
  const tree = await readNativeWindow()
  if (!tree.includes('Chrome notifications make things easier')) return false
  assert(await tapNativeControl(tree, 'No thanks'), 'Could not locate the exact Chrome notification decline action')
  evidence.steps.push('Declined the Chrome notification offer on the disposable profile')
  return true
}

async function waitForChrome(endpoint) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const response = await globalThis.fetch(endpoint + '/json/version', { signal: globalThis.AbortSignal.timeout(1000) }).catch(() => null)
    if (response?.ok) return
    await delay(500)
  }
  throw new Error('Launcher did not start a debuggable Chrome process')
}

async function findStandalone(context) {
  for (let attempt = 0; attempt < 30; attempt++) {
    for (const page of context.pages()) {
      if (!page.url().startsWith(site)) continue
      if (await page.evaluate(() => matchMedia('(display-mode: standalone)').matches)) return page
    }
    await delay(500)
  }
  throw new Error('Chrome did not expose a standalone page for the launcher entry')
}

let context, restartedBrowser, debugPort
try {
  evidence.android = await shell('getprop ro.build.version.release')
  evidence.model = device.model()
  const details = await shell('dumpsys package ' + chromePackage)
  evidence.chrome = details.match(/versionName=(\S+)/)?.[1]
  assert(evidence.chrome, 'Chrome package is unavailable')
  await shell('am set-debug-app --persistent ' + chromePackage)
  await shell('settings put secure show_ime_with_hard_keyboard 1')
  await shell('settings put system accelerometer_rotation 0')
  await shell('settings put system user_rotation 0')
  context = await device.launchBrowser({ viewport: null, hasTouch: true, timeout: 60000 })
  const page = await context.newPage()
  await page.goto(site)
  const expectedBuild = (await (await globalThis.fetch(new URL('build-info.json', site))).json()).buildId
  await page.waitForFunction(build => document.querySelector('footer')?.textContent.includes(build), expectedBuild)
  evidence.build = expectedBuild
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true))
  await page.reload()
  await page.waitForFunction(() => Boolean(navigator.serviceWorker.controller))
  await page.getByRole('button', {name:'Continue creating'}).click()
  await page.locator('.studio-composer-toggle').click()
  const prompt = page.getByRole('textbox', {name:'Prompt',exact:true})
  const visualHeight = await page.evaluate(() => visualViewport.height)
  await prompt.tap()
  await page.waitForFunction(() => document.activeElement?.matches('textarea'))
  const keyboardVisible = () => page.waitForFunction(before => visualViewport.height < before - 60, visualHeight, { timeout: 8000 })
  try {
    await keyboardVisible()
  } catch (error) {
    if (!await dismissNotificationOffer()) throw error
    await prompt.tap()
    await keyboardVisible()
  }
  await prompt.fill(draft)
  await device.screenshot({ path: folder + '/keyboard.png' })
  await shell('input keyevent KEYCODE_BACK')
  await page.waitForFunction(before => visualViewport.height >= before - 30, visualHeight)
  evidence.steps.push('Android software keyboard reduced the visual viewport and could be dismissed')
  await shell('settings put system user_rotation 1')
  await page.waitForFunction(() => innerWidth > innerHeight)
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth))
  assert.equal(await prompt.inputValue(), draft)
  await device.screenshot({ path: folder + '/landscape.png' })
  evidence.steps.push('Landscape retained the draft without horizontal overflow')
  await shell('settings put system user_rotation 0')
  await page.waitForFunction(() => innerWidth < innerHeight)
  const installation = verifyInstall ? await installFromChrome(page) : undefined
  if (installation) evidence.installation = installation.package ? 'WebAPK' : 'launcher shortcut'
  await shell('cmd connectivity airplane-mode enable')
  await shell('svc wifi disable')
  assert.equal(await shell('settings get global airplane_mode_on'), '1')
  await context.setOffline(true)
  await page.waitForFunction(() => !navigator.onLine)
  await assert.rejects(page.evaluate(url => globalThis.fetch(url), new URL('/android-offline-probe-' + Date.now(), site).href))
  const offline = await context.newPage()
  await offline.goto(site)
  await offline.waitForFunction(build => document.querySelector('footer')?.textContent.includes(build), expectedBuild)
  assert(await offline.evaluate(() => Boolean(navigator.serviceWorker.controller)))
  await offline.getByRole('button', {name:'Continue creating'}).click()
  await offline.locator('.studio-composer-toggle').click()
  await offline.waitForFunction(value => document.querySelector('.creation-prompt textarea')?.value === value, draft)
  await device.screenshot({ path: folder + '/offline.png' })
  evidence.steps.push('A fresh Chrome tab launched offline and recovered the same build and draft')
  if (installation) {
    const oldPid = await shell('pidof ' + chromePackage)
    assert.match(oldPid, /^\d+$/)
    await shell('am force-stop ' + chromePackage)
    assert.equal(await shell('pidof ' + chromePackage), '', 'Chrome stayed running after force-stop')
    evidence.steps.push('Chrome process was absent before the offline launcher action')
    debugPort = adb('forward', 'tcp:0', 'localabstract:chrome_devtools_remote')
    assert.match(debugPort, /^\d+$/)
    const endpoint = 'http://127.0.0.1:' + debugPort
    await launchInstalled(installation)
    await waitForChrome(endpoint)
    const newPid = await shell('pidof ' + chromePackage)
    assert.match(newPid, /^\d+$/)
    assert.notEqual(newPid, oldPid)
    evidence.chromeProcess = { before: oldPid, after: newPid }
    restartedBrowser = await chromium.connectOverCDP(endpoint, { timeout: 15_000 })
    const [restartedContext] = restartedBrowser.contexts()
    assert(restartedContext, 'The restarted browser did not expose its existing context')
    const installed = await findStandalone(restartedContext)
    await installed.waitForFunction(build => document.querySelector('footer')?.textContent.includes(build), expectedBuild)
    evidence.launcherDisplay = 'standalone'
    await installed.waitForFunction(() => !navigator.onLine)
    assert(await installed.evaluate(() => Boolean(navigator.serviceWorker.controller)))
    await assert.rejects(installed.evaluate(url => globalThis.fetch(url), new URL('/android-installed-probe-' + Date.now(), site).href))
    await installed.getByRole('button', { name: 'Continue creating' }).click()
    await installed.locator('.studio-composer-toggle').click()
    await installed.waitForFunction(value => document.querySelector('.creation-prompt textarea')?.value === value, draft)
    await device.screenshot({ path: folder + '/installed-offline.png' })
    evidence.steps.push('Android launcher started a new Chrome process and recovered the workspace offline in standalone mode')
  }
  evidence.result = 'PASS'
} catch (error) {
  evidence.result = 'FAIL'
  evidence.error = String(error)
  await device.screenshot({ path: folder + '/failure.png' }).catch(() => {})
  process.exitCode = 1
} finally {
  await writeFile(folder + '/result.json', JSON.stringify(evidence, null, 2))
  console.log(JSON.stringify(evidence, null, 2))
  await restartedBrowser?.close().catch(() => {})
  await shell('cmd connectivity airplane-mode disable').catch(() => {})
  await context?.close().catch(() => {})
  await device.close()
  if (debugPort && /^\d+$/.test(debugPort)) adb('forward', '--remove', 'tcp:' + debugPort)
}
