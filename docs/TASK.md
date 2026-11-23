# TASK

> Status: **Planning.** All tasks are pending. Nothing is implemented, so there is no completion evidence yet.

Status values: `PENDING`, `IN_PROGRESS`, `DONE`, `BLOCKED`. A task becomes `DONE` only with evidence (code, tests, or recorded runtime result).

## Phase 0 — Decisions needed before coding

| ID | Task | Acceptance check | Status |
|----|------|------------------|--------|
| T-001 | Choose the first provider(s) | A named provider list is written into DESIGN.md | PENDING |
| T-002 | Decide supported browsers and install targets | Matrix recorded in DESIGN.md | PENDING |
| T-003 | Decide the license | `LICENSE` file added | PENDING |
| T-004 | Decide the tech approach (plain HTML/CSS/JS or a framework) | Decision recorded in DESIGN.md | PENDING |

## Phase 1 — Core

| ID | Task | Depends on | Acceptance check | Status |
|----|------|------------|------------------|--------|
| T-101 | PWA shell: `index.html`, manifest, icons, service worker | T-004 | Installs and opens offline; manifest check passes | PENDING |
| T-102 | Update flow: visible user-controlled prompt | T-101 | Test SW-05, SW-06, SW-08 specs executed | PENDING |
| T-103 | BYOK settings: enter, store, remove key | T-101 | Key stays in browser; not in cache or export | PENDING |
| T-104 | Provider adapter interface + first adapter | T-001 | One image is generated end to end with a real key | PENDING |
| T-105 | Model selector | T-104 | Options reflect model capabilities | PENDING |
| T-106 | Text-to-Image flow with generation queue | T-104 | Job survives reload; failure shows a recoverable error | PENDING |
| T-107 | Reference images and Image-to-Image | T-106 | Reference image changes the result | PENDING |
| T-108 | Local storage: IndexedDB schema and migration | T-101 | OFF-06 spec executed | PENDING |
| T-109 | Version history | T-108 | Each generation is kept with prompt, params, model | PENDING |
| T-110 | Export | T-109 | Image downloads; 4K only if the model supports it | PENDING |
| T-111 | Main layout (desktop three columns, mobile canvas-first) | T-101 | Taste gate passed at 390x844, 768x1024, 1440x900 | PENDING |
| T-112 | Phase 1 release check | T-101…T-111 | PWA gates G1–G4 evidence recorded | PENDING |

## Phase 2–4

Tasks are not broken down yet. They will be split after Phase 1 is verified.

## Next executable task

**T-001**: choose the first provider(s). It unblocks T-104, the first working end-to-end generation.
