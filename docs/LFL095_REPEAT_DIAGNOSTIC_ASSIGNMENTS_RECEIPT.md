# LFL-095 repeated diagnostic assignments

Status: planned

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

## Verification

Deployment evidence, migration status, counts, and health checks will be added
after the focused tests and PCT128 rollout complete.
