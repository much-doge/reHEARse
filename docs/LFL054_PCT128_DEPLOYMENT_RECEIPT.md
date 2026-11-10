# LFL-054 PCT128 production deployment receipt

Date: 2026-11-10 (Asia/Jakarta)

Environment: Countryroad Proxmox PCT 128, public origin
`https://rehearse.najala.org`

Implementation commit/image: `b53b45e` / `rehearse-app:b53b45e`

## Deployment

The live app was `rehearse-app:a939b10` and the production database migration
ledger was current through migration 032. The exact committed release was
assembled in the isolated guest directory
`/opt/rehearse/.releases/b53b45e`, using the previous release as a base plus
the committed changes since `a939b10`. The transferred change archive SHA-256
was `26a39c059da5e5fadb47d7801d688b44d532f61ad596bf9e246082fc57057e7d`.
PCT128 production tools and app images built successfully; the in-image Next
production build and TypeScript phase passed.

Before migration 033, a custom-format PostgreSQL backup was written to
`/opt/rehearse/.secrets/lfl054-pre-migration.dump`, mode `0600`, size
2,490,378 bytes. `pg_restore --list` validated the backup. Migration
`033_vocabulary_flashcards.sql` applied successfully and is recorded in
`app_migration`; the TOEFL frequency deck is published. There are currently
zero vocabulary invites, assignments, and attempts.

Only the `app` service was recreated for the release. PostgreSQL remains
healthy with zero restarts. For app-only rollback, select the retained image
`rehearse-app:a939b10` and recreate only the app service. Keep additive
migration 033 in place; do not restore the database backup over live learner
data except as an explicit disaster-recovery decision.

## Verification

- `rehearse-app-1` runs `rehearse-app:b53b45e`, is healthy, and has zero
  restarts. PostgreSQL is healthy with zero restarts.
- PCT LAN and public `/api/health` returned HTTP 200.
- Signed-out learner and teacher pages returned HTTP 307 with private,
  no-store cache controls.
- Signed-out learner and teacher APIs returned HTTP 401 with private,
  no-store and `Vary: Cookie` headers.
- Local changed-path ESLint, TypeScript, Next production build, vocabulary
  package invariants, and `git diff --check` passed. No tests were run.
- No authenticated teacher or learner browser journey was exercised. The
  release is deployed and healthy, but classroom verification remains open.
