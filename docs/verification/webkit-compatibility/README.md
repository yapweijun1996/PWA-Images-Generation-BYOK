# WebKit storage and touch-control checks

Date: 2026-11-23, macOS 27.2, Playwright WebKit 27.2 in a disposable context. This is desktop WebKit at phone-sized CSS viewports, not a physical iPhone or iOS Home Screen test. All images were locally drawn fixtures; no provider request was made.

## Reference and backup recovery

An initial local WebKit build could not import a reference. A bounded probe found `navigator.storage.getDirectory()` threw `UnknownError`; an IndexedDB string and `Uint8Array` could be stored, while a Blob write failed with `UnknownError: Error preparing Blob/File data to be stored in object store`. This observation is specific to the automation environment and does not prove the same failure on real Safari.

With the storage fallback and ArrayBuffer representation, the local `v0.1.0 · 2026-11-23T14:53:01.616Z` build successfully imported a synthetic PNG, retained it after reload, opened it from Assets, exported a project ZIP, restored it and displayed the restored asset. No UI alert appeared. Tested JS `index-Dqb72dwn.js` SHA-256: `0fb4f1939d019b3b92bdada4f0738a925faf4987e2f54cc2f6c76f43f0babf30`; `index.html` SHA-256: `39e254681c49a787b57728c9a1835118aa130b29c8a8a52f68594f11be2996df`; `sw.js` SHA-256: `78ed69e8d2a46402f0088edfc01be7b9e30a811fbdc35c49d9380387631a46c4`. The [390](create-390x844.webp) and [430](create-430x932.webp) images show populated Create with that build and two assets.

## Touch controls and screenshot review

Before the styling adjustment, WebKit measured the Language and Compare selects at 21 px tall. In the combined local test build (`v0.1.0 · 2026-11-23T14:58:58.737Z`, current storage implementation plus CSS commit `1c43247616a7c3c8a0ad96d42732c969c7da7dde`), both measured **44 px** at 390 and 430 CSS px; the document did not overflow horizontally. The select remained focusable with a visible focus indicator, and Playwright `selectOption` changed the comparison and displayed two images. Playwright keyboard input did not change the selection in the WebKit native popup; real keyboard operation and physical touch usability remain **NOT VERIFIED**. The CSS preserves native select semantics and adds a visible dropdown indicator; that fact alone is not proof of keyboard operation.

The primary agent, independent of the CSS patch author, visually reviewed [390](touch-select-390x844.webp) and [430](touch-select-430x932.webp), observing readable labels and arrows, a populated canvas and visible navigation. This is a scoped screenshot acceptance, not a complete device or accessibility gate.

A clean navigation of the combined build produced no observed console error. A CSP `style-src` error was recorded immediately after a Playwright screenshot call; the timing is consistent with the capture step, but the source of the injected inline stylesheet was not independently proven. Do not treat this as a comprehensive console audit or weaken CSP to suppress it.
