# SPEC

> Status: **Planning.** Requirements below are intended behavior. Nothing is implemented or verified.

Priority labels: **MUST** = required for the phase, **SHOULD** = intended, **MAY** = optional.

## 1. Core Features (shared engine)

| ID | Feature | Requirement | Phase |
|----|---------|-------------|-------|
| F-01 | BYOK | User enters their own API key. It is stored only in the browser and sent only to the chosen provider. | 1 |
| F-02 | Model Selector | User picks a provider and model. Options reflect that model's capabilities. | 1 |
| F-03 | Text-to-Image | Generate an image from a text prompt. | 1 |
| F-04 | Image-to-Image | Generate from one or more reference images. | 1 |
| F-05 | Version History | Keep every generation and edit as a version, with its prompt, parameters, and model. | 1 |
| F-06 | Export | Export images. 4K only where the model supports it. | 1 |
| F-07 | Project Library | Organize images, references, and works into projects. | 2 |
| F-08 | Prompt Enhancement | AI improves the user's prompt, shown before use. | 2 |
| F-09 | Cost Estimator | Estimate API cost before generating. | 4 |
| F-10 | Inpainting | Edit part of an image or replace an object. | 3 |
| F-11 | Outpainting | Extend the image borders. | 3 |
| F-12 | Character Lock | Keep a character consistent across images. | 3 |
| F-13 | Style Lock | Keep a brand or art style consistent. | 3 |
| F-14 | Batch Generation | Generate several images in one run. | 3 |

## 2. Reference Consistency

| ID | Requirement |
|----|-------------|
| RC-01 | Reference Consistency is a shared engine capability, available to all six studios. |
| RC-02 | When a result cannot be guaranteed to match its reference, the app MUST require manual review before the result is accepted. |
| RC-03 | Interior Design SHOULD preserve door and window positions of the uploaded space. |
| RC-04 | Commercial Artwork SHOULD preserve product appearance. |
| RC-05 | Manga & Comics SHOULD preserve character appearance. |

## 3. Studios

### 01 Manga & Comics
- Styles: American Comics, Japanese Manga / Anime, Chinese Manhua.
- Features: character design, character consistency, panel layout (storyboard), dialogue, chapters, continuous comic pages.

### 02 Education
- Content: teaching illustrations, scientific diagrams, historical scenes, flowcharts, knowledge visualization.
- Features: learning objectives, age-level grading, multilingual labels, content accuracy review.

### 03 Movie & Cinematic
- Content: concept art, scene design, character styling, storyboards, posters, keyframes.
- Features: camera language, shot sizes, lighting, color, character and scene continuity.

### 04 Commercial Artwork
- Content: brand advertising, e-commerce product images, marketing banners, social media assets.
- Features: brand visual guidelines, product reference images, background replacement, size variants, batch generation.

### 05 UI/UX Design
- Content: websites, PWAs, dashboards, mobile apps, landing pages.
- Features: design style exploration, page concepts, responsive mockups, design system visual references.

### 06 Interior Design
- Content: residential, office, retail, restaurant, and showroom spaces.
- Features: upload space photos, style transfer, furniture concepts, materials, lighting, renovation plans.

Detailed per-studio requirements are not written yet.

## 4. Non-Functional Requirements

Source: `pwa:product-standard` v1.1.0, profile `STATIC_OFFLINE`.

| ID | Requirement |
|----|-------------|
| NF-01 | Installable PWA: HTTPS, valid manifest, stable `id`, 192/512 and maskable icons. |
| NF-02 | The app shell and local library work offline. Generation requires network. |
| NF-03 | Network failure is detected from real failed requests, not only `navigator.onLine`. |
| NF-04 | A generation job is not reported as complete until the provider returns a result. Uncertain or possibly-billed requests are never retried automatically. |
| NF-05 | The API key is never cached in a shared cache and never included in exports. |
| NF-06 | Service worker updates need a visible, user-controlled prompt and must not discard drafts or running jobs. |
| NF-07 | Accessibility target: WCAG 2.2 AA (keyboard, focus, labels, contrast, reduced motion). |
| NF-08 | Core Web Vitals target at field P75: LCP <= 2.5s, INP <= 200ms, CLS <= 0.1. |
| NF-09 | Responsive: no horizontal overflow; usable at 390x844, 768x1024, and 1440x900. |
| NF-10 | Storage quota errors and cache eviction are recoverable, with a clear message to the user. |

## 5. Acceptance Criteria

The PWA standard defines 60 E2E test specifications in groups INS, SW, OFF, MOB, A11Y, QA, and REL. They are specifications only.
This project will select the applicable ones when Phase 1 starts. A test counts as passed only with recorded evidence (build, environment, runner, artifact).

The UI is accepted only after the taste gate: real screenshots at 390x844, 768x1024, and 1440x900 are viewed and scored, and no veto applies.

## 6. Out of Scope (for now)

- A backend or user accounts.
- Server-side storage of the user's images or API keys.
- Any provider not listed under supported APIs.
