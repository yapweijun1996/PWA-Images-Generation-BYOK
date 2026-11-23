# Two-tab update guards

Local production acceptance on 2026-11-23 at 22:22 Singapore time. macOS, Chrome 158.0.8127.37 driven by Playwright, two 1440 × 900 tabs in one isolated browser context, same loopback origin and app scope. Source commit `40c9cba`. Each tab opened A, registered the worker and reloaded under its control. The server then switched to B and a registration update discovered the waiting worker. The key fields received unsaved, randomly generated test text. No credential was saved or sent to a provider.

| Build | Displayed build timestamp (UTC) | SHA-256 of sw.js |
|---|---|---|
| A | 2026-11-23T14:22:19.889Z | 155af3a76fa858cf5ec1ab2e3df4a409b0e89199017eaaa422318663ac5aa74f |
| B | 2026-11-23T14:22:27.621Z | 2aca8756028c3c4d801889dab92493073e42893a58c82bdab0c8f7d925011041 |

| Case | Result | Observed behavior |
|---|---|---|
| SW-06 | PASS | Typing in the first tab's key field disabled the update button and displayed “Save or discard your draft before updating.” The page did not navigate. Clearing the field enabled the button. |
| SW-07 | PASS | With unsaved input in the second tab, clicking Update in the first displayed “Finish or save work in other tabs, then try again.” B remained waiting, A remained visible and both navigation counts stayed zero. Clearing the second field allowed the explicit update. |
| SW-08 | PASS | A rapid mouse double-click on the enabled update button produced exactly one main-frame navigation in the requesting tab. The other tab had zero navigations. |
| SW-09 | PASS | A DOM observer recorded “Updating…” in the update status region. The requesting tab then rendered B; the second tab still displayed A. |

This run covers Chromium tabs with Web Locks support. Status-region observation establishes DOM behavior; screen-reader announcement and real-device behavior require their own checks.

## Interrupted activation and retry

On 2026-11-23, Chrome 158.0.8127.37 on macOS used a loopback origin, two isolated tabs and a persisted prompt. A fault injected before the first activation click dropped only the `SKIP_WAITING` message. With the earlier public artifacts (runs 45199196879 and 45200603284), the update control remained disabled throughout the 16.5-second observation window.

Two production builds containing the fix were served in the same harness. A (`15:13:30.249Z`, worker SHA-256 `bd9bbf53579c06fb2a0c93144af5451c7ce97727f8cb07d160596eecb7463882`) held the draft and did not navigate after the first message was dropped. After 15 seconds, it announced failure, re-enabled Update and released the Web Lock. A rapid double-click retried the request and performed exactly one navigation to B (`15:14:03.869Z`, worker SHA-256 `5bbf7e33402c8e156f2feebf889ba0d1792b396d4562c77d322830eae8e8b5b9`). The other tab did not navigate. An offline refresh loaded B and recovered the original prompt. Same-tab and cross-tab draft blocking were also rechecked against these builds. This covers interruption before takeover and explicit retry under desktop Chromium.

## Late takeover and update notice placement

On 2026-11-23, a separate two-build loopback run used Chrome 158.0.8127.37 and delayed the requested worker message by 17 seconds. The update first timed out. After the candidate took control, the status offered an explicit reload. The old page stayed open until that click, which navigated once to the new build. This passed at 1440 × 844 and 390 × 844. In both viewports the notice was visible without scrolling. On the phone viewport its bounds cleared the bottom navigation. The checked builds were `15:34:41.420Z` (worker SHA-256 `89cc59d27dc7e3aaee59008834059411eaf379f12d16947aa2624f1aa1c751df`) and `15:34:46.019Z` (worker SHA-256 `2cde493681a0a9a699d42ca9a56e4a561c1d9ea9dc8ebb560a4010241dc92f93`). A regression test also verifies that a pending draft disables the explicit reload until saved.

## Update live region

On 2026-11-23, Chrome 158.0.8127.37 inspected two production builds on a loopback origin. Before discovery, the page contained an empty update status node with polite and atomic properties in Chrome's accessibility tree. After worker discovery, a mutation observer recorded “An update is ready.” in the same node. An unsaved settings draft then disabled the update button and changed the same node to the draft-blocked message. This exercises the markup and accessibility event source. Spoken announcements remain unverified. [W3C status-message technique](https://www.w3.org/WAI/WCAG21/Techniques/aria/ARIA22).

Build A displayed `15:51:18.587Z` with worker SHA-256 `b30300b58fbafa55094b55c66ed449268754bd1e8dd5be2c9014e4a467137f2c`. The candidate displayed `15:51:27.714Z` with worker SHA-256 `289580166a37777ebbb814109187cf559d5acbc09fc8e3e2a6153a7fee436ef4`.

## Android TalkBack speech feedback

On November 24 Singapore time, an isolated ARM64 Android 16 emulator ran Chrome 133.0.6943.137 and TalkBack 16.0.0.738667889. The test replayed the retained Pages assets from `86e510a` and `68ef70d` on a loopback origin. TalkBack's **Display speech output** setting produced captions for “Help and installation” and an independent polite test message. Captions were read from the overlay below the app's update card. The browser's update card displayed “An update is ready.” while focus stayed on Help, but the phrase did not appear in the 20 sampled caption frames spanning 11.4 seconds.

