# ROADMAP

> Status: **Planning.** No phase has started. Dates are not set.

Build general image generation first, then add the specialized studios step by step.

| Phase | Name | Scope | Status |
|-------|------|-------|--------|
| 1 | Core | BYOK, model selection, prompt, reference images, generation, history, export | Planning |
| 2 | Studios | Six creation modes, each with its own templates | Planning |
| 3 | Advanced | Image editing, Character Lock, Style Lock, batch generation | Planning |
| 4 | Production | Cost control, offline project management, backup and restore, responsive polish | Planning |

## Phase 1 — Core

Goal: a user can bring a key, generate an image from text or a reference, see its history, and export it.

Delivery: the app is a PWA deployed to GitHub Pages through a GitHub Actions workflow (task T-113).

Exit gate:
- Applicable P0 tests from the PWA standard pass, with recorded evidence.
- The UI passes the taste gate at 390x844, 768x1024, and 1440x900.

## Phase 2 — Studios

Goal: six studios, each with its own templates and workflow, on the shared engine.

Depends on: Phase 1.
First studio: **Manga & Comics** (owner-decided 2026-11-23). The other five follow in an order still to be decided.

## Phase 3 — Advanced

Goal: image editing (inpainting, outpainting), Character Lock, Style Lock, batch generation.

Depends on: Phase 1. Character Lock and Style Lock feed the Reference Consistency capability used by all studios.

## Phase 4 — Production

Goal: cost control, offline project management, backup and restore, responsive polish.

Depends on: Phases 1–3. Release gates G1–G4 of the PWA standard apply before any production release.

## Risks

| Risk | Note |
|------|------|
| Reference consistency cannot be guaranteed by AI models | Manual review step is required (see SPEC RC-02). |
| Provider API differences | Isolated behind the provider adapter layer. |
| Browser storage limits | Quota and eviction recovery must be designed in Phase 1. |
| GitHub Pages limits | Static only, no custom headers (CSP via meta tag), sub-path hosting, CDN caching. No hosted proxy. |
| iOS PWA limitations | No `beforeinstallprompt`; real-device checks needed for iOS claims. |
| UI quality | Machine checks do not prove good design; the taste gate needs real screenshots. |
