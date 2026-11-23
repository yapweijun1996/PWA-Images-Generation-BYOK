# Coding Agent Handoff

> Status: Implementation underway. This handoff records the project contracts and acceptance criteria. See [TASK.md](TASK.md) for current results.
> The module layout and interfaces below are a **proposal** for the agent to follow or improve. Where it improves on them, update the docs in the same change.

## 1. Read First (in order)

1. `README.md` — vision, studios, core features.
2. `docs/DESIGN.md` — architecture, stack, deployment, PWA profile.
3. `docs/SPEC.md` — requirements, MVP scope, non-functional requirements.
4. `docs/UIUX.md` — design system and **Visual Anchor V1** (`docs/ui/anchors/anchor-v1-desktop.webp`).
5. `docs/TASK.md` — the task list this handoff expands.
6. `docs/ROADMAP.md` — phases and risks.

If these disagree, the order of trust is: the code and passing tests, then explicit owner decisions (marked "owner-decided" in the docs), then the docs. Do not guess a decision the owner has not made. Record it as a question instead.

## 2. Fixed Decisions (do not change without the owner)

| Area | Decision |
|------|----------|
| Product | Browser-first, local-first, BYOK AI image creation PWA with six studios on one shared engine |
| Stack | React + TypeScript + Vite |
| Hosting | GitHub Pages, deployed by a GitHub Actions workflow, served under the sub-path `/PWA-Images-Generation-BYOK/` |
| Backend | None. No accounts, no server sync, no hosted proxy |
| Storage | IndexedDB for metadata, OPFS for image files where supported |
| First provider | OpenAI |
| Studio order (Phase 2 onward) | Manga & Comics, Commercial Artwork, Interior Design, UI/UX Design, Movie & Cinematic, then Education |
| PWA profile | `STATIC_OFFLINE` under `pwa:product-standard` v1.1.0 |
| Install and browser targets | iPhone Safari Home Screen, Android Chrome, desktop Chrome and Edge. Desktop Safari and Firefox are ordinary web pages with no install guarantee |
| License | Apache-2.0 |
| UI direction | Canvas-first workspace, built toward Visual Anchor V1 |

## 3. Rules of Engagement

- **Minimal diff.** Do only what the current task needs.
- **No fake results.** Do not present mock output as working behavior. Label any mock clearly and keep it out of the production path.
- **Evidence before claims.** A task is `DONE` only with evidence: code, a passing test, or a recorded run. Say `NOT RUN` or `BLOCKED` when that is the truth.
- **Secrets.** Never commit an API key. Never log one. Never put one in an export, a cache, or telemetry.
- **No deploy, merge, or push** unless the owner says so for that action. Commit locally on a branch first.
- **Possibly billed requests are never retried automatically.** A timeout is shown to the user as uncertain.
- **UI taste gate.** Machine checks do not prove a UI is good. View real screenshots at 390x844, 768x1024, and 1440x900 before calling any screen done. Compare against the anchor. Fit and overflow metrics do not prove good composition.
- **Do not copy** the mockup's pictures or its placeholder text (model name, prices) into the product.

## 4. Proposed Module Layout

```text
src/
  app/            App shell, routing, providers, theme, update prompt
  engine/         Shared generation engine (no UI)
    providers/      ProviderAdapter interface + one folder per provider
    queue/          Generation queue and job state machine
    history/        Versions and provenance
    assets/         Asset library, reference manager
    storage/        IndexedDB schema/migrations, OPFS access, backup/import
    export/         Image and project export
    secrets/        BYOK key handling
    prompt/         Prompt builder, enhancement
  studios/        One folder per studio; configuration and tools only
    manga/  education/  movie/  commercial/  uiux/  interior/
  ui/             Shared components (workspace, canvas, composer, inspector, nav)
  pwa/            Manifest helpers, service worker, install guidance
public/           Icons, static assets
docs/             Project documents
.github/workflows/  Pages deploy workflow
```

Dependency direction: `studios` and `ui` depend on `engine`. `engine` depends on nothing in `ui` or `studios`. `engine/providers/*` are the only code that talks to a provider API.

## 5. Proposed Engine Contracts (sketch)

These are sketches. Finalize the exact types in T-104 and write them into `docs/DESIGN.md`.

