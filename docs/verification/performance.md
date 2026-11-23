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

The mobile navigation and theme build was retested under the same lab settings in Chrome 158. The six fresh navigations measured LCP 1,264–1,340 ms, CLS 0–0.0004 and longest observed interaction events 48–56 ms. The local displayed build was `2026-11-23T15:23:36.917Z` with JS SHA-256 `f8d4606a28591caef80d1e6ec2d886317a2c2b5c1d18288b8494ab61a10ea09f`. The two mobile drawer sizes retained focus and restored it on dismissal. Axe reported zero violations and left color contrast for manual checking in all four sampled theme and width combinations.

The exact [published artifact for `68ef70d`](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45232034707) ran in the same loopback lab. Its entry script SHA-256 was `4e3f47960f31eb01c3b65b0f911145901958116e78184be6de58908544171674`. Six fresh loads measured LCP 1,276–1,380 ms, CLS 0–0.0004 and longest observed interaction-event duration 48–72 ms. Each viewport fit without horizontal overflow. The keyboard suite confirmed both drawers retained and restored focus at 390 and 768 px, and the public build label remained visible above mobile navigation at 390 px. Field P75 remains `INSUFFICIENT_DATA`.

The exact [published artifact for `49388bd`](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45239647736) repeated the same loopback lab. Six fresh loads measured LCP 1,288–1,352 ms, CLS 0–0.0004 and longest observed interaction-event duration 48–64 ms. Both widths fit without horizontal overflow, and the drawer and build-label checks passed. Entry script SHA-256 is `343599df1ab5cb96d0b86dc6c49d6a6c99e1cf4edd9991d7c36f05f4f92b142e`.

The exact [published artifact for `e9c076f`](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45242606194) passed six fresh loads in the same loopback Chrome lab. Observations were LCP 1,428–1,472 ms, CLS 0–0.0004 and longest interaction-event duration 72–136 ms. The sampled widths fit without horizontal overflow and the keyboard checks passed. Entry script SHA-256 is `d534acf681d99a875b87e01cc6fff54c666218332872fa51a56a50f50ba136be`.

An initial run of the exact `8d319a6` artifact overlapped other local browser checks. Its first 390 px load took 3,636 ms LCP. The other five LCP samples were 1,484–1,776 ms. After the other checks exited, the same host ran the retained `e9c076f` and `8d319a6` artifacts serially with the standard settings and six loads each.

| Artifact | LCP range (ms) | CLS range | Longest interaction-event duration range (ms) |
| --- | ---: | ---: | ---: |
| `e9c076f` | 1,384–1,524 | 0–0.0004 | 80–112 |
| `8d319a6` | 1,348–1,404 | 0–0.0004 | 56–80 |

Both serial samples fit the viewport and passed the lab checks. The newer entry script SHA-256 is `ad01a16d5b3e039a0c2b5d98a2069167cfaedc0e9c333fa81c408d0909fa509d`. Field P75 remains `INSUFFICIENT_DATA`. [Artifact for `8d319a6`](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45245075066).

### Transport check for the generation announcement release

An initial loopback server delivered the `c03b99f` entry script uncompressed at 416,958 bytes. Its six throttled loads measured LCP 3,108–3,180 ms. The public asset served gzip at 134,337 bytes. The same host repeated the standard six-load harness in Chrome 158.0.8127.37 for each retained release in sequence, with Vite preview and gzip on both ports.

| Artifact | LCP range (ms) | CLS range | Longest interaction-event duration range (ms) |
| --- | ---: | ---: | ---: |
| `8d319a6` | 1,416–1,448 | 0–0.0004 | 80–120 |
| `c03b99f` | 1,420–1,464 | 0–0.0004 | 88–160 |

Both gzip runs fit the viewport and passed the lab checks. The `c03b99f` entry script SHA-256 is `2476bcee5076e416b3f72d0c435401103cc8b938c1c44c34fb8473a49ee27df3`. The measured interaction events cover a short lab journey. Field P75 remains `INSUFFICIENT_DATA`. [Artifact for `c03b99f`](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45250691263).

### Earlier Safari installation guidance artifact

On November 24 Singapore time, the exact [published `6d70d15` artifact](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45256773772) matched the 13 public files byte for byte. Vite served those files on loopback under the same app subpath. The lab server and Pages each served the entry script with gzip. The script transferred in 133,319 bytes on loopback and 134,434 bytes from Pages, with uncompressed SHA-256 `3d6c396efb4341843100131b416e64e66deb6219d4426274e46106da18717744`.

