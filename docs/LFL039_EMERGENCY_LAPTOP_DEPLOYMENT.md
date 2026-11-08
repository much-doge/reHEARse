# LFL-039 emergency laptop deployment

Status: deployed to the Debian laptop on 2026-11-09 (Asia/Jakarta). No
Cloudflare Tunnel hostname was attached during this checkpoint.

## Release

- Commit: `e677c82` (`feat(test-center): assign individual diagnostic sections`),
  which includes Listening browse/lock correction `bd06e1e`.
- Target: this Debian laptop, Docker Compose project `rehearse`.
- Runtime origin: `http://127.0.0.1:3000`; the container publishes host port
  3000 for a separately configured tunnel.
- The image was built from a clean `git archive` of `e677c82`, excluding
  unrelated presentation edits and unfinished Practice Test B files.
- Before migration 024, a private mode-600 PostgreSQL custom-format backup was
  created at
  `.secrets/rehearse-laptop-pre-024-20261109-055628.dump` and validated with
  `pg_restore --list`.
- Additive migration `024_diagnostic_section_assignments.sql` completed. The
  existing laptop PostgreSQL volume and learner records were preserved.
- The repository-default teacher identity was replaced with the named owner
  teacher account. Its generated password is stored only in
  `.secrets/emergency-laptop-teacher-20261109.txt` (mode 600). Unused
  repository-default learner and administrator passwords were rotated to
  generated unknown values before tunnel exposure.

## Verification

- Local pre-release verification: ESLint, TypeScript, 48 Vitest files / 182
  tests, and Next production build passed.
- The clean emergency image completed a separate Next production build.
- PostgreSQL records migration 024, and the new `delivery_scope` column has the
  historical-safe `full` default.
- `rehearse-app-1` and `rehearse-db-1` report healthy.
- Local `/api/health` returned HTTP 200 with private/no-store headers.
- Logged-out `/test-center/teaching` returned an authentication redirect.
- No Cloudflare hostname, authenticated teacher browser journey, candidate
  journey, classroom playback observation, or external health check was
  verified at this checkpoint.

## PCT128 state

PCT128 was fast-forwarded to `e677c82`, and matching image builds were started,
but repeated power shutdowns interrupted the final app-image unpack. No PCT128
backup or migration 024 was started; its database remains on migration 023 and
its last confirmed live app remained `rehearse-app:0136117`.

## Rollback

Recreate the laptop app from the prior local image if it is still retained, or
check out the prior deployment commit and rebuild only the app. Leave additive
migration 024 applied and preserve existing attempts. The validated pre-024
backup is available for disaster recovery, not routine rollback.
