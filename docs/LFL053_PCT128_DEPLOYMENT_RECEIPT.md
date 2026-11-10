# LFL-053 PCT128 production deployment receipt

Date: 2026-11-10 (Asia/Jakarta)

Environment: Countryroad Proxmox PCT 128, public origin
`https://rehearse.najala.org`

Implementation commit/image: `a939b10` / `rehearse-app:a939b10`

## Deployment

The release archive was generated from the exact committed source and had
SHA-256 `a387437d82c0ec32543b379794f18ca1d64c883ab50d1c4388a842e0b5663c6c`.
The image was built in the isolated release directory
`/opt/rehearse/.releases/a939b10`. Production Compose configuration validated
before build. The application build compiled successfully, completed its
TypeScript phase, and included `/api/test-center/teaching/question`.

Only the `app` service was recreated with `--no-deps`. No database migration
or data change was required. The previous app image `rehearse-app:007a361`
remains available for app-only rollback. The independent guest checkout and
unrelated local presentation edits were left untouched.

## Verification

- PCT128 reports `rehearse-app:a939b10`, running and healthy, with zero
  restarts; PostgreSQL remains running and healthy.
- Guest LAN and public `/api/health` requests returned HTTP 200.
- The logged-out teaching page returned HTTP 307 with private/no-store
  response headers.
- A same-origin logged-out POST to the new teacher question endpoint returned
  HTTP 401 with private/no-store and `Vary: Cookie` headers.
- Local changed-path ESLint, TypeScript, and `git diff --check` passed. The
  automated test suite and authenticated teacher browser journey were not run;
  the latter remains operator verification.
