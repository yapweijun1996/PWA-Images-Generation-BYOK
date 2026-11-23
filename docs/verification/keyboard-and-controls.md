# Keyboard, touch targets and rendering checks

Chrome 158.0.8127.37 on macOS, isolated profiles, Playwright with keyboard input, local production preview. Tested build `v0.1.0 · 2026-11-23T14:40:02.662Z`, based on `1a54675` with the touch target changes in this commit. CSS SHA-256 `c280ec1ace9b6c9eeb3f8fd2c604f9750c6b0313afb4761611476c0c5f829c1c`; application JS SHA-256 `c7bd9d246635485a4021d5bcf05b7752cf7fde9e38edfcc7d6b4b5e958d8db57`.

| Check | Observed scope and result |
|---|---|
| A11Y-01 | Using Tab, Enter, Escape and typing at 1440 × 900, the tester reached key settings, received an inline validation error for whitespace, cleared the invalid field, opened and closed Help with focus restored, created a project, entered a prompt, and submitted it without a key. The missing-key error appeared and the prompt survived. No billable request was made. |
| A11Y-02 | Tab visits on the desktop Create surface had a visible computed outline on all 48 sampled stops in each theme. The dark-mode Generate control used a 2 px outline. See the separate drawer tests in performance.md. |
| A11Y-04 | For these keyboard visits, computed contrast between the focus indicator and nearest opaque parent background had minima of 7.14:1 in dark mode and 6.51:1 in light mode. This checks focus contrast; text and icons over all possible media and interaction states remain outside the sample. |
| A11Y-05 | Before correction, disclosure rows measured 18 px high, the checkbox label 20 px, and mobile header icons shrank to 38–40 px wide. After correction the disclosure rows and checkbox label are at least 44 px high and header icon controls retain their 44 px width. The enabled controls in the measured Create/error state (17 at 390, 12 at 768, 27 at 1440 CSS px wide) all had an effective box of at least 24 × 24 px; the associated label supplied the checkbox hit area. Some larger fields and navigation buttons are 40–42 px high. The measurements do not certify every screen or input device. |
| A11Y-06 | With reduced motion enabled, visible elements on the same three viewport states had no active animation names, nonzero transition durations or smooth scrolling. Navigation and editing remained usable. |
| QA-04 | Header controls stayed inside the viewport with no document-width overflow at 320, 360, 390, 768 and 1440 CSS px in the retested Create views. |
| QA-05 | A project name containing literal bold tags and an ampersand remained ordinary text in its heading, with zero nested bold elements before and after reload. In the production page a benign fetch to a different loopback port was blocked, with an observed securitypolicyviolation event for connect-src. These checks cover the project-name rendering path and connection policy only. |

VoiceOver, physical-device touch behavior, subjective legibility, and comprehensive WCAG conformance require separate evidence.

## Help and installation dialog

On November 24 Singapore time, Chrome 158.0.8127.37 inspected live source revision `6d70d15e6d7299464b3580d551d789a45b6aebfc` at 390 and 1440 CSS px in both themes. Each Help dialog exposed its name and the Add to Home Screen instructions, opened with focus on Close, and hid the workspace landmark from the Chrome accessibility tree. Forward and reverse Tab did not focus workspace content. Escape closed the dialog and restored focus to Help in all four combinations.

Axe-core 4.14.1 reported zero WCAG 2, 2.1 or 2.2 A/AA violations and zero incomplete checks for the open dialog in those four combinations. This checks the updated instructions in desktop Chrome at two widths. Physical touch and spoken VoiceOver are tracked in the [physical-device acceptance record](physical-device.md).

The corrected `7aaefff` public release repeated the same four Chrome combinations with zero axe violations and zero incomplete checks. The named dialog opened with focus on Close, isolated the workspace during forward and reverse Tab, and restored focus on Escape.

## Generation status across workspace views

On November 24 Singapore time, a disposable Android 16 ARM64 emulator ran Chrome 133.0.6943.137 and TalkBack 16.0.0.738667889 with **Display speech output** enabled. A separate polite status message produced a TalkBack caption as a positive control. The public `8d319a6` build generated an image from one intercepted response while the tester switched to Assets. The canvas and its status were hidden. Input focus stayed on Assets, and none of the 18 caption frames over 11.9 seconds contained the completion. Returning to Create showed `Completed`.

