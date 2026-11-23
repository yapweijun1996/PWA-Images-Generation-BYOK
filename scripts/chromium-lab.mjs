/* global URL, fetch, document, window, PerformanceObserver, innerWidth, matchMedia, getComputedStyle, console, axe */
// Run against a local production preview. Set PLAYWRIGHT_MODULE to an installed Playwright ESM entry.
import { createHash } from 'node:crypto'
import process from 'node:process'
import assert from 'node:assert/strict'
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright')
const url = new URL(process.argv[2] || 'http://127.0.0.1:48925/PWA-Images-Generation-BYOK/')
if (!['localhost', '127.0.0.1'].includes(url.hostname)) throw Error('Use a localhost preview.')
const browser = await chromium.launch({ channel: 'chrome' })
const output = { browser: browser.version(), url: url.href, runs: [], keyboard: [] }

async function keyboardVisit(page, locator) {
  for (let tab = 0; tab < 100; tab++) {
    if (await locator.evaluate(el => el === document.activeElement)) return
    await page.keyboard.press('Tab')
  }
  throw Error('Unable to reach ' + locator + ' by Tab.')
}

try {
  const response = await fetch(url)
  const html = await response.text()
  const bundle = html.match(/<script[^>]+src="([^"]+)"/)?.[1]
  assert(bundle, 'Missing production script.')
  output.script = bundle
  output.scriptSha256 = createHash('sha256').update(new Uint8Array(await (await fetch(new URL(bundle, url))).arrayBuffer())).digest('hex')
  for (const [width, height] of [[390,844],[1440,900]]) {
    for (let iteration = 1; iteration <= 3; iteration++) {
      const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 1, reducedMotion: 'reduce' })
      const page = await context.newPage()
      const cdp = await context.newCDPSession(page)
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 })
      await cdp.send('Network.enable')
      await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 100, downloadThroughput: 180000, uploadThroughput: 90000 })
      await page.addInitScript(() => {
        const metrics = window.lab = { lcp: 0, shifts: [], interactions: [] }
        new PerformanceObserver(list => {
          for (const entry of list.getEntries()) metrics.lcp = entry.startTime
        }).observe({ type: 'largest-contentful-paint', buffered: true })
        new PerformanceObserver(list => {
          for (const e of list.getEntries()) if (!e.hadRecentInput) metrics.shifts.push([e.startTime, e.value])
        }).observe({ type: 'layout-shift', buffered: true })
        new PerformanceObserver(list => {
          for (const e of list.getEntries()) if (e.interactionId) metrics.interactions.push(e.duration)
        }).observe({ type: 'event', buffered: true, durationThreshold: 16 })
      })
      await page.goto(url.href)
      await page.getByRole('heading', {name: 'Untitled project'}).waitFor({state: 'attached'})
      await page.waitForTimeout(1000)
      if (width < 768) await page.getByRole('button',{name:/^Prompt/}).click()
      const prompt = page.getByRole('textbox',{name:'Prompt',exact:true})
      await prompt.click()
      await page.keyboard.type('A blue sky', {delay: 50})
      await page.getByRole('button',{name:'Projects',exact:true}).click()
      await page.getByRole('textbox',{name:'Project name'}).fill('Lab project')
      await page.getByRole('button',{name:'New project',exact:true}).click()
      await page.getByRole('heading',{name:'Lab project'}).waitFor()
      await page.waitForTimeout(600)
      const result = await page.evaluate(() => {
        const { lcp, shifts, interactions } = window.lab
        let cls = 0, first = -Infinity, last = -Infinity, sum = 0
        for (const [time, score] of shifts) {
          if (time-last > 1000 || time-first > 5000) { first=time; sum=0 }
          last=time; sum+=score; cls=Math.max(cls,sum)
        }
        return { lcpMs: Math.round(lcp), cls: +cls.toFixed(4), maxObservedInteractionMs: interactions.length ? Math.max(...interactions) : null,
          build: document.querySelector('footer')?.textContent, widthOverflow: document.documentElement.scrollWidth > innerWidth }
      })
      assert(result.lcpMs > 0, 'Missing LCP')
      output.runs.push({width,height,iteration,...result})
      await context.close()
    }
  }
  for (const width of [390,768,1440]) {
    const context = await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'})
    const page = await context.newPage()
    await page.goto(url.href)
    const observed = {width,drawers:[],focus:[],reducedMotion: await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)}
    if (width < 1280) for (const name of ['Open navigation','Generation settings']) {
      const opener = page.getByRole('button',{name,exact:true})
      await keyboardVisit(page,opener)
      await page.keyboard.press('Enter')
      const dialog = page.getByRole('dialog')
      await dialog.waitFor()
      const outline = await page.evaluate(()=>getComputedStyle(document.activeElement).outline)
      observed.focus.push({name,outline})
      let trapped = true
      for (const key of ['Shift+Tab','Tab',...Array(25).fill('Tab')]) {
        await page.keyboard.press(key)
        if (!await dialog.evaluate(el=>el.contains(document.activeElement))) { trapped=false;break }
      }
      await page.keyboard.press('Escape')
      await dialog.waitFor({state:'hidden'})
      observed.drawers.push({name,trapped,restored:await opener.evaluate(el=>el===document.activeElement)})
    }
    if (width === 390) {
      const toggle=page.getByRole('button',{name:/^Prompt/});await keyboardVisit(page,toggle);await page.keyboard.press('Enter')
    }
    const field=page.getByRole('textbox',{name:'Prompt',exact:true})
    await keyboardVisit(page,field)
    await page.keyboard.type('Keyboard draft')
    assert.equal(await field.inputValue(),'Keyboard draft')
    observed.focus.push({name:'Prompt',outline:await field.evaluate(el=>getComputedStyle(el).outline)})
    output.keyboard.push(observed)
    await context.close()
  }
  if (process.env.AXE_SCRIPT) {
    output.accessibility = []
    for (const width of [390,1440]) {
      const context = await browser.newContext({ viewport: {width,height:900} })
      const page = await context.newPage()
      await page.goto(url.href)
      await page.getByRole('heading',{name:'Untitled project'}).waitFor({state:'attached'})
      await page.route('**/lab-accessibility.js', route => route.fulfill({
        path: process.env.AXE_SCRIPT, contentType: 'application/javascript',
      }))
      await page.addScriptTag({ url:'/lab-accessibility.js' })
      for (const theme of ['dark','light']) {
        if (theme === 'light') await page.getByRole('button',{name:'Switch to light theme'}).click()
        const result = await page.evaluate(async () => {
          const result = await axe.run(document, {runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}})
          return {version:axe.version, passed:result.passes.length, violations:result.violations.map(v=>v.id), incomplete:result.incomplete.map(v=>v.id)}
        })
        output.accessibility.push({width,theme,...result})
      }
      await context.close()
    }
  }
  console.log(JSON.stringify(output,null,2))
} finally { await browser.close() }
