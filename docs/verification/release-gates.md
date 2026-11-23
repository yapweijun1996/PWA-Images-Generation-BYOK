# Production release gates

**Decision: HOLD.** This assessment uses the STATIC_OFFLINE profile of KB-MCP `pwa:product-standard` v1.1.0 (registry body revision `80aad1538f3ecdddd7512de64cde4b8047196fb3637c075a87aab381bf314874`) and its service-worker install-integrity companion. Assessment date: 2026-11-24 Singapore time. Current hosted build: `c03b99f`. This matrix records the scope of each observation. Historical local passes do not establish release-candidate or live acceptance.

| Gate | Decision | Outstanding evidence |
|---|---|---|
| G1 Safety | HOLD | `8d319a6` recovered an interrupted four-image batch in two existing public Chrome tabs without resubmission. Earlier builds passed the queue notification, passive-tab ZIP restore and corrupt update fixtures. Remaining device and safety-matrix coverage are recorded below. |
| G2 Compatibility | HOLD | Android 16 emulator TalkBack captioned update discovery on `49388bd` and generation completion on `c03b99f`. Physical iPhone, iPad and Android, VoiceOver and remaining TalkBack journeys stay open. See the device matrix for browser coverage. |
| G3 Performance | HOLD | Six cold navigations of the current artifact met the lab thresholds with gzip enabled. On November 24, CrUX Vis returned no data for the exact URL. Field P75 is INSUFFICIENT_DATA. Targets are LCP ≤2.5 s, INP ≤200 ms and CLS ≤0.1. [Measurements](performance.md#transport-check-for-the-generation-announcement-release). |
| G4 Evidence | HOLD | The published artifact includes its verified source commit. Remaining gaps include per-case evidence across the full target matrix. The live rollback and restore-forward drill passed. |

## Current public release

[Pages run 45250691263](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45250691263) published `c03b99fa5502040a553c3569ea7ded4fb021d202`, displayed as `v0.1.0 · 2026-11-23T19:36:53.094Z`. CI and an independent check matched the full source revision and 13 files to the public release. The worker SHA-256 is `053ce758a3437836c1d51dc31ec53312982a3ee91168b9f29e15f1f8c6015ad0`. The rollback artifact expires at 19:36:27 UTC on February 21, 2027. CI passed 42 tests, lint, type checking and the production build. The configured developer credential was absent from all 141 tracked files and 13 released files.

On an Android 16 emulator, Chrome explicitly upgraded from the previous public build in one navigation under service-worker control. TalkBack captioned generation start, completion while input focus stayed on Assets, failure, and an unconfirmed result. Public desktop Chrome verified that the empty polite status region stayed mounted with no horizontal overflow at 390 and 1440 CSS px. Hosted Android 15 independently verified software keyboard, rotation, and offline launcher cold start of the same revision. [Screen-reader evidence](keyboard-and-controls.md#generation-status-across-workspace-views), [Android run 45251026542](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45251026542).

## November 24 interruption recovery release

[Pages run 45245075066](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45245075066) published `8d319a6d3b65a2681d807d94034cae1dd3844784`, displayed as `v0.1.0 · 2026-11-23T19:05:03.863Z`. Both CI and an independent check matched the full source revision and all 13 public files to the retained artifact. Worker SHA-256 is `56ee7f982697aca9eb3cefadf812f7ccab72529b2fb06e88f32f11a0d6a1a99f`. The artifact expires at 19:04:37 UTC on February 21, 2027. CI passed 41 tests, lint, type checking and the production build. A scan of 140 tracked files and all 13 released files found no copy of the configured developer key.

Public Chrome verified a four-image batch with two existing observers. After the submitting tab closed, both showed one uncertain result and three unsent items without reloading. The run intercepted one generation request and created zero versions. [Recovery evidence](offline-recovery.md#recovery-in-an-already-open-view).

Public Chrome then observed one successful real OpenAI generation forwarded through the local test process. The idle observer saw the job run and completed a 1024 × 1024 PNG download. Hosted Android 15 Chrome independently reopened the same public build and saved draft offline from a launcher shortcut after a Chrome process restart. [Generation checks](offline-recovery.md#recovery-in-an-already-open-view), [Android run 45245512256](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45245512256).

## November 24 cross-tab generation release

[Pages run 45242606194](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45242606194) published `e9c076f19975a93f83c9b663445288ce6f865998`, displayed as `v0.1.0 · 2026-11-23T18:50:52.271Z`. Both CI and an independent check matched the full source revision and all 13 public files to the retained artifact. Worker SHA-256 is `6182f889ecfc5a93b30c5a2e01a5d561a595b616f050fe820a66a9fa6e83b247`. The artifact expires at 18:50:25 UTC on February 21, 2027. CI passed 40 tests, lint, type checking and the production build. A scan of 140 tracked files and all 13 released files found no copy of the configured developer key.

Public Chrome confirmed that an already open project view received the generating state, the completed job and the original image. The same image downloaded byte for byte after going offline and reloading. WebKit and Firefox ran the two-tab flow against the exact artifact on loopback. WebKit's interrupted-request recovery produced zero versions and one total intercepted provider attempt. [Queue and recovery evidence](offline-recovery.md#concurrent-project-views-and-interruption).

## November 24 TalkBack update release

[Pages run 45239647736](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45239647736) published `49388bd0e64efe2bc480f731f1ec05ea689e5f53`, displayed as `v0.1.0 · 2026-11-23T18:33:50.324Z`. Both CI and an independent check matched the full source revision and all 13 public files to the retained artifact. Worker SHA-256 is `3de65219634c0ad6d30a5f263773b4fd47a3152190a6b10702fe6cd840ebdfbd`. The artifact expires at 18:33:25 UTC on February 21, 2027. The pipeline passed 39 tests, lint, type checking and the production build. A scan of 138 tracked files and all 13 released files found no copy of the configured developer key.

The exact retained artifact produced TalkBack's actionable update caption during real worker discovery on Android 16, with input focus still on Help. Public Chrome reopened the new build offline at a 390 CSS px viewport with the idle speech region mounted and an uncached request blocked. [Speech evidence](update-guards.md#android-talkback-speech-feedback).

An ARM64 Android 16 emulator using Chrome 133 also tested the public build with the software keyboard, rotation and a fresh offline tab. A pinned launcher shortcut reopened the draft in a new Chrome process in standalone mode. WebAPK registration and physical mobile coverage remain open. [Android acceptance evidence](compatibility.md#offline-launcher-after-full-chrome-restart).

## November 24 cross-tab asset compatibility release

[Pages run 45232034707](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45232034707) published `68ef70d32b85bfecffe62e2a3a675f4d0ac70c6a`, displayed as `v0.1.0 · 2026-11-23T17:51:20.264Z`. The full source revision and all 13 public files matched the retained artifact. The worker SHA-256 is `44eb516ad4d809eee47cff1cd815d8534dfc5f77351836048c0d8a42c6ecf160`. The artifact expires at 17:50:52 UTC on February 21, 2027. The pipeline passed 39 tests, lint, type checking and the production build. A scan of the 138 tracked files and all 13 released files found no copy of the configured developer key.

Two Chrome 158 tabs were already controlled by public `86e510a` before publication. One explicitly activated the new version while the other retained its older UI. After the browser went offline, the passive tab retrieved an older fingerprinted script with its original SHA-256, restored a ZIP and downloaded the original PNG byte for byte. The updated tab reopened the new build offline. Chrome and WebKit replayed the exact retained artifacts on loopback and repeated the successful restore and original export. Each engine also independently rejected wrong descriptor bytes, wrong fingerprinted script bytes and an interrupted HTML download. [Three-version cache and reload evidence](shell-integrity.md#old-tab-assets-across-activation-and-rollback).

Hosted Windows Chrome 157 and Edge 157 and macOS Edge 151 each recorded `68ef70d` and recovered the same saved draft in a new offline standalone window. The installed Chrome and Edge windows on Windows reported service-worker control. All three checks independently blocked an uncached request. [Windows run 45232321999](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45232321999), [macOS run 45232322248](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45232322248).

Android 15 emulator Chrome verified the current revision with the software keyboard, landscape and portrait, a fresh offline tab and a pinned launcher shortcut. After a full Chrome process restart, the shortcut reached standalone mode under service-worker control, rejected an uncached request and recovered the same draft. WebAPK registration and physical Android remain open. [Android run 45232941305](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45232941305), [compatibility evidence](compatibility.md#offline-launcher-after-full-chrome-restart).

## November 24 archive performance release

[Pages run 45227232851](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45227232851) published `86e510ab8abf0e129b7b04d4b822cd2b80d9d03f`, displayed as `v0.1.0 · 2026-11-23T17:24:30.594Z`. The full source revision and all 13 public files matched the retained artifact. The worker SHA-256 is `73938611a05ff50e8e637fe870d5f1c503ca556759bc25ee7678bc582f615a69`. The asset worker for restoration is included in the precache with its own SHA-256. The artifact expires at 17:23:59 UTC on February 21, 2027. The pipeline passed 38 tests, lint, type checking and production build. A scan of the 138 tracked files and all 13 public files found no copy of the developer credential.

The public Chrome build exported a single file after a rapid double click. In the separate 193 MB fixture, export reported no main-thread tasks at or above 50 ms, and restore retained all 48 assets and versions with a longest reported task of 76 ms. Public WebKit restored the previous release's ZIP offline and exported the selected image with its original digest. A loopback replay of the exact release blocked update activation from both tabs during backup, then completed the update after release. [Archive measurements](performance.md#large-project-backup-and-restore), [update evidence](update-guards.md#update-during-project-backup-or-restore).

## November 24 populated library release

[Pages run 45224109099](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45224109099) published `95d5acd0464684bf2542e88db7457e60a01c0fa4`, displayed as `v0.1.0 · 2026-11-23T17:07:47.117Z`. The source revision and all 11 live files matched the retained artifact. The worker SHA-256 is `f8dc96ab7ebcc41d98e242f5c05afb8a7e38e2049aebbcc3d8bd57af811057a7`. The artifact expires at 17:07:16 UTC on February 21, 2027. The workflow passed 38 tests, lint, type checking and the build. A scan of 136 tracked files and all 11 public files found no copy of the developer credential. The npm advisory audit returned zero known vulnerabilities.

The published release generates viewport-bound thumbnails for Assets and version history. A Chrome user flow with 48 seed assets and versions stayed intact across an explicit update, exact original export and an offline reload. The same mobile-width fixture measured a reduction from 383,241,808 to 4,633,789 active URL bytes at the first Assets view. WebKit separately verified the editor, selection, original export and offline browsing. [Populated library experiment](performance.md#populated-asset-library).

## November 24 source-provenance release

[Pages run 45219993424](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45219993424) published `7cbb891fd801be73c95a869cb7af507d77232e88`, displayed as `v0.1.0 · 2026-11-23T16:45:21.339Z`. The workflow checked out that SHA and recorded it as `sourceRevision` in `build-info.json`. All 37 tests, lint, type checking and the production build passed. The independent live verifier matched the full source revision and all 11 files. Worker SHA-256: `bd9930bcf0059d277e7931ffc9f7867a67e07f9d3f14f070c6f055f4ca4a0a39`. The retained artifact expires on 2027-02-21 at 16:45:04 UTC. A scan of 135 tracked files and all 11 published files found no copy of the developer credential.

For REL-02 and OFF-01, a Chrome 158 browser tab was already controlled by the published `d05d51f` worker and had a saved draft before the new release was dispatched. The old app continued reading its original descriptor after the new one was available on the network. One explicit **Update and reload** caused one navigation. The tab then read the new descriptor and recovered it and the same draft again after an offline reload. This release-specific transition exercised a browser tab. The earlier native installed transition is recorded below.

For INS-05 and OFF-01, Windows Chrome, Windows Edge and macOS Edge each recovered the same published revision and saved draft in an offline standalone window after browser restart. The hosted runs used managed installation and stored their observed revision in each result artifact. [Platform evidence](compatibility.md).

Android 15 emulator Chrome also reopened this exact revision and draft from a pinned launcher shortcut in a fresh Chrome process. The test recorded both process IDs and verified that the previous Chrome process had stopped. The new standalone page had service-worker control, reported offline and rejected an uncached probe. [Android run 45221099348](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45221099348).

For REL-05, the verifier rejects a malformed expected SHA, a missing revision when one was requested, and a different source revision. The published worker binds the descriptor digest `788b53c03a8f7cca950c8a43545488e91f1224e8fda3aa562962a79bc69152b7`. The legacy verification mode still matched all 11 files of `d05d51f` before deployment. The release workflow allows historical rollback artifacts to retain their original descriptor.

## November 24 accessibility and build label release

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
| Chrome on Android | PARTIAL (Android 15 and 16 emulators) | [Keyboard, rotation, offline fresh-tab and cold launcher recovery](compatibility.md#offline-launcher-after-full-chrome-restart) passed. Android 16 covered [TalkBack generation messages](keyboard-and-controls.md#generation-status-across-workspace-views). WebAPK registration, physical Android and remaining TalkBack journeys are open. |
| Safari on physical iPhone | NOT_RUN | Browser, Home Screen, VoiceOver, safe areas, keyboard and interrupted update |
| iPadOS Safari | PARTIAL (WebKit tablet viewport only) | At 768 × 1024 and 1024 × 768 the hosted workspace retained its draft and enabled Generate without horizontal overflow. Physical iPad, keyboard and orientation events remain open. |
| Desktop Safari | PASS (bounded origin-offline reload) | Safari 27.2 in a private tab recovered a draft after the local replay of the exact published artifact became unavailable. [Desktop observations](compatibility.md#safari-272). |
| Desktop Firefox | PASS (bounded origin-offline reload) | Playwright Firefox and Windows release Firefox 160 ordinary offline reload passed within [recorded limits](compatibility.md). |

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
| SW-07 | Multiple tabs coordinate activation | PASS (two-tab Chrome) | A waiting worker could be activated only after the shared draft or backup guard was released. [Observed checks](update-guards.md). |
| SW-08 | Duplicate Update click prevented | PASS (two-tab Chrome) | [Actual drafts, double click and update navigation](update-guards.md). |
| SW-09 | Activation loader and controllerchange | PASS (two-tab Chrome) | [Actual drafts, double click and update navigation](update-guards.md). |
| SW-10 | Offline update failure preserves old build | PASS (local Chrome, two builds) | [Build-bound integrity and recovery observations](shell-integrity.md). |
| SW-11 | Rollback from invalid build | PASS (local replay of two released artifacts) | Corrupt candidate rejected, original files restored, existing and fresh offline clients retained or opened the good release. See shell-integrity.md. |
| SW-12 | Unknown-route recovery | PASS (local Chrome, two builds) | [Build-bound integrity and recovery observations](shell-integrity.md). |
| OFF-01 | Offline shell loads | PASS (live Chrome) | After an explicit installed-client update, offline refresh retained build B in standalone mode. |
| OFF-02 | Offline network error detected | PASS (bounded local fixture) | [Chrome failure, storage, migration and cache observations](offline-recovery.md). |
| OFF-03 | Offline server transaction not falsely committed | PASS (bounded local fixture) | [Chrome failure, storage, migration and cache observations](offline-recovery.md). |
| OFF-04 | Durable pending operation recovery | PASS (bounded browser fixtures) | The current artifact recovered an uncertain job after the submitting tab closed, with the observer left open. The public Chrome batch also stopped three unsent items. Earlier fixtures covered recovery after reload. [Recovery evidence](offline-recovery.md#recovery-in-an-already-open-view). |
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
| A11Y-03 | Screen-reader landmarks and names | PARTIAL | Chrome accessibility trees expose named navigation, dialogs, a required prompt and an inert background during drawers. TalkBack 16 on Android 16 captioned Help and installation and new generation feedback. Full reading order, VoiceOver and physical Android remain open. [Keyboard and generation evidence](keyboard-and-controls.md), [Update evidence](update-guards.md#android-talkback-speech-feedback). |
| A11Y-04 | Contrast requirements | PARTIAL | Focus contrast exceeded 6.5:1 on sampled controls in both themes. Chrome checked 36 viewport, theme and UI-state combinations with no automated axe violations. Manual and wider coverage remain open. [Evidence](keyboard-and-controls.md). |
| A11Y-05 | Touch target spacing | PARTIAL | Measured desktop Chrome viewports and corrected undersized disclosures, header buttons and key controls. Physical touch acceptance remains open. [Evidence](keyboard-and-controls.md). |
| A11Y-06 | Reduced-motion preference | PASS (Chrome preference emulation) | Reduced-motion behavior verified in Chrome. [Evidence](keyboard-and-controls.md). |
| A11Y-07 | Modal focus trapping and restoration | PASS (Chrome and WebKit drawers) | Both drawers at 390 and 768 px kept keyboard focus inside, blocked direct background focus and restored focus on Escape or backdrop click. Chrome also verified the accessibility tree. [Evidence](keyboard-and-controls.md). |
| A11Y-08 | Accessible update status announcements | PARTIAL | Android TalkBack missed the earlier waiting-build message and captioned the `49388bd` artifact's instruction during actual worker discovery in loopback. Spoken VoiceOver and full TalkBack coverage remain open. [Update status evidence](update-guards.md#android-talkback-speech-feedback). |
| QA-01 | LCP target | LAB PASS; FIELD INSUFFICIENT_DATA | Six serial fresh loads of `c03b99f` measured LCP 1,420–1,464 ms with gzip. An uncompressed loopback measurement is also recorded. [Lab conditions](performance.md#transport-check-for-the-generation-announcement-release). |
| QA-02 | INP target | LAB ONLY; FIELD INSUFFICIENT_DATA | The longest observed interaction event in the serial `c03b99f` sample was 160 ms. Field P75 remains unavailable. [Measurements](performance.md#transport-check-for-the-generation-announcement-release). |
| QA-03 | CLS target | LAB PASS; FIELD INSUFFICIENT_DATA | Observed CLS was 0–0.0004 in six fresh navigations of `c03b99f` with gzip. [Measurements](performance.md#transport-check-for-the-generation-announcement-release). |
| QA-04 | Responsive layout without overflow | PARTIAL | No horizontal overflow on tested fresh shells at 390/768/1440 or at the end of the 48-image library in public WebKit at 1440 px. [Scope](performance.md). |
| QA-05 | CSP and XSS regression | PASS (bounded desktop Chrome checks) | Project markup displayed as literal text. CSP blocked an off-origin request. [Evidence](keyboard-and-controls.md). |
| QA-06 | No sensitive cache leakage | PASS (bounded local fixture) | [Chrome failure, storage, migration and cache observations](offline-recovery.md). |
| QA-07 | Dependency security review | PASS (2026-11-23 npm advisory snapshot) | Clean Node 24 install and full npm audit reported zero known vulnerabilities after overriding Workbox’s build-only glob dependency to 14.0.6. Lint, tests and production worker generation passed. |
| QA-08 | Recoverable runtime errors | PASS (bounded fixtures) | On the public candidate, Chrome displayed an intercepted HTTP 401, restored the prompt on reload and issued no duplicate request. Network/quota fixtures and malformed-ZIP feedback were also exercised. |
| REL-01 | Clean production deployment | PASS (first live release) | Workflow 45192152435, live HTTPS entry, nine matching artifact files. |
| REL-02 | Old-to-new build upgrade | PASS (live Chrome) | Installed A stayed on A until explicit activation, then displayed B after one navigation. |
| REL-03 | Interrupted update recovery | PASS (bounded desktop Chrome faults) | Broken download retained the old shell. Dropped activation timed out with an explicit retry, one subsequent navigation, and a retained offline draft. [Activation evidence](update-guards.md). |
| REL-04 | Rollback artifact available | PASS (live Pages) | A restore dispatch republished the exact nine files of A. A second restore republished the exact ten files of B. |
| REL-05 | Release evidence completeness | PARTIAL | Current public files are tied to the checked-out source SHA, with digests and scoped observations. Per-case evidence for the full catalog remains open. |
| REL-06 | Cross-browser test matrix | NOT_RUN | Complete declared device/browser matrix below. |
| REL-07 | Monitoring and alert validation | PASS (Actions operator view) | An intentional [invalid restore dispatch](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45199992786) failed at Verify rollback source; deploy was skipped. A subsequent check matched all 10 live files. End-user notification and external paging were outside this check. |
| REL-08 | No unauthorized automatic resubmission | PASS (bounded fixtures) | The current artifact kept one intercepted request across interruption and recovery in open tabs. The separate invalidation fixture on `e9c076f` produced zero requests. [Offline recovery](offline-recovery.md#concurrent-project-views-and-interruption). |

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