Chrome 158.0.8127.37 repeated the standard 4× CPU and throttled network profile across three fresh contexts per viewport. All six displayed build `v0.1.0 · 2026-11-23T20:12:01.911Z`, met the sampled numeric budgets and fit without horizontal overflow.

| Viewport | LCP range (ms) | CLS range | Longest interaction-event duration range (ms) |
| --- | ---: | ---: | ---: |
| 390 × 844 | 1,400–1,460 | 0 | 80–96 |
| 1440 × 900 | 1,376–1,416 | 0.0004 | 72–80 |

Both drawers kept and restored keyboard focus and hid background content from the Chrome accessibility tree at 390 and 768 px. The build label was visible above mobile navigation. Axe-core 4.14.1 found no violations in the initial workspace at 390 and 1440 px in both themes. Color contrast remained flagged for manual review. The metrics describe a lab run with the retained release. Field P75 remains `INSUFFICIENT_DATA`.

### Compact toolbar release artifact

The exact [published `7aaefff` artifact](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45266948803) matched all 13 public files. Chrome 158.0.8127.37 repeated the six-load throttled lab on Vite preview under the same app subpath. The entry script SHA-256 was `c58ddd310b8848786de6525aa7f8f2b76c5ab7493723b98f6ae11c3414794977`.

| Viewport | LCP range (ms) | CLS range | Longest interaction-event duration range (ms) |
| --- | ---: | ---: | ---: |
| 390 × 844 | 1,448–1,640 | 0 | 104–168 |
| 1440 × 900 | 1,364–1,432 | 0.0004 | 72–80 |

The six views fit without horizontal overflow. The keyboard suite confirmed focus restoration for four drawer and viewport combinations. Axe-core 4.14.1 found no automatic violations in the four initial-workspace theme and viewport combinations and flagged color contrast for manual review. Field P75 remains `INSUFFICIENT_DATA`.

### Share actions release artifact

Chrome 158.0.8127.37 repeated the lab with the exact [published `83a4e07` artifact](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45271666647). The retained files matched all 13 public files. The entry script SHA-256 was `0b732ea8a26fe496cd5c64555902c15fef14571bc282003c85fd47da5e08cb8f`.

| Viewport | LCP range (ms) | CLS range | Longest interaction-event duration range (ms) |
| --- | ---: | ---: | ---: |
| 390 × 844 | 1,576–1,656 | 0 | 136 |
| 1440 × 900 | 1,456–1,672 | 0.0004 | 80–120 |

No sampled view overflowed. Both drawers kept and restored focus at 390 and 768 px. Field P75 remains `INSUFFICIENT_DATA`.

### Current public release artifact

Chrome 158.0.8127.37 repeated the six-load lab with the exact [published `8d5a29a` artifact](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45281471335). All 13 files matched the deployed site. The entry script SHA-256 was `b301b5947e5249104bb7f7bac9a07c88635a4bcf2c63d15601ab302a4f80a1c1`.

| Viewport | LCP range (ms) | CLS range | Longest interaction-event duration range (ms) |
| --- | ---: | ---: | ---: |
| 390 × 844 | 1,372–1,428 | 0 | 64–88 |
| 1440 × 900 | 1,392–1,404 | 0.0004 | 64–72 |

No sampled view overflowed. The four drawer and viewport combinations held and restored keyboard focus. Field P75 remains `INSUFFICIENT_DATA`.

## Populated asset library

On November 24 Singapore time, a mobile-width Chrome 158.0.8127.37 fixture seeded one project with 48 assets and 48 versions in IndexedDB. The synthetic PNGs measured 2048 × 1536, with about 3.9 MB per original. Half the asset records omitted recorded dimensions. Two distinct PNG payloads made it possible to verify the selected export independently of the initial selection. The test ran at 390 × 844 with a fresh browser profile for each build. It counted requests to the local blob store and the payload sizes of active object URLs 500 ms after each sampled state.

| State | Public baseline blob reads | Local candidate blob reads | Baseline active URL bytes | Candidate active URL bytes |
| --- | ---: | ---: | ---: | ---: |
| Home | 50 | 1 | 195,532,229 | 3,911,325 |
| Create with version history | 50 | 13 | 195,532,229 | 4,530,501 |
| Assets first view | 98 | 27 | 383,241,808 | 4,633,789 |
| Assets after scrolling to the last tile | 98 | 41 | 383,241,808 | 4,633,697 |

