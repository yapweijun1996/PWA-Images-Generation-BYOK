# DESIGN

> Status: The T-101 shell and shared contracts are implemented. The remaining product architecture describes planned behavior.

## 1. Design Standards Applied

Two house standards from KB-MCP govern this project.

| Standard | Version | What it means here |
|----------|---------|--------------------|
| `pwa:product-standard` | 1.1.0 | PWA rules: platform profile, iOS-first UX, service worker integrity, offline data safety, accessibility, release gates. |
| `ui:taste-gate-before-merge` | 1.2.1 | UI rules: look at real screenshots before judging, design for one dominant idea per screen, no generic card-grid template, check every changed screen at real phone size. |

Both are specifications. Neither certifies this app.

### PWA profile

The app declares profile **`STATIC_OFFLINE`** (local-first utility): user data stays on the device and the app shell works offline.
Generation itself needs the network, because it calls the user's chosen provider API.

Items the standard requires us to declare before implementation:

| Item | Decision |
|------|----------|
| Profile | `STATIC_OFFLINE` |
| Offline scope | App shell, project library, history, and exported assets work offline. Generation requires network. |
| Sensitive data | The user's API key (high), reference photos (medium, may include private rooms or faces), generated images (low). |
| Install targets | iPhone Safari (Home Screen), Android Chrome, desktop Chrome and Edge (owner-decided 2026-11-23) |
| Supported browsers | The above, plus desktop Safari and Firefox as ordinary web pages with no install guarantee. Real-device iOS standalone checks are required for iOS claims. |
| Device budget | Not yet decided |

## 2. Architecture

Six studios share one generation engine. A studio owns only its workflows, templates, parameters, and editing tools.

```text
Studios (Manga · Education · Movie · Commercial · UI/UX · Interior)
        |
        v
Shared Generation Engine
  Prompt Builder · Model Selector · Image Editor
  Reference Images · Generation Queue · Asset Library
        |
        v
Provider Adapter Layer   (OpenAI · Gemini · other supported APIs)
        |
        v
Local Asset Storage      (IndexedDB · OPFS · Export / Import)
```

Responsibility split:

| Layer | Owns |
|-------|------|
| Studio | Workflow, templates, studio-specific parameters, editing tools |
| Engine | API calls, generation jobs, version history, storage access, error recovery |
| Provider adapter | One adapter per provider; translates engine requests to provider API calls |
| Local storage | Projects, assets, history, settings |

Rules:

- A studio never calls a provider directly. It goes through the engine.
- A provider is added by writing one adapter, with no change to any studio.

### Technology stack (owner-approved 2026-11-23)

| Area | Decision |
|------|----------|
| Front end | React + TypeScript + Vite PWA |
| Studios | Six modular studio workflow configurations on top of shared services |
| Shared services | Prompt Builder, Reference Asset Manager, Model/Provider Adapter, Job Queue, Generation History, Image Editor, Export |
| Local storage | IndexedDB for metadata; OPFS for image files where supported; backup, import, and quota handling |
| API key | Stored on this device by default, with an explicit "do not remember" option and a visible Forget Key action (owner-decided 2026-11-23). Never in exports, logs, telemetry, or service-worker caches |
| Provider calls | Direct from the browser only where CORS and provider policy allow; otherwise an optional proxy that the user configures and controls |
| Provider capabilities | Discovered per provider (resolution, reference editing, masks, cost), never assumed |
| Offline | View and edit projects offline; remote generation needs a connection |
| Backend | None. No mandatory account and no automatic upload to a platform server |

### Deployment (owner decision 2026-11-23)

The project must be a PWA and is deployed to **GitHub Pages using GitHub Actions**.