A locally built structural change moved the live status outside the update card and explicitly marked it polite. The initial update message still went uncaptured when both the card and announcement changed together. After the card had settled, TalkBack captioned both a test phrase inserted into the app's existing update status and a separate test phrase inserted into a body-level status. [TalkBack developer settings](https://support.google.com/accessibility/android/answer/6006589?hl=en), [TalkBack speech overlay](https://github.com/google/talkback/blob/master/talkback/src/main/res/values/strings.xml).

With the visible card and browser focus held steady, re-sending the same “An update is ready.” message into the app's status produced no recorded caption. In the same status, “Studio update available. Choose Update and reload.” appeared in the speech overlay. This comparison isolates the phrasing in that emulator run. The setup did not capture audio playback through a physical speaker.

The corrected local production build `2026-11-23T18:31:39.221Z` kept the visual card immediate and posted a separate polite, actionable message from the persistent status region. In a real worker discovery, TalkBack captioned “Studio update available. Choose Update and reload.” without moving focus from Help. Desktop Chrome independently verified the visible card and explicit activation at 390 and 1440 CSS px. Component checks covered spoken text changes for an unsaved draft, a language switch and an explicit reload after takeover.

The exact [published `49388bd` artifact](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45239647736) repeated the result on the same emulator in a new browser origin. It discovered the retained `68ef70d` worker while focus remained on Help. A cropped frame shows the visible card above the distinct TalkBack caption. [Captured speech overlay](talkback-update.png). The crop's SHA-256 is `6dbb97f137089dc9ff6a3ab5bbb66e05462dfc6dbfa82aa3f6a9e0ba5f448553`.

## Update during project backup or restore

On November 24 Singapore time, Chrome 158.0.8127.37 ran the corrected local build `2026-11-23T17:20:00.313Z` and the previously published `95d5acd` artifact on one loopback origin. A fixture held a real export at its checksum step. The Projects controls were disabled and the current tab showed the backup-specific update message. Clicking Update in a second tab reported other-tab work, left the old build visible and kept the worker waiting. Releasing the archive produced the download. Selecting a file that was not a ZIP reported the validation error, cleared the busy state, and allowed the explicit update to finish.

A separate fixture held a real restore until after another project was selected. The busy state persisted across the project switch and the completed import added a project without replacing the user's new selection. These checks exercise user-visible states and shared Web Locks behavior on desktop Chrome. [Archive performance and compatibility](performance.md#large-project-backup-and-restore).

The two-tab update fixture repeated successfully with the exact archive release artifact from [Pages run 45227232851](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45227232851) as the active build `2026-11-23T17:24:30.594Z`. The busy Projects controls and the blocked status were visible at desktop and 390 px viewports.

## Two-tab update to the share actions release

On November 24 Singapore time, isolated desktop Chrome 158.0.8127.37, Playwright WebKit 27.2 and Playwright Firefox 157.0 replayed the exact retained `7aaefff` and `83a4e07` artifacts on loopback at the Pages subpath. The current artifact matched all 13 public files. The old release backed up a persisted prompt through the Projects UI. Both existing tabs then discovered the waiting worker and kept the old release active.

In each engine, typing into the peer tab's API key field held the update lock with an unsaved synthetic value. Update in the other tab reported work in a different tab. Both tabs remained on the old build and neither navigated. Clearing the field allowed the requesting tab to reload once into `83a4e07` with its persisted prompt. The passive tab retained its old UI and offered an explicit reload.

The harness stopped the origin and confirmed an uncached request failed. The passive tab retrieved `assets/restore-ptEZH5c9.js` with the previous release's SHA-256, `32da6ed2ade0b9265b737287d2ff8ba06e9d328b71116d3fb1c530f2e7dd45c4`. It restored a synthetic ZIP and independently exported a 2 × 2 PNG with the original SHA-256, `5e45cd1384539a7c21fb110b632bb9cb174ea48e37a388efe055d78d5f482de9`. Its next explicit reload opened `83a4e07` offline and displayed the restored prompt and image. Each tab performed one update navigation. No provider POST reached OpenAI.

With the Firefox context's offline emulation enabled, an explicit `cache: 'no-store'` diagnostic failed for both the current build descriptor and the prior archive module. The prior module still existed in Cache Storage, the controller was active and default fetches for both files returned HTTP 200. Firefox completed the UI journey with the origin stopped, both with and without context offline emulation. [Previous artifact](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45266948803), [current artifact](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45271666647).

## Storyboard caption writes during an update

On November 24 Singapore time, Chrome 158 replayed `83a4e07` and `7aaefff` on the same loopback subpath. The fixture imported a synthetic image, added a captioned panel and approved the board. After a replacement worker began waiting, editing the panel text left Update and Export enabled. A second tab held an IndexedDB write transaction on the projects store. Clicking Update blurred the caption field, then the app navigated before that delayed save completed. The reopened board contained the original approved caption.

The corrected local build `2026-11-23T22:36:36.586Z` held the draft guard from input through the IndexedDB commit. Export was unavailable during the edit and a peer tab's update attempt reported work in another tab. With the projects transaction still held, blurring the field left Update disabled. After releasing the transaction, the user updated and recovered the new caption. The saved board required a new review. A regression test also checks that a concurrent board change keeps the unsaved value available and leaves the persisted board untouched until the user resolves the conflict.
