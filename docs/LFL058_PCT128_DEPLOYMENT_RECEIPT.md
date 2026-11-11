# LFL-058 PCT128 deployment receipt

Date: 2026-11-11 (Asia/Jakarta)

Environment: Countryroad Proxmox PCT128, public origin
`https://rehearse.najala.org`

Release: `c40add9` / `rehearse-app:c40add9`

## Backup and migration

Before migration, a custom-format PostgreSQL backup was written to
`/opt/rehearse/.secrets/lfl058-pre-migration-c40add9.dump`. The file is mode
0600, 2,606,669 bytes, and passed `pg_restore --list`.

Migration `036_vocabulary_contextual_queue_v4.sql` applied successfully and is
recorded once in `app_migration`. It advanced the published vocabulary deck,
two active assignments, and two active invitations to package v4. The two
existing active attempts remain pinned to package v2 until their learners open
the upgraded assignment; all 56 legacy vocabulary events remain.

Immediately after migration, the new queue, lineage, and practice-event tables
were empty. No production learner attempt, response, reset, or access code was
created for deployment verification.

## Release and verification

- The exact committed release was assembled from the prior `5d064df` release
  plus a `git archive` from `c40add9`; the transfer archive SHA-256 was
  `3bac44d0a62f840a26cd1ec8d2b7ce88e443b34b2cdd92d2942022fc108f719b`.
- PCT128 built `rehearse-tools:c40add9` and `rehearse-app:c40add9`; the in-image
  Next production build and TypeScript phase passed.
- Only the app service was recreated after the additive migration.
- `rehearse-app:c40add9` and PostgreSQL reported healthy with zero restarts.
- PCT128 LAN and public `/api/health` returned HTTP 200.
- Signed-out `/vocabulary` returned HTTP 307 to sign-in with private/no-store
  cache controls.
- Signed-out `/api/vocabulary` returned HTTP 401 with private/no-store and
  `Vary: Cookie`.
- App startup logs contained no runtime error.

The authenticated teacher/learner browser appearance and a real classroom
session remain unverified. Source-complete and isolated-container journey
evidence is recorded in `docs/LFL058_CONTEXTUAL_VOCABULARY_RECEIPT.md`.

## Rollback

For an app-only rollback, recreate the app with the retained
`rehearse-app:5d064df` image while leaving additive migration 036 in place.
After any v4 learner evidence exists, fix forward. Do not restore the backup
over live data unless the operator explicitly chooses disaster recovery,
because doing so would erase later learner evidence.