| Area | Decision |
|------|----------|
| Hosting | GitHub Pages (static files only) |
| Deploy | A GitHub Actions workflow builds with Vite and publishes the build output to Pages |
| URL path | Served under a repository sub-path (`/PWA-Images-Generation-BYOK/`), so the Vite `base`, manifest `id`, `start_url`, `scope`, icon paths, and service worker scope must all use that sub-path |
| HTTPS | Provided by GitHub Pages, as the PWA standard requires |
| Server headers | GitHub Pages cannot set custom headers, so CSP is applied with a `<meta>` tag and its limits are documented |
| Backend | None. Pages cannot host a proxy, so any proxy is one the user runs and configures |
| Releases | Each deploy keeps a previous build available for rollback (PWA standard REL-04) |

Consequences:
- Service worker updates and build identity must work with Pages caching (CDN may serve a stale build, so tests SW-03 and SW-04 apply).
- Deployment happens only through the workflow, on a separate explicit authorization from the owner. Writing this document does not deploy anything.

### T-101 shell and service worker

- Vite's base, manifest identity and icon URLs, and service-worker registration scope share `/PWA-Images-Generation-BYOK/`. The manifest links to placeholder PNGs. The shell displays the package version and UTC build timestamp.
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/guide/prompt-for-update.html) uses Workbox `generateSW` and `registerType: 'prompt'`. The shell registers the worker in production. Workbox takes no immediate control of existing clients and handles `SKIP_WAITING` only when explicitly messaged. T-102 owns the visible prompt and the activation check for dirty drafts or running jobs.
- The precache contains the built shell HTML, manifest, icons, and bundled assets. The navigation fallback serves the shell entry under the base path. Runtime caching is disabled. Provider calls, keys, project data, and user images stay outside Cache Storage.

### Shared engine contracts

`src/engine/types.ts` defines the cross-module types. `ProviderCapabilities.models` describes model IDs, provider-specific size and quality choices, image limits, reference support (`maxReferenceImages: 0` means unsupported), and mask support. Size dimensions may be omitted when the provider chooses the size. Prices are optional per size and quality in the specified currency per image. An absent price means the estimate is unavailable.

`ProviderAdapter.generate(request, signal)` takes a prompt, model ID, selected settings, and optional ordered reference images and mask. The adapter receives resolved blobs and an `AbortSignal`. It returns image blobs with optional dimensions and provider request ID. A successful result requires at least one image. Queue records use asset IDs so pending requests can be recovered from local storage. `JobStatus` is `queued`, `running`, `succeeded`, `failed`, or `uncertain`. An `uncertain` request may have been billed and is never automatically retried.

Project, asset, and version records use string IDs and ISO 8601 UTC timestamps. Assets hold metadata and link to their project. Versions link a project and its output asset and can point to a parent version. A version records its creation time and captures the prompt, provider, model, applied settings, and source asset IDs. T-108 owns the persistence layout and file lookup.

### Folder ownership

| Path | Owner and surface |
|------|------------------|
| `src/app/`, `src/engine/types.ts`, `index.html`, `public/icons/`, root build and test configuration | T-101 owns the shell bootstrap and shared contracts |
| `src/pwa/` | T-102 owns `PwaControls`, the update prompt and install guidance |
| `src/engine/secrets/` | T-103 owns BYOK handling |
| `src/engine/providers/` and one child folder per provider | T-104 owns the registry and adapter implementations |
| `src/engine/queue/` | T-106 owns the generation job state machine |
| `src/engine/assets/` | T-107 owns the asset library and references |
| `src/engine/storage/` | T-108 owns IndexedDB and OPFS |
| `src/engine/history/` | T-109 owns version history and provenance |
| `src/engine/export/` | T-110 owns image and backup export |
| `src/engine/prompt/` | Prompt builder and templates |
| `src/ui/` | T-111 owns `Workspace` and shared workspace components |
| `src/studios/manga/` | Phase 2 owns Manga & Comics workflows |
| `.github/workflows/` | Reserved for T-113. Git omits this empty directory from commits. |

