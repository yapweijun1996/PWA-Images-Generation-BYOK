# Mobile workspace verification

Production preview on loopback, Chrome 158.0.8127.37 on macOS, build `v0.1.0 · 2026-11-23T14:26:28.362Z`. Each run used an isolated browser context and a generated local 960 × 640 PNG landscape fixture. No requests were sent to an image provider.

| Viewport | Home | Populated Create |
| --- | --- | --- |
| 390 × 844 | [First-use Home](home-390.webp) | [Image and touch tools](create-390.webp) |
| 430 × 932 | [First-use Home](home-430.webp) | [Image and touch tools](create-430.webp) |
| 768 × 1024 | Tablet opens Create | [Tablet Create](create-768.webp) |
| 1440 × 900 | Desktop opens Create | [Desktop Create](create-1440.webp) |

Both phone layouts opened Home with a first-use hint, a Continue creating button and six icon-and-text studio choices in two columns. Choosing Interior Design opened Create. The test typed a prompt, imported a PNG, selected it from Assets, zoomed, fitted the image and exported the original bytes. It revisited the project from Recent projects, moved the image to Trash, then restored it. At 390 and 430 pixels, all four image buttons occupied one row and measured 74.5 × 49 and 84.5 × 49 CSS pixels respectively.

The image selection, fit, export and restore flow also passed at tablet and desktop sizes. The tablet navigation drawer dismissed with Escape. All four viewports finished without page errors or horizontal document overflow. During visual inspection, a clipped desktop Fit preview was corrected to contain the entire image. These observations cover desktop Chrome viewport emulation. Physical-device safe areas, touch keyboards and browser installation require separate checks.
