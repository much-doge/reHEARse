# LFL-114 — Volume 1 Practice Test A completion repair

Status: deployed to PCT128; authenticated full submission and focused retake
observed in production evidence.

## Incident

Production read-only evidence on 17 November 2026 found that ETS Volume 1
Practice Test A could not finish. All 27 attempts remained in progress, no
result row existed, 11 attempts had reached Reading, and three of those held
answers for all 140 questions. Existing answer events remain preserved.

The completion adapter treated every score-conversion file as a `ranges`
array. The immutable Volume 1 package instead preserves its source table as
section-specific raw-range maps. Passing the absent `ranges` value into the
scorer throws before the result insert and attempt-completion update; the
transaction then rolls back.

## Repair boundary

- Add a validated compatibility reader for both the established `ranges`
  representation and the Volume 1 section-map representation.
- Use the reader for full and standalone-section completion.
- Do not edit the published package, its score-table hash, answer key, learner
  responses, attempt lineage, deadlines, assignments, or existing events.
- Add package-backed regression coverage so every registered score table can
  convert representative raw values before release.
- Deploy only the application. No migration or learner-data write is required.

## Acceptance

1. Volume 1 section maps produce the source-listed converted ranges, including
   their distinct raw buckets by section.
2. Volume 3 `ranges` behavior remains unchanged.
3. Invalid/missing score shapes fail closed instead of producing an invented
   score.
4. Focused tests, full lint, TypeScript, Vitest, production build, Compose
   configuration, and the package verifier pass.
5. The PCT128 app-only release is healthy; PostgreSQL is not recreated.
6. A read-only production audit confirms the existing stranded attempts and
   their saved answers are unchanged and eligible for normal submission.
7. Students receive the instruction to press **Yes** only after the deployed
   runtime contains the repair and health/integrity checks pass.

## Implemented repair

The result adapter now accepts both supported score-table representations:

- normalized cross-section `ranges`, retained by Volume 3; and
- source-faithful section maps, retained by Volume 1.

The compatibility reader validates inclusive raw and converted range labels,
returns `null` only for source-unavailable conversions, and fails closed for a
missing or malformed table. Both full-test and standalone-section completion
use it. The Volume 1 package, manifest, hashes, questions, key, scoring values,
attempts, responses, assignments, and deadlines were not changed.

## Verification

- Focused scoring/package/adapter run: 3 files, 19 tests passed.
- Full ESLint: passed.
- Repository TypeScript: passed.
- Full Vitest: 56 files, 226 tests passed.
- Volume 1 package verifier: passed with 50 Listening, 40 Structure, and 50
  Reading items.
- Local and production-image Next.js 16.3.4 builds: passed.
- Production Compose configuration: passed inside PCT128 using the protected
  production environment. The intentionally secret-free local environment
  could not evaluate that production-only configuration and was not treated as
  a release failure.
- `git diff --check`: passed.

## Deployment

- Source/release commit: `4323cee`.
- Release tree: `/opt/rehearse/.releases/4323cee`.
- App image: `rehearse-app:4323cee`; image ID
  `sha256:8847036e9fcd026ce2127cb032dd9db1ff7dabf34822b1a3e35afba732c6663b`.
- Only `rehearse-app-1` was recreated. It is healthy with zero restarts.
- `rehearse-postgres-1` retained container ID
  `b8d72c028dc252b4d53fb7df208e51ca9d0c7af99ea6d87fb7618095603b03e3`,
  remained healthy with zero restarts, and was not migrated or recreated.
- LAN and public health returned HTTP 200. The signed-out Volume 1 route
  returned 307 to authentication, and unauthenticated resources returned 401.
- The running bundle contains the new fail-closed score-table reader.

## Existing-attempt readback and learner instruction

After deployment, read-only production counts remained 27 Volume 1 attempts,
zero completed/results, 11 in Reading, and three Reading attempts with all 140
responses. This confirms verification did not complete or rewrite a learner
attempt. Every Reading-stage attempt retained all four package pins; none had a
revoked or expired assignment.

Students may now refresh the test page, reopen the same attempt, choose
**Finish diagnostic**, and press **Yes**. They must not start a new attempt.
The server will calculate and append the result from the already saved answers.
The screenshots later supplied by the operator were timestamped 12:03–12:04
Jakarta, before the repaired app started at 12:19:27. They therefore show the
original failure, not a post-deployment failure.

After the repaired release started, the matching anonymized attempt completed
at 12:21:24 Jakarta. Its result row contains all 140 review items and reports
140 total questions. The same learner then completed a 33-item focused retake
at 12:49:58, and that separate result row is also present. This verifies the
production full-submit and focused-retake persistence paths from authenticated
learner actions. It is production evidence, not an independently observed
classroom/browser walkthrough.

## Rollback

Restore `REHEARSE_IMAGE_TAG=1de97fa` and recreate only the app service from the
retained prior release. Keep PostgreSQL and all learner evidence in place. No
database or package rollback is required.
