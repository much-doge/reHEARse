# LFL-057 PCT128 deployment receipt

**Date:** 2026-11-11  
**Environment:** PCT128 production, `https://rehearse.najala.org`  
**Release:** `5d064df` (`rehearse-app:5d064df`)

## Delivered

- Vocabulary cards return feedback immediately when a learner taps a part-of-speech choice. Partial matches remain visible as partial feedback.
- The extra “Check this word” action is removed, and the Next action is beside the choices.
- Multi-role cards show an authored context clue. All 2,844 entries in package v3 have original contextual examples with validated highlight offsets.
- Learner copy no longer blames the source list for incomplete data.

## Data and attempt preservation

Before applying migration 035, a database backup was created at
`/opt/rehearse/.secrets/lfl057-pre-migration-a4a86cd.dump` with mode 0600;
`pg_restore --list` succeeded.

Migration 035 was applied. The published deck is now version 3 and two active
assignments point to it. Two in-progress attempts remain pinned to version 2,
with all 17 existing events preserved. Two existing invitations remain pinned
to version 2. New rounds use version 3. This keeps active learner evidence
intact while making the authored examples available on new rounds.

## Deployment verification

- Release image `5d064df` is running in PCT128; app and PostgreSQL containers
  reported healthy with zero restarts at verification time.
- PCT128 LAN health endpoint returned HTTP 200.
- Public `https://rehearse.najala.org/api/health` returned HTTP 200.
- Signed-out `/vocabulary` redirected to sign-in with private/no-store cache
  headers; signed-out `/api/vocabulary` returned HTTP 401 with private/no-store
  and `Vary: Cookie`.
- The running app bundle contained the new “Which roles fit?” interface copy.
- Local changed-path ESLint, TypeScript, production build, Python content
  generator compile, content audit, and `git diff --check` passed. No test suite
  was run.

An authenticated learner browser journey and live classroom session were not
verified.

## Rollback guidance

Before any version 3 invitation or attempt is created, the app image can be
rolled back to `219b843`. After version 3 learner activity exists, fix forward;
do not restore the pre-migration database backup over live data because that
would erase subsequent learner activity.
