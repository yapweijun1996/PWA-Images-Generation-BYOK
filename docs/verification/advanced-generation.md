# Prompt enhancement and masked image editing

Executed on 2026-11-23 at approximately 22:25–22:27 Singapore time using Chrome 158.0.8127.37 on macOS, Playwright, an isolated browser profile, and a local production preview under the repository subpath. Source `82aacd7`; displayed build `v0.1.0 · 2026-11-23T14:24:25.073Z`.

## Prompt enhancement

A completed OpenAI Responses request for an already detailed edit instruction displayed a reviewable suggestion. The original composer remained intact. An assertion expecting changed wording failed because the returned suggestion matched the original. On a separate shorthand input, the model returned a different 79-character suggestion. The composer retained the shorthand until **Use suggestion** was clicked, then contained the exact reviewed text. There were two intentional text requests for distinct inputs and one image edit in total. No uncertain response was retried.

## Masked edit

The source was a locally drawn 512 × 512 opaque blue field with a red circle in the middle. A keyboard-positioned brush marked a central circle with radius 25%. **Apply to prompt** prepared the edit. One explicit low-quality generation submitted one authenticated OpenAI Images edit request. Chrome decoded the result as 1024 × 1024. Download was blocked until the review screen showed the source and **Accept after review** was clicked. The exported PNG measured 821,729 bytes with SHA-256 `1aedf5d11b306254ab383a6503b1ba6ddae10e4749bdb18cc4cd360ca30f9779`. The ZIP included the reviewed output and its saved mask provenance. The stored mask's center alpha was 0, its corner alpha 255.

A separate local test intercepted the prepared request at the browser fetch boundary before transmission. The FormData contained one PNG source under `image[]`, a 512 × 512 PNG under `mask`, and the chosen model, prompt, quality and size. The mask was transparent in the center and opaque in the corner. This test used a fixture key and sent no provider request. The browser's network telemetry for the real call identified the endpoint and successful response but did not expose the file fields.

**Observed fidelity.** The requested yellow center was present (RGBA 254,252,2,253). The sampled background corner was nearly transparent (RGBA 0,0,255,1), whereas the source corner was opaque blue. This result verifies the review and export path and shows that unmasked pixels can change. A manual approval during this test records the UI action only.

**Privacy probes.** The transient key was absent from captured request URLs/bodies, browser console messages, rendered text, localStorage, Cache Storage responses/URLs and all decompressed backup entries in the shorthand-input and edit flow. Both provider calls used the intended Authorization header. Binary body inspection was limited by browser network telemetry. No key, trace or raw provider payload was retained in the repository.

## Mask preservation regression

After the real edit exposed opacity drift, the queue was changed to combine the provider output with the source using the submitted mask before saving a version. Chrome 158 compared 903,399 protected pixels in a 1024 × 1024 result to a proportionally scaled 512 × 512 reference. Every RGBA sample matched, including fully transparent and translucent patches. The editable center retained the generated yellow. In a right-edge expansion of a square source by 25%, Auto fitted the frame into a supported 1536 × 1024 output; the original remained blue, the extended right band retained generated pixels, and padding remained transparent.

A production-preview UI check used an intercepted provider response deliberately containing a transparent background. Choosing a mismatched explicit output ratio failed before any edit POST. Choosing a matching size generated a version that preserved the opaque blue corner (21,69,159,255) and used yellow in the painted center (255,255,0,255). Download remained gated by review. The exported 52,483-byte fixture PNG had SHA-256 `d3897ee7d424044366d7d67fb2fb9b5cb6d92490fdce53aeb9ea6387978482ec`. The fixture reproduces the earlier provider defect without another paid request; composition does not guarantee subject fidelity inside the editable region.

A subsequent **real provider verification** used the corrected production build `v0.1.0 · 2026-11-23T14:32:18.767Z` from implementation `d21feed`, an isolated Chrome 158 profile, the same source and centered 25% brush, and the normal workspace flow. A mismatched 1536 × 1024 selection was rejected with zero provider requests. After choosing the matching 1024 × 1024 size, the tester explicitly requested one low-quality OpenAI masked edit. All 836,219 RGBA samples more than 260 output pixels from the center exactly matched the scaled original. Within radius 250, 196,293 pixels changed. The center was yellow (253,251,2,253); the corner stayed opaque blue (21,69,159,255). Manual acceptance enabled downloading the 307,132-byte PNG, SHA-256 `7adba3bdb973201e3b10b2af8484f82a1d88332c4747f22816226a469aa752a9`. Edge-transition pixels between these radii were excluded from the fidelity counts. No provider request was retried.

### Public masked edit on the share actions release

On November 24 Singapore time, Chrome 158.0.8127.37 opened public `83a4e07`, displayed as `v0.1.0 · 2026-11-23T21:38:36.419Z`. The user flow imported a synthetic 1024 × 1024 PNG with transparent and translucent corner patches, selected Paint a region and placed a centered 25% brush using the keyboard controls. One low-quality `gpt-image-2.6-flare` edit POST went directly to OpenAI from the browser with a temporary key and returned HTTP 200.

