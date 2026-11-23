# Production release gates

**Decision: HOLD.** This assessment uses the STATIC_OFFLINE profile of KB-MCP `pwa:product-standard` v1.1.0 (registry body revision `80aad1538f3ecdddd7512de64cde4b8047196fb3637c075a87aab381bf314874`) and its service-worker install-integrity companion. Assessment date: 2026-11-23 Singapore time. Repository baseline: `0fab919`. This matrix records the scope of each observation. Historical local passes do not establish release-candidate or live acceptance.

| Gate | Decision | Outstanding evidence |
|---|---|---|
| G1 Safety | HOLD | Build-integrity rejection and cross-tab activation have passed bounded Chrome checks. Review remaining offline failure, security and device cases below. |
| G2 Compatibility | HOLD | Physical iOS Home Screen, VoiceOver, Android and remaining supported browsers need execution. |
| G3 Performance | HOLD | Six local cold navigations met the lab thresholds. Real-user percentile coverage is outstanding. Field P75 is INSUFFICIENT_DATA. Targets are LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1. |
| G4 Evidence | HOLD | A release artifact is published. Remaining gaps include per-case build evidence and the full target matrix. The live rollback and restore-forward drill passed. |

## Evidence used

- **E1 — shell and offline startup.** Local macOS Chrome 158.0.8127.37 with isolated persistent profile. The recorded browser install and cold-start attempts contain build IDs, environment and the observed standalone mismatch. [Browser verification](t101.md).
- **E2 — update.** On 2026-11-23, a local Playwright-driven Chrome instance used two built outputs on the same loopback subpath. The old build remained visible until a single explicit update click, after which exactly one navigation displayed the new build. The tested update implementation is `f38b0fb`; the two exact output digests and UI build IDs were not retained. This is historical functional evidence.
- **E3 — credential.** Local production Chrome exercised saving, replacing, reloading and forgetting a test credential. The fixture did not appear in inspected cache URLs/bodies, console text or request URLs/bodies. Tested implementation: `04e42df`. No real provider interaction occurred during this credential fixture check.
- **E4 — production build on loopback.** macOS desktop Chrome, isolated profile, Playwright, build `v0.1.0 · 2026-11-23T14:06:32.771Z` from a working-tree snapshot. One low-quality 1024 × 1024 real OpenAI image edit retained the supplied green background, upper-left magenta rectangle and lower-right blue circle. The prompt omitted colors and positions. Output samples were RGB (26,169,77), (243,11,186) and (18,74,235), respectively. The reference was visible for review and PNG download was disabled until explicit acceptance. The 854,940-byte PNG had SHA-256 `fd20ff6589a130b04d9cf926c88c030b9a2c57ccce79e44e305e18371add8903`. A 867,630-byte UI backup contained two assets, one version, one reference and one review record. Its uncompressed entries did not contain the credential. The restored project survived reload and exported identical PNG bytes, with review acceptance preserved. Backup/restore used a 390 × 844 desktop viewport. On build `2026-11-23T14:08:05.759Z` the Projects tab and backup action were also accessible at 1440 × 900. Neither working-tree build has an exact source commit or artifact digest.
- **E5 — release preparation.** Workflow syntax and subpath production output were checked locally. Artifact publication and retrieval require an actual workflow run. [Release procedure](../release-pages.md).

## Device coverage

| Environment | Verified coverage | Remaining release checks |
|---|---|---|
| Chrome on macOS | E1–E4 within stated scope | See the public installed upgrade and offline observations below; repeat against later releases as needed |
| Chrome and Edge on Windows | PASS (managed installation on Windows Server 2025) | [Public installed and offline browser evidence](compatibility.md). Consumer installation UI and Windows client edition outstanding. |
| Edge on macOS | NOT_RUN | Installed and ordinary browser flows |
| Chrome on physical Android | NOT_RUN | Browser and installed app including rotation, keyboard and offline restart |
| Safari on physical iPhone | NOT_RUN | Browser, Home Screen, VoiceOver, safe areas, keyboard and interrupted update |
| iPadOS Safari | NOT_RUN | Responsive editing, keyboard and orientation |
| Desktop Safari and Firefox | PARTIAL | Desktop Safari and Playwright Firefox ordinary/offline checks passed within [recorded limits](compatibility.md); stable Firefox outstanding |

