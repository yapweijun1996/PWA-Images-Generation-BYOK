/* global URL, document, navigator, innerWidth, innerHeight, visualViewport, console */
import assert from 'node:assert/strict'
import { mkdir, writeFile } from 'node:fs/promises'
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
  context = await device.launchBrowser({ viewport: null, timeout: 60000 })
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
  await page.waitForFunction(before => visualViewport.height < before - 60, visualHeight, {timeout:12000})
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
  await shell('cmd connectivity airplane-mode enable')
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