The 1024 × 1024 result retained the original RGBA values for all 836,219 pixels outside radius 260. Inside radius 250, 196,293 pixels changed and the center became golden yellow (254, 218, 1, 254). Pixels between those radii were outside the comparison. Download was disabled until the test explicitly accepted the result after review. The 293,392-byte PNG had SHA-256 `b98fef28423740f2d60ff6182d69d82004998a59079c28049ba734d4d6265cd8`. The source fixture SHA-256 was `665c5859e3a034d29ea291af50d0e04c6cefe00c3a9d006ce46d0d07c4400f5d`.

The temporary credential was absent from inspected local and session storage. After disabling browser networking and confirming an uncached request failed, the exact public build reopened with the saved draft, accepted review and one version. Its second download matched the first PNG byte for byte. The total provider POST count stayed at one. [Published artifact](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45271666647).

## Public native UHD generation

On 2026-11-23, an isolated macOS Chrome session loaded the public GitHub Pages release built from `318ff9d`. The tester entered a temporary credential, selected 3840 × 2160 at low quality and explicitly submitted one generation. The provider returned HTTP 200. Chrome decoded the image at 3840 × 2160, reopened it after an offline reload and downloaded an 8,609,201-byte PNG whose IHDR width and height matched the selected dimensions.

## Multi-line board captions

Chrome on macOS imported a local image through the composer, added it to a board with a six-line caption, approved the board and exported a 640 × 618 PNG. Reopening the workspace retained all six caption lines. Board rows expand for the tallest caption in each row, while short captions retain the standard 560-pixel row.

## Public two-image batch

On 2026-11-23, macOS Chrome 158.0.8127.37 loaded Pages run 45210017661, source `b05ac79`, displayed build `v0.1.0 · 2026-11-23T15:52:30.039Z`. An isolated profile used a temporary key and submitted one explicit two-image batch at 1024 × 1024 and low quality. OpenAI returned two HTTP 200 responses for two authenticated POSTs. Both jobs reached Completed. The two version buttons downloaded distinct 1024 × 1024 PNGs with SHA-256 `e45d1ef4279e68fa5684d8057135e33dd3650c132c6484fda5ff6c1110608d2b` and `5bf5850b47374be7d8d598bd1b8293ae4f3c7e862f54b20ed88de5daa0deac9a`. An offline reload restored both versions and the prompt without another provider request. No key or provider response body was recorded.

## Outpainting an opaque source

Two authorized live requests to the previous public build returned HTTP 200. The first test read the older 512 × 512 source before the version preview switched, so it did not establish output fidelity. The second inspected the new 1536 × 1024 output. All 913,612 sampled pixels from the protected original matched, but only 67,902 of 196,800 sampled extension pixels had alpha above 200 despite the requested solid background.

The corrected build requests an opaque generation background only when the expanded source's original pixels are fully opaque. It leaves the provider background automatic for sources containing transparency and still composites the protected original and transparent fitting margin locally. A Chrome preview intercepted the browser's outgoing FormData before transmission and observed `background=opaque` for an opaque source and no background override for a source containing transparent pixels. Both cases sent a PNG mask and selected 1536 × 1024. Those fixtures caused zero provider traffic.

On 2026-11-24 Singapore time, a separate authorized request through corrected local production build `2026-11-23T15:59:54.113Z` returned HTTP 200. The output again preserved all 913,612 sampled original pixels and the transparent fitting margin. All 196,800 sampled extension pixels had alpha above 200. Manual review enabled export of a 328,900-byte 1536 × 1024 PNG with SHA-256 `f1d01e6107e98a06252a315beadb7bbdb9f3009efaf286cb6b409df06e53bee1`. Offline reload retained the result and prompt without another request. The real browser run measured the result; the separate intercepted fixtures checked the exact request fields. [OpenAI image background options](https://developers.openai.com/api/docs/guides/image-prompting?model=gpt-image-2.6).

### Review waits for the selected result and its references

On 2026-11-24 Singapore time, Chrome 158 tested the review flow in local production build `2026-11-23T16:03:04.640Z` using synthetic 512 × 512 input and 1024 × 1024 output. Selecting the generated version immediately removed the previous source preview. The harness held the result and reference network loads apart. Accept and Download stayed disabled with both resources held. Finishing the new result alone left Accept disabled. Finishing the reference enabled Accept, and the explicit acceptance enabled Download. The simulated provider response produced zero external image POSTs.

Chrome 158 repeated these assertions on public build `2026-11-23T16:06:51.928Z` from source `db3c6ed`. The result appeared at its expected resolution, the review action waited for the reference, and explicit acceptance enabled export. This fixture also made zero external image POSTs. [Deployed release run](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45212692403).

On the same public build, a separate low-quality outpaint made one authenticated POST (HTTP 200). The 1536 × 1024 result matched all 913,612 sampled protected RGBA pixels, all 196,800 sampled extension pixels had alpha above 200, and the fitting margin remained transparent. Download stayed disabled until manual acceptance. The downloaded 334,700-byte PNG had SHA-256 `e648ba28a41b03c538c9119e9672d5ffe8dd72dd7f27fa69c7ae55dbbe722f4a`. An offline reload recovered the saved version and prompt without another provider request.