```ts
interface ProviderAdapter {
  id: string;
  getCapabilities(): Promise<ProviderCapabilities>; // models, sizes, quality, reference support, masks, cost
  generate(req: GenerationRequest, signal: AbortSignal): Promise<GenerationResult>;
}

type JobStatus = 'queued' | 'running' | 'succeeded' | 'failed' | 'uncertain';
// 'uncertain' = a timeout or lost response where the provider may have billed. Never auto-retried.
```

Capabilities come from the adapter, never from hardcoded assumptions in the UI. The UI disables unsupported options and explains why.

## 6. Task Checklists (Phase 1)

Use the IDs from `docs/TASK.md`. Update the status there as you go, with evidence.

### T-101 PWA shell
- [ ] Vite + React + TypeScript project created; `base` set to `/PWA-Images-Generation-BYOK/`.
- [ ] Manifest with stable `id`, `start_url`, `scope`, 192/512 and maskable icons, all under the sub-path.
- [ ] Service worker registered with scope under the sub-path.
- [ ] `viewport-fit=cover`, safe-area insets, theme color for light and dark.
- [ ] Builds with no errors; installable in a browser; opens offline after first load.
- Evidence: build log, installability check, offline cold-start result. Test IDs INS-01 to INS-05, OFF-01.

### T-102 Update flow
- [ ] A new service worker waits and shows a visible, accessible update prompt.
- [ ] Activation is blocked while a draft is dirty or a job is running.
- [ ] Duplicate clicks are ignored; the page reloads once after activation.
- Evidence: SW-05, SW-06, SW-08, SW-09, A11Y-08 executed.

### T-103 BYOK settings
- [ ] User can enter, replace, and remove a key.
- [ ] The key is stored on this device by default (owner decision). Provide a "do not remember" option, a visible Forget Key action, and a clear warning.
- [ ] Strict CSP via meta tag, no third-party scripts (a stored key is readable by any script on the page).
- [ ] The key never appears in exports, logs, history, or any cache.
- Evidence: test that searches exports, logs, and cache contents for the key string and finds none. OFF-08, QA-06.

### T-104 Provider adapter + OpenAI
- [ ] First verify browser-direct calls to the OpenAI image API work (CORS). Record the result in `DESIGN.md`.
- [ ] If direct calls are blocked, stop and ask the owner about the user-controlled proxy. Do not build a hosted proxy.
- [ ] Adapter interface finalized and documented.
- [ ] One real image is generated end to end with a real key. A mock does not satisfy this.
- [ ] The real key comes from `OPENAI_API_KEY` in a local, git-ignored `.env` that the owner fills in. Read it only in dev and test scripts (never use a `VITE_` prefix, so it is never bundled). Never print it, commit it, or copy it into docs or logs. If it is empty, mark the real run `NOT RUN` and ask the owner.
- [ ] If browser-direct calls are blocked by CORS, stop and report the result to the owner. Do not choose a proxy design yourself.
- Evidence: recorded real run (date, model, result); no key in the record.

### T-105 Model selector
- [ ] Also add the basic cost estimate (F-09): shown only where pricing is known, labelled as an estimate.
- [ ] Options come from `getCapabilities()`.
- [ ] Unsupported options are disabled with a plain explanation.

### T-106 Text-to-Image and queue
- [ ] Job state machine implemented, including `uncertain`.
- [ ] Job survives a reload (durable).
- [ ] On failure the prompt and references are kept.
- [ ] No automatic retry of a possibly billed request.

### T-107 References and Image-to-Image
- [ ] Upload and manage reference images.
- [ ] A reference measurably affects the request and is stored with the job.

### T-108 Local storage
- [ ] IndexedDB schema with versioned migrations; OPFS for files where supported, with a fallback.
- [ ] Quota-exceeded and eviction are handled with a clear message.
- Evidence: OFF-05, OFF-06, OFF-07.

### T-109 Version history
- [ ] Every generation and edit is a new version with prompt, model, settings, and time.
- [ ] Regenerating never overwrites an earlier version (non-destructive).

### T-110 Export
- [ ] Download an image at its real size and format.
- [ ] Project backup is a manual export file plus import from it (F-15). Data stays intact; the key is never included.
- [ ] 4K is offered only if the selected model supports it.

