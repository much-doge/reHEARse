# LFL-068 — Teacher workspace first-load latency

Date: 2026-11-11 (Asia/Jakarta)

Status: source-complete; deployment pending PLN recovery.

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

## Deployment state

No production or PCT128 replacement was attempted in this checkpoint because
the operator reported a PLN outage. The change is application-only and has no
migration. When power/network access returns, deploy the committed app image
without recreating PostgreSQL, then verify:

1. public health and logged-out teaching redirect;
2. authenticated teacher first paint with compact resource cards;
3. one candidate open loads full live/archived history;
4. question reveal and staff-only Listening playback still work; and
5. existing attempts/events/results counts remain unchanged.

Rollback is app-only to the previous image; no database restore is required.
