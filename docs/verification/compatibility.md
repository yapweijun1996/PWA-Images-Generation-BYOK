# Desktop browser compatibility checks

Date: 2026-11-23 (Singapore). All checks used macOS 27.2 and a local production build under the `/PWA-Images-Generation-BYOK/` subpath. The repository contained uncommitted changes at build time; these observations do not establish the behavior of a clean commit or deployed Pages artifact.

## Safari 27.2

- **PASS, scoped:** the ordinary Safari tab rendered build `v0.1.0 · 2026-11-23T14:06:57.482Z`. Projects and Create navigation worked.
- The local server was stopped and `curl` confirmed connection refused. Reloading the tab rendered the same build and Projects remained accessible.
- This was a reload in an existing desktop tab. A browser-restart cold launch, browser-wide network disconnection, iPhone and Home Screen installation were not tested. Safari developer settings and permissions were not changed.

## Firefox 159.0 (Playwright build)

- The installed Firefox Nightly 160.0a1 showed a first-run Terms of Use screen; it was not accepted. The following tests instead used Playwright's separate Firefox 159.0 build and an isolated automation session, not the installed Nightly profile or a stable Firefox release.
- Initial build `v0.1.0 · 2026-11-23T14:06:57.482Z` rendered, supported Projects navigation, and reloaded after the local server stopped, with a service-worker controller. Firefox reported a CSP console error from a Zod dynamic-function capability probe. The probe was caught; this did not establish all features worked.
- After the Zod configuration fix, the later build `v0.1.0 · 2026-11-23T14:19:13.333Z` (`index.html` SHA-256 `6364990fe60adb64455bc65b0e0e36606fa055a9dd49b6193469c172a3cf8642`; script `index-C9de1mJ2.js`) loaded with no new console errors. An isolated test project was created, exported as a ZIP and imported; both the original and restored project appeared in the list. After stopping the local server and confirming connection refused, reload still displayed both projects and a service-worker controller. No console or page errors were observed during the project/backup or offline reload actions.
- This is a scoped automation check, not complete Firefox compatibility or a cross-device test.

## Other browsers and devices

Microsoft Edge and stable Firefox were not found in the standard application locations. No iPhone or Android device was identified in USB profiler output; ADB showed only an offline emulator. `xcrun devicectl` and `simctl` were unavailable. These checks cannot rule out inaccessible or wirelessly connected devices. No Android, iOS, Edge or deployed Pages checks were performed.

## Edge and stable Firefox availability follow-up

On 2026-11-23, searches of `/Applications`, `~/Applications`, the Homebrew Cask directory, the Downloads directory and Spotlight's app bundle index did not find an existing Microsoft Edge or stable Firefox application. Firefox Nightly and Playwright Firefox remain the distinct builds described above.

The [official Microsoft Edge download page](https://www.microsoft.com/en-us/edge/download) states that downloading Edge signifies agreement to the Microsoft Edge Software License Terms. No Edge package was downloaded or extracted, and no license terms were accepted; therefore the requested portable Edge, installation and offline checks remain **NOT RUN**.

No already-running Windows environment was identified: the listed Tart instances were macOS or stopped, Lima listed no instances, and checks of the UTM container and running VM processes did not reveal a Windows VM. This is a bounded local inventory, not proof that no Windows environment exists elsewhere. No VM was provisioned or started. Stable Firefox and Edge compatibility, including Edge PWA installation and offline launch, still need testing in an authorized environment.

## Windows installed Chrome and Edge

On a disposable Windows Server 2025 GitHub-hosted runner (10.0.26100), Chrome 157.0.8103.79 and Edge 157.0.4341.60 opened the published release `2026-11-23T14:41:40.454Z` with service-worker control and no reported installability errors. The test entered a draft, read it from a fresh tab, and installed the site with each browser's managed web-app policy. Windows created app-specific shortcuts using the respective Chrome and Edge launchers.

After terminating each browser, the harness blocked its profile network and verified that an uncached same-origin request failed. Both a cold browser tab and the installed app launched via its registered app ID reopened the same release and draft. In each installed window, standalone matched, browser display mode did not, and the public service worker controlled the page. Both jobs passed. The managed policy route exercises installed windows and offline data. Consumer installation dialogs and Windows client-edition desktops were outside this run. [Windows evidence run](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45197514167).

## Windows stable Firefox

[Hosted run 45198772781](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45198772781) verified the runner's preinstalled release-channel Firefox 160.0 on Windows Server 2025 with a fresh profile and a local production build from source `4d1e124`. A normal browser tab persisted the project draft in IndexedDB. An online navigation established worker control. After closing the local HTTP server and confirming the TCP connection was refused, reloading replaced the document and recovered the same build and draft. This tests ordinary browser use with the app origin offline.

## Android Chrome on an emulator

[GitHub Actions run 45205464785](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45205464785), 2026-11-23T15:29:07Z, runner Ubuntu 24.04, Android 15 Play Store emulator (`sdk_gphone64_x86_64`), Chrome 124.0.6367.219. The run loaded the public build `2026-11-23T15:25:32.252Z` from `bc9f60d`. The actual Android keyboard reduced the visual viewport while leaving the active prompt and Generate visible. Dismissing the keyboard and rotating the emulator preserved the prompt without horizontal overflow. After switching on airplane mode and disabling browser network traffic, an uncached same-origin probe failed. A fresh, worker-controlled browser tab then recovered the build and draft and showed the offline message.

The `android-browser` artifact contains the result and three screenshots. SHA-256 values are `6c353bfc06bf564f18d201997edeb2c87bcd1e77e48abec9816121dc60d8654a` (keyboard), `7554e72f6ab4831b563af3053d6a6057692027cb324f6a17330d9b2cb2816414` (landscape) and `6265d0742879d71bd53f13918b9823bf262f22fa7178a74727d6a3c91d13f406` (offline). The emulator result covers the browser tab. Chrome installation, launcher cold start, modern physical hardware and TalkBack remain separate checks.