### T-111 Main layout
- [ ] Built as real HTML/CSS following Visual Anchor V1 and the T-114 decisions (no top studio strip, no avatar, no Complexity).
- [ ] Desktop three panels; tablet drawers; mobile bottom tabs (Home, Create, Assets, Projects) per the mobile anchor decisions in `docs/UIUX.md` 6a.
- [ ] All UI strings go through an i18n layer; English and Simplified Chinese are switchable (NF-12).
- [ ] Keyboard navigation, visible focus, reduced motion, light and dark themes.
- [ ] Taste gate passed with real screenshots at 390x844, 768x1024, 1440x900.

### T-113 GitHub Pages deploy
- [ ] Actions workflow builds and publishes to Pages.
- [ ] The installed app works from the Pages URL, including offline.
- [ ] Previous build kept for rollback (REL-04).
- Run only when the owner authorizes deployment.

### T-114 Anchor differences
- [x] Done. The owner decided all items on 2026-11-23. Follow the decision table in `docs/UIUX.md` section 1a (left navigation only, no avatar, no Complexity, model in the right inspector, basic cost estimate in Phase 1, disabled-with-reason for unsupported features, icons instead of thumbnails).

### T-112 Phase 1 release check
- [ ] Applicable P0 tests from the PWA standard executed, with evidence bound to build, environment, and timestamp.
- [ ] Gates G1 to G4 reported. `NOT_RUN` and `BLOCKED` never count as `PASS`.
- [ ] iOS claims backed by a real iPhone standalone check.

## 7. Open Questions for the Owner

- Whether a second provider (Gemini) joins Phase 1.
- Whether the user-controlled proxy is built in Phase 1 (decided by the CORS result in T-104).

## 8. Definition of Done for a Task

1. The acceptance checks above are met.
2. Evidence is recorded (test output, build log, or screenshot paths).
3. `docs/TASK.md` is updated; any design change is written into the matching doc.
4. No secret, mock, or placeholder is left in the production path.
5. Work is committed locally on a branch. Push and deploy wait for the owner.

## 9. Report Format When Finishing

Current goal, what was achieved, files changed, verification (`PASS` / `FAIL` / `NOT RUN` / `BLOCKED` per check), what remains, the next task, and the final destination of the project.

## 10. Running Codex Locally (lessons from T-101, 2026-11-23)

- Command used: `codex exec -m gpt-6.2-sol -c model_reasoning_effort=xhigh -s workspace-write -c sandbox_workspace_write.network_access=true -C <repo> -o <report> - < prompt.md`.
- In the `workspace-write` sandbox on Windows, Codex **cannot write to `.git`** (`index.lock: Permission denied`). It writes the code but cannot commit. The orchestrator must verify the result independently and make the commit.
- Codex could not start Chrome (GPU process failed), so browser install and offline checks stay `NOT RUN` and must be done separately.
- One Codex job per workspace. For a parallel batch, create one git worktree per job and give each job only its own folders.
- Never trust the Codex summary. Re-run `tsc`, `vitest`, `eslint`, and `build` and scan for secrets before committing.

## Release engineering reflection (2026-11-23)

- A successful build from an existing dependency directory missed a broken lockfile. A clean Node 24 install reproduced the failure. The Pages workflow now starts with `npm ci`, so a new runner exercises the same boundary.
- A browser tab that starts with its origin offline establishes shell recovery. To verify installed behavior, close the browser, launch the installed application and check its display mode. The initial CDP launch returned a tab. A later standalone launch passed, followed by an explicit A-to-B update on the public origin.
- One simulated successful response exercises request serialization. A real browser request plus decoded image dimensions establishes a separate result. UI-level image edit, manual acceptance, backup, restore and byte comparison then exposed the data relationships that a provider-only test cannot cover.
- Test two independent tabs against the same project. Saving a stale project object could erase another tab's new storyboard panel. Narrow transactional updates and a real two-tab check now protect that case. A complete draft includes references, mask, stage, model settings and batch count as well as prompt text.
- Validate deployed bytes against retained artifacts. A green deployment job alone says little about CDN content or offline clients. The release runbook pairs the workflow result with file hashes, an installed-client update, and a restore drill.
- A real image edit reached the requested color but changed opacity outside the mask. Comparing decoded RGBA values identified a defect that HTTP success and a thumbnail missed. A second real edit verified the local composition fix against the original.
- The Windows hosted browser rendered a narrower workspace than the requested outer window size. A hidden navigation control prevented the first install test from reaching installation. An independent-tab readback checks durable draft storage without assuming a navigation layout.

