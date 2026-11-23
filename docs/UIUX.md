# UI/UX Design System V1

> Status: **Draft proposal. Planning only.** Nothing is implemented. The layouts below are conceptual wireframes for structure, not final visual design.
> Under the project's UI taste gate (`ui:taste-gate-before-merge`), the real UI must be judged from real screenshots before it is accepted. This document does not replace that review.

## 1. Goal

One professional, consistent, modular interface for all six studios. The studios share navigation, Canvas, Prompt Composer, Model Settings, and Asset Library.

## 2. Design Direction: Canvas-first Creative Workspace

One workspace, not six unrelated pages.

- The Canvas is always the visual center and gets the most space.
- The Prompt Composer is fixed at the bottom, so typing and regenerating never need a page change.
- The left side holds Studio, Projects, and Assets navigation.
- The right side holds Model, Size, Quality, Reference, and other generation parameters.
- All six studios use the same base layout. Only the studio-specific tools change.
- Light and Dark themes, responsive layout, and keyboard shortcuts are supported.
- No heavy 3D, WebGL, or constant animation as ordinary decoration, to protect performance.

## 3. Desktop Layout (three panels)

```text
+--------------------------------------------------------------------+
| Images Studio  (Global Header, 56px)                               |
+------------+--------------------------------------+----------------+
| STUDIOS    |  Project / Image 01          100%    | GENERATION     |
|  Manga     |                                      |  Provider      |
|  Education |                                      |  Model         |
|  Movie     |            Canvas                    |  Ratio         |
|  Commercial|                                      |  Quality       |
|  UI/UX     |                                      |  Images        |
|  Interior  |                                      |  References    |
| LIBRARY    |                                      |                |
|  Projects  +--------------------------------------+                |
|  Assets    | Describe your image...     [Generate]|                |
|  History   |  (Bottom Composer)                   |                |
+------------+--------------------------------------+----------------+
```

| Component | Proposed size |
|-----------|---------------|
| Global Header | 56px |
| Left Navigation | 240px expanded, 64px collapsed |
| Center Canvas | Remaining width |
| Right Inspector | 320px, resizable |
| Bottom Composer | Auto height, typically 100–180px |
| Asset Tray | Collapsible, about 140px |
| Minimum comfortable desktop width | 1280px |

On small laptops the side panels collapse so the Canvas is not squeezed.

## 4. Six Studios: Shared Layout, Specialized Tools

Switching studio keeps the shared interface. What changes is the tools, presets, workflow, and data context.

| Studio | Journey | Specialized tools |
|--------|---------|-------------------|
| Manga | Story → Character → Panel → Page | Character Library, Panel Layout, Dialogue Bubbles, Page Composer |
| Education | Topic → Learning Goal → Diagram → Annotation → Review → Export | Not yet designed |
| Movie | Script → Scene → Shot List → Storyboard → Keyframes → Export | Not yet designed |
| Commercial | Brand → Product Reference → Campaign → Variants → Review → Export | Not yet designed |
| UI/UX | Requirements → Style → Layout → Responsive Variants → Review → Handoff | Not yet designed |
| Interior | Room Photo → Style → Materials → Render → Before/After → Export | Not yet designed |

The draft is saved automatically before a studio switch. Unfinished edits must never be lost by switching.

## 5. Canvas Interaction

The Canvas is the most important component. It must support generating, viewing, and editing.

| Interaction | Expected behavior |
|-------------|-------------------|
| Zoom | Mouse wheel with a shortcut key, or touch pinch |
| Pan | Space + drag, or touch drag |
| Fit to Screen | One action shows the whole image |
| Compare | Before/After and side-by-side |
| Versions | View, select, and restore earlier versions |
| Reference | Drag in or pick a reference image |
| Undo / Redo | Undo and redo local edits |
| Export | Export at the real image size and chosen format |

The Canvas uses **non-destructive editing**. Regenerating creates a new version and never overwrites the original asset.

## 6. Responsive Layout

| Breakpoint | Layout |
|------------|--------|
| Desktop, 1280px and above | Three-panel workspace |
| Tablet, 768–1279px | Canvas plus drawers |
| Mobile, below 768px | Canvas plus bottom tabs |

Mobile has four bottom tabs: **Studio, Create, Assets, Settings**. The Prompt Composer opens as a bottom sheet so it does not permanently take Canvas space.

## 7. Design Tokens

- Default theme: Dark. Neutral dark grey, a restrained indigo accent, a clear type hierarchy, and an 8px spacing system.
- Light theme uses its own semantic color values. It is not a simple inversion of Dark.
- Exact token values are not decided yet.

## 8. UI/UX Acceptance Criteria

- Navigation, Canvas, and Composer are the same across all six studios.
- Switching studio never loses a project or an unfinished draft.
- The Canvas supports zoom, pan, fit to screen, and version comparison.
- When a provider does not support a capability, the UI disables it and explains why.
- After a failed generation, the prompt and references are kept. A request that may be billed is never retried automatically.
- Desktop, tablet, and mobile can all complete the core generation flow.
- Keyboard navigation, visible focus, touch operation, and reduced motion are supported.
- Switching between Light and Dark does not change project content.

## 9. Relationship to Project Standards

- PWA behavior follows `pwa:product-standard` (safe areas, 16px inputs, touch targets about 44px, no horizontal overflow).
- Visual quality is judged by the taste gate: real screenshots at 390x844, 768x1024, and 1440x900, with no card-grid template look and one dominant idea per screen.
- Studio-specific tools for Education, Movie, Commercial, UI/UX, and Interior are still to be designed.

## 10. Open Questions

- Exact color tokens, typography, and the final visual style (needs a high-fidelity mockup reviewed on real screens).
- Layer and Mask editing scope (Phase 3).
- Keyboard shortcut map.
- Detailed mobile interaction design.
