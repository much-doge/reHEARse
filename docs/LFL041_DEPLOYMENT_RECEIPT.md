# LFL-041 deployment receipt

Status: deployed to Countryroad PCT128 on 2026-11-09 (Asia/Jakarta).
Authenticated teacher visual review remains pending.

## Release

- Source commit: `148b31268e7edccd92d27596a015c24670785d93`.
- Target: `/opt/rehearse` in PCT128; public app at
  `https://rehearse.najala.org`.
- Runtime image: `rehearse-app:148b312`.
- The PCT128 checkout was fast-forwarded from `e677c82` to `148b312` using a
  temporary Git bundle.
- Production Compose configuration passed `config --quiet`; the production
  Next build completed in PCT128.
- Only the app image/container was rebuilt and replaced. No migration ran;
  PostgreSQL, assignments, attempts, events, and results were not modified.
- A private mode-preserving production environment copy is kept at
  `/opt/rehearse/.secrets/lfl041-env-before` for tag rollback.

## Verification

- PCT128 reports image `rehearse-app:148b312` and Docker health `healthy`.
- In-container `/api/health` returned HTTP 200 with private/no-store headers.
- Public `https://rehearse.najala.org/api/health` returned HTTP 200.
- The signed-out teaching route returned HTTP 307 to authentication with
  private/no-store headers.
- No authenticated teacher browser session was used; visual presentation and
  real candidate history were not observed after deployment.

## Rollback

Set `REHEARSE_IMAGE_TAG=e677c82` in the protected PCT128 `.env.production`
and recreate only the app service using the production Compose file with
`--no-deps`. Do not revert or restore the PostgreSQL database; this release
made no database changes.
