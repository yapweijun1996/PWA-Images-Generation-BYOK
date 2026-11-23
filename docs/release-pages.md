# Release to GitHub Pages

Select **GitHub Actions** as the repository's Pages source. Restrict the
`github-pages` deployment environment to `main`. The release operator dispatches
**Release GitHub Pages** from `main` after release approval and records the run
ID, commit, displayed build ID and Pages URL. Leave the restore field empty for
a new build. Pushing to the branch does not initiate a deployment.

Open the published URL in a fresh browser profile, verify its build ID, install
the PWA and open it again after closing it and disabling network access. Check
the manifest scope and worker registration under `/PWA-Images-Generation-BYOK/`.
Test an existing installed profile separately to confirm the update prompt,
draft protection and transition to the new build.

## Roll back

Before releasing an update, confirm the previously accepted run still has a
downloadable `site-files` artifact. Each successful release, including a restore,
keeps its deployed files as an immutable artifact for up to 90 days, subject to
repository retention policy. Record its expiry. For longer intervals, dispatch
a restore of the current accepted run **before expiry** and record the new run
ID to renew the rollback window. If the prior artifact has expired, establish
and verify a new rollback candidate before replacing the live site.

To restore, dispatch the same workflow on `main` and enter the known-good run
ID in **Successful Pages run ID to restore**. The workflow verifies the source
run, downloads the retained files with digest checking and republishes them.
No build takes place on this path. A failed preparation leaves the current site
in place. Use a new dispatch for a retry so the release receives a new artifact
namespace.

Confirm the restored build ID on the live URL, recheck offline startup, then
exercise the update prompt on an installed client. A rollback changes the
static files. Check local data written by the newer version against the older
version's schema before offering rollback to users.

The `verify-live` job downloads the retained files and compares their SHA-256 hashes with the public HTTPS responses. It retries briefly while CDN nodes update. If the comparison still fails, the workflow reports the affected path. Inspect that response, verify the expected source run and restore a known-good artifact when needed. This check reads public static files only. It sends no credentials or customer content to the site.

Releases with the IndexedDB byte-buffer fallback can read previous Blob values and OPFS references. Older releases cannot open images stored as byte buffers by newer clients. For a UI regression after this format change, publish a corrective build retaining the compatible reader. Before restoring an older static artifact, test it against a copy of a project written by the newer build and retain a current project ZIP.
