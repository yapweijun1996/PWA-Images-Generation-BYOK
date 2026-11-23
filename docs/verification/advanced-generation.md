# Prompt enhancement and masked image editing

Executed on 2026-11-23 at approximately 22:25–22:27 Singapore time using Chrome 158.0.8127.37 on macOS, Playwright, an isolated browser profile, and a local production preview under the repository subpath. Source `82aacd7`; displayed build `v0.1.0 · 2026-11-23T14:24:25.073Z`.

## Prompt enhancement

A completed OpenAI Responses request for an already detailed edit instruction displayed a reviewable suggestion. The original composer remained intact. An assertion expecting changed wording failed because the returned suggestion matched the original. On a separate shorthand input, the model returned a different 79-character suggestion. The composer retained the shorthand until **Use suggestion** was clicked, then contained the exact reviewed text. There were two intentional text requests for distinct inputs and one image edit in total. No uncertain response was retried.

## Masked edit

The source was a locally drawn 512 × 512 opaque blue field with a red circle in the middle. A keyboard-positioned brush marked a central circle with radius 25%. **Apply to prompt** prepared the edit. One explicit low-quality generation submitted one authenticated OpenAI Images edit request. Chrome decoded the result as 1024 × 1024. Download was blocked until the review screen showed the source and **Accept after review** was clicked. The exported PNG measured 821,729 bytes with SHA-256 `1aedf5d11b306254ab383a6503b1ba6ddae10e4749bdb18cc4cd360ca30f9779`. The ZIP included the reviewed output and its saved mask provenance. The stored mask's center alpha was 0, its corner alpha 255.

A separate local test intercepted the prepared request at the browser fetch boundary before transmission. The FormData contained one PNG source under `image[]`, a 512 × 512 PNG under `mask`, and the chosen model, prompt, quality and size. The mask was transparent in the center and opaque in the corner. This test used a fixture key and sent no provider request. The browser's network telemetry for the real call identified the endpoint and successful response but did not expose the file fields.

**Observed fidelity.** The requested yellow center was present (RGBA 254,252,2,253). The sampled background corner was nearly transparent (RGBA 0,0,255,1), whereas the source corner was opaque blue. This result verifies the review and export path and shows that unmasked pixels can change. A manual approval during this test records the UI action only.

**Privacy probes.** The transient key was absent from captured request URLs/bodies, browser console messages, rendered text, localStorage, Cache Storage responses/URLs and all decompressed backup entries in the shorthand-input and edit flow. Both provider calls used the intended Authorization header. Binary body inspection was limited by browser network telemetry. No key, trace or raw provider payload was retained in the repository.
