# LFL-034 access control and role workspaces

Status: deployed to PCT128 on 2026-11-08 (Asia/Jakarta), image `8c9d7f5`.

## Changes

- Split `/dashboard` by server-authenticated role. Teachers and administrators
  receive staff controls and candidate-page access; learners receive their
  own course-resource entry point.
- Moved the previous listening activities, workshop, classroom, game and
  listening ladder under `/legacy/`. Old route roots redirect there.
- Kept server-side `requireUser` checks on every legacy, dashboard and Test
  Center page. Workshop and game APIs now require an active account session;
  room PINs and old membership cookies alone cannot authorize requests.
- Replaced learner workshop, teacher classroom, and Test Center media URLs
  with authenticated app routes that check role, ownership, current assignment
  or room state before streaming bytes. Audio range requests follow the same
  authorization path.
- Set protected pages, APIs and app-served media to private no-store caching.
  The session notice locks protected content when the session expires or cannot
  be revalidated, including when a tab is restored or revisited.
- Extended the safe login-return allowlist to `/legacy/` routes. Without this,
  the protected page correctly redirected to sign-in but the return target
  fell back to `/dashboard`.

## Verification

- ESLint passed.
- TypeScript passed after removing stale `.next/dev/types` generated for the
  old route locations.
- Vitest: 45 files, 170 tests passed, including legacy route mapping and return-path coverage.
- Next.js production build passed and listed all `/legacy/*`, Test Center and
  authenticated media routes as dynamically rendered; the archived route
  redirect proxy was included.
- `git diff --check` passed.
- PCT128 fast-forwarded through `d8f2175`, `2791519`, `44b27a6`, and
  `8c9d7f5`. The app reports healthy on `rehearse-app:8c9d7f5`; PostgreSQL
  remains healthy with its prior container ID unchanged. No database migration
  or learner record changed.
- Live LAN no-cookie requests returned `307` with private no-store headers for
  `/dashboard`, `/test-center`, `/test-center/manage`, `/legacy`, and nested
  legacy pages. Old route aliases (`/learn`, `/workshop`, `/ladder`,
  `/classroom`, `/play`) returned `307` to `/legacy/...`, also with private
  no-store headers and preserved query strings.
- No-cookie requests to `/api/game`, classroom/workshop media, listening media,
  and Test Center media returned `401` with private no-store headers.
- `/api/health` returned `health.v1` OK. No authenticated teacher/learner
  browser journey was performed; not classroom-verified.

## Storage visibility limitation

The production object store currently serves the `rehearse/media` prefix from
a public base URL. This release stops the application from returning raw
object URLs to learner and teacher pages and proxies playback through signed-in
routes. However, an old copied URL or direct request to an already-public
object can still be fetched anonymously until storage/CDN visibility is
changed. The bucket is shared; changing its bucket-level visibility without an
audit could break unrelated files. Do not describe application authorization
as revoking those direct object URLs. Full revocation requires moving the
reHEARse objects to a private bucket or changing the storage/CDN policy after
all bucket consumers are audited.

## Rollback

Restore the prior reHEARse app image and source revision, recreating only the
app service. No database schema or learner records changed. Route moves and
media proxy behavior can be reverted with the same source revision rollback.
