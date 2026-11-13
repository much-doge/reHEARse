# LFL-094 vocabulary contextual POS audit

Status: deployed to PCT128; classroom/browser verification remains pending

## Scope

The complete contextual deck was audited as card data, not as a generic word-list
classification. For each of the 2,948 exposures, the audit checks the single
contextual role, the exact highlighted headword, the UTF-16 highlight offsets,
the sentence boundary, and duplicate contextual identities. A contextual review
of parser disagreements and source-labelled examples found two authored
sentences whose highlighted usage did not match the stored role.

## Corrections

- `combat` remains a noun exposure, but now uses “The army prepared for combat
  near the border.” instead of a verb construction after `to`.
- The source-labelled noun `condense` was replaced by the contemporary noun
  `condensation`, using “Condensation formed on the cold glass of the
  greenhouse.” The previous sentence used `condense` as a verb.

The corrected package is `toefl-vocabulary-package.v5`. The v4 package and all
existing v4 invitations, assignments, attempts, and events remain immutable.
Only new vocabulary codes issued after migration 043 use v5. No learner history
was rewritten.

## Context note

The learner and teacher vocabulary views now state:

> Labels describe the highlighted word in this sentence. A word may take another
> class in a different construction, and some familiar adverb forms can function
> adjectivally in context. Use the sentence as the deciding evidence.

Teacher history now labels the recorded response as “Learner choice” and the
package label as “Expected role in this context,” so a wrong learner selection
cannot be mistaken for the card’s contextual answer.

## Verification

- `python3 scripts/build-toefl-vocabulary-v5.py`
- `python3 scripts/audit-toefl-vocabulary-pos.py`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test` (54 files, 209 tests)
- `corepack pnpm build`
- `git diff --check`

## Deployment and migration evidence

- Deployment date: 2026-11-13 (Asia/Jakarta).
- Source commit: `f384658`.
- Runtime image: `rehearse-app:f384658`, image digest
  `sha256:d91b57d3a1738d902999d665ede5e0ae76c17660895127925227b7edfc2c9c4a`.
- Migrator image: `rehearse-tools:f384658`, image digest
  `sha256:941801b94cddf2daa1e7bf2a27d6b1991a26cf312430d6a8dcd3e18b8ecae1e2`.
- Target: PCT128, application `192.168.8.63`, public origin
  `https://rehearse.najala.org`.
- Before migration, `/opt/rehearse/.secrets/lfl094-pre-migration-20261113213839.dump`
  was written with mode `0600`, size `3,354,321` bytes, and passed
  `pg_restore --list` validation inside the PostgreSQL container.
- Migration `043_vocabulary_pos_context_v5.sql` applied once. The published
  `toefl-itp-full-frequency` deck is v5; the 19 existing assignments and their
  queues remain pinned to v4, preserving their historical package behavior.
- Only the app service was recreated. PostgreSQL remained healthy with zero
  restarts; the app is healthy with zero restarts.
- In-guest and public `/api/health` returned HTTP 200 with
  `{"status":"ok","service":"rehearse","contractVersion":"health.v1"}`.
- Signed-out `/test-center/teaching` returned HTTP 307 with private/no-store
  cache controls. No authenticated classroom journey was claimed here.

Rollback is app-only to the retained `rehearse-app:e344174` image and release
tree; keep migration 043 in place and fix forward for any v5 evidence. Do not
restore the database backup over live data unless the operator explicitly
chooses disaster recovery.
