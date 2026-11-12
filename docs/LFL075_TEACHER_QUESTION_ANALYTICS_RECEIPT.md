# LFL-075 Teacher question analytics data-path receipt

## Problem corrected

The LFL-074 Question Detail panel was reading the lightweight candidate-list DTO. That DTO intentionally includes section totals but strips `review[]` to keep the teacher assignment page fast, so the panel correctly reported that question-level review was unavailable even though individual history loads could contain it.

## Fix

The teacher workspace now requests a dedicated, authenticated `question_analytics` action from `/api/test-center/teaching` when a filtered cohort is visible. The server:

- validates the staff role and bounded assignment-ID list;
- restricts every assignment to the requested resource, non-revoked state, and teacher/admin ownership;
- selects the latest non-archived root diagnostic attempt per assignment;
- ignores in-progress attempts for completed-result analytics;
- applies completed teacher-issued section resets to full-diagnostic results;
- aggregates question-level correct, incorrect, omitted, and A–D response counts;
- returns the compact 50/40/50 analytics DTO rather than raw result JSON.

The initial teacher roster remains summary-only, so this does not reintroduce the full-history first-load slowdown. Existing attempts, events, results, assignments, and reset lineage are unchanged.

## Verification

- Changed-path ESLint: passed
- Repository TypeScript: passed
- Vitest: 53 files / 195 tests passed
- New aggregation test covers the 50/40/50 ranges and per-question A–D counts
- Next production build: passed
- `git diff --check`: passed
- Deployment: PCT128 app-only image `rehearse-app:ccee4c7`
- Image digest: `sha256:4aa98b2216c78bcddb5601c737ad0c6280affa44f148d709edb4bd02f0d81cb2`
- Runtime: healthy, zero restarts after replacement
- Delta archive from deployed `be6164d`: SHA256 `8a35ef043c672137570c4e31d6fd23d78e20fadc2ca989debb413b0dff042e63`
- Public health: HTTP 200 (`https://rehearse.najala.org/api/health`)
- Signed-out teacher page: HTTP 307 (`/test-center/teaching`)
- Unauthenticated teaching API: HTTP 401 (`/api/test-center/teaching`)

An authenticated browser walkthrough of the filtered table remains operator-side verification; source, aggregation tests, container, and access-boundary checks are complete.

## Rollback

Redeploy the prior app-only image `rehearse-app:be6164d` from its isolated release tree. No database migration or data rollback is required.

