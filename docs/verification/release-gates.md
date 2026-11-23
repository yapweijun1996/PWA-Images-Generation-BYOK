# Production release gates

**Decision: HOLD.** This assessment uses the STATIC_OFFLINE profile of KB-MCP `pwa:product-standard` v1.1.0 (registry body revision `80aad1538f3ecdddd7512de64cde4b8047196fb3637c075a87aab381bf314874`) and its service-worker install-integrity companion. Assessment date: 2026-11-24 Singapore time. Current hosted build: `d05d51f`. This matrix records the scope of each observation. Historical local passes do not establish release-candidate or live acceptance.

| Gate | Decision | Outstanding evidence |
|---|---|---|
| G1 Safety | HOLD | Build-integrity rejection and cross-tab activation have passed bounded Chrome checks. Review remaining offline failure, security and device cases below. |
| G2 Compatibility | HOLD | Physical iPhone, iPad and Android installation and offline checks, plus spoken VoiceOver and TalkBack verification, remain open. See the device matrix for browser coverage. |
| G3 Performance | HOLD | Six local cold navigations met the lab thresholds. Real-user percentile coverage is outstanding. A public PageSpeed Insights query on November 23 returned HTTP 429 and provided no field records. Field P75 is INSUFFICIENT_DATA. Targets are LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1. |
| G4 Evidence | HOLD | A release artifact is published. Remaining gaps include per-case build evidence and the full target matrix. The live rollback and restore-forward drill passed. |

## Current public release

[Pages run 45217151933](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45217151933) published `d05d51f`, displayed as `v0.1.0 · 2026-11-23T16:30:20.736Z`. All 37 tests, lint, type checking and the production build passed. An independent comparison matched all 11 public files to the retained artifact. Worker SHA-256: `968c42d64f9e25d1034524652ac32bac85b49f6ef27900d82beab687260040da`. The retained artifact expires on 2027-02-21 at 16:29:49 UTC. A scan of 135 tracked files and all 11 published files found no copy of the configured developer key.

The release isolates the background when a phone or tablet drawer is open, including connection and update controls. It makes the build label readable above the fixed phone navigation. Live Chrome recovered the saved draft and build on an offline reload. [Browser and state evidence](keyboard-and-controls.md).

## November 24 generation and review release

[Pages run 45212692403](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45212692403) published `db3c6ed`, displayed as `v0.1.0 · 2026-11-23T16:06:51.928Z`. All 37 tests, lint, type checking and the production build passed. An independent comparison matched all 11 published files to the retained release artifact. Worker SHA-256: `f7a1a697333f3c65d70f7d040f37aa74fc7ee6d2c1d694c128be9cfe97599f7f`. The artifact expires on 2027-02-21 at 16:06:23 UTC. A scan of the tracked repository and all public files found no copy of the configured developer key. The npm advisory audit on November 24 Singapore time reported zero known vulnerabilities.

The [public preview fixture](advanced-generation.md) confirmed that edited images can be approved only after the selected result and its references finish loading. An authenticated outpaint on this public build verified exact preservation of the sampled protected pixels, a filled extension, a transparent fitting margin, reviewed export and offline recovery. Two authenticated batch requests passed on the preceding public build.

## November 23 update announcement release

[Pages run 45210017661](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45210017661) published `b05ac79`, displayed as `v0.1.0 · 2026-11-23T15:52:30.039Z`. CI ran 36 tests, lint, type checking and the production build. CI and an independent check matched all 11 files to the retained artifact. Worker SHA-256: `787c0069cc24130174deabd6a6e4d836b5eb3cc42983b62bd6e7096fb8ffafcb`. The artifact expires on 2027-02-21 at 15:52:06 UTC. A local scan of 135 tracked files and all 11 public files found no copy of the developer key.