The first local candidate mounted a status region outside the canvas. TalkBack captioned its accessible name, “Generation updates,” during the completion window. The next candidate removed the region name and retained the full, atomic message in that region. TalkBack then captioned the start and the full completion with input focus still on Assets. A separate HTTP 401 fixture captioned the failure and response code while input focus stayed on Help, with zero new versions. Each fixture intercepted one generation request. [TalkBack settings](https://support.google.com/accessibility/android/answer/6006589?hl=en), [W3C status messages](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22).

The same emulator explicitly activated the [published `c03b99f` worker](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45250691263) from `8d319a6` in one navigation. The worker controlled the new page. The English TalkBack caption showed the start with focus on Help and the full completion with focus on Assets. One intercepted response produced one new version and a decoded 16 × 16 PNG. The HTTP 401 and HTTP 500 fixtures captioned the response code and respectively reported failure and an unconfirmed result. Each observed one request, zero new versions and input focus on Help. These checks used intercepted responses and exercised Chrome as a browser tab on the emulator. [Completion caption](talkback-generation.png). Its cropped screenshot SHA-256 is `35c3b75b743a2a33b156ff8fe6bf1172d591ed81d83c08054d3dc5b9ec95842b`.

## Mobile composer and long project library

In macOS Chrome 158 and Playwright WebKit 27.2, the production-preview build `2026-11-23T15:19:00.669Z` reported at least 16 CSS px for the prompt, workflow selector, language selector and key field at tested phone widths (320, 390 and 430 px). The equivalent public WebKit baseline reported 13.12 px for the prompt and two selectors. The tested viewports had no horizontal document overflow.

At 390 × 844, a disposable project library with 115 synthetic records made the main document scroll. At one viewport down, the header hid on downward scrolling and returned on upward scrolling. Reduced motion was enabled. Keyboard activation of Back to top returned the document to zero, focused the header and allowed the navigation button to receive the next focus. Chrome reached the return control by reverse tabbing from Home. WebKit used explicit focus before keyboard activation. This does not establish the absence of Safari focus zoom on a physical iPhone or screen-reader announcements.

With the operating-system preference emulated as light at 390 × 844, the baseline kept its light/dark media hint colors while displaying the app's dark header. Chrome 158 and Playwright WebKit 27.2 verified that both hints now follow the header color, default controls use the same color scheme, and the light selection persists across reload. This check reads the document's theme metadata and computed style. Physical iOS and Android status-bar rendering remains a separate observation.

Chrome 158 inspected the current public build with axe-core at 390 and 1440 px in both themes. The only contrast rule requiring manual review pointed to selectors with a decorative CSS gradient at the right edge. The labels occupy the solid background area to the left of the arrow. The computed text and solid background pairs give 14.04:1 in dark mode and 14.81:1 in light mode. The sample covered the language selector at both widths and the workflow, model, size and quality selectors on desktop. This remains a scoped contrast check.

Chrome 158 inspected the browser accessibility tree of the live build `2026-11-23T15:39:10.092Z` at 390 and 1440 CSS px. Both views exposed the workspace landmark, branded heading, required Prompt, disabled Generate, Model, Image size and Quality names, and a modal Help dialog with a named Close button and polite status. On the narrow view the generation settings drawer also reported itself as a named modal. This captured browser accessibility metadata. Spoken announcements and mobile assistive technology remain open.

## Navigation and settings drawer isolation

On Singapore November 24, the public baseline `db3c6ed` (build `2026-11-23T16:06:51.928Z`) opened both phone and tablet drawers with focus on Close, but the background Help button could still receive scripted focus. Chrome's accessibility tree also exposed the background workspace. The reproduction covered Chrome 158.0.8127.37 and Playwright WebKit 27.2 at 390 and 768 CSS px. [WAI modal dialog pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

In the corrected production preview `2026-11-23T16:25:15.583Z`, both drawers kept Tab and Shift+Tab inside and blocked attempts to focus background Help. Escape and the visual backdrop both closed the drawer and returned focus to its opener in Chrome and WebKit. In Chrome the actual accessibility tree retained the named dialog and excluded the workspace and Help. Visual checks used WebKit at 390 and 430 px and Chrome at 768 and 1440 px.

A separate two-build Chrome fixture opened a settings drawer, triggered offline status, and later discovered a real waiting service worker while the drawer was open. The status and update control were absent from the accessibility tree with the drawer open and reachable on close. Activating the restored update control loaded the other build. This fixture exercised two local production artifacts from one loopback origin.

The text-contrast scan covered 36 Chrome viewport, theme and UI-state combinations across 390, 768 and 1440 CSS px. It included Home, enabled and empty Create, Help, the settings drawer, Projects and intercepted generation errors. axe-core 4.14.1 reported no automatic violations. Native select arrow gradients, a decorative disclosure glyph and a partially obscured footer were classified as manual review. See the solid select background measurements above. This is bounded browser and state evidence. Physical-device screen readers and wider contrast coverage remain open.

## Build label at the bottom of phone screens

Geometry and hit testing confirmed that the fixed bottom navigation covered the build label even at the maximum scroll position on Home and Create. The mobile navigation clearance now follows the footer. In Chrome 158 and WebKit 27.2 on corrected local build `2026-11-23T16:28:12.570Z`, the label was reachable at 320, 390 and 430 CSS px on both views. The complete text ended about four CSS pixels above the fixed navigation at a height of 844 px. The label also remained reachable at 768 and 1440 px on Create.

## Published browser results

[Pages run 45216625714](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45216625714) published the drawer fix in `0618424` (build `2026-11-23T16:27:28.267Z`). Chrome and WebKit verified the drawer behavior from the public URL. [Pages run 45217151933](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45217151933) published the additional footer fix in `d05d51f` (build `2026-11-23T16:30:20.736Z`). It passed 40 drawer assertions and all 16 build-label placements. The repeated contrast scan had zero automatic violations out of 36 sampled states. The manual flags on this build were the decorative select gradients and disclosure glyph.

On the public `d05d51f` URL, a worker-controlled 390 × 844 Chrome tab recovered the same build and saved draft after an offline reload. A separate loopback replay of the retained `d05d51f` and `0618424` artifacts verified the modal and update boundary again with an actual waiting worker. The live transition was missed because the deployment completed before the browser opened the older build.