## Catalog

All 60 cases below are relevant to the declared product or require an explicit justified exception. NOT_RUN means the full assertion lacks a recorded execution in its stated environment. Component tests, static inspection and partial runtime observations appear in the evidence column. The initial standalone mismatch and subsequent successful installed launches are both recorded.

| Test ID | Assertion | Result | Evidence or remaining acceptance check |
|---|---|---|---|
| INS-01 | HTTPS and manifest discovery | PASS (live Chrome) | Public HTTPS manifest retrieved and the app installed from its scoped URL. |
| INS-02 | Stable manifest ID across releases | PASS (two live builds) | Both release manifests retained the same repository ID. |
| INS-03 | Valid start_url and scope | PASS (live Chrome) | The published manifest subpath matched the artifact and the installed app launched there. |
| INS-04 | 192/512 icons and maskable rendering | NOT_RUN | Inspect installed icon crop and safe zone on each install target. |
| INS-05 | Standalone launch | PASS (macOS Chrome) | The subsequent installed standalone-window check supersedes the earlier tab-only result. See the public upgrade observation below. |
| INS-06 | iOS manual installation guidance | NOT_RUN | Walk through Add to Home Screen on a physical iPhone. |
| INS-07 | Unsupported install prompt fallback | NOT_RUN | Exercise ordinary web fallback in Firefox and Safari. |
| INS-08 | Deep-link launch after installation | NOT_RUN | Launch installed app from a supported deep link. |
| SW-01 | Fresh install and first-load behavior | PASS (historical local) | Chrome registered and activated the shell worker at the app subpath (E1). |
| SW-02 | Build A to B update discovery | PASS (historical local) | Two distinct preview builds triggered discovery and installation (E2). |
| SW-03 | Mismatched build identity rejected | PASS (local Chrome, two builds) | [Build-bound integrity and recovery observations](shell-integrity.md). |
| SW-04 | CDN stale asset rejection | PASS (local Chrome, two builds) | [Build-bound integrity and recovery observations](shell-integrity.md). |
| SW-05 | Update prompt visible | PASS (historical local) | Waiting worker displayed an actionable prompt in real Chrome (E2). |
| SW-06 | Unsaved draft blocks activation | PASS (two-tab Chrome) | [Actual drafts, double click and update navigation](update-guards.md). |
| SW-07 | Multiple tabs coordinate activation | PASS (two-tab Chrome) | [Actual drafts, double click and update navigation](update-guards.md). |
| SW-08 | Duplicate Update click prevented | PASS (two-tab Chrome) | [Actual drafts, double click and update navigation](update-guards.md). |
| SW-09 | Activation loader and controllerchange | PASS (two-tab Chrome) | [Actual drafts, double click and update navigation](update-guards.md). |
| SW-10 | Offline update failure preserves old build | PASS (local Chrome, two builds) | [Build-bound integrity and recovery observations](shell-integrity.md). |
| SW-11 | Rollback from invalid build | NOT_RUN | Simulate a corrupt build and restore known-good bytes. |
| SW-12 | Unknown-route recovery | PASS (local Chrome, two builds) | [Build-bound integrity and recovery observations](shell-integrity.md). |
| OFF-01 | Offline shell loads | PASS (live Chrome) | After an explicit installed-client update, offline refresh retained build B in standalone mode. |
| OFF-02 | Offline network error detected | PASS (bounded local fixture) | [Chrome failure, storage, migration and cache observations](offline-recovery.md). |
| OFF-03 | Offline server transaction not falsely committed | PASS (bounded local fixture) | [Chrome failure, storage, migration and cache observations](offline-recovery.md). |
| OFF-04 | Durable pending operation recovery | PASS (bounded local fixture) | [Chrome failure, storage, migration and cache observations](offline-recovery.md). |
| OFF-05 | Storage quota exceeded | PASS (bounded local fixture) | [Chrome failure, storage, migration and cache observations](offline-recovery.md). |
| OFF-06 | IndexedDB migration | PASS (bounded local fixture) | [Chrome failure, storage, migration and cache observations](offline-recovery.md). |
| OFF-07 | Cache eviction recovery | PASS (bounded local fixture) | [Chrome failure, storage, migration and cache observations](offline-recovery.md). |
| OFF-08 | Sensitive responses excluded from cache | PASS (bounded local fixture) | [Chrome failure, storage, migration and cache observations](offline-recovery.md). |
| MOB-01 | Notch and Dynamic Island clearance | NOT_RUN | Inspect notched real iPhone layouts in both orientations. |
| MOB-02 | Home indicator clearance | NOT_RUN | Inspect actions above home indicator in standalone mode. |
| MOB-03 | Keyboard viewport resize | NOT_RUN | Exercise iOS keyboard and keyboard dismissal with composer visible. |
| MOB-04 | No unintended input focus zoom | NOT_RUN | Focus all editable fields on physical iOS and check zoom. |
| MOB-05 | Portrait and landscape layout | NOT_RUN | Compare portrait and landscape tablet and phone layouts. |
| MOB-06 | Smart top bar scroll direction | NOT_RUN | Exercise scrolling in real long-view contexts; document exceptions if unnecessary. |
| MOB-07 | Scroll-to-top accessibility | NOT_RUN | Test keyboard and screen-reader access to return-to-top in long content. |
| MOB-08 | Light/dark system chrome | NOT_RUN | Inspect light/dark system chrome and transitions on physical devices. |
| A11Y-01 | Keyboard-only navigation | PASS (bounded desktop Chrome journeys) | Keyboard-only validation, project creation and generation failure exercised. [Evidence](keyboard-and-controls.md). |
| A11Y-02 | Visible focus indicator | PARTIAL | 48 focus visits per theme, with visible focus and contrast measured in desktop Chrome. Review on remaining platforms. [Evidence](keyboard-and-controls.md). |
| A11Y-03 | Screen-reader landmarks and names | NOT_RUN | Use real VoiceOver to inspect navigation and form names. |
| A11Y-04 | Contrast requirements | PARTIAL | Focus contrast exceeded 6.5:1 in both themes on sampled controls. Full state coverage remains open. [Evidence](keyboard-and-controls.md). |
| A11Y-05 | Touch target spacing | PARTIAL | Measured desktop Chrome viewports and corrected undersized disclosures, header buttons and key controls. Physical touch acceptance remains open. [Evidence](keyboard-and-controls.md). |
| A11Y-06 | Reduced-motion preference | PASS (Chrome preference emulation) | Reduced-motion behavior verified in Chrome. [Evidence](keyboard-and-controls.md). |
| A11Y-07 | Modal focus trapping and restoration | PASS (Chromium drawers) | Four drawer cases verified keyboard containment, Escape and focus restoration. See performance.md. |
| A11Y-08 | Accessible update status announcements | NOT_RUN | Observe update and blocked-update announcements with a screen reader. |
| QA-01 | LCP target | LAB PASS; FIELD INSUFFICIENT_DATA | Six fresh navigations measured LCP 1260–1368 ms in the bounded lab. See performance.md. |
| QA-02 | INP target | LAB ONLY; FIELD INSUFFICIENT_DATA | Worst observed interaction event duration was 120 ms. The bounded sample does not establish field INP P75. |
| QA-03 | CLS target | LAB PASS; FIELD INSUFFICIENT_DATA | Observed CLS 0.0003–0.0004 in six fresh navigations. See performance.md. |
| QA-04 | Responsive layout without overflow | PARTIAL | No horizontal overflow on tested fresh shells at 390/768/1440. See performance.md. |
| QA-05 | CSP and XSS regression | PASS (bounded desktop Chrome checks) | Project markup displayed as literal text. CSP blocked an off-origin request. [Evidence](keyboard-and-controls.md). |
| QA-06 | No sensitive cache leakage | PASS (bounded local fixture) | [Chrome failure, storage, migration and cache observations](offline-recovery.md). |
| QA-07 | Dependency security review | PASS (2026-11-23 npm advisory snapshot) | Clean Node 24 install and full npm audit reported zero known vulnerabilities after overriding Workbox’s build-only glob dependency to 14.0.6. Lint, tests and production worker generation passed. |
| QA-08 | Recoverable runtime errors | NOT_RUN | Observe recovery paths for invalid credentials, network errors, quota and damaged restores. |
| REL-01 | Clean production deployment | PASS (first live release) | Workflow 45192152435, live HTTPS entry, nine matching artifact files. |
| REL-02 | Old-to-new build upgrade | PASS (live Chrome) | Installed A stayed on A until explicit activation, then displayed B after one navigation. |
| REL-03 | Interrupted update recovery | NOT_RUN | Interrupt update discovery, download and activation; verify recovery. |
| REL-04 | Rollback artifact available | PASS (live Pages) | A restore dispatch republished the exact nine files of A. A second restore republished the exact ten files of B. |
| REL-05 | Release evidence completeness | NOT_RUN | Attach per-case test IDs, source/build digests, timestamps, environment and outcomes. |
| REL-06 | Cross-browser test matrix | NOT_RUN | Complete declared device/browser matrix below. |
| REL-07 | Monitoring and alert validation | NOT_RUN | Verify operator visibility of Pages failure and privacy-safe recovery instructions. |
| REL-08 | No unauthorized automatic resubmission | PASS (bounded fixtures) | Interrupted and uncertain jobs did not resend during the observation windows in [offline recovery](offline-recovery.md). |

