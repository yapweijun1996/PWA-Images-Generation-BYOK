# PWA-Images-Generation-BYOK

**AI Image Generation Studio — Browser-first · Local-first · BYOK**

> Status: **Planning.** This repository does not contain application code yet. This document describes the intended direction only.

## Vision

This project evolves from a Manga-focused tool into a multi-domain **AI Image Creation Platform** that supports six creative studios.

Users bring their own API key, choose a creation type, and use AI to generate, edit, manage, and export high-quality images.

## Core Principles

- **Browser-first** — runs as a Progressive Web App (PWA) in the browser; no backend required.
- **Local-first** — user data and generated images are stored on the user's own device.
- **BYOK (Bring Your Own Key)** — users supply their own AI provider API key. The key stays in the user's browser.

## Six Creative Studios

### 01 — Manga & Comics Studio
Supports American Comics, Japanese Manga / Anime, and Chinese Manhua.
Features: character design, character consistency, panel layout (storyboard), dialogue, chapters, continuous comic pages.

### 02 — Education Studio
Teaching illustrations, scientific diagrams, historical scenes, flowcharts, knowledge visualization.
Features: learning objectives, age-level grading, multilingual labels, content accuracy review.

### 03 — Movie & Cinematic Studio
Movie concept art, scene design, character styling, storyboards, posters, keyframes.
Features: camera language, shot sizes, lighting, color, character and scene continuity.

### 04 — Commercial Artwork Studio
Brand advertising, e-commerce product images, marketing banners, social media assets.
Features: brand visual guidelines, product reference images, background replacement, size variants, batch generation.

### 05 — UI/UX Design Studio
Websites, PWAs, dashboards, mobile apps, landing pages.
Features: design style exploration, page concepts, responsive mockups, design system visual references.

### 06 — Interior Design Studio
Residential, office, retail, restaurant, and showroom spaces.
Features: upload space photos, style transfer, furniture concepts, materials, lighting, and renovation plans.

## Shared Generation Engine

The six studios do not each build their own image generator. They all share one core engine.

```text
PWA Images Generation BYOK  (Six Creative Studios)
        |
        v
+-----------------------+-----------------------+
| Prompt Builder        | Reference Images      |
| Model Selector        | Generation Queue      |
| Image Editor          | Asset Library         |
+-----------------------+-----------------------+
        |
        v
Provider Adapter Layer   (OpenAI · Gemini · other supported APIs)
        |
        v
Local Asset Storage      (IndexedDB · OPFS · Export / Import)
```

- **Each studio** owns only its own workflows, templates, parameters, and editing tools.
- **The shared engine** owns API calls, generation jobs, version history, storage, and error recovery.

## Core Features

| Feature | Purpose |
|---------|---------|
| Text-to-Image | Generate images from text |
| Image-to-Image | Generate from reference images |
| Inpainting | Local edits, replace objects |
| Outpainting | Extend image borders |
| Character Lock | Keep manga characters consistent |
| Style Lock | Keep a brand or art style consistent |
| Batch Generation | Generate multiple images at once |
| Prompt Enhancement | AI automatically improves prompts |
| Version History | Keep generation history and edit versions |
| 4K Export | High-resolution output, depending on model capability |
| Cost Estimator | Estimate API cost before generating |
| Project Library | Organize images, references, and works |

## UI/UX Layout

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

- **Desktop:** three columns (studio list, canvas, settings).
- **Mobile:** the canvas is the main view; other panels open as a drawer or tabs.

## Reference Consistency

Reference Consistency is a shared capability across all six studios, not a feature of one studio. Examples:

- **Interior Design** should preserve the original positions of doors and windows.
- **Commercial Artwork** should keep the product's appearance.
- **Manga & Comics** should keep characters consistent.

AI generation cannot guarantee exact preservation. When a result cannot be guaranteed to match the reference, the app should offer **manual review** before the result is accepted.

## Roadmap

Build general image generation first, then add the specialized studios step by step.

| Phase | Name | Scope |
|-------|------|-------|
| 1 | Core | BYOK, model selection, prompt, reference images, generation, history, export |
| 2 | Studios | Six creation modes, each with its own templates |
| 3 | Advanced | Image editing, Character Lock, Style Lock, batch generation |
| 4 | Production | Cost control, offline project management, backup and restore, responsive polish |

## License

Not yet specified.
