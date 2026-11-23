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
| T-101 | PWA shell: Vite + React + TypeScript project, manifest, icons, service worker | T-004 | Installs and opens offline; manifest check passes | PENDING |
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

## Next executable task

**T-101**: scaffold the Vite + React + TypeScript PWA shell. All Phase 0 decisions (T-001 to T-004) are done.
Before T-104, verify that OpenAI image APIs can be called directly from a browser (CORS). If not, the user-controlled proxy option becomes necessary.
