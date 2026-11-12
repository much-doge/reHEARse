# LFL-073 Teacher response summary receipt

## Outcome

The authenticated Test Center teacher workspace now has a response-summary panel directly below the candidate filters. The flow is intentionally ordered as:

1. filter by participant or assignment label;
2. scan progress and response totals for the visible cohort;
3. open an individual learner for live answers, immutable history, question reveal, and reset controls.

The summary is Google-Forms-like in presentation but remains grounded in the existing Test Center result contract. It reports, for the currently visible learners' latest non-archived completed attempt:

- completed, in-progress, and not-started counts;
- saved-answer count and results-recorded count;
- correct, incorrect, omitted, and questions-recorded totals;
- correct-response percentage among answered responses;
- Listening, Structure, and Reading breakdowns with correct/total, incorrect, omitted, and a compact correctness bar.

When no completed result exists, the panel states that it is waiting for a completed result instead of treating live answers as a score. No learner attempt, answer, result, reset lineage, or assignment record is changed by this release.

## Verification

- Changed-path ESLint: passed (`src/components/test-center/resources.tsx`)
- Repository TypeScript: passed (`node_modules/.bin/tsc --noEmit`)
- Vitest: 52 files / 194 tests passed
- Next production build: passed
- `git diff --check`: passed
- Deployment: PCT128 app-only image `rehearse-app:c394ed3`
- Image digest: `sha256:1008705f4173148f01c2763a5e11e0a2b0f9e017b5e465be127c3934b2fc3b7e`
- Runtime: healthy, zero restarts after replacement
- Delta archive from deployed `a34697a`: SHA256 `7ce02d0e6b9aa92362ec81424258b78230ba452ca1c24836016c63e821c41661`
- Public health: HTTP 200 (`https://rehearse.najala.org/api/health`)
- Signed-out teacher page: HTTP 307 (`/test-center/teaching`)
- Unauthenticated teaching API: HTTP 401 (`/api/test-center/teaching`)

An authenticated teacher browser walkthrough of the new summary remains operator-side follow-up; the release was source-, container-, and endpoint-verified.

## Security and rollback

The panel consumes the existing teacher-scoped candidate DTO and does not add an endpoint or expose tags/answer keys to learner routes. It uses completed, non-archived results only; in-progress answers remain in the existing per-learner live review. Roll back by redeploying the prior app-only image `rehearse-app:a34697a` from its isolated release tree.

