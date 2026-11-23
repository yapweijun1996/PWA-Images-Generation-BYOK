# Production release gates

**Decision: HOLD.** This assessment uses the STATIC_OFFLINE profile of KB-MCP `pwa:product-standard` v1.1.0 (registry body revision `80aad1538f3ecdddd7512de64cde4b8047196fb3637c075a87aab381bf314874`) and its service-worker install-integrity companion. Assessment date: 2026-11-23 Singapore time. Repository baseline: `0fab919`. This matrix records the scope of each observation. Historical local passes do not establish release-candidate or live acceptance.

| Gate | Decision | Outstanding evidence |
|---|---|---|
| G1 Safety | HOLD | Build-integrity rejection, cross-tab update safety, recovery and security checks remain open. |
| G2 Compatibility | HOLD | Physical iOS Home Screen, VoiceOver, Android and remaining supported browsers need execution. |
| G3 Performance | HOLD | Lab baselines and launch policy for absent field data are outstanding. Field P75 is INSUFFICIENT_DATA. Targets are LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1. |
| G4 Evidence | HOLD | A release artifact is published. Remaining gaps include per-case build SHA/digest, live rollback drill or complete target matrix. |

## Evidence used

- **E1 — shell and offline startup.** Local macOS Chrome 158.0.8127.37 with isolated persistent profile. The recorded browser install and cold-start attempts contain build IDs, environment and the observed standalone mismatch. [Browser verification](t101.md).
- **E2 — update.** On 2026-11-23, a local Playwright-driven Chrome instance used two built outputs on the same loopback subpath. The old build remained visible until a single explicit update click, after which exactly one navigation displayed the new build. The tested update implementation is `f38b0fb`; the two exact output digests and UI build IDs were not retained. This is historical functional evidence.
- **E3 — credential.** Local production Chrome exercised saving, replacing, reloading and forgetting a test credential. The fixture did not appear in inspected cache URLs/bodies, console text or request URLs/bodies. Tested implementation: `04e42df`. No real provider interaction occurred during this credential fixture check.
- **E4 — production build on loopback.** macOS desktop Chrome, isolated profile, Playwright, build `v0.1.0 · 2026-11-23T14:06:32.771Z` from a working-tree snapshot. One low-quality 1024 × 1024 real OpenAI image edit retained the supplied green background, upper-left magenta rectangle and lower-right blue circle. The prompt omitted colors and positions. Output samples were RGB (26,169,77), (243,11,186) and (18,74,235), respectively. The reference was visible for review and PNG download was disabled until explicit acceptance. The 854,940-byte PNG had SHA-256 `fd20ff6589a130b04d9cf926c88c030b9a2c57ccce79e44e305e18371add8903`. A 867,630-byte UI backup contained two assets, one version, one reference and one review record. Its uncompressed entries did not contain the credential. The restored project survived reload and exported identical PNG bytes, with review acceptance preserved. Backup/restore used a 390 × 844 desktop viewport. On build `2026-11-23T14:08:05.759Z` the Projects tab and backup action were also accessible at 1440 × 900. Neither working-tree build has an exact source commit or artifact digest.
- **E5 — release preparation.** Workflow syntax and subpath production output were checked locally. Artifact publication and retrieval require an actual workflow run. [Release procedure](../release-pages.md).

## Device coverage

| Environment | Verified coverage | Remaining release checks |
|---|---|---|
| Chrome on macOS | E1–E4 within stated scope | Current installed build, standalone display mode, live update and offline reopening |
| Chrome and Edge on Windows; Edge on macOS | NOT_RUN | Installed and ordinary browser flows |
| Chrome on physical Android | NOT_RUN | Browser and installed app including rotation, keyboard and offline restart |
| Safari on physical iPhone | NOT_RUN | Browser, Home Screen, VoiceOver, safe areas, keyboard and interrupted update |
| iPadOS Safari | NOT_RUN | Responsive editing, keyboard and orientation |
| Desktop Safari and Firefox | NOT_RUN | Ordinary website including supported offline behavior |

## Catalog

All 60 cases below are relevant to the declared product or require an explicit justified exception. NOT_RUN means the full assertion lacks a recorded execution in its stated environment. Component tests, static inspection and partial runtime observations appear in the evidence column. FAIL for INS-05 describes the measured local result.