- Browser testing needs an explicit fault at each update stage. Dropping the activation message reproduced a permanently disabled update button even when a valid candidate was waiting. A bounded wait for worker control and a user-driven retry kept the old build available while preserving the saved draft.
- Inspect computed values in the built app on each target engine. In mobile WebKit, the workspace's inherited font shorthand overrode the 16px baseline. Browser layout checks now verify the actual control size and long-page navigation rather than relying on the global declaration.

- Android Chrome can accept the install request and then offer a separate system confirmation to pin a shortcut. Follow the native prompts and check the resulting window's display mode and offline storage. An accepted request alone cannot establish WebAPK registration or standalone behavior.

- A successful image edit can still leave an undesirably transparent extension. Inspect the decoded RGBA output and distinguish the provider's generated edge from the local fitting margin. Preserve the original alpha and request an opaque new edge for an opaque source.
- Version selection and image decoding are separate events. Bind the preview to the asset identity and gate approval on the decoded result and reference images. A test that holds each image load independently checks that users cannot approve during a transition.
- Edge DevTools can return a tab-container ID when launching an installed app. Verify the page with a unique in-scope launch URL, a separate window ID, standalone display and service-worker control. Keep browser assertions and temporary preference cleanup visible in the result.
- A modal drawer needs to isolate background content as well as contain Tab. Check the browser accessibility tree and try moving focus directly to a background control. Include status and update controls that can mount or change while the drawer is open.
- A fixed navigation overlay can cover text at the end of a scrollable page. Verify the last text block at maximum scroll with a hit test. For a live worker upgrade, confirm that the old worker controls the browser before dispatching the new build.
- Release observations should identify both the displayed build and the source revision. Bind the descriptor to the checked-out GitHub Actions commit and verify its bytes after deployment. Restoring a historical artifact preserves its original descriptor.
- To verify an Android launcher cold start, record the prior Chrome PID, confirm its absence, launch through Android and attach DevTools to the new process. Let the emulator radios supply the new process's offline state and independently verify a failed uncached fetch. Keep keyboard and rotation failures visible without obscuring independent cold-start results.
- Thumbnail performance depends on deferring storage reads as well as rendering. Exercise a populated library, measure active object URL bytes, and verify full-size export hashes separately. Old asset records may omit dimensions.
- Test local archives with a populated project. A ZIP may round-trip successfully while freezing the main thread or allowing duplicate clicks. Compare backup format compatibility in both directions and verify that same-tab and cross-tab updates wait for active archive work.
- Keep a second tab open when testing a service-worker update or rollback. Its older interface can request a lazy asset after the new worker takes control. Verify the asset offline against the preceding release's digest and keep any waiting release isolated until activation.
- Android can acknowledge a rotation command before returning the new lock. Poll for the expected lock with a deadline, then independently observe the browser viewport, draft and overflow. Exercise delayed readback and timeout, and retain failed rotation evidence alongside the launcher result.
- Check screen-reader output separately from the visible live-region text. Keep focus on another control, capture the reader's speech panel, and use a known polite announcement to prove that the capture works. A changed ARIA tree alone cannot show that the reader produced the announcement.
- Hold a generation response while two tabs view the same project. Check the observer before completion, then keep it open until the terminal state and original image arrive. Switch the initiating tab to another project in a separate run, and count provider requests independently of the UI.
- For an offline check in a fresh browser context, wait for the active service-worker registration, then check the document's controller before disconnecting. Reload online if needed. The first live WebKit document had an active registration and no controller. The next navigation enabled a verified offline ZIP restore. Count real provider POSTs separately when checking that offline generation is blocked.
- For interrupted work, close the submitting tab while its request and lock are still active. Verify that existing observers recover without reloading, the dependent queue stops and the request count stays at one. Exercise normal completion and observer cancellation independently.
- Exercise live job messages after navigating away from Create. TalkBack missed a completion when the canvas was hidden. The first persistent region announced its accessible name alone. Recheck the entire native caption, along with focus and the underlying job outcome, before accepting a change to the live region.
- Attribute Content Security Policy events to the action that triggered them. The Help interaction rendered and restored focus in WebKit. A controlled Playwright screenshot produced an inline style violation after a zero-event control. Compare the interaction and capture separately while retaining the site's policy.
