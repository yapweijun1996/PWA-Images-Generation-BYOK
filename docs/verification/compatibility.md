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
