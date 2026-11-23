# TASK

> Status: **Planning.** All tasks are pending. Nothing is implemented, so there is no completion evidence yet.

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
| T-101 | PWA shell: Vite + React + TypeScript project, manifest, icons, service worker | T-004 | Installs and opens offline; manifest check passes | PARTIAL. Code done and independently verified 2026-11-23: `tsc --noEmit`, `vitest` (2/2), `eslint`, and `npm run build` PASS; manifest and service worker paths all under the sub-path; no secrets found. **NOT RUN:** browser install and offline cold start (INS-05, OFF-01). Do these before marking DONE. |
| T-102 | Update flow: visible user-controlled prompt | T-101 | Test SW-05, SW-06, SW-08 specs executed | PENDING |
| T-103 | BYOK settings: enter, store, remove key | T-101 | Key stays in browser; not in cache or export | PENDING |
| T-104 | Provider adapter interface + first adapter | T-001 | One image is generated end to end with a real key | PENDING |
| T-105 | Model selector | T-104 | Options reflect model capabilities | PENDING |
| T-106 | Text-to-Image flow with generation queue | T-104 | Job survives reload; failure shows a recoverable error | PENDING |
| T-107 | Reference images and Image-to-Image | T-106 | Reference image changes the result | PENDING |
| T-108 | Local storage: IndexedDB schema and migration | T-101 | OFF-06 spec executed | PENDING |
| T-109 | Version history | T-108 | Each generation is kept with prompt, params, model | PENDING |
| T-110 | Export | T-109 | Image downloads; 4K only if the model supports it | PENDING |
| T-114 | Resolve the anchor-vs-spec differences listed in UIUX.md section 1a | - | Owner decided all items on 2026-11-23; written into UIUX.md | DONE |
| T-111 | Main layout (desktop three columns, mobile canvas-first) | T-101 | Built in real HTML from Visual Anchor V1; taste gate passed at 390x844, 768x1024, 1440x900 | PENDING |
| T-113 | GitHub Pages deploy: Actions workflow, Vite `base` for the sub-path, manifest and service worker scope under the sub-path | T-101 | Workflow publishes a build; installed app opens and works offline from the Pages URL | PENDING |
| T-112 | Phase 1 release check | T-101…T-111 | PWA gates G1–G4 evidence recorded | PENDING |

## Phase 2–4

Tasks are not broken down yet. They will be split after Phase 1 is verified.

## Next executable tasks (as of 2026-11-23, end of day)

T-101 code is merged to `main` and verified (`tsc`, `vitest`, `eslint`, `build`). Still **NOT RUN**: browser install and offline cold start (INS-05, OFF-01). Do these first, on a machine where Chrome starts, before marking T-101 `DONE`.

Parallel batch to start next (disjoint folders, one git worktree and branch each):

| Batch | Tasks | Folders |
|-------|-------|---------|
| A | T-108 local storage | `src/engine/storage` |
| B | T-104 provider adapter + OpenAI, T-106 queue | `src/engine/providers`, `src/engine/queue` |
| C | T-103 BYOK key handling | `src/engine/secrets`, `src/engine/prompt` |
| D | T-111 workspace UI from the anchors | `src/ui`, `src/app` |
| E | T-102 update flow, T-113 Pages workflow (write only, no deploy) | `src/pwa`, `.github/workflows` |

Then serially: T-107, T-109, T-110, T-112.

Before T-104: the owner fills `OPENAI_API_KEY` in the local git-ignored `.env`. If it is empty, the real run is `NOT RUN`. If browser-direct calls hit CORS, stop and ask the owner.
