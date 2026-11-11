# LFL-068 — Teacher workspace first-load latency

Date: 2026-11-11 (Asia/Jakarta)

Status: deployed to the Debian `dev1` runtime on 2026-11-12 (Asia/Jakarta).

## Diagnosis

`/test-center/teaching` rendered every assigned candidate's complete attempt
lineage on the initial server response. For each attempt the response included
latest answer events, retakes, and the full result review payload. That made the
page grow with classroom activity and caused the teacher workspace to become
slow before the first useful paint.

On the local PostgreSQL copy, the previous nested history query took 63.8 ms
for the current 50 assignments/49 diagnostic attempts/5,184 events. The new
summary query took 24.6 ms and, more importantly, omits answer/review bodies
from the initial page payload.

## Change

- The initial teacher page now receives only candidate identity, assignment
  label, current non-archived attempt summary, historical-attempt count,
  section-retake count, and answered-question count.
- Opening one candidate requests that candidate's full immutable history from
  `GET /api/test-center/teaching?resourceId=…&candidateActorId=…`.
- The history route requires an authenticated teacher/admin and performs the
  same assignment/resource boundary check before returning live answers,
  archived attempts, retakes, question reveals, and protected Listening
  playback controls.
- Existing attempt, event, result, reset, and archive records are unchanged.
- Teacher-only tags and learner-facing resource DTOs are unchanged.

## Verification

- Changed-path ESLint: passed.
- Repository TypeScript check: passed.
- Vitest: 52 files / 194 tests passed.
- Next production build: passed.
- `git diff --check`: passed.
- Local SQL plan measured both the previous nested aggregation and the new
  summary path against the current database copy.

## Deployment

The committed app image `rehearse-app:8156d4a` is running as container
`73e54097b40a5524b90316ded28f75a6783d71c6e8c44db31edb92b83dbcabf7` on the
Debian `dev1` runtime. The existing `rehearse-db-1` PostgreSQL container and
`rehearse_listening_db_v18` volume were not recreated. The existing media volume
and HTTPS-safe session-cookie setting were retained.

Observed after replacement:

- app container health: `healthy`;
- local `/api/health`: HTTP 200;
- public `https://dev1-rehearse.najala.org/api/health`: HTTP 200;
- logged-out `/test-center/teaching`: HTTP 307 with private/no-store headers;
- unauthenticated candidate-history API: HTTP 401 with private/no-store headers;
- PostgreSQL counts unchanged: 69 users, 50 active assignments, 49 diagnostic
  attempts, 5,184 diagnostic events, and 36 diagnostic results.

The change is application-only and has no migration. Authenticated teacher
first-paint, candidate history expansion, question reveal, and protected
Listening playback still need an operator browser check.

## Rollback

If the app image needs to be rolled back, recreate only the app container from
the retained prior image `rehearse-app:7e1ccdc` with the same `rehearse_default`
network and `rehearse_listening_media` volume. Do not recreate PostgreSQL or
restore a database dump.

For the next release, verify:

1. authenticated teacher first paint with compact resource cards;
2. one candidate open loads full live/archived history;
3. question reveal and staff-only Listening playback still work; and
4. existing attempts/events/results counts remain unchanged.
