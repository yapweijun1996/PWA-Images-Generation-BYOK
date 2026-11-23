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
