import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig } from 'vitest/config'
import packageJson from './package.json' with { type: 'json' }

const base = '/PWA-Images-Generation-BYOK/'
const productName = 'PWA Images Studio'
const lightBackground = '#f7f8fb'

export default defineConfig(({ command }) => ({
  base,
  resolve: { tsconfigPaths: true },
  define: {
    __PRODUCT_NAME__: JSON.stringify(productName),
    __BUILD_ID__: JSON.stringify(
      `v${packageJson.version} · ${command === 'build' ? new Date().toISOString() : 'development'}`,
    ),
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
    VitePWA({
      base,
      scope: base,
      strategies: 'generateSW',
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
      workbox: {
        globPatterns: ['index.html', 'assets/**/*.{js,css,woff2}', 'icons/*.png'],
        modifyURLPrefix: { '': base },
        navigateFallback: `${base}index.html`,
        navigateFallbackAllowlist: [new RegExp(`^${base}(?:index\\.html)?$`)],
        runtimeCaching: [],
        skipWaiting: false,
        clientsClaim: false,
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  test: { environment: 'jsdom' },
}))