| Test ID | Assertion | Result | Evidence or remaining acceptance check |
|---|---|---|---|
| INS-01 | HTTPS and manifest discovery | NOT_RUN | Loopback manifest discovery observed; deployed HTTPS origin pending. |
| INS-02 | Stable manifest ID across releases | NOT_RUN | Compare manifest IDs across two published builds. |
| INS-03 | Valid start_url and scope | NOT_RUN | Local manifest ID, scope and start URL matched the repository subpath; repeat on Pages. |
| INS-04 | 192/512 icons and maskable rendering | NOT_RUN | Inspect installed icon crop and safe zone on each install target. |
| INS-05 | Standalone launch | FAIL | Chrome CDP installation launched a target where standalone media query returned false (E1). |
| INS-06 | iOS manual installation guidance | NOT_RUN | Walk through Add to Home Screen on a physical iPhone. |
| INS-07 | Unsupported install prompt fallback | NOT_RUN | Exercise ordinary web fallback in Firefox and Safari. |
| INS-08 | Deep-link launch after installation | NOT_RUN | Launch installed app from a supported deep link. |
| SW-01 | Fresh install and first-load behavior | PASS (historical local) | Chrome registered and activated the shell worker at the app subpath (E1). |
| SW-02 | Build A to B update discovery | PASS (historical local) | Two distinct preview builds triggered discovery and installation (E2). |
| SW-03 | Mismatched build identity rejected | NOT_RUN | Serve mismatched HTML/worker build identity and prove candidate rejection. |
| SW-04 | CDN stale asset rejection | NOT_RUN | Serve stale assets under new CDN release metadata; verify previous cache survives. |
| SW-05 | Update prompt visible | PASS (historical local) | Waiting worker displayed an actionable prompt in real Chrome (E2). |
| SW-06 | Unsaved draft blocks activation | NOT_RUN | Component/guard tests cover blocked clicks; run a real dirty editor through update. |
| SW-07 | Multiple tabs coordinate activation | NOT_RUN | Keep one tab busy while requesting activation in another tab. |
| SW-08 | Duplicate Update click prevented | NOT_RUN | Unit test covers duplicate clicks; exercise repeated input in a real browser. |
| SW-09 | Activation loader and controllerchange | NOT_RUN | One controller transition/reload observed; loader visibility and announcement outstanding. |
| SW-10 | Offline update failure preserves old build | NOT_RUN | Interrupt installing B offline while A remains usable. |
| SW-11 | Rollback from invalid build | NOT_RUN | Simulate a corrupt build and restore known-good bytes. |
| SW-12 | Unknown-route recovery | NOT_RUN | Navigate to unknown path online/offline and recover. |
| OFF-01 | Offline shell loads | NOT_RUN | Local Chrome tab rendered cached shell after server shutdown; standalone result incomplete (E1). |
| OFF-02 | Offline network error detected | NOT_RUN | Disconnect during a real provider request and inspect error/retained inputs. |
| OFF-03 | Offline server transaction not falsely committed | NOT_RUN | Confirm a lost provider response is never shown as a successful job. |
| OFF-04 | Durable pending operation recovery | NOT_RUN | Restart browser mid-operation; prove pending work survives and is never billed twice. |
| OFF-05 | Storage quota exceeded | NOT_RUN | Trigger quota exhaustion and verify user recovery without losing prior versions. |
| OFF-06 | IndexedDB migration | NOT_RUN | Migrate prior populated schema in a real browser and compare metadata and blobs. |
| OFF-07 | Cache eviction recovery | NOT_RUN | Evict assets/cache and verify warnings plus backup-based recovery. |
| OFF-08 | Sensitive responses excluded from cache | NOT_RUN | E3 audited cache for a BYOK marker; inspect all caches after authenticated image/edit calls. |
| MOB-01 | Notch and Dynamic Island clearance | NOT_RUN | Inspect notched real iPhone layouts in both orientations. |
| MOB-02 | Home indicator clearance | NOT_RUN | Inspect actions above home indicator in standalone mode. |
| MOB-03 | Keyboard viewport resize | NOT_RUN | Exercise iOS keyboard and keyboard dismissal with composer visible. |
| MOB-04 | No unintended input focus zoom | NOT_RUN | Focus all editable fields on physical iOS and check zoom. |
| MOB-05 | Portrait and landscape layout | NOT_RUN | Compare portrait and landscape tablet and phone layouts. |
| MOB-06 | Smart top bar scroll direction | NOT_RUN | Exercise scrolling in real long-view contexts; document exceptions if unnecessary. |
| MOB-07 | Scroll-to-top accessibility | NOT_RUN | Test keyboard and screen-reader access to return-to-top in long content. |
| MOB-08 | Light/dark system chrome | NOT_RUN | Inspect light/dark system chrome and transitions on physical devices. |
| A11Y-01 | Keyboard-only navigation | NOT_RUN | Complete core flow by keyboard, including form errors. |
| A11Y-02 | Visible focus indicator | NOT_RUN | Inspect visible focus throughout drawers, composer and review. |
| A11Y-03 | Screen-reader landmarks and names | NOT_RUN | Use real VoiceOver to inspect navigation and form names. |
| A11Y-04 | Contrast requirements | NOT_RUN | Measure contrast of text, controls, focus and error states in both themes. |
| A11Y-05 | Touch target spacing | NOT_RUN | Measure actual target spacing at each breakpoint. |
| A11Y-06 | Reduced-motion preference | NOT_RUN | Enable reduced motion and inspect transitions and scrolling. |
| A11Y-07 | Modal focus trapping and restoration | NOT_RUN | Tab through each dialog, dismiss and confirm focus restoration. |
| A11Y-08 | Accessible update status announcements | NOT_RUN | Observe update and blocked-update announcements with a screen reader. |
| QA-01 | LCP target | NOT_RUN | Collect lab LCP and separately report field P75; field sample insufficient. |
| QA-02 | INP target | NOT_RUN | Measure interaction latency and separately report field INP P75. |
| QA-03 | CLS target | NOT_RUN | Measure layout shifts through core flow and separately report field CLS P75. |
| QA-04 | Responsive layout without overflow | NOT_RUN | Mobile backup exercised; run dedicated overflow assertions across target dimensions. |
| QA-05 | CSP and XSS regression | NOT_RUN | CSP present in production output; execute defensive rendering and CSP checks on release candidate. |
| QA-06 | No sensitive cache leakage | NOT_RUN | Fixture credential absent from inspected E3 caches and E4 backup; full release cache audit pending. |
| QA-07 | Dependency security review | NOT_RUN | Review locked production and build dependencies and document dispositions. |
| QA-08 | Recoverable runtime errors | NOT_RUN | Observe recovery paths for invalid credentials, network errors, quota and damaged restores. |
| REL-01 | Clean production deployment | PASS (first live release) | Workflow 45192152435, live HTTPS entry, nine matching artifact files. |
| REL-02 | Old-to-new build upgrade | NOT_RUN | Preview update observed (E2); repeat on installed Pages client. |
| REL-03 | Interrupted update recovery | NOT_RUN | Interrupt update discovery, download and activation; verify recovery. |
| REL-04 | Rollback artifact available | NOT_RUN | Workflow requests retained immutable artifact; actual release artifact and rollback unverified. |
| REL-05 | Release evidence completeness | NOT_RUN | Attach per-case test IDs, source/build digests, timestamps, environment and outcomes. |
| REL-06 | Cross-browser test matrix | NOT_RUN | Complete declared device/browser matrix below. |
| REL-07 | Monitoring and alert validation | NOT_RUN | Verify operator visibility of Pages failure and privacy-safe recovery instructions. |
| REL-08 | No unauthorized automatic resubmission | NOT_RUN | One intentional image edit observed (E4); check uncertain/reloaded requests for implicit resubmission. |

## First live release

GitHub Pages published commit `f4142674e1ebfa74c4722bbd0769824d3bf7d488` on 2026-11-23. Both build and deploy jobs succeeded. All nine published files matched the retained `site-files` artifact byte for byte, including the index served at the app entry point. [Workflow run 45192152435](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45192152435).

On macOS Chrome, the live HTTPS workspace generated one low-quality image via OpenAI (HTTP 200). Chrome decoded it at 1024 × 1024, reloaded the workspace, went offline, reloaded again, and downloaded the reopened image as PNG. The test used a temporary BYOK credential in an isolated browser context. No credential or image payload is included in this report. This verifies REL-01 and browser-tab offline access for this release. See [T-101](t101.md) for installed-window verification on the local production preview.

To compare a subsequent release, download its `site-files` artifact and run `node scripts/verify-pages.mjs /path/to/site-files` from the repository.
