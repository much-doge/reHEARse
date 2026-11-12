# LFL-071 — Teacher workspace and vocabulary review

Date: 2026-11-12 (Asia/Jakarta)

Deployment status: deployed to PCT128 on 2026-11-12 (Asia/Jakarta).

## Product change

The authenticated Test Center teacher workspace now presents the candidate list as a review workspace rather than a raw roster:

- the current participant/assignment filter drives a cohort snapshot with learner count, completion, in-progress/not-started counts, saved answers, retakes, and recorded results;
- candidate history remains on demand and append-only, with a visible live-refresh switch (15-second polling while a candidate panel is open) plus an explicit refresh action;
- the existing per-section and whole-assignment reset controls remain in the candidate history, alongside live answers, archived attempts, retake history, and question reveal;
- the snapshot is derived only from the visible filtered candidates, so a teacher can use an assignment label or search filter as a cohort view without changing learner data.

The teacher-only Word Studio review now opens directly on cards needing attention and provides:

- presented, needs-review, right-first-response, and open/skipped counts;
- filters for Needs review, No response, Skipped, and All cards;
- word search, assignment/learner context, response choice, role target, example sentence, and exposure status for each card.

No vocabulary score, rank, or mastery value is introduced; this remains activity-level review data. Test Center score/result data remains bounded to the Test Center product.

## Verification

- changed-path ESLint: passed;
- repository TypeScript: passed;
- Vitest: 52 files / 194 tests passed;
- Next production build: passed;
- `git diff --check`: passed;
- no migration; no persistence contract changed;
- unrelated owner-edited presentation files were not staged.

Authenticated browser visual review, classroom use, and the post-deploy teacher polling journey remain operator verification items.

## PCT128 deployment evidence

- Runtime image: `rehearse-app:bc24d25`.
- The app release was assembled from the retained `b3582dd` release plus the exact changed-file delta for this work; delta SHA-256: `87a3f94146830a7ec282983b57a40b6b72ce370b89aa5ddae648aa5091c19dc0`.
- `rehearse-app-1`: healthy, zero restarts.
- `rehearse-postgres-1`: healthy, zero restarts; no migration and no database recreation.
- Counts after replacement: 90 users, 71 assignments, 93 diagnostic attempts, 7,794 diagnostic events, and 67 diagnostic results.
- In-container and public `https://rehearse.najala.org/api/health`: HTTP 200.
- Signed-out `/test-center/teaching`: HTTP 307 with private/no-store headers.
- Unauthenticated `/api/vocabulary/teaching`: HTTP 401 with private/no-store headers.

## Rollback

Application-only rollback to the previous app image is sufficient; no database rollback is required because this change has no migration and does not mutate existing attempt or vocabulary evidence.

