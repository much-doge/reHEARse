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

## Deployment verification

- Pushed `fa93d5e` and `fd8f35d` to `origin/main`.
- Built app image `rehearse-app:fd8f35d` and loaded it into PCT128.
- Fast-forwarded `/opt/rehearse` and recreated only `rehearse-app-1`; no
  migration, import or database operation ran.
- Docker health reported `healthy` on image `rehearse-app:fd8f35d`.
- LAN health at `192.168.8.63:3001/api/health` and public health at
  `https://rehearse.najala.org/api/health` returned `health.v1` OK.
- Public homepage and login HTML exposed the expected English labels and no
  former paired Indonesian label for those checks.
- Exact temporary image archives were removed from the workstation, Proxmox
  host and PCT128.

This verifies deployment and public routing, not an authenticated browser sweep
of every role or a classroom trial.

## Rollback

Revert the LFL-029 implementation and D029 governance commits together. No data
rollback is required because stored records and schemas are unchanged.
