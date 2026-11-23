# Shell update integrity

Chrome 158.0.8127.37 on macOS, isolated browser contexts, Playwright driving two production builds from a loopback HTTP server under the repository base path. Executed on 2026-11-23 at approximately 22:16 Singapore time.

| Build shown in UI (UTC) | SHA-256 of served sw.js |
|---|---|
| A · 2026-11-23T14:16:12.406Z | ff027992a9be221733fd44294c488de6349caab9b453718748e00d9172505a94 |
| B · 2026-11-23T14:16:19.156Z | f6def55996504b83ddf788eeff90ca4285fd8bda77e998285140ca06746c641e |

For each negative case, install A in a fresh profile, reload to establish a controlling worker, and record its cache names. Serve B's worker and files from the same origin with the single fault below, then call the registration's update method. Count faulted requests on the server so a skipped update cannot pass.

| Case | Fault and observed result |
|---|---|
| SW-03 | Served A's build-info.json during B installation. The candidate became redundant, the cache list stayed unchanged, no update button appeared, and offline reload rendered A's build ID. |
| SW-04 | Returned A's index.html to B's versioned precache request. The same rejection, retained cache, absence of prompt, and offline A reload were observed. |
| SW-10 | Closed the connection while serving B's index.html. The candidate became redundant; the original cache and offline UI survived. |
| SW-12 | With A active and network offline, navigated to an unknown repository subpath. The recovery screen linked back to the working offline workspace. Restored network with healthy B files, opened another unknown path, accepted the visible update and followed the recovery link to B. The app initiated discovery for this navigation. |

The first development attempt failed to install a valid shell because the build plugin added a second manifest revision using MD5. The final builds require a SHA-256 digest for every distinct precache URL. These observations cover local Chrome; production CDN, real-device standalone behavior and physical rollback require separate evidence.

A later run replayed the exact artifacts retained by Pages runs 45197947231 (A) and 45199196879 (B) in loopback Chrome 158. A's worker SHA-256 was `a365b2685b67aac3c9efac15b2bda26c49b90de3096985014b92bfe1cfd68921`, B's was `df9b933797ea4c0b84a97cfc670e9e964fc29c06aba50a77ff815af0912c1a1a`. A stale descriptor, an old HTML response during install and an interrupted HTML download each rejected B and preserved offline A. Restoring the original A bytes after the corrupt install left the existing profile on A, and a fresh profile installed A and reopened it offline. After a separate interrupted download, a healthy B was discovered and explicitly activated from the route-recovery screen. No corrupted candidate was published to the public origin.

## Old-tab assets across activation and rollback

On November 24 Singapore time, loopback Chrome 158 replayed the exact [archive release](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45227232851) and [preceding library release](https://github.com/yapweijun1996/PWA-Images-Generation-BYOK/actions/runs/45224109099). One tab activated the rollback while a second kept the archive UI open. Its new controller returned the rollback's build descriptor, the old shell cache disappeared, and the second tab's on-demand archive worker returned HTTP 404. The ZIP import reported an error and did not create a copy.

The corrected replay used the exact archive release as A, a local build of the library release with the corrected worker and update controls as B, and a local build of the current workspace as C. Chrome 158.0.8127.37 and Playwright WebKit 27.2 both observed these results in isolated desktop contexts.

| Build | Displayed timestamp (UTC) | Worker SHA-256 |
|---|---|---|
| A | 2026-11-23T17:24:30.594Z | `73938611a05ff50e8e637fe870d5f1c503ca556759bc25ee7678bc582f615a69` |
| B | 2026-11-23T17:49:16.295Z | `7319f0d5c0d4b957b5e4babeec23d7a9ce9a8659f224ce535c55efc8f122c3a9` |
| C | 2026-11-23T17:49:44.584Z | `8faa59a779e518b3cf13e8e6686dfac755bd22203118d17fd5df04e358a9a2ae` |

- Three separate installation faults served wrong bytes for the build descriptor, wrong bytes for a fingerprinted script and a dropped HTML connection. Each injected request reached the server, B became redundant, and an offline reload retained A.
- After healthy B activation, the passive A tab fetched A's fingerprinted archive worker offline with an exact SHA-256 match. The build descriptor still reported B. The old tab restored a synthetic ZIP through the project UI and exported the original image with the same SHA-256.
- While C waited, an offline request for a C-only script failed and B's descriptor remained available. After C activated, Cache Storage held the C and B shells, the oldest A shell was removed, and an unrelated cache survived. The passive B tab displayed the reload notice and reached C only after an explicit click. It retained the restored project selection. A component test verified that a pending draft disables this explicit reload.

The exact released `68ef70d` artifact was also rolled back in loopback Chrome to both earlier releases. The immediately preceding `86e510a` shared the same fingerprinted archive worker. Its passive newer tab restored the ZIP and exported the original image offline without reloading. Historical `95d5acd` predates predecessor retention and lacks that worker. After taking control, its passive newer tab reported the import error. The reload notice led to `95d5acd` with the browser offline. After that explicit reload, the same ZIP restored and its PNG matched the original digest. Test each planned historical rollback target against the currently deployed build.
