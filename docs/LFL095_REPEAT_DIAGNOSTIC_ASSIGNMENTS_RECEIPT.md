# LFL-095 repeated diagnostic assignments

Status: deployed to PCT128; authenticated learner/browser journey remains pending

## Problem evidence

The learner-facing message `The diagnostic could not be opened` is a generic
mapping for any start failure. Production inspection found that migration 038
intended to replace the original resource-wide attempt-number uniqueness rule,
but PostgreSQL had truncated the old constraint name to
`protefl_diagnostic_attempt_resource_id_actor_id_attempt_num_key`. Migration
038 attempted to drop the untruncated name, so the old rule remained active.

That stale rule makes `(resource_id, actor_id, attempt_number)` globally unique
even after assignments became additive. A learner with an earlier assignment
therefore cannot create attempt 1 on a second full or section-only assignment
for the same package; the insert is caught and surfaced as the generic open
error. The assignment and invite rows themselves are present and preserved.

## Planned fix

- Add an additive migration that drops the exact truncated legacy constraint
  (and the previous untruncated spelling defensively).
- Keep assignment-scoped attempt numbering and assignment-scoped active/primary
  indexes as the authoritative boundary.
- Preserve the legacy `(resource, actor, attempt_number)` index only for rows
  that still have `assignment_id IS NULL`.
- Add regression coverage for repeated full assignments and repeated
  section-only assignments, including the first section-only attempt after an
  earlier full assignment.
- Keep old attempts, events, results, and assignment rows immutable.

## Deployment and verification

- Source commit: `8c26678`.
- Target: PCT128, application `192.168.8.63`, public origin
  `https://rehearse.najala.org`.
- Before migration, `/opt/rehearse/.secrets/lfl095-pre-migration-20261114054952.dump`
  was written with mode `0600`, size `3,355,823` bytes, and passed
  `pg_restore --list` validation inside the PostgreSQL container.
- Migrator image: `rehearse-tools:8c26678`, digest
  `sha256:2c73082d8a5e2b0e722cf92194b75e566afbf3c7ed513e6eda71f706738357d1`.
- Migration `044_drop_legacy_attempt_number_constraint.sql` applied once. The
  stale truncated constraint is gone; the assignment-scoped unique index and
  the legacy-only `assignment_id IS NULL` index remain.
- The application image `rehearse-app:f384658` was not restarted because the
  fix is entirely a database constraint correction. The app and PostgreSQL
  containers both remained healthy with zero restarts.
- A production transaction (rolled back without changing data) inserted
  attempt number 1 for the existing learner's second `structure` assignment
  and second `full` assignment while an earlier full assignment already
  existed. Both inserts succeeded, proving the previous conflict boundary is
  removed without creating learner evidence.
- In-guest and public `/api/health` returned HTTP 200 with
  `{"status":"ok","service":"rehearse","contractVersion":"health.v1"}`.

The route still maps unexpected database failures to a generic learner-facing
message; the specific production failure was the stale uniqueness constraint,
which is now removed. Existing assignments, attempts, answers, results, and
access-code claims were not rewritten.

Rollback is migration-safe only by fixing forward; do not restore the database
backup over live data because that would erase later learner evidence. The
previous app image remains available for app-only rollback.
