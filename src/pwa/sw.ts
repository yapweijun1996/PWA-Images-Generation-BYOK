/// <reference lib="webworker" />
export {}
declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: { url: string; revision: string }[]
}

// The PWA plugin appends a legacy MD5 manifest entry after Workbox transforms.
// Require one strong digest for every URL, including the manifest itself.
const injected = self.__WB_MANIFEST
const entries = [...new Set(injected.map(entry => entry.url))].map(url => {
  const verified = injected.find(entry => entry.url === url && /^[a-f0-9]{64}$/.test(entry.revision))
  if (!verified) throw new Error('Missing shell integrity digest')
  return verified
})
const scope = self.registration.scope
const prefix = 'pwa-images-shell:' + scope + ':'
const lifecycleName = 'pwa-images-lifecycle:' + scope
const activeShellKey = new URL('.pwa-active-shell', scope)
const predecessorKey = new URL('.pwa-predecessor', scope)
const assetsPath = new URL('assets/', scope).pathname
const isShellCache = (name: string) => name.startsWith(prefix) && /^[a-f0-9]{64}$/.test(name.slice(prefix.length))
// The digest of the release descriptor binds this worker to the displayed build ID.
const identity = entries.find(entry => entry.url === 'build-info.json')!.revision
async function sha256(input: BufferSource) {
  const digest = await crypto.subtle.digest('SHA-256', input)
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

const candidate = sha256(new TextEncoder().encode(JSON.stringify(entries))).then(hash => prefix + hash)
const files = new Map(entries.map(entry => [new URL(entry.url, scope).pathname, entry]))

async function verifiedResponse(url: string, revision: string) {
  const request = new URL(url, scope)
  request.searchParams.set('v', identity)
  const response = await fetch(request, { cache: 'reload', credentials: 'omit', redirect: 'error' })
  if (!response.ok) throw new Error('Shell download failed')
  const bytes = await response.clone().arrayBuffer()
  if (await sha256(bytes) !== revision) throw new Error('Shell release mismatch')
  return response
}

async function installCandidate() {
  const cacheName = await candidate
  const existed = await caches.has(cacheName)
  const cache = await caches.open(cacheName)
  try {
    // Finish each write before cleanup so rejected installs leave no late writes.
    for (const { url, revision } of entries) {
      const response = await verifiedResponse(url, revision)
      await cache.put(new URL(url, scope), response)
    }
  } catch (cause) {
    if (!existed) await caches.delete(cacheName)
    throw cause
  }
}

self.addEventListener('install', event => { event.waitUntil(installCandidate()) })
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') event.waitUntil(self.skipWaiting())
})
self.addEventListener('activate', event => {
  event.waitUntil(candidate.then(async cacheName => {
    const keys = await caches.keys()
    const earlier = keys.slice(0, Math.max(0, keys.indexOf(cacheName)))
    const lifecycle = await caches.open(lifecycleName)
    const activated = await (await lifecycle.match(activeShellKey))?.text()
    // Legacy workers leave their active cache ahead of any pending candidate.
    const predecessor = activated && activated !== cacheName && isShellCache(activated) && keys.includes(activated)
      ? activated : earlier.find(isShellCache)
    const cache = await caches.open(cacheName)
    await cache.delete(predecessorKey)
    if (predecessor) await cache.put(predecessorKey, new Response(predecessor))
    await lifecycle.put(activeShellKey, new Response(cacheName))
    // A newer candidate may be installing before this activation finishes.
    await Promise.all(keys.filter(key => key !== cacheName && key !== predecessor && (
      (key.startsWith(prefix) && earlier.includes(key)) || key === 'workbox-precache-v2-' + scope
    )).map(key => caches.delete(key)))
  }))
})

async function predecessorAsset(request: Request, url: URL) {
  const cacheName = await candidate
  const cache = await caches.open(cacheName)
  const predecessor = await (await cache.match(predecessorKey))?.text()
  if (predecessor && predecessor !== cacheName && isShellCache(predecessor)) {
    const stored = await caches.match(new URL(url.pathname, scope), { cacheName: predecessor })
    if (stored) return stored
  }
  return fetch(request)
}

self.addEventListener('fetch', event => {
  const request = event.request
  const url = new URL(request.url)
  if (request.method !== 'GET' || !url.href.startsWith(scope)) return
  const entry = files.get(url.pathname)
  const path = request.mode === 'navigate' ? 'index.html' : entry?.url
  if (!path) {
    // An open tab can request a fingerprinted bundle from the preceding release.
    if (url.pathname.startsWith(assetsPath) && /-[\w-]{8,64}\.(?:js|css|woff2)$/.test(url.pathname.slice(assetsPath.length))) {
      event.respondWith(predecessorAsset(request, url))
    }
    return
  }
  const expected = files.get(new URL(path, scope).pathname)
  if (!expected) return
  event.respondWith(candidate.then(async name => {
    const cache = await caches.open(name)
    const key = new URL(path, scope)
    const stored = await cache.match(key)
    if (stored) return stored
    // Evicted entries can be restored online only when the server still supplies this release.
    const response = await verifiedResponse(path, expected.revision)
    await cache.put(key, response.clone())
    return response
  }))
})
