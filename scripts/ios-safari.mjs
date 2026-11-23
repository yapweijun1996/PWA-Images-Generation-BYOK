/* global URL, AbortSignal, fetch, console */
import assert from 'node:assert/strict'
import { Buffer } from 'node:buffer'
import { execFileSync, spawn } from 'node:child_process'
import { createServer } from 'node:http'
import { closeSync, openSync } from 'node:fs'
import { readFile, readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import process from 'node:process'
import { setTimeout as delay } from 'node:timers/promises'

const { APPIUM_BIN, DEVICE_NAME, SIMULATOR_UDID, SITE_FILES, WDA_BUILD } = process.env
assert(APPIUM_BIN && DEVICE_NAME && SIMULATOR_UDID && SITE_FILES && WDA_BUILD, 'Missing simulator, driver, or release inputs')
const folder = 'ios-evidence'
const base = '/PWA-Images-Generation-BYOK/'
const draft = 'Safari Home Screen offline acceptance draft'
const safari = 'com.apple.mobilesafari'
const elementKey = 'element-6066-11e4-a52e-4f735466cecf'
const mime = new Map([
  ['html', 'text/html; charset=utf-8'], ['css', 'text/css'], ['js', 'application/javascript'],
  ['json', 'application/json'], ['webmanifest', 'application/manifest+json'],
  ['png', 'image/png'], ['svg', 'image/svg+xml'],
])
const build = JSON.parse(await readFile(join(SITE_FILES, 'build-info.json'), 'utf8'))
const manifest = JSON.parse(await readFile(join(SITE_FILES, 'manifest.webmanifest'), 'utf8'))
assert.match(build.sourceRevision, /^[a-f0-9]{40}$/)
assert.equal(manifest.scope, base)
assert.equal(manifest.start_url, base)
const report = { time: new Date().toISOString(), device: DEVICE_NAME, udid: SIMULATOR_UDID, ...build, steps: [] }
const requests = []
const files = new Map()
for (const entry of await readdir(SITE_FILES, {recursive:true, withFileTypes:true})) {
  if (!entry.isFile()) continue
  const path = join(entry.parentPath, entry.name)
  const content = await readFile(path)
  files.set(base + path.slice(SITE_FILES.length + 1), {content, type: mime.get(entry.name.split('.').at(-1))})
}

const site = createServer((request, response) => {
  const path = new URL(request.url, 'http://localhost').pathname
  requests.push(path)
  const file = files.get(path === base ? base + 'index.html' : path)
  if (!file) return response.writeHead(404).end()
  response.writeHead(200, { 'Content-Type': file.type || 'application/octet-stream', 'Cache-Control': 'no-store' })
  response.end(file.content)
})
await new Promise(resolve => site.listen(0, '127.0.0.1', resolve))
const url = 'http://127.0.0.1:' + site.address().port + base
const driverUrl = 'http://127.0.0.1:4723'
const log = openSync(join(folder, 'appium.log'), 'w')
const driver = spawn(APPIUM_BIN, ['--address', '127.0.0.1', '--port', '4723', '--log-level', 'info', '--log-timestamp'], {
  stdio: ['ignore', log, log],
})
closeSync(log)
let session

async function command(method, resource, body, timeout = 75_000) {
  const response = await fetch(driverUrl + resource, {
    method, headers: {'Content-Type':'application/json'}, body: JSON.stringify(body), signal: AbortSignal.timeout(timeout),
  })
  const { value } = await response.json()
  if (!response.ok || value?.error) {
    const error = new Error(value?.message || 'WebDriver HTTP ' + response.status)
    error.code = value?.error
    throw error
  }
  return value
}
function send(method, resource, body) {
  return command(method, '/session/' + session + resource, body)
}
function execute(name, args = {}) {
  return send('POST', '/execute/sync', { script: 'mobile: ' + name, args: [args] })
}
async function waitFor(description, attempt, timeout = 24_000) {
  const deadline = Date.now() + timeout
  do {
    const value = await attempt()
    if (value) return value
    await delay(350)
  } while (Date.now() < deadline)
  throw new Error('Timed out waiting for ' + description)
}
async function find(predicate) {
  const matches = await send('POST', '/elements', {using:'-ios predicate string', value:predicate})
  return matches[0]?.[elementKey]
}
function element(id, method, resource, body) {
  return send(method, '/element/' + id + resource, body)
}
function tap(id) {
  return element(id, 'POST', '/click', {})
}
function named(text, type) {
  const exact = '(label == ' + JSON.stringify(text) + ' OR name == ' + JSON.stringify(text) + ')'
  return find(type ? 'type == "XCUIElementType' + type + '" AND ' + exact : exact)
}
function step(description) {
  report.steps.push(description)
  console.log(description)
}
async function screenshot(name) {
  const data = await send('GET', '/screenshot')
  await writeFile(join(folder, name + '.png'), Buffer.from(data, 'base64'))
}
const installAction = () => find('visible == true AND label == "Add to Home Screen" AND type IN {"XCUIElementTypeCell","XCUIElementTypeButton"}')
const installDialog = () => find('visible == true AND type == "XCUIElementTypeNavigationBar" AND name == "Add to Home Screen"')
const installSwitch = () => find('visible == true AND type == "XCUIElementTypeSwitch" AND (name == "Open as Web App" OR label == "Open as Web App")')
const moreActions = () => find('visible == true AND type == "XCUIElementTypeCell" AND name == "actionGroupCell" AND label IN {"More","View More"}')
async function openInstallDialog(evidenceName) {
  if (!await installAction() && !await moreActions()) {
    let share = await find('type == "XCUIElementTypeButton" AND name == "ShareButton" AND visible == true')
    if (!share) {
      const menu = await named('More', 'Button')
      assert(menu, 'Safari Share and compact toolbar More controls are missing')
      await tap(menu)
      share = await waitFor('Safari Share in the More menu', () => named('Share'))
    }
    await tap(share)
  }
  await screenshot(evidenceName)
  await writeFile(join(folder, evidenceName + '.xml'), await send('GET', '/source'))
  let expanded = false
  const add = await waitFor('Add to Home Screen action', async () => {
    const action = await installAction()
    if (action) return action
    if (!expanded) {
      const more = await moreActions() || await named('More Actions') || await named('View More')
      if (more) { await tap(more); expanded = true }
    }
  }, 90_000)
  await tap(add)
  await waitFor('Add to Home Screen confirmation', installDialog, 45_000)
}
async function workspace() {
  const labels = '{"Continue creating","Your image will appear here."}'
  await waitFor('studio workspace', () => find('name IN ' + labels + ' OR label IN ' + labels), 120_000)
}
async function createView() {
  const start = await named('Continue creating', 'Button')
  if (start) await tap(start)
  return waitFor('Create view', () => named('Generate image', 'Button'))
}
async function prompt() {
  const predicate = 'type == "XCUIElementTypeTextView" OR type == "XCUIElementTypeTextField"'
  let field = await find('(' + predicate + ') AND (label == "Prompt" OR name == "Prompt" OR value == "Describe your image…")')
  if (!field) {
    const toggle = await named('Prompt', 'Button')
    if (toggle) await tap(toggle)
    field = await waitFor('prompt input', () => find('(' + predicate + ') AND (label == "Prompt" OR name == "Prompt" OR value CONTAINS "Describe your image" OR value == ' + JSON.stringify(draft) + ')'))
  }
  return field
}
function verifyDraft(id) {
  return waitFor('the saved draft', async () => (await element(id, 'GET', '/attribute/value')) === draft)
}
const home = () => execute('pressButton', {name:'home'})
const springboard = 'com.apple.springboard'
const labels = '{' + [manifest.name, manifest.short_name].map(value => JSON.stringify(value)).join(',') + '}'
const icon = () => find('type == "XCUIElementTypeIcon" AND (label IN ' + labels + ' OR name IN ' + labels + ') AND visible == true')
const preferApp = defaultActiveApplication => send('POST', '/appium/settings', {settings:{defaultActiveApplication}})
async function launchFromHome(capture) {
  await home()
  // The first Home Screen page can expose the Dock as a separate active application.
  await preferApp(springboard)
  try {
    if ((await execute('activeAppInfo')).bundleId !== springboard) await execute('activateApp', {bundleId:springboard})
    for (const direction of [null, 'left', 'right']) {
      if (direction) await execute('swipe', {direction})
      const found = await waitFor('the studio icon on this page', icon, 10_000).catch(error => {
        if (error.message === 'Timed out waiting for the studio icon on this page') return undefined
        throw error
      })
      if (found) {
        if (capture) await screenshot(capture)
        const requestStart = requests.length
        await tap(found)
        return requestStart
      }
    }
    throw new Error('The studio Home Screen icon was not found while paging through SpringBoard')
  } finally {
    await preferApp('auto')
  }
}

try {
  await waitFor('Appium server', () => command('GET', '/status').then(value => value.ready).catch(() => false), 25_000)
  const started = await command('POST', '/session', {capabilities:{alwaysMatch:{
    platformName:'iOS', 'appium:platformVersion':'26.2', 'appium:automationName':'XCUITest', 'appium:udid':SIMULATOR_UDID,
    'appium:deviceName':DEVICE_NAME, 'appium:bundleId':safari, 'appium:language':'en', 'appium:locale':'en_US',
    'appium:noReset':true, 'appium:isHeadless':true, 'appium:newCommandTimeout':120,
    'appium:usePreinstalledWDA':true,
    'appium:prebuiltWDAPath':join(WDA_BUILD, 'Build', 'Products', 'Debug-iphonesimulator', 'WebDriverAgentRunner-Runner.app'),
    'appium:wdaLaunchTimeout':125_000, 'appium:wdaStartupRetries':1,
  }}}, 360_000)
  session = started.sessionId
  report.platformVersion = started.capabilities.platformVersion
  step('Connected WebDriverAgent to the booted simulator')
  execFileSync('xcrun', ['simctl', 'openurl', SIMULATOR_UDID, url])
  await workspace()
  step('Opened the exact public artifact at its application subpath in mobile Safari')

  await openInstallDialog('share-sheet')
  step('Opened the native Add to Home Screen confirmation')
  let webApp
  try {
    webApp = await waitFor('Open as Web App', installSwitch, 90_000)
  } catch (error) {
    if (error.message !== 'Timed out waiting for Open as Web App' || !await installDialog()) throw error
    await screenshot('stalled-install')
    await writeFile(join(folder, 'stalled-install.xml'), await send('GET', '/source'))
    const cancel = await find('visible == true AND enabled == true AND type == "XCUIElementTypeButton" AND name == "Cancel"')
    if (cancel) {
      await tap(cancel)
    } else {
      assert.equal(await execute('terminateApp', {bundleId:safari}), true)
      execFileSync('xcrun', ['simctl', 'openurl', SIMULATOR_UDID, url])
      await workspace()
    }
    await waitFor('installation confirmation to dismiss', async () => !await installDialog())
    await openInstallDialog('share-sheet-retry')
    step('Reopened the native confirmation after its app metadata stayed empty')
    webApp = await waitFor('Open as Web App after reopening confirmation', installSwitch, 90_000)
  }
  if (await element(webApp, 'GET', '/attribute/value') !== '1') await tap(webApp)
  assert.equal(await element(webApp, 'GET', '/attribute/value'), '1')
  await screenshot('install')
  await tap(await waitFor('enabled Add confirmation', () => find('visible == true AND enabled == true AND type == "XCUIElementTypeButton" AND name == "Add"')))
  await waitFor('the installation dialog to close', async () => !await installDialog(), 45_000)
  step('Submitted Add to Home Screen with Open as Web App enabled')
  const installedRequestStart = await launchFromHome('launcher')
  await workspace()
  const installed = await execute('activeAppInfo')
  assert(![safari, springboard].includes(installed.bundleId) && installed.bundleId, 'The icon opened Safari or stayed on Home Screen')
  report.installedBundleId = installed.bundleId
  step('Opened the workspace from the named Home Screen icon in a separate application')
  await screenshot('standalone')
  // Standalone WebKit exposes the Help opener as an accessible Other element.
  await tap(await waitFor('workspace Help', () => named('Help and installation')))
  await waitFor('studio standalone status', () => named('Installed on this device.'))
  await tap(await waitFor('Help Close', () => named('Close')))
  step('Verified the standalone status in Help')
  await createView()
  const field = await prompt()
  await tap(field)
  await element(field, 'POST', '/value', {text:draft})
  await verifyDraft(field)
  await waitFor('installed shell precache requests', () => {
    const installedRequests = requests.slice(installedRequestStart)
    return installedRequests.includes(base + 'sw.js') && installedRequests.includes(base + 'build-info.json') &&
      installedRequests.filter(path => path.endsWith('.js')).length >= 3
  })
  const keyboard = await named('Done', 'Button')
  if (keyboard) await tap(keyboard)
  await screenshot('draft')

  assert.equal(await execute('terminateApp', {bundleId:installed.bundleId}), true)
  assert.equal(await execute('queryAppState', {bundleId:installed.bundleId}), 1)
  await new Promise((resolve, reject) => site.close(error => error ? reject(error) : resolve()))
  await assert.rejects(fetch(url + 'uncached-verification'), TypeError)
  step('Stopped the artifact origin and confirmed the installed process was gone')
  await launchFromHome()
  await workspace()
  const offlineApp = await execute('activeAppInfo')
  assert.equal(offlineApp.bundleId, installed.bundleId)
  assert.notEqual(offlineApp.pid, installed.pid, 'Expected a new installed-app process')
  report.process = { before:installed.pid, after:offlineApp.pid }
  await createView()
  await verifyDraft(await prompt())
  assert((await send('GET', '/source')).includes(build.buildId), 'Reopened build label did not match')
  await screenshot('offline')
  step('Recovered the same build and draft in a fresh Home Screen process with the origin unavailable')
  report.result = 'PASS'
} catch (error) {
  report.result = 'FAIL'
  report.failure = error.message
  if (session) {
    await screenshot('failure').catch(() => {})
    await send('GET', '/source').then(source => writeFile(join(folder, 'failure.xml'), source)).catch(() => {})
  } else {
    try { execFileSync('xcrun', ['simctl', 'io', SIMULATOR_UDID, 'screenshot', join(folder, 'failure.png')], { timeout: 10_000 }) }
    catch { /* The driver error is the primary evidence when the simulator is unavailable. */ }
  }
  throw error
} finally {
  await writeFile(join(folder, 'result.json'), JSON.stringify({ ...report, requestedPaths: [...new Set(requests)] }, null, 2))
  if (session) await send('DELETE', '').catch(() => {})
  driver.kill()
  if (site.listening) site.close()
}