On the hosted build Chrome exposed the empty polite, atomic update region before discovery and showed no update card while idle. The [two-build update test](update-guards.md) verified initial discovery and draft blocking in the same DOM region. The [previous release's platform checks](compatibility.md) retain their original build scope.

## November 23 install icon and update recovery release

[Pages run 45207535206](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45207535206) published source `83ba3a4`, displayed build `v0.1.0 · 2026-11-23T15:39:10.092Z`. CI completed 36 tests, lint, type checking and production build. CI and an independent check matched all 11 public files to the release artifact. Worker SHA-256: `ba5c62652f1afe0c3e77a55872bbb90bd66b3ced68633b4288b219dfdb85ab7f`. The retained artifact expires on 2027-02-21 at 15:38:43 UTC. No copy of the configured developer key was found in the tracked files or deployed artifact.

The release added branded install icons, a visible update notice and guarded reload when takeover occurs after a timeout. It distinguishes the browser's acceptance from the standalone launch. [Android emulator installation and offline launch](compatibility.md), [update recovery](update-guards.md), and [browser accessibility metadata](keyboard-and-controls.md) record the scoped checks.

## November 23 mobile navigation and theme release

[Pages run 45204988515](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45204988515) published `bc9f60d`, build `v0.1.0 · 2026-11-23T15:25:32.252Z`. The workflow completed 35 tests, lint, production build and live artifact comparison. An independent check matched all ten files. Worker SHA-256: `0aa37882da270cdc7c2d3765cef2527ac0dd8f199579462b2e6f70f1273b9b97`. The retained artifact expires on 2027-02-21 at 15:25:07 UTC.

The deployed change makes stalled service-worker activation retryable, keeps mobile controls at 16 CSS px, supports keyboard return to the top of long project lists, and matches browser theme hints to the visible setting. The [update fault test](update-guards.md) exercised a dropped activation message and one successful retry. Chrome and WebKit repeated [the mobile navigation and theme checks](keyboard-and-controls.md) against the published application. Field P75 remains unavailable. PageSpeed Insights reported that it could not resolve this URL on 2026-11-23 while an independent request to the same public URL returned HTTP 200.

## November 23 WebKit select release

[Pages run 45200603284](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45200603284) published application commit `955b8ad`, displayed build `v0.1.0 · 2026-11-23T15:02:20.861Z`. It adds the WebKit select sizing fix to the previous tested application. All 34 tests, lint, type checking and production build passed. The dependency audit reported zero known advisories. Both the workflow and a separate local comparison verified all ten public files. Inspection of 128 tracked files and the retained artifact found no copy of the configured developer key.

[Windows Chrome and Edge](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45200839657) both reopened this exact build and draft offline in a managed installed window. Public WebKit exported a 640 × 618 board, recovered its six-line caption, and switched languages at 390 and 430 px with a measured 44 px selector and no horizontal overflow. Chromium at verified 200% browser zoom retained a usable composer with equal document and viewport widths (720 CSS px). The [WebKit evidence](webkit-compatibility/README.md) includes the storage diagnosis, backup round trip and mobile screenshots. The real image and rollback observations below identify the specific earlier builds they exercised.

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
| Edge on macOS | PASS (hosted macOS 15, managed installation) | A fresh ordinary tab and separate installed standalone window recovered the live build and draft offline. Consumer installation and native launcher coverage remain open. [Platform evidence](compatibility.md#macos-installed-edge). |
| Chrome on Android | PARTIAL (Android 15 emulator) | [Browser keyboard, system rotation and offline fresh-tab recovery](compatibility.md). [Native launcher shortcut reopened the app offline in standalone mode](compatibility.md). WebAPK registration, full Chrome restart, TalkBack and physical Android remain open. |
| Safari on physical iPhone | NOT_RUN | Browser, Home Screen, VoiceOver, safe areas, keyboard and interrupted update |
| iPadOS Safari | PARTIAL (WebKit tablet viewport only) | At 768 × 1024 and 1024 × 768 the hosted workspace retained its draft and enabled Generate without horizontal overflow. Physical iPad, keyboard and orientation events remain open. |
| Desktop Safari and Firefox | PARTIAL | Desktop Safari and Playwright Firefox ordinary/offline checks passed within [recorded limits](compatibility.md); [Windows release Firefox 160 ordinary offline reload also passed](compatibility.md) |

## Catalog

All 60 cases below are relevant to the declared product or require an explicit justified exception. NOT_RUN means the full assertion lacks a recorded execution in its stated environment. Component tests, static inspection and partial runtime observations appear in the evidence column. The initial standalone mismatch and subsequent successful installed launches are both recorded.

| Test ID | Assertion | Result | Evidence or remaining acceptance check |
|---|---|---|---|
| INS-01 | HTTPS and manifest discovery | PASS (live Chrome) | Public HTTPS manifest retrieved and the app installed from its scoped URL. |
| INS-02 | Stable manifest ID across releases | PASS (two live builds) | Both release manifests retained the same repository ID. |
| INS-03 | Valid start_url and scope | PASS (live Chrome) | The published manifest subpath matched the artifact and the installed app launched there. |
| INS-04 | 192/512 icons and maskable rendering | PARTIAL | Branded PNGs decoded at their declared dimensions. The 512 px maskable asset is fully opaque and the contrasting glyph stayed within 161 px of center, inside the 204.8 px safe zone. Chrome on Android emulator displayed the new icon in its native installation dialog. Installed crop across physical launchers remains open. [Manifest safe-zone rule](https://www.w3.org/TR/appmanifest/#icon-masks). |
| INS-05 | Standalone launch | PASS (macOS Chrome) | The subsequent installed standalone-window check supersedes the earlier tab-only result. See the public upgrade observation below. |
| INS-06 | iOS manual installation guidance | NOT_RUN | Walk through Add to Home Screen on a physical iPhone. |
| INS-07 | Unsupported install prompt fallback | PASS (Playwright Firefox 159 and WebKit 27.2) | On the published candidate, Help displayed bookmark/browser instructions without an Install button. Closing Help returned to an editable prompt. |
| INS-08 | Deep-link launch after installation | PASS (macOS Chrome CDP) | In builds `2026-11-23T15:15:45.577Z` and `2026-11-23T15:20:56.882Z`, the installed window opened `index.html?source=install-acceptance` offline. An unknown scope path displayed the recovery screen and returned to the workspace, also offline. |
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
| SW-11 | Rollback from invalid build | PASS (local replay of two released artifacts) | Corrupt candidate rejected, original files restored, existing and fresh offline clients retained or opened the good release. See shell-integrity.md. |
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
| MOB-03 | Keyboard viewport resize | PARTIAL | [Android emulator keyboard reduced the visual viewport](compatibility.md) with prompt and Generate visible, then dismissed. Physical iOS keyboard remains open. |
| MOB-04 | No unintended input focus zoom | PARTIAL | Composer and selected controls measured at least 16 CSS px in mobile WebKit emulation. Physical iOS focus and zoom outstanding. |
| MOB-05 | Portrait and landscape layout | PARTIAL | In WebKit on the public build, a tablet viewport changed from 768 × 1024 to 1024 × 768 and back without losing the draft or overflowing. On Android 15 emulator, system rotation also retained the draft without horizontal overflow. Physical-device checks remain open. |
| MOB-06 | Smart top bar scroll direction | PASS (Chrome/WebKit viewport tests) | Long library hides the mobile header on downward scroll and reveals it on upward scroll. [Results](keyboard-and-controls.md). |
| MOB-07 | Scroll-to-top accessibility | PARTIAL | Keyboard activation scrolls to top, focuses the header and proceeds to navigation. Screen-reader verification outstanding. [Results](keyboard-and-controls.md). |
| MOB-08 | Light/dark system chrome | PARTIAL | Browser theme metadata and native control scheme followed the selected app theme in Chrome and WebKit. Physical system chrome remains open. |
| A11Y-01 | Keyboard-only navigation | PASS (bounded desktop Chrome journeys) | Keyboard-only validation, project creation and generation failure exercised. [Evidence](keyboard-and-controls.md). |
| A11Y-02 | Visible focus indicator | PARTIAL | 48 focus visits per theme, with visible focus and contrast measured in desktop Chrome. Review on remaining platforms. [Evidence](keyboard-and-controls.md). |
| A11Y-03 | Screen-reader landmarks and names | PARTIAL | Chrome accessibility trees expose named navigation, inspector and Help dialogs, a required prompt, named settings and a polite status region. With a workspace drawer open, Chrome exposes the named dialog and excludes the inert background. VoiceOver and TalkBack remain open. [Evidence](keyboard-and-controls.md). |
| A11Y-04 | Contrast requirements | PARTIAL | Focus contrast exceeded 6.5:1 on sampled controls in both themes. Chrome checked 36 viewport, theme and UI-state combinations with no automated axe violations. Manual and wider coverage remain open. [Evidence](keyboard-and-controls.md). |
| A11Y-05 | Touch target spacing | PARTIAL | Measured desktop Chrome viewports and corrected undersized disclosures, header buttons and key controls. Physical touch acceptance remains open. [Evidence](keyboard-and-controls.md). |
| A11Y-06 | Reduced-motion preference | PASS (Chrome preference emulation) | Reduced-motion behavior verified in Chrome. [Evidence](keyboard-and-controls.md). |
| A11Y-07 | Modal focus trapping and restoration | PASS (Chrome and WebKit drawers) | Both drawers at 390 and 768 px kept keyboard focus inside, blocked direct background focus and restored focus on Escape or backdrop click. Chrome also verified the accessibility tree. [Evidence](keyboard-and-controls.md). |
| A11Y-08 | Accessible update status announcements | PARTIAL | Chrome exposed a polite atomic status node before discovery. The same node changed on discovery and draft blocking. Spoken announcements with VoiceOver and TalkBack remain open. [Update status evidence](update-guards.md). |
| QA-01 | LCP target | LAB PASS; FIELD INSUFFICIENT_DATA | Six fresh navigations measured LCP 1260–1368 ms in the bounded lab. See performance.md. |
| QA-02 | INP target | LAB ONLY; FIELD INSUFFICIENT_DATA | Worst observed interaction event duration was 120 ms. The bounded sample does not establish field INP P75. |
| QA-03 | CLS target | LAB PASS; FIELD INSUFFICIENT_DATA | Observed CLS 0.0003–0.0004 in six fresh navigations. See performance.md. |
| QA-04 | Responsive layout without overflow | PARTIAL | No horizontal overflow on tested fresh shells at 390/768/1440. See performance.md. |
| QA-05 | CSP and XSS regression | PASS (bounded desktop Chrome checks) | Project markup displayed as literal text. CSP blocked an off-origin request. [Evidence](keyboard-and-controls.md). |
| QA-06 | No sensitive cache leakage | PASS (bounded local fixture) | [Chrome failure, storage, migration and cache observations](offline-recovery.md). |
| QA-07 | Dependency security review | PASS (2026-11-23 npm advisory snapshot) | Clean Node 24 install and full npm audit reported zero known vulnerabilities after overriding Workbox’s build-only glob dependency to 14.0.6. Lint, tests and production worker generation passed. |
| QA-08 | Recoverable runtime errors | PASS (bounded fixtures) | On the public candidate, Chrome displayed an intercepted HTTP 401, restored the prompt on reload and issued no duplicate request. Network/quota fixtures and malformed-ZIP feedback were also exercised. |
| REL-01 | Clean production deployment | PASS (first live release) | Workflow 45192152435, live HTTPS entry, nine matching artifact files. |
| REL-02 | Old-to-new build upgrade | PASS (live Chrome) | Installed A stayed on A until explicit activation, then displayed B after one navigation. |
| REL-03 | Interrupted update recovery | PASS (bounded desktop Chrome faults) | Broken download retained the old shell. Dropped activation timed out with an explicit retry, one subsequent navigation, and a retained offline draft. [Activation evidence](update-guards.md). |
| REL-04 | Rollback artifact available | PASS (live Pages) | A restore dispatch republished the exact nine files of A. A second restore republished the exact ten files of B. |
| REL-05 | Release evidence completeness | NOT_RUN | Attach per-case test IDs, source/build digests, timestamps, environment and outcomes. |
| REL-06 | Cross-browser test matrix | NOT_RUN | Complete declared device/browser matrix below. |
| REL-07 | Monitoring and alert validation | PASS (Actions operator view) | An intentional [invalid restore dispatch](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45199992786) failed at Verify rollback source; deploy was skipped. A subsequent check matched all 10 live files. End-user notification and external paging were outside this check. |
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

## Byte-buffer compatibility release

On 2026-11-23 [Pages run 45199196879](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45199196879) published commit `00559ca`, build `v0.1.0 · 2026-11-23T14:54:41.759Z`. The clean workflow ran 34 tests, lint, type checking and a production build. All 10 public files matched the retained artifact both in CI and in a separate local check. GitHub reports artifact expiry on 2027-02-21 at 14:54:14 UTC. A local check found the configured developer key in none of the 123 tracked files or ten deployed files inspected.

- Public macOS Chrome received HTTP 200 from a single explicitly submitted GPT Image 2.6 Flare request, decoded the 1024 × 1024 result and downloaded it after an offline reload.
- Public Playwright WebKit imported an image, exported a reviewed six-line board as a 640 × 618 PNG and recovered the caption after reload.
- On an isolated Chromium 159 profile, the browser zoom API confirmed 200% zoom. A 1440 px browser window produced a 720 CSS px viewport and 720 px document, with no horizontal overflow. The user could open the composer, enter text and reach the enabled Generate action.
- [Windows Chrome and Edge run 45199407605](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45199407605) verified this exact displayed build in both managed installed applications. Both reopened a saved draft in a fresh, offline standalone window.
- Physical iPhone/iPad and Android acceptance, screen-reader observations, broader accessibility coverage and representative field percentiles remain outstanding. The release decision at the top of this matrix remains HOLD.
