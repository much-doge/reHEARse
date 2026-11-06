# LFL-030 passage-aware remediation receipt

## Defect

The pilot selected missed questions individually. For Parts B and C, only the
first item in each passage group carries the complete conversation or talk.
A learner who missed a later dependent question could therefore receive only
the spoken question during remediation, without the passage it referred to.

## Correction

- Part A remains missed-item-only.
- If any Part B or C item is missed, the remedial selector includes the entire
  immutable passage group in source order. Its first item therefore replays the
  complete conversation or talk before the dependent questions.
- Main-test answers and submitted attempts are not rewritten.
- The results action now describes passage-aware review rather than promising
  that the remedial run contains only the numerical count of missed items.

## Verification

- Focused selection tests cover a missed Part A item and missed dependent Part
  B/C items, including inclusion of their correct first passage-bearing items.
- ESLint and TypeScript passed.
- Vitest passed: 44 files and 168 tests.
- Next.js production build passed.
- A read-only production aggregate found 20 full attempts in progress, two
  submitted full attempts and two legacy remedial attempts in progress before
  deployment. Recovery of those legacy remedials remains a deployment step.

## Rollback

Revert the implementation and redeploy the previous app image. Existing
attempts remain append-only; do not delete learner response rows.
