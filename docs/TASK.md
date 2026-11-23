# TASK

> Status: **In progress.** The rows below track implementation and acceptance evidence.

Status values: `PENDING`, `IN_PROGRESS`, `DONE`, `BLOCKED`. A task becomes `DONE` only with evidence (code, tests, or recorded runtime result).

## Phase 0 — Decisions needed before coding

| ID | Task | Acceptance check | Status |
|----|------|------------------|--------|
| T-001 | Choose the first provider(s) | OpenAI first, owner-decided 2026-11-23; recorded in DESIGN.md | DONE |
| T-002 | Decide supported browsers and install targets | iPhone Safari, Android Chrome, desktop Chrome/Edge install; desktop Safari/Firefox as web pages; recorded in DESIGN.md | DONE |
| T-003 | Decide the license | Apache-2.0; `LICENSE` file added | DONE |
| T-004 | Decide the tech approach | Decision recorded in DESIGN.md: React + TypeScript + Vite, approved by owner 2026-11-23 | DONE |

## Phase 1 — Core

| ID | Task | Depends on | Acceptance check | Status |
|----|------|------------|------------------|--------|
| T-101 | PWA shell: Vite + React + TypeScript project, manifest, icons, service worker | T-004 | Installs and opens offline; manifest check passes | PARTIAL. Chrome installed the app through CDP and reopened its cached shell after browser restart with the server stopped. Standalone display mode still needs confirmation. [Evidence](verification/t101.md). |
| T-102 | Update flow: visible user-controlled prompt | T-101 | Test SW-05, SW-06, SW-08 specs executed | Implemented. Real Chrome switched between two builds with one navigation. Draft/job guards have component coverage. Verify the final integrated UI and multiple tabs. |
| T-103 | BYOK settings: enter, store, remove key | T-101 | Key stays in browser; not in cache or export | Implemented. Remember, replace, temporary use and forget tested. Browser cache and allowlisted archive checks passed. |
| T-104 | Provider adapter interface + first adapter | T-001 | One image is generated end to end with a real key | DONE. Chrome made a browser-direct low-quality request using the production adapter and decoded a 1024 × 1024 PNG (2026-11-23). See DESIGN.md. |
| T-105 | Model selector | T-104 | Options reflect model capabilities | Implemented. Selector reads model-specific presets, quality and output price estimates from the adapter. Recheck preset changes in the release build. |
| T-106 | Text-to-Image flow with generation queue | T-104 | Job survives reload; failure shows a recoverable error | Implemented. Real production-preview UI generated and decoded a 1024 × 1024 PNG, then reopened and downloaded it after reload. Queue tests cover recovery without resending interrupted jobs. |
| T-107 | Reference images and Image-to-Image | T-106 | Reference image changes the result | Implemented; verify reference-guided editing and manual review in the final browser flow. |
| T-108 | Local storage: IndexedDB schema and migration | T-101 | OFF-06 spec executed | Engine verified. Schema migration retained existing image data. Chrome OPFS write, reopen, read and missing-file recovery passed. Quota handling tested with a simulated error; workspace recovery UX pending. |
| T-109 | Version history | T-108 | Each generation is kept with prompt, params, model | Implemented. Project-scoped history tests cover immutable prompt, settings, source assets and parent links. Browser generation survived reload. |
| T-110 | Export | T-109 | Image downloads; 4K only if the model supports it | Implemented. Native PNG download verified in Chrome. ZIP round-trip tests cover bytes, remapped lineage and secret exclusion. Full browser backup/restore still needs verification. |
| T-114 | Resolve the anchor-vs-spec differences listed in UIUX.md section 1a | - | Owner decided all items on 2026-11-23; written into UIUX.md | DONE |
| T-111 | Main layout (desktop three columns, mobile canvas-first) | T-101 | Built in real HTML from Visual Anchor V1; taste gate passed at 390x844, 768x1024, 1440x900 | In progress. Responsive workspace is integrated. Visual review, navigation fixes and localized journeys are underway. |
| T-113 | GitHub Pages deploy: Actions workflow, Vite `base` for the sub-path, manifest and service worker scope under the sub-path | T-101 | Workflow publishes a build; installed app opens and works offline from the Pages URL | Workflow and rollback runbook implemented. Local syntax and subpath build verified. Live deployment and installed-app acceptance pending. |
| T-112 | Phase 1 release check | T-101…T-111 | PWA gates G1–G4 evidence recorded | PENDING |

## Remaining delivery work

Verify reference-guided and masked image edits, studio-specific review and exports, backup restore, responsive and accessibility flows in the integrated application. Complete installed/offline device tests and the authorized Pages release before assessing the production gates. The [roadmap](ROADMAP.md) and [specification](SPEC.md) define the scope across all four phases.
