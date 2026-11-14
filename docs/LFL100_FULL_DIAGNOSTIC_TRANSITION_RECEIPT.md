# LFL-100 Full diagnostic transition

Status: source-complete; deployment pending

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
- Next production build passed locally before this source patch; a fresh build
  is required for the deployment image.
- `git diff --check` passed.
- Deployment and authenticated full-test browser journey remain pending.
