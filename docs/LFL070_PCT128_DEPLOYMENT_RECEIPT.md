# LFL-070 PCT128 deployment receipt

Date: 2026-11-12 (Asia/Jakarta)

## Release

- Repository commit: `b3582dd` (`fix(test-center): bind password recovery to assignments`), including the preceding teacher-workflow commit `bd98a43`.
- Runtime image: `rehearse-app:b3582dd`.
- PCT: 128 (`192.168.8.63` application address; Proxmox transport via `192.168.8.50`).
- The release tree was assembled from the existing `5d064df` release plus the exact changed-file delta for `b3582dd`; delta SHA-256: `17ca51b41fd784cdbf1ef75a4b912a0e050e0160efc9eb4a01d590fc304d44e5`.

## Safety and migration

- A mode-0600 custom-format PostgreSQL backup was written to `/opt/rehearse/.secrets/lfl070-pre-migration-b3582dd.dump` before migration.
- The backup was copied into the PostgreSQL container and passed `pg_restore --list` validation.
- Migrations `038_additive_resource_assignments.sql`, `039_independent_section_resets.sql`, and `040_assignment_scoped_password_reset_audit.sql` applied successfully.
- PostgreSQL was not recreated or restarted. The database container remained healthy with zero restarts.
- Counts before migration and after deployment were unchanged: 90 users, 71 assignments, 93 diagnostic attempts, 7,794 diagnostic events, and 67 diagnostic results.

## Runtime verification

- `rehearse-app-1`: image `rehearse-app:b3582dd`, healthy, zero restarts; container ID `17deac261a1d…`.
- `rehearse-postgres-1`: healthy, zero restarts; container ID `b8d72c028dc2…`.
- In-container health: `{"status":"ok","service":"rehearse","contractVersion":"health.v1"}`.
- Public health: `https://rehearse.najala.org/api/health` returned HTTP 200 with the same `health.v1` response.
- Signed-out teaching page redirected with HTTP 307 to `/login?next=%2Fdashboard` and private/no-store response headers.
- Unauthenticated teaching history API returned HTTP 401 with private/no-store response headers.

## Deployment boundary

Only the app service was recreated. Active learner attempts, answer events, results, assignments, and PostgreSQL storage were preserved. This receipt records source/container/deployment verification; an authenticated teacher browser journey and live classroom playback were not exercised during this network-constrained deployment.

## Rollback

Rollback is app-only: restore `REHEARSE_IMAGE_TAG=1d1043d` in `/opt/rehearse/.env.production` and recreate only the `app` service from the retained `/opt/rehearse/.releases/1d1043d` tree. Do not restore the database backup over live data unless a separate, explicitly approved database recovery is required.

