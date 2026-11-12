# LFL-072 — Vocabulary teacher review placement

Date: 2026-11-13 (Asia/Jakarta)

## Change

The selected vocabulary card-history review panel now appears above the long
assignment roster in the teacher workspace. The teacher sees the selected
learner's metrics and card review immediately after opening an attempt, without
scrolling to the bottom of the assignment list. Review behavior and learner
records are unchanged.

## Verification

- Changed-path ESLint: passed.
- Repository TypeScript: passed.
- Vitest: 52 files / 194 tests passed.
- Next production build: passed.
- `git diff --check`: passed.
- No migration or database change.

## PCT128 deployment

- Runtime image: `rehearse-app:a34697a`.
- Release tree: `/opt/rehearse/.releases/a34697a`.
- Transferred delta SHA-256: `5ae8d6e2e278a42faf286e0ed03c01ab4467af2aed8dce2e1b5d2bbba691e75c`.
- Image digest: `sha256:9b6d51b71d165809373350f7deb83ad218fde31c7590b994d4034ba08594c0dd`.
- App container: healthy, zero restarts.
- Public health: HTTP 200.
- Signed-out vocabulary teacher route: HTTP 307.
- Unauthenticated vocabulary teaching API: HTTP 401.

Authenticated browser visual review remains an operator-side check; no learner
data was changed by this layout-only release.

## Rollback

App-only rollback to `rehearse-app:097b810`; no database rollback is needed.
