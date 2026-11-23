# DESIGN

> Status: **Planning.** No code exists yet. Everything below is a design decision or a design intent, not a description of working software.

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
| Install targets | Not yet decided |
| Supported browsers | Not yet decided |
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

This is a layout sketch for direction only. Under the taste gate, the real design must be judged from real screenshots at 390x844, 768x1024, and 1440x900 before it is accepted.

## 5. PWA Design Constraints (from `pwa:product-standard`)

- iOS-first standalone UX, `viewport-fit=cover`, and `env(safe-area-inset-*)` for chrome, dialogs, and toasts.
- Input text at least 16px to avoid focus zoom on iOS.
- Touch targets about 44x44 CSS px; no horizontal overflow.
- Opaque light and dark system chrome, and a manifest theme that matches.
- Manifest with stable `id`, `start_url`, `scope`, 192/512 icons and a maskable icon.
- A new service worker never takes over silently. The user sees an update prompt, and drafts and running generation jobs are protected.
- `beforeinstallprompt` is unavailable on iOS Safari, so iOS needs manual install guidance.

## 6. Data and Security Design

- The API key is stored only in the user's browser and sent only to the chosen provider.
- The API key and authenticated responses are never put into a shared cache or into exported files.
- Pending generation jobs are durable, so a reload does not lose them. A job is not reported as done until the provider returns a result.
- Do not blindly retry a request that may already have been billed.
- Storage quota errors and cache eviction must be recoverable.

## 7. Open Design Questions

- Which providers ship first?
- Exact storage split between IndexedDB and OPFS.
- How a character or style lock is represented (reference images, a text profile, or both).
- Which browsers and install targets are officially supported.
