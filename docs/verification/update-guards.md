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
