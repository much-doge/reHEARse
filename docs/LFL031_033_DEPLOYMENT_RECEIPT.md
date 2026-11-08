# LFL-031–033 PCT128 deployment receipt

Status: deployed to PCT128 on 2026-11-08 (Asia/Jakarta); authenticated
teacher journey not yet verified.

## Release contents

- Public TOEFL ITP/ProTEFL preparation homepage and archived former homepage
  (LFL-031).
- Assigned-only ProTEFL Test Center resources, staff visibility controls,
  one-use invite codes, and Listening route/media enforcement (LFL-032).
- Najala affiliation, supplied logos and footer navigation (LFL-033).
- Source commits pushed to `origin/main` through `8196e28`.
- PCT128 checkout: `/opt/rehearse`, fast-forwarded to `8196e28`.
- Runtime image: `rehearse-app:8196e28`, image ID
  `sha256:e66b3dbe11b4ded9f0e28f16f5f4c44356605067cab91b1a4276d057d15ae3eb`.
- Tools image `rehearse-tools:8196e28` loaded; `REHEARSE_IMAGE_TAG` updated in
  the mode-0600 production environment file.

## Migration and data boundary

- Before migration, a mode-0600 PostgreSQL custom-format backup was written to
  `.secrets/lfl032-pre-migration.dump` inside PCT128.
- The first migration attempt failed because PostgreSQL could not infer the
  partial unique index for the historical assignment backfill. The migration
  transaction rolled back; no DDL or backfill from that attempt persisted.
- Commit `64bfade` added the required `revoked_at IS NULL` conflict predicate.
  Migration `018_protefl_assigned_resources.sql` then applied successfully
  once, using the tools image from that commit.
- Read-only post-migration counts: one migration-ledger entry, one seeded
  Listening resource, 21 historical assignments and 21 distinct actors with
  existing pilot attempts. Existing formal attempts were not rewritten.
- PostgreSQL container ID remained
  `b8d72c028dc252b4d53fb7df208e51ca9d0c7af99ea6d87fb7618095603b03e3` and
  remained healthy. Only `rehearse-app-1` was recreated.

## Deployment verification

- Production Compose configuration passed its quiet validation.
- The PCT128 app container reported healthy on `rehearse-app:8196e28`.
- LAN `http://192.168.8.63:3001/api/health` and public
  `https://rehearse.najala.org/api/health` returned `health.v1` OK.
- An unauthenticated request to `/test-center/manage` returned HTTP 307 to
  `/login?next=%2Ftest-center%2Fmanage`, confirming the management destination
  survives the login redirect.
- Public homepage HTML contained the Najala affiliation. The manager page and
  its resources are role-protected; no production teacher/admin credentials
  were used, so the authenticated controls and candidate assignment journey
  remain for the operator to inspect.
- Both supplied Najala PNG logo assets returned HTTP 200 with `image/png`.
- No deployed browser visual review was performed.
- Local ESLint, TypeScript, and Next production builds passed. No test suite or
  authenticated production browser journey was run.

## Rollback

Restore the prior reHEARse app image tag and recreate only the app service.
Keep migration 018 and its additive resource/assignment records in place; do
not delete assessment attempts or roll back PostgreSQL data. The pre-release
environment file and database dump remain protected in PCT128 `.secrets/`.