Use these public `index.ts` entry points across folders. Vite and Vitest resolve the TypeScript aliases from `tsconfig.json` (`@engine/*`, `@ui`, `@ui/*`, `@studios/*`, `@pwa`, and `@pwa/*`). T-102, T-103, T-104, and T-108 can develop in separate folders with the shared types in place. Coordinate shared contract changes with the T-101 owner and keep feature tests alongside their owning modules.

T-101 owns `package.json` and `package-lock.json`. Later tasks should avoid editing them and coordinate any needed dependency change. Shared dependencies include `idb` for IndexedDB, `fflate` and `zod` for archives and validation, `lucide-react` for workspace icons, and `workbox-window` for service-worker lifecycle events. The test environment includes Vitest, jsdom, Testing Library, and `fake-indexeddb`. Provider adapters can use browser `fetch`.

## 3. Reference Consistency (shared capability)

Reference Consistency applies to all six studios:

- Interior Design: keep the original positions of doors and windows.
- Commercial Artwork: keep the product's appearance.
- Manga & Comics: keep characters consistent.

AI generation cannot guarantee exact preservation. When a result cannot be guaranteed to match its reference, the app offers **manual review** before the result is accepted.

## 4. UI Layout

```text
+--------------------------------------------------------------+
| Images Studio                                  [History][Tune]|
+----------------+-----------------------------+---------------+
| Create         |                             | Settings      |
|  Manga         |        Image Canvas         |  Model        |
|  Education     |        (Preview / Edit)     |  Resolution   |
|  Movie         |                             |  Quality      |
|  Commercial    |                             |  References   |
|  UI/UX         |                             |  Generate     |
|  Interior      |                             |               |
+----------------+-----------------------------+---------------+
| Generation History · Variations · Assets                      |
+--------------------------------------------------------------+
```

- **Desktop:** three columns.
- **Mobile:** the canvas is the main view. Studio list and settings open as a drawer or tabs.

The full UI/UX Design System V1 draft is in [UIUX.md](UIUX.md). This is a layout sketch for direction only. Under the taste gate, the real design must be judged from real screenshots at 390x844, 768x1024, and 1440x900 before it is accepted.

## 5. PWA Design Constraints (from `pwa:product-standard`)

- iOS-first standalone UX, `viewport-fit=cover`, and `env(safe-area-inset-*)` for chrome, dialogs, and toasts.
- Input text at least 16px to avoid focus zoom on iOS.
- Touch targets about 44x44 CSS px; no horizontal overflow.
- Opaque light and dark system chrome, and a manifest theme that matches.
- Manifest with stable `id`, `start_url`, `scope`, 192/512 icons and a maskable icon.
- A new service worker never takes over silently. The user sees an update prompt, and drafts and running generation jobs are protected.
- `beforeinstallprompt` is unavailable on iOS Safari, so iOS needs manual install guidance.

## 6. Data and Security Design

- The API key is stored on the user's device by default and the user can opt out of remembering it. It is sent only to the chosen provider.
- Because a stored key is readable by any script running on the page, the app keeps a strict Content Security Policy (meta tag), uses no third-party scripts, and shows a clear warning about on-device key storage.
- Backup and restore: the user exports a backup file by hand and imports it later. The backup never contains the API key.
- The API key and authenticated responses are never put into a shared cache or into exported files.
- Pending generation jobs are durable, so a reload does not lose them. A job is not reported as done until the provider returns a result.
- Do not blindly retry a request that may already have been billed.
- Storage quota errors and cache eviction must be recoverable.

## 7. Open Design Questions

- Whether a second provider (Gemini) is added in Phase 1 or later. OpenAI is the first provider (owner-decided 2026-11-23); browser-direct CORS support must be verified.
- Exact record layout within IndexedDB and OPFS.
- Whether a user-controlled proxy is offered in Phase 1 or later.
- How a character or style lock is represented (reference images, a text profile, or both).
