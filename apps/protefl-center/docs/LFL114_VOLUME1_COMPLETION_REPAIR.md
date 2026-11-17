# LFL-114 — Volume 1 Practice Test A completion repair

Status: implementing.

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
