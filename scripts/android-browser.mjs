/* global URL, document, navigator, innerWidth, innerHeight, visualViewport, matchMedia, console */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
import { setTimeout as delay } from 'node:timers/promises'
import process from 'node:process'

const { _android } = await import(process.env.PLAYWRIGHT_MODULE)
const site = 'https://yapweijun1996.github.io/PWA-Images-Generation-BYOK/'
const folder = 'android-evidence'
await mkdir(folder, { recursive: true })
const evidence = { time: new Date().toISOString(), site, steps: [] }
const [device, ...others] = await _android.devices()
assert(device && device.serial().startsWith('emulator-') && !others.length, 'Expected exactly one isolated Android emulator')
const shell = async command => (await device.shell(command)).toString().trim()
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
  for (let i = 0; i < 30; i++) {
    const installed = (await installedPackages()).filter(pkg => !baseline.includes(pkg))
    if (installed.length === 1) return installed[0]
    await delay(1000)
  }
  throw new Error('Chrome did not register a WebAPK after confirming the install dialog')
}

async function dismissNotificationOffer() {
  const tree = await readNativeWindow()
  if (!tree.includes('Chrome notifications make things easier')) return false
  assert(await tapNativeControl(tree, 'No thanks'), 'Could not locate the exact Chrome notification decline action')
  evidence.steps.push('Declined the Chrome notification offer on the disposable profile')
  return true
}
let context
try {
  evidence.android = await shell('getprop ro.build.version.release')
  evidence.model = device.model()
  const details = await shell('dumpsys package com.android.chrome')
  evidence.chrome = details.match(/versionName=(\S+)/)?.[1]
  assert(evidence.chrome, 'Chrome package is unavailable')
  await shell('am set-debug-app --persistent com.android.chrome')
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
  const installedPackage = verifyInstall ? await installFromChrome(page) : undefined
  if (installedPackage) evidence.installedPackage = installedPackage
  await shell('cmd connectivity airplane-mode enable')
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
  if (installedPackage) {
    await shell('am force-stop ' + installedPackage)
    const launched = context.waitForEvent('page', { timeout: 30_000 })
    const result = await shell('monkey -p ' + installedPackage + ' -c android.intent.category.LAUNCHER 1')
    assert(result.includes('Events injected: 1'), 'Android did not launch the installed package')
    const installed = await launched
    await installed.waitForFunction(build => document.querySelector('footer')?.textContent.includes(build), expectedBuild)
    assert(await installed.evaluate(() => matchMedia('(display-mode: standalone)').matches && Boolean(navigator.serviceWorker.controller)))
    await assert.rejects(installed.evaluate(url => globalThis.fetch(url), new URL('/android-installed-probe-' + Date.now(), site).href))
    await installed.getByRole('button', { name: 'Continue creating' }).click()
    await installed.locator('.studio-composer-toggle').click()
    await installed.waitForFunction(value => document.querySelector('.creation-prompt textarea')?.value === value, draft)
    await device.screenshot({ path: folder + '/installed-offline.png' })
    evidence.steps.push('Android launcher reopened the stopped WebAPK in standalone mode and recovered the draft offline')
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
  await shell('cmd connectivity airplane-mode disable').catch(() => {})
  await context?.close().catch(() => {})
  await device.close()
}
