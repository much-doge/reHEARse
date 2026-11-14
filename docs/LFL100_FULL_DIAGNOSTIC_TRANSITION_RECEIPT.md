# LFL-100 Full diagnostic transition

Status: deployed to PCT128; authenticated full-test journey pending

## Scope

Restore the full candidate flow for every registered diagnostic package:
Listening must finish, advance to Structure, advance to Reading, and submit a
full result with working answer review and missed-question retake controls.
Single-section assignments and existing attempts must retain their current
behavior and append-only evidence.

## Finding

The Listening server action used the literal `2_101_073` milliseconds from the
older Volume 3 Practice Test A recording in both the accepted `audio_played`
position bound and the full-audio completion check. Volume 1 Practice Test A
and the newer recordings have package-specific durations, so a valid final
position could be rejected as `listening_incomplete`. The client then remained
on Listening because the transition action never committed.

## Correction

Load `audioDurationMs` from the registered package timing manifest for both
validation points. The completion path remains server-authoritative and still
requires the complete audio sequence; it no longer depends on another
package's duration.

## Verification and deployment

- Changed-path ESLint passed.
- Repository TypeScript passed.
- Full Vitest suite: 55 files, 211 tests passed.
- Next production build passed locally.
- `git diff --check` passed.
- Source commit: `dde63e5` (`fix(test-center): restore package-specific diagnostic transitions`).
- PCT128 release tree: `/opt/rehearse/.releases/dde63e5`.
- Runtime image: `rehearse-app:dde63e5` (`sha256:de407e147a18276a34d819cf494747d30ed43dabf477a285493b7cacea4794a5`).
- Deployment was app-only (`docker compose up -d --no-deps app`); no migration,
  database write, attempt rewrite, answer change, or timer change was performed.
- Runtime checks after deployment: app healthy, PostgreSQL healthy, both restart
  counts 0, LAN `/api/health` HTTP 200, public `/api/health` HTTP 200,
  signed-out `/test-center/teaching` HTTP 307, and unauthenticated
  `/api/test-center/resources` HTTP 401.
- Application startup logs show a clean Next.js ready state. Authenticated
  candidate playback through all three sections remains the final classroom
  verification boundary.
- Rollback is app-only: redeploy the previous `rehearse-app:1360204` image from
  its release tree if this transition fix must be withdrawn.
