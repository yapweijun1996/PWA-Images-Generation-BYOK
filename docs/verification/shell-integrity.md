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
