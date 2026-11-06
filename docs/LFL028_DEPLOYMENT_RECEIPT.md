# LFL-028 supervised listening pilot receipt

Status: deployed pilot; authenticated classroom verification pending

## Shipped boundary

- Planning authorization: `ae52c26`.
- Application, isolated persistence and learner journey: `82bce68`.
- Najala Dumpster Backblaze delivery correction: `a266d37`.
- Deployment target: reHEARse in PCT128, public origin
  `https://rehearse.najala.org`.
- Protected route: `/test-center/listening/2000-10`.
- PCT128 checkout at deployment: `a266d37468ee07e3c4db5eb163ac5255d2193fac`.
- Runtime image: locally built from the verified checkout and cached exact
  Next.js `16.3.4` dependencies after PCT128 registry downloads timed out;
  loaded as `rehearse-app:2dbc4f5`.

The test uses existing reHEARse authentication only as a route adapter.
Forms, keys, attempts, item responses and remedial records remain in additive
`protefl_*` tables. No Test Center result is written to reHEARse learning
attempts, feedback or history.

## Content and media state

- Private package: exactly 50 items in original sequence, Part A 1–30, Part B
  31–39 and Part C 40–50.
- Every item has four ordered A–D options and one answer key.
- The matching online printed form and transcript were used; Whisper was not
  used. The key is secondary-source and semantic-review evidence, not a
  publisher-authenticated official key.
- Package validation passed for all 50 local clips: file presence, size,
  SHA-256, MP3 content type and duration.
- Backblaze destination:
  `najala-dumpster/rehearse/media/test-center/ptc-listening-2000-10-v1/`.
- `rclone check` reported zero differences and 50 matching files.
- Public delivery of `001.mp3` returned `audio/mpeg`; byte-range delivery of
  `050.mp3` returned HTTP 206 with the requested 32 bytes.
- PCT128 temporary media and package copies were removed after the immutable
  database import. Runtime audio is served from the object store.

## Verification

- `pnpm check`: ESLint, TypeScript, 41 test files / 162 tests and Next
  production build passed.
- Migration 017 passed from an empty disposable PostgreSQL database and is
  recorded once in the deployed `app_migration` ledger.
- The guarded importer validated and inserted exactly 50 deployed items. The
  first and last stored keys are the expected Backblaze `001.mp3` and
  `050.mp3` objects.
- Disposable PostgreSQL journey passed: no answer key before submission,
  complete 50-item submission, deliberately missed ten-item remedial run,
  immutable original attempt, foreign-media denial and duplicate-request
  recovery.
- PCT128 app container reached `healthy` on Next.js `16.3.4` at
  `192.168.8.63:3001`.
- Public `/api/health` returned the reHEARse health contract.
- Logged-out access to the protected test returned HTTP 307 to
  `/login?next=%2Ftest-center%2Flistening%2F2000-10`.

## Honest remaining gate

No production account credentials were used and no privileged session was
fabricated for acceptance. Therefore the authenticated public page, real
one-play audio journey, final submission and classroom concurrency are not yet
classroom-verified. A teacher should sign in with a normal account, open the
protected route, play at least the first item, and confirm the Backblaze audio
and twelve-second response window before learners begin. Keep the activity
labelled as a supervised pilot and stop the run if any content mismatch is
observed.

## First Begin request hotfix

The first authenticated learner Begin request exposed an invalid HTTP adapter
schema: two members of a Zod discriminated union used the same `start` value.
The domain, imported form, learner role and stored answers were not disabled or
damaged; the route rejected the request before starting an attempt.

Commit `f67c41f` replaces that adapter schema with a strict union and adds
regression cases for both full and remedial start payloads plus invalid mixed
payloads. `pnpm check` passed with 42 test files and 164 tests. The hotfix image
was deployed by recreating only the reHEARse app container. The container is
healthy, `/api/health` passes, the Test Center POST route now initializes and
returns the expected `authentication_required` response to an unauthenticated
probe, and post-cutover logs contain no duplicate-discriminator failure. A
normal signed-in learner Begin request remains the final classroom check.

## Rollback

Restore the prior `rehearse-app` image tag and recreate only the app service.
Migration 017 is additive and may remain unused. If the form must be withdrawn,
retire its `protefl_test_form` row; do not delete attempts. Backblaze objects
are immutable and should be retained until the source owner approves removal.

## v2 source-map and server-clock correction

The first live audio run established that v1 Part A physical media was shifted
by one item: its clip 001 began at 197.480 seconds, while the source video's
timestamped English caption identifies number 2 at 197.020 seconds. The answer
options remained on item 1 because the public DTO correctly projected the v1
item record; the media source mapping was wrong. Part B/C grouped mappings were
already aligned.

The same run exposed a separate timing defect. The learner computer's wall
clock is approximately seven hours ahead of the server, but the client compared
that wall clock directly with server deadlines. The v2 client now anchors time
to each server response and advances it only with monotonic elapsed browser
time; timezone or wall-clock skew cannot keep choices locked or expire them
early.

The corrected private form `ptc-listening-2000-10-v2` rebuilds item 1 from
167.000–185.497 seconds, maps items 2–30 to the former physical clips 001–029,
and retains the already aligned Part B/C clips 031–050. All 50 v2 objects were
uploaded to a new immutable Backblaze prefix and `rclone check` reported 50
matches and zero differences. The v2 importer passed from an empty disposable
database. The v1 form and objects remain unchanged for audit and must not be
used for new attempts.
