# Local Chromium performance and accessibility evidence

On 2026-11-23 (Singapore), six fresh workspace loads and a short editing flow stayed within the project's numeric budgets on the measured Chrome configuration. Field P75 is **INSUFFICIENT_DATA** for LCP, INP and CLS. Release gate G3 still needs a launch decision about missing field data and validation of the artifact selected for release.

## Artifact and conditions

- Clean application source at `9cf946a03a62eaf38336bd3de13a1abc08b347c2`. Product build `v0.1.0 · 2026-11-23T14:14:47.461Z`, bundled entry `index-Bbj726EG.js`, SHA-256 `f4d1d52f9e17f155afae83b346e300fb83674e589e5ecd0353d0d3fe05bcf89a`. Service worker SHA-256 `32256289590d309ba29550ce06af27558296728013777cea586dfda8c16be83c`.
- macOS 27.2 (26B123), Apple M4, headless Google Chrome 158.0.8127.37, Playwright 1.66.0-alpha-2026-11-18, Vite production preview at the repository subpath on loopback.
- Each performance run started with a new browser context, empty project library, empty HTTP and service-worker caches, DPR 1, reduced-motion preference, and desktop Chromium input. CDP configured a 4× CPU slowdown, 100 ms latency, 180,000 bytes/s download and 90,000 bytes/s upload. Browser processes ran on the same host. The narrow viewport models layout only.
- Each run opened the shell, waited for its initial project heading, opened the composer on narrow screens, typed a ten-character prompt, opened Projects and created a local project. No provider request was made.

## Observations

| Viewport | Run | LCP (ms) | Largest observed interaction event duration (ms) | CLS |
| --- | ---: | ---: | ---: | ---: |
| 390 × 844 | 1 | 1260 | 96 | 0.0003 |
| 390 × 844 | 2 | 1264 | 112 | 0.0003 |
| 390 × 844 | 3 | 1272 | 120 | 0.0003 |
| 1440 × 900 | 1 | 1368 | 72 | 0.0004 |
| 1440 × 900 | 2 | 1320 | 88 | 0.0004 |
| 1440 × 900 | 3 | 1336 | 64 | 0.0004 |

The page observed Largest Contentful Paint before user input, non-input layout shifts grouped into session windows, and Event Timing entries with a nonzero interaction ID and a 16 ms reporting threshold. The table gives the longest reported duration from each short interaction sample. All six final views fit the viewport width. A populated media library, large archive, drawing session, slow physical device, production CDN and complete user sessions still need separate coverage.

## Keyboard and accessibility

- In unthrottled 390 × 900 and 768 × 900 Chrome sessions, Tab reached both the navigation and generation-settings openers. Enter opened each drawer, reverse Tab then forward Tab cycled inside it, and Escape returned focus to its opener in all four cases. This covers A11Y-07 for these drawers on this build.
- At widths 390, 768 and 1440, keyboard navigation reached the prompt and accepted typed text. In dark mode the focused prompt and drawer close buttons had a computed 2 px solid outline, RGB (156, 155, 255). These checks cover a subset of A11Y-01/02. They do not measure focus contrast over every surface, form errors, generated assets or screen-reader announcements.
- axe-core 4.14.0 inspected the initial Create screen at 390 × 900 and 1440 × 900 in both themes. WCAG 2 A/AA, 2.1 A/AA and 2.2 AA tag filters returned zero violations and zero incomplete results in all four scans. There were 18 applicable passing rules per narrow scan and 25 per desktop scan. The first attempt to inject the auditor as inline script was rejected by the site's CSP. The completed runs served the auditor through a same-origin test route in the browser context.
- Reduced motion was requested and the media query matched. A motion-specific interaction and VoiceOver remain untested by this harness. The sampled screens do not establish WCAG conformance for the full app.

## Reproduction

Use the repository's supported Node version and a local installation of Google Chrome. Install the locked project dependencies, build, then start a production preview:

```sh
npm ci
npm run build
npm run preview -- --host 127.0.0.1 --port 48925 --strictPort
```

In a second terminal, point the runner at an installed Playwright ESM entry. Set the optional axe script path to include the automated accessibility checks. Output is a JSON object with the build identity, bundle digest, individual runs, focus results and optional accessibility findings.

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright/index.mjs \
AXE_SCRIPT=/absolute/path/to/axe-core/axe.min.js \
node scripts/chromium-lab.mjs http://127.0.0.1:48925/PWA-Images-Generation-BYOK/
```

The layout candidate from `28aa460` was rerun using the same Chromium lab profile. Six new navigations had LCP 1,416–1,528 ms, CLS 0–0.0004 and maximum observed interaction duration 80–112 ms. None overflowed the viewport. Navigation and settings drawers trapped and restored keyboard focus at 390 and 768 px. Axe-core 4.14.0 reported zero violations on the fresh 390 and 1440 px surfaces in both themes. The served JS SHA-256 was `33df4c58847a57bc5c7f4d591fe7c665f4d5b9eeb14e0f4a645c8fb591babfef`. Field P75 remains unmeasured.
