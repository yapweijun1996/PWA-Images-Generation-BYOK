# Browser compatibility checks

The initial Safari and Firefox checks used macOS 27.2 on 2026-11-23 Singapore time and an uncommitted local production build under the `/PWA-Images-Generation-BYOK/` subpath. Later checks identify their own environment and build.

## Safari 27.2

- **PASS, scoped:** the ordinary Safari tab rendered build `v0.1.0 · 2026-11-23T14:06:57.482Z`. Projects and Create navigation worked.
- The local server was stopped and `curl` confirmed connection refused. Reloading the tab rendered the same build and Projects remained accessible.
- This was a reload in an existing desktop tab. A browser-restart cold launch, browser-wide network disconnection, iPhone and Home Screen installation were not tested. Safari developer settings and permissions were not changed.

On November 24 Singapore time, Safari 27.2 (22625.2.8.11.9) on arm64 macOS 27.2 replayed all 11 unmodified files from [Pages run 45217151933](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45217151933) at the same application subpath on loopback. The artifact had matched the public responses file by file. The HTTP server logged Safari fetching the worker and the version-keyed HTML, build descriptor, manifest, script, stylesheet and three icons. In an isolated private window, the synthetic draft survived an online reload. After the server stopped and a separate connection was refused, Safari replaced the document and displayed the same build `2026-11-23T16:30:20.736Z` and draft with Generate enabled. The scope is an ordinary private tab with the origin unavailable. Fresh launch after the private session is closed and physical iOS behavior remain open.

## Firefox 159.0 (Playwright build)

- The installed Firefox Nightly 160.0a1 showed a first-run Terms of Use screen; it was not accepted. The following tests instead used Playwright's separate Firefox 159.0 build and an isolated automation session, not the installed Nightly profile or a stable Firefox release.
- Initial build `v0.1.0 · 2026-11-23T14:06:57.482Z` rendered, supported Projects navigation, and reloaded after the local server stopped, with a service-worker controller. Firefox reported a CSP console error from a Zod dynamic-function capability probe. The probe was caught; this did not establish all features worked.
- After the Zod configuration fix, the later build `v0.1.0 · 2026-11-23T14:19:13.333Z` (`index.html` SHA-256 `6364990fe60adb64455bc65b0e0e36606fa055a9dd49b6193469c172a3cf8642`; script `index-C9de1mJ2.js`) loaded with no new console errors. An isolated test project was created, exported as a ZIP and imported; both the original and restored project appeared in the list. After stopping the local server and confirming connection refused, reload still displayed both projects and a service-worker controller. No console or page errors were observed during the project/backup or offline reload actions.
- This is a scoped automation check, not complete Firefox compatibility or a cross-device test.

## Initial local browser and device inventory

Microsoft Edge and stable Firefox were not found in the standard application locations. No iPhone or Android device was identified in USB profiler output; ADB showed only an offline emulator. `xcrun devicectl` and `simctl` were unavailable. These checks cannot rule out inaccessible or wirelessly connected devices. No Android, iOS, Edge or deployed Pages checks were performed.

## Edge and stable Firefox availability follow-up

On 2026-11-23, searches of `/Applications`, `~/Applications`, the Homebrew Cask directory, the Downloads directory and Spotlight's app bundle index did not find an existing Microsoft Edge or stable Firefox application. Firefox Nightly and Playwright Firefox remain the distinct builds described above.

