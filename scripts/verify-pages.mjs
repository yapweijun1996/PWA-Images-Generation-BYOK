/* global URL, fetch, AbortSignal, console */
import process from "node:process"
// Usage: gh run download RUN_ID -n site-files -D /tmp/site-files
//        node scripts/verify-pages.mjs /tmp/site-files [EXPECTED_SOURCE_REVISION]
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import { resolve, relative, sep } from 'node:path'

if (!process.argv[2]) throw new Error('Pass the downloaded site-files artifact directory.')
const root = resolve(process.argv[2])
const expectedRevision = process.argv[3]
if (expectedRevision !== undefined) {
  if (!/^[a-f0-9]{40}$/.test(expectedRevision)) throw new Error('Pass a full lowercase Git commit SHA.')
  const { buildId, sourceRevision } = JSON.parse(await readFile(resolve(root, 'build-info.json'), 'utf8'))
  if (typeof buildId !== 'string' || !buildId.trim() || sourceRevision !== expectedRevision) {
    throw new Error('The artifact does not identify the expected source revision.')
  }
  console.log('Verified release identity:', buildId, sourceRevision)
}
const base = new URL('https://yapweijun1996.github.io/PWA-Images-Generation-BYOK/')
const digest = bytes => createHash('sha256').update(bytes).digest('hex')
async function verify(path) {
  let count = 0
  for (const entry of await readdir(path, { withFileTypes: true })) {
    const file = resolve(path, entry.name)
    if (entry.isDirectory()) { count += await verify(file); continue }
    if (!entry.isFile()) throw new Error('Unexpected artifact entry.')
    const name = relative(root, file).split(sep).join('/')
    const url = new URL(name === 'index.html' ? '' : name, base)
    const response = await fetch(url, { redirect: 'error', cache: 'no-store', signal: AbortSignal.timeout(30000) })
    if (!response.ok || digest(new Uint8Array(await response.arrayBuffer())) !== digest(await readFile(file))) {
      throw new Error('Published file does not match the release artifact: ' + name + ' (HTTP ' + response.status + ')')
    }
    count++
  }
  return count
}
await Promise.all(['index.html','sw.js','manifest.webmanifest'].map(name => readFile(resolve(root,name))))
console.log('Verified', await verify(root), 'published files against the release artifact.')
