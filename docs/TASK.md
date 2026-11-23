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
| T-101 | PWA shell: Vite + React + TypeScript project, manifest, icons, service worker | T-004 | Installs and opens offline; manifest check passes | DONE on installed macOS Chrome, including offline relaunch. Mobile coverage is tracked under T-112. |
| T-102 | Update flow: visible user-controlled prompt | T-101 | Test SW-05, SW-06, SW-08 specs executed | DONE for desktop Chrome. [Cross-tab guards](verification/update-guards.md) and [live installed update](verification/release-gates.md) verified. |
| T-103 | BYOK settings: enter, store, remove key | T-101 | Key stays in browser; not in cache or export | DONE. Remember, replace, temporary use and forget tested. Cache and backup inspected. |
| T-104 | Provider adapter interface + first adapter | T-001 | One image is generated end to end with a real key | DONE. Chrome made a browser-direct low-quality request using the production adapter and decoded a 1024 × 1024 PNG (2026-11-23). See DESIGN.md. |
| T-105 | Model selector | T-104 | Options reflect model capabilities | DONE. Model-specific presets, prices and quality selections have adapter coverage. |
| T-106 | Text-to-Image flow with generation queue | T-104 | Job survives reload; failure shows a recoverable error | DONE. Live generation, offline reopening and download passed. [Interrupted-job recovery](verification/offline-recovery.md) verified. |
| T-107 | Reference images and Image-to-Image | T-106 | Reference image changes the result | Chrome production preview verified. One real image edit preserved reference colors and positions absent from the prompt. Download unlocked after explicit review. See the release gate evidence. |
| T-108 | Local storage: IndexedDB schema and migration | T-101 | OFF-06 spec executed | DONE within the documented migration, quota and eviction fixtures. [Storage recovery](verification/offline-recovery.md). |
| T-109 | Version history | T-108 | Each generation is kept with prompt, params, model | DONE. Immutable versions retain prompt, model, settings, references and parent links. Reload and archive round trip verified. |
| T-110 | Export | T-109 | Image downloads; 4K only if the model supports it | DONE for native PNG and project ZIP export. Restored reference-guided output matched the original bytes. |
| T-114 | Resolve the anchor-vs-spec differences listed in UIUX.md section 1a | - | Owner decided all items on 2026-11-23; written into UIUX.md | DONE |
| T-111 | Main layout (desktop three columns, mobile canvas-first) | T-101 | Built in real HTML from Visual Anchor V1; taste gate passed at 390x844, 768x1024, 1440x900 | Visual assessment passed for six captured widths, 90/100. [Screenshots and limits](verification/taste-gate-candidate/README.md). Hardware and full accessibility acceptance remain in T-112. |
| T-113 | GitHub Pages deploy: Actions workflow, Vite `base` for the sub-path, manifest and service worker scope under the sub-path | T-101 | Workflow publishes a build; installed app opens and works offline from the Pages URL | DONE on GitHub Pages with installed Chrome, offline reload, explicit update, rollback and restore-forward. [Live evidence](verification/release-gates.md). |
| T-112 | Phase 1 release check | T-101…T-111 | PWA gates G1–G4 evidence recorded | IN_PROGRESS. The published artifact carries its verified source commit. Managed desktop Chrome and Edge have installed offline evidence. Physical devices, screen readers, field measurements and remaining catalog cases are tracked in the [release matrix](verification/release-gates.md). |

## Studio and production acceptance

The six studios share generation, board review and export. Character and style references, masked edits, batch generation, output price estimates and manual backup are implemented. See [advanced generation](verification/advanced-generation.md), [browser compatibility](verification/compatibility.md) and [physical-device acceptance](verification/physical-device.md). Track outstanding release assertions in T-112.