The baseline was public commit `7cbb891`, build `2026-11-23T16:45:21.339Z`. The corrected production preview displayed `2026-11-23T17:00:17.945Z`. Preview tiles defer reads until they approach the viewport, use images bounded to 240 pixels on the longest side when downsampling succeeds, and release their object URLs after leaving the observed area. The edit controls defer initialization until first opened. The main canvas still loads the selected original.

Chrome and WebKit 27.2 verified all 48 accessible asset buttons, the last tile after scrolling, and a 2048-pixel original in the canvas and editor. Collapsing and reopening the editor retained a keyboard-created brush mark. The selected PNG download matched its seeded SHA-256. After an offline reload, the library loaded its thumbnails again. The byte totals describe active blob URLs. Runtime heap, decode peaks and field responsiveness were outside this measurement.

The empty-workspace Chromium lab reran on the same local candidate. Six cold navigations measured LCP from 1,388 to 1,560 ms, CLS up to 0.0004 and longest observed interaction-event duration from 80 to 112 ms. The candidate fit all sampled viewports and the drawer keyboard checks passed.

[Pages run 45224109099](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45224109099) published the fix as `95d5acd`, build `2026-11-23T17:07:47.117Z`. Chrome used a populated project already stored under the old public worker, then applied one explicit update. The new build reproduced the four candidate read counts and byte totals above, exposed all 48 asset buttons, displayed version history, exported the selected original with matching SHA-256 and reopened the library offline. Public WebKit repeated the thumbnail, selection, editor, byte-exact export and offline checks and reached the final thumbnail at 1440 px without horizontal document overflow.

## Large project backup and restore

On November 24 Singapore time, Chrome 158.0.8127.37 at 1440 × 900 exported and restored a synthetic project with 48 images and 48 versions. The source images totaled 192,603,216 bytes. Each run used a fresh profile, started the phase by using the real Projects controls and sampled main-thread Long Tasks during the operation and for a short interval after its visible completion.

| Browser build | Downloads after a separate double click on a small backup | Largest reported export task | Largest reported restore task |
| --- | ---: | ---: | ---: |
| Public `95d5acd`, `2026-11-23T17:07:47.117Z` | 2 | 683 ms | 177 ms |
| Corrected production preview, `2026-11-23T17:20:00.313Z` | 1 | No task ≥50 ms reported | No task ≥50 ms reported |
| Public `86e510a`, `2026-11-23T17:24:30.594Z` | 1 | No task ≥50 ms reported | 76 ms (also one 50 ms task) |

Entry-by-entry export avoids concatenating the entire archive into one array on the UI thread. Restore performs the existing validations and atomic IndexedDB write in a dedicated worker. A compatibility fallback invokes the same restore implementation when the environment has no Worker API. The result above reflects main-thread responsiveness in one sample. It does not measure total operation time, peak process memory or field INP.

The old public build restored the candidate's ZIP. WebKit 27.2 restored the old public build's ZIP in the candidate and in the new public release with the browser offline and an uncached probe rejected. These checks recovered 48 assets and versions, and the selected image downloaded with the original SHA-256 `c036dea708ffbf65dd888b037611064145a86387b1fe2a1257833b743b7c668f`. The WebKit runs observed the dedicated restore worker start from the cached shell.

The empty-workspace lab reran on the corrected archive build. Six cold loads reported LCP of 1,508–1,668 ms, observed interaction events of 88–136 ms and CLS up to 0.0004. No sampled viewport overflowed horizontally. The offline shell added the restore worker and fallback chunk, about 112 KB of built JavaScript before HTTP compression.

## Field measurements and launch policy

Test the published workspace URL through [PageSpeed Insights](https://pagespeed.web.dev/) or the [CrUX API](https://developer.chrome.com/docs/crux/api). Record the URL, phone and desktop form factors, collection dates, and P75 LCP, INP and CLS when URL-level data is available. This repository shares its GitHub Pages origin with other paths. Origin-level measurements describe that combined traffic and belong in the release record as context.

On November 24 Singapore time, the [official CrUX Vis dashboard](https://cruxvis.withgoogle.com/) returned no data for the exact published application URL. Its CrUX History requests returned HTTP 404 and no percentiles were available. The field result remains `INSUFFICIENT_DATA`.

While field data is unavailable, record `INSUFFICIENT_DATA`, retain reproducible lab results for each candidate, and keep full production acceptance open. Public candidate builds can gather usage under the existing release authorization. Evaluate observed regressions against the documented P75 thresholds before closing the performance gate. The published app uses the existing local-first data model. Reporting relies on aggregate browser data published independently of the app, subject to [CrUX coverage and eligibility](https://developer.chrome.com/docs/crux/methodology).