The [official Microsoft Edge download page](https://www.microsoft.com/en-us/edge/download) states that downloading Edge signifies agreement to the Microsoft Edge Software License Terms. No Edge package was downloaded or extracted, and no license terms were accepted; therefore the requested portable Edge, installation and offline checks remain **NOT RUN**.

No already-running Windows environment was identified: the listed Tart instances were macOS or stopped, Lima listed no instances, and checks of the UTM container and running VM processes did not reveal a Windows VM. This is a bounded local inventory, not proof that no Windows environment exists elsewhere. No VM was provisioned or started. Stable Firefox and Edge compatibility, including Edge PWA installation and offline launch, still need testing in an authorized environment.

## macOS installed Edge

An Intel macOS 15 GitHub-hosted runner (Darwin 24.6.0) used preinstalled Microsoft Edge 151.0.4129.101 and a fresh profile. The ordinary browser opened public commit `db3c6ed`, displayed as `v0.1.0 · 2026-11-23T16:06:51.928Z`. An independent tab read the saved draft, Edge installed the app through DevTools, and the profile had a macOS app shim. After the original browser exited, a fresh process used a deliberately unreachable proxy and an uncached network probe failed. Its ordinary tab recovered the same build and draft with service-worker control.

Under the same offline conditions, DevTools launched the installed app at the in-scope URL `?source=macos-edge-install`. Its page appeared in a different window from the ordinary browser. The new window reported standalone display and a service-worker controller and recovered the same build and draft. This is a managed installation and DevTools launch on hosted macOS. The consumer install dialog and launching from Finder or Dock remain untested.

[Run 45214011839](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45214011839) captured both screenshots and all browser assertions. Its step exited after a cleanup command failed. Earlier attempts tested the ordinary offline path and showed that Edge returns a tab-container ID for the app launch. The page check identifies the app by its requested launch URL and verifies the separate window ID and display mode.

[Run 45214322845](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45214322845) repeated the browser assertions on the same build and verified removal of the temporary policy. The retained `macos-edge` artifact includes `result.json` and the offline standalone screenshot, SHA-256 `a01c035dd811e0495d61f25d1086844d694b13e9064e1b027e6b21a248115276`.

[Run 45220327329](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45220327329) passed the ordinary and installed offline checks with Edge 151.0.4129.101 on the production build `2026-11-23T16:45:21.339Z`. Its retained result directly records public source revision `7cbb891fd801be73c95a869cb7af507d77232e88` and verifies temporary policy cleanup.

## Windows installed Chrome and Edge

On a disposable Windows Server 2025 GitHub-hosted runner (10.0.26100), Chrome 157.0.8103.79 and Edge 157.0.4341.60 opened the published release `2026-11-23T14:41:40.454Z` with service-worker control and no reported installability errors. The test entered a draft, read it from a fresh tab, and installed the site with each browser's managed web-app policy. Windows created app-specific shortcuts using the respective Chrome and Edge launchers.

After terminating each browser, the harness blocked its profile network and verified that an uncached same-origin request failed. Both a cold browser tab and the installed app launched via its registered app ID reopened the same release and draft. In each installed window, standalone matched, browser display mode did not, and the public service worker controlled the page. Both jobs passed. The managed policy route exercises installed windows and offline data. Consumer installation dialogs and Windows client-edition desktops were outside this run. [Windows evidence run](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45197514167).

Windows Chrome 157.0.8103.79 and Edge 157.0.4341.60 repeated the managed-install check against `83ba3a4`, build `2026-11-23T15:39:10.092Z`. Both recovered the draft in a new standalone window after stopping the original browser and blocking network traffic. [Run 45207945582](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45207945582).

[Run 45220327400](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45220327400) repeated this check with the same browser versions and both reports recorded the exact public build `2026-11-23T16:45:21.339Z` and source revision `7cbb891fd801be73c95a869cb7af507d77232e88`. Each standalone window reopened the saved draft and remained controlled by the production scoped worker.

## Windows stable Firefox

[Hosted run 45198772781](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45198772781) verified the runner's preinstalled release-channel Firefox 160.0 on Windows Server 2025 with a fresh profile and a local production build from source `4d1e124`. A normal browser tab persisted the project draft in IndexedDB. An online navigation established worker control. After closing the local HTTP server and confirming the TCP connection was refused, reloading replaced the document and recovered the same build and draft. This tests ordinary browser use with the app origin offline.

## Android Chrome on an emulator

[GitHub Actions run 45205464785](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45205464785), 2026-11-23T15:29:07Z, runner Ubuntu 24.04, Android 15 Play Store emulator (`sdk_gphone64_x86_64`), Chrome 124.0.6367.219. The run loaded the public build `2026-11-23T15:25:32.252Z` from `bc9f60d`. The actual Android keyboard reduced the visual viewport while leaving the active prompt and Generate visible. Dismissing the keyboard and rotating the emulator preserved the prompt without horizontal overflow. After switching on airplane mode and disabling browser network traffic, an uncached same-origin probe failed. A fresh, worker-controlled browser tab then recovered the build and draft and showed the offline message.

The `android-browser` artifact contains the result and three screenshots. SHA-256 values are `6c353bfc06bf564f18d201997edeb2c87bcd1e77e48abec9816121dc60d8654a` (keyboard), `7554e72f6ab4831b563af3053d6a6057692027cb324f6a17330d9b2cb2816414` (landscape) and `6265d0742879d71bd53f13918b9823bf262f22fa7178a74727d6a3c91d13f406` (offline). The emulator result covers the browser tab. Chrome installation, launcher cold start, modern physical hardware and TalkBack remain separate checks.

### Launcher shortcut and standalone recovery

[Run 45207430801](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45207430801) used the same Android 15 emulator and Chrome 124.0.6367.219 on 2026-11-23 at 15:39 UTC. It loaded public build `2026-11-23T15:39:10.092Z` from source `83ba3a4`. The in-app installation action opened Chrome's confirmation with the new purple icon. Android then offered a second confirmation to pin the shortcut. With airplane mode enabled and browser network traffic blocked, launching from the system shortcut opened a new standalone target. Its service worker controlled the page, an uncached same-origin fetch failed, and the same build and saved draft appeared. This proves the launcher shortcut path on the emulator and leaves WebAPK registration, a full Chrome process restart and physical Android open.

[Native installation dialog](android-install/install.webp) and [offline standalone workspace](android-install/offline.webp) are resized copies. The original images are in the Actions artifact with SHA-256 `759ed100460cb9293491413ee68d09b8534cde2353d236608b21ff45abdd321b` and `61faaad064295af0ea2606187c115c1755caec153a1c885eb51228530d787089`.

### Offline launcher after full Chrome restart

[Run 45221099348](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45221099348) passed in an Android 15 Play Store emulator with Chrome 124.0.6367.219. The result records production build `2026-11-23T16:45:21.339Z` and source revision `7cbb891fd801be73c95a869cb7af507d77232e88`. Keyboard resize and dismissal, landscape draft retention and portrait return passed before installation. Chrome's dialog and Android's second confirmation pinned a launcher shortcut.

With confirmed airplane mode and Wi-Fi disabled, the original browser reopened a normal tab offline. The harness then stopped Chrome and verified that PID 2182 had exited. Tapping the system launcher shortcut started new Chrome PID 5449. The observed page opened in standalone display mode, reported offline and rejected an uncached network probe. It was controlled by the service worker and recovered the same build and draft. Attaching DevTools after launch did not emulate offline for the new process. The installed screenshot SHA-256 is `86317533cb747d39e6cb6a733a94734bdce02296c11160a14e3a1f800ca4c3d8`.

Earlier runs captured Chrome's first-run welcome, a Pixel Launcher startup overlay and a requested rotation that left the display in portrait. The successful run preserved the initial browser automation flags for the disposable profile and verified the window manager's rotation before checking the viewport. The harness reports a rotation failure independently of the cold-start checks. WebAPK registration, TalkBack and physical Android acceptance remain open. [First-run observation](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45218411486), [launcher overlay](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45219557638), [rotation observation](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45220306123).

The first run for `68ef70d` passed the software-keyboard check and then read the preceding Window Manager lock immediately after both rotation commands. The harness now waits up to 15 seconds for the reported lock before testing the actual browser viewport. A controlled check exercised delayed landscape, delayed portrait and timeout. The successful hosted rerun recorded each lock on its first read and verified landscape draft retention, portrait return, and a fresh offline tab. Android then opened a pinned launcher shortcut in standalone mode after Chrome PID 2610 exited and a new PID 5651 started. The offline screenshot SHA-256 is `35f54a7be7d7a4518465d5eb9ff745109e43e1f0e3cb9588c86fb02b5f9f54dd`. [Initial run 45232322361](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45232322361), [passing run 45232941305](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45232941305).

On November 24 Singapore time, a local ARM64 Android 16 emulator with Chrome 133.0.6943.137 checked public build `49388bd`. The initial run passed keyboard and landscape checks. It sampled the in-app Install button before it appeared and attempted browser-menu fallback while the Help dialog was still open. The failure screenshot showed the Install button. The harness now waits for the in-app offer and closes Help before using the browser menu. On rerun, Chrome accepted the installation, Android pinned a shortcut, and the device reopened the same draft offline in Chrome standalone mode after PID 20165 exited and PID 21076 started. Service-worker control, aircraft mode and a failed uncached request were independently checked. The installed screenshot SHA-256 is `94f9cc19634df018c8fa40a04c569a970bc06d5eef7a76702c40c6afe72e2062`. The emulator did not register a WebAPK.
