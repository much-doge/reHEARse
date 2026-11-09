# LFL-042 deployment receipt

Status: deployed to Countryroad PCT128 on 2026-11-09 (Asia/Jakarta).
An authenticated same-account code re-entry was not performed.

## Release

- Source commit: `cd61a4064e072c218c4f7d281e7f008b8347f1b7`.
- Target: `/opt/rehearse` in PCT128; public app at
  `https://rehearse.najala.org`.
- Runtime image: `rehearse-app:cd61a40`.
- The PCT128 checkout was fast-forwarded from `148b312` using a temporary
  Git bundle.
- Production Compose configuration and the PCT128 Next production build
  passed. Only the app container was rebuilt and replaced; no migration ran.
- A private environment copy for tag rollback is at
  `/opt/rehearse/.secrets/lfl042-env-before`.

## Recovery evidence

- Read-only inspection before the change showed the newest invite already
  claimed, one active assignment, and one in-progress Listening attempt with
  saved response events.
- Test Center totals immediately before and after the app replacement were
  unchanged: 8 diagnostic attempts, 505 diagnostic events, and 2 results. The
  latest attempt remained `in_progress` with its 2 answer events.
- The original learner account can re-enter its code to rediscover the active
  assignment. A different account still cannot reuse that code.
- No participant account was impersonated. The authenticated recovery journey
  remains unobserved.

## Runtime verification

- PCT128 reports `rehearse-app:cd61a40` as healthy.
- In-container and public health endpoints returned HTTP 200.
- The signed-out staff route returned HTTP 307 with private/no-store headers.

## Rollback

Set `REHEARSE_IMAGE_TAG=148b312` in the protected PCT128 `.env.production`
and recreate only the app service using production Compose with `--no-deps`.
Do not modify PostgreSQL; this release has no schema or data changes.
