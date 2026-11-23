import { createHash } from 'node:crypto'
import { copyFile, readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import packageJson from './package.json' with { type: 'json' }

const base = '/PWA-Images-Generation-BYOK/'
const productName = 'PWA Images Studio'
const lightBackground = '#f7f8fb'

export default defineConfig(({ command }) => {
  const buildId = `v${packageJson.version} · ${command === 'build' ? new Date().toISOString() : 'development'}`
  return {
    base,
    resolve: { tsconfigPaths: true },
    define: {
      __PRODUCT_NAME__: JSON.stringify(productName),
      __BUILD_ID__: JSON.stringify(buildId),
    },
    plugins: [
      react(),
      {
        name: 'production-content-security-policy',
        apply: 'build',
        transformIndexHtml() {
          return [{
            tag: 'meta',
            attrs: {
              'http-equiv': 'Content-Security-Policy',
              content: [
                "default-src 'none'", "script-src 'self'", "style-src 'self'",
                "img-src 'self' blob: data:", "font-src 'self'",
                "connect-src 'self' https://api.openai.com", "worker-src 'self'",
                "manifest-src 'self'", "form-action 'none'", "base-uri 'none'",
              ].join('; '),
            },
            injectTo: 'head-prepend',
          }]
        },
      },
      {
        name: 'shell-build-identity',
        async writeBundle({ dir }) {
          if (dir) await copyFile(resolve(dir, 'index.html'), resolve(dir, '404.html'))
        },
        apply: 'build',
        generateBundle() {
          this.emitFile({ type: 'asset', fileName: 'build-info.json', source: JSON.stringify({ buildId }) })
        },
      },
      VitePWA({
        base,
        scope: base,
        strategies: 'injectManifest',
        srcDir: 'src/pwa',
        filename: 'sw.ts',
        registerType: 'prompt',
        injectRegister: false,
        includeManifestIcons: false,
        manifest: {
          id: base,
          name: productName,
          short_name: 'Images Studio',
          start_url: base,
          scope: base,
          display: 'standalone',
          theme_color: lightBackground,
          background_color: lightBackground,
          icons: [
            { src: `${base}icons/icon-192.png`, sizes: '192x192', type: 'image/png', purpose: 'any' },
            { src: `${base}icons/icon-512.png`, sizes: '512x512', type: 'image/png', purpose: 'any' },
            { src: `${base}icons/icon-maskable-512.png`, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        injectManifest: {
          globPatterns: ['index.html', 'build-info.json', 'manifest.webmanifest', 'assets/**/*.{js,css,woff2}', 'icons/*.png'],
          manifestTransforms: [async entries => ({
            manifest: await Promise.all(entries.map(async entry => ({
              ...entry, revision: createHash('sha256').update(await readFile(resolve('dist', entry.url))).digest('hex'),
            }))),
            warnings: [],
          })],
        },
      }),
    ],
    test: { environment: 'jsdom' },
  }
})
