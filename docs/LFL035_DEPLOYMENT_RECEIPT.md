# LFL-035 PCT128 deployment receipt

Status: deployed to PCT128 on 2026-11-08 (Asia/Jakarta). The authenticated
candidate and teacher journeys have not been observed; this is not classroom
verified.

## Release

- Runtime source: `9a7dc61`; initial diagnostic implementation: `2b311e5`;
  source package: `2430447`. Both runtime commits are pushed to `origin/main`.
- Target: reHEARse in PCT128, checkout `/opt/rehearse`.
- Running image: `rehearse-app:9a7dc61`, container healthy, zero restarts.
- Only the reHEARse app service was recreated for the release and auth-return
  correction. PostgreSQL remained healthy with container ID
  `b8d72c028dc252b4d53fb7df208e51ca9d0c7af99ea6d87fb7618095603b03e3`.
- The PCT128 guest could not complete `git pull` from GitHub within a bounded
  network check. The two committed ranges were transferred as verified Git
  bundles through the Proxmox transport, fast-forwarded inside PCT128, and the
  temporary bundles were removed.

## Database and source boundary

- Before migration, a custom-format database backup was written to
  `.secrets/lfl035-pre-migration.dump`, mode 0600. `pg_restore --list` in the
  PostgreSQL container validated it. The protected backup is retained for
  rollback.
- Migrations `019_protefl_short_codes.sql` and
  `020_protefl_diagnostic_attempts.sql` applied successfully and appear last in
  `app_migration`. The new diagnostic attempt table contains zero rows.
- The seeded `ets-volume3-practice-test-a` resource remains `draft`. No invite
  was issued and no candidate attempt was created; publication and assignment
  remain under teacher/admin control.
- The final app image contains the assigned question-page renders and the
  Listening audio. An image-level check confirmed it excludes the complete
  source PDF, layout-text source and bulk page-text companion. Answer and scoring
  data remain server-side until whole-test submission.

## Deployment checks

- Production Compose configuration passed validation. The guest built the
  `rehearse-tools:2b311e5` migrator and the `rehearse-app:2b311e5` then
  `rehearse-app:9a7dc61` images; production Next builds and TypeScript passed.
- `http://192.168.8.63:3001/api/health`: HTTP 200.
- `https://rehearse.najala.org/api/health`: HTTP 200.
- Logged-out diagnostic page: HTTP 307 to
  `/login?next=%2Ftest-center%2Fdiagnostic%2Fets-volume3-practice-test-a`,
  with `private, no-store` caching headers.
- Logged-out diagnostic run and question-page media APIs: HTTP 401.
- The final application container is healthy with zero restarts. PostgreSQL
  stayed healthy and its container ID is unchanged.
- Local checks before deployment: ESLint, TypeScript, 47 test files / 175
  tests, Next production build, package manifest/structure verifier, standalone
  content-boundary inspection and `git diff --check`. The auth return fix also
  passed its focused test (3/3), changed-file ESLint, TypeScript and a fresh
  production build.

## Remaining verification boundary

No authenticated student or teacher account was used. The signed-in assignment,
code claim, full audio, timed sections, answer review and retake journey remains
unverified in the live browser. The source audio's item alignment still needs a
human spot-check. The resource remains draft-only until a teacher/admin
publishes it and creates an assignment.

## Rollback

For an app-only rollback, set `REHEARSE_IMAGE_TAG=8c9d7f5` in the protected
production environment and recreate only the app service. Keep migrations 019
and 020 and their additive tables/columns in place; do not delete attempts or
restore over the live database. Retain `.secrets/lfl035-pre-migration.dump`
until the release rollback window is closed.