## First live release

GitHub Pages published commit `f4142674e1ebfa74c4722bbd0769824d3bf7d488` on 2026-11-23. Both build and deploy jobs succeeded. All nine published files matched the retained `site-files` artifact byte for byte, including the index served at the app entry point. [Workflow run 45192152435](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45192152435).

On macOS Chrome, the live HTTPS workspace generated one low-quality image via OpenAI (HTTP 200). Chrome decoded it at 1024 × 1024, reloaded the workspace, went offline, reloaded again, and downloaded the reopened image as PNG. The test used a temporary BYOK credential in an isolated browser context. No credential or image payload is included in this report. This verifies REL-01 and browser-tab offline access for this release. See [T-101](t101.md) for installed-window verification on the local production preview.

To compare a subsequent release, download its `site-files` artifact and run `node scripts/verify-pages.mjs /path/to/site-files` from the repository.
## Installed update and rollback drill

On public GitHub Pages, Chrome 158.0.8127.37 on macOS installed build A (`2026-11-23T14:15:30.967Z`) in a fresh profile. The installed window reported standalone display mode. After [build B was published](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45192998855), the old UI stayed visible until the user clicked the update button. One main-frame navigation displayed B (`2026-11-23T14:20:07.985Z`). An offline reload retained the build and standalone mode. B's worker SHA-256 was `9ea30324b76f526d6d68bdabe0dcf80b22b84d7a648016912048b5287f1aa54b`. All ten public files matched its retained artifact.

The [rollback dispatch](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45193373686) restored A from the previously retained artifact. All nine files matched the original A artifact at the live origin. The [restore-forward dispatch](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45193539228) returned the site to B. Both dispatches completed successfully.

Additional device and lab results: [desktop browser compatibility](compatibility.md), [performance and keyboard checks](performance.md).

## Integrated November 23 release

[Pages run 45196879919](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45196879919) published source `3918d98`. Its clean build, deployment and live artifact comparison succeeded. Chrome opened the public app with displayed build `v0.1.0 · 2026-11-23T14:41:40.454Z`. A tester selected GPT Image 2.6 Flare and explicitly submitted a low-quality image request with a temporary key. OpenAI returned HTTP 200, Chrome decoded the image at 1024 × 1024, and an offline reload retained the image and enabled PNG download. The separate [UHD and masked-edit checks](advanced-generation.md) describe their respective release builds and models.
