# LFL-039 Countryroad deployment

Status: deployed to PCT128 on Countryroad on 2026-11-09 (Asia/Jakarta).
Authenticated teacher/candidate browser review and classroom playback remain
separate gates.

## Release

- Application commit/image: `e677c82`
  (`feat(test-center): assign individual diagnostic sections`), including
  Listening progress correction `bd06e1e`.
- Target: `/opt/rehearse` in PCT128 on Countryroad.
- Runtime image: `rehearse-app:e677c82`.
- Migrator image: `rehearse-tools:e677c82`.
- Before migration 024, a private PostgreSQL custom-format backup was created
  at
  `/opt/rehearse/.secrets/rehearse-pre-024-countryroad-20261109-100544.dump`.
  It is 2,262,504 bytes, mode 600, and passed `pg_restore --list`.
- Production configuration validation passed with secrets omitted.
- Additive migration `024_diagnostic_section_assignments.sql` completed and is
  recorded in `app_migration`.
- Only the reHEARse app container was replaced. PostgreSQL was retained.

## Verification

- `rehearse-app:e677c82` reports healthy.
- Public `https://rehearse.najala.org/api/health` returned HTTP 200 with the
  `health.v1` contract through Cloudflare.
- Public responses included private/no-store cache controls and HSTS.
- Logged-out `/test-center/teaching` returned HTTP 307 to authentication.
- An unauthenticated diagnostic-run API request returned HTTP 401.
- No authenticated access-code issuance, single-section completion, answer
  review, retry, or classroom audio journey was performed during deployment.

## Emergency laptop fallback

The laptop deployment remains healthy and was not deleted or overwritten. Its
database is independent from Countryroad and must not accept concurrent learner
traffic unless an explicit failover is declared and records are reconciled.

## Rollback

Set `REHEARSE_IMAGE_TAG=0136117` in PCT128 `.env.production`, then recreate only
the app service. Leave additive migration 024 applied and preserve all attempts
and results. Use the validated pre-024 backup only for disaster recovery.
