# LFL-056 PCT128 deployment receipt

Date: 2026-11-11 (Asia/Jakarta)

Environment: PCT128 production, `https://rehearse.najala.org`

Implementation commit/image: `219b843` / `rehearse-app:219b843`

## Repair

The learner reported that both the original and newly claimed private
vocabulary assignments showed the unavailable message. Production inspection
confirmed both assignments belonged to the intended learner account, were
active, pinned to package v2, and had no saved attempts.

On first open, `createAttempt` inserted an attempt but returned only its ID,
number, and timestamp. The caller then looked up the package using the missing
`package_version`, causing `package_unavailable` before a run could be
returned or an attempt saved. The function now returns the complete attempt
state and assignment title needed by the caller. No migration was needed.

## Deployment

The release was assembled at `/opt/rehearse/.releases/219b843` from
`bd7c4a8` plus the LFL-056 source and ledger changes. The transferred archive
SHA-256 was `7ffbb6bcbb9d166621e47b293a36ba66d5f7c145900234a496705cf95fe89790`.
The production Next build and Compose configuration validation passed. The
persistent production image tag was updated to `219b843`, and only the app
container was recreated.

## Verification and limits

- Local changed-path ESLint, TypeScript, Next production build, and
  `git diff --check` passed. No tests were run.
- `rehearse-app:219b843` and PostgreSQL are healthy; app restart count is zero.
- LAN and public health endpoints returned HTTP 200.
- The two private assignments remain in place; no attempts or other learner
  records were created or changed by this deployment.
- The learner's authenticated browser journey was not available for a
  post-deployment click-through, so the reported page needs a fresh learner
  reload to confirm the fix in the actual session.

Rollback is app-only to `rehearse-app:bd7c4a8`; no database rollback is needed.
