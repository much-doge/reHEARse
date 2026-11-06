# LFL-029 English-only interface receipt

## Outcome

All rendered learner, teacher, administrator, classroom-game, listening-ladder,
workshop and ProTEFL Test Center interface copy is English-only. D029 records
the product decision that supersedes the former bilingual presentation rule.

Historical bilingual fields remain in immutable records and versioned domain
contracts. UI presenters select the English field; this change performs no
database migration, deletes no Indonesian historical value and rewrites no
learner attempt, feedback, game run or formal-test response.

## Source verification

- Render-path scan covered `src/app` and `src/components`, including visible
  copy, status and error text, timer labels, accessible names and dynamic
  English/Indonesian content pairs.
- ESLint passed.
- TypeScript passed.
- Vitest passed: 43 files and 166 tests.
- Next.js production build passed.

## Deployment state

Not deployed at this checkpoint. PCT128 app-only deployment and public route
checks remain required before the ledger may say `deployed`.

## Rollback

Revert the LFL-029 implementation and D029 governance commits together. No data
rollback is required because stored records and schemas are unchanged.
