-- LFL-069: a learner may receive the same resource more than once (for
-- example a full diagnostic followed by a Reading-only assignment).  The
-- invite is the assignment key; claiming another invite must never overwrite
-- the earlier learner-facing card or its attempt lineage.
DROP INDEX IF EXISTS protefl_resource_assignment_active_idx;
CREATE UNIQUE INDEX protefl_resource_assignment_active_invite_idx
  ON protefl_resource_assignment(resource_id, actor_id, invite_id)
  WHERE revoked_at IS NULL AND invite_id IS NOT NULL;
CREATE UNIQUE INDEX protefl_resource_assignment_active_historical_idx
  ON protefl_resource_assignment(resource_id, actor_id)
  WHERE revoked_at IS NULL AND invite_id IS NULL;

ALTER TABLE protefl_diagnostic_attempt
  ADD COLUMN assignment_id uuid REFERENCES protefl_resource_assignment(id) ON DELETE RESTRICT;

-- Before this migration there could only be one active assignment per
-- resource/learner, so this backfill is deterministic and preserves every
-- existing attempt without rewriting its evidence.
UPDATE protefl_diagnostic_attempt d
SET assignment_id = a.id
FROM protefl_resource_assignment a
WHERE d.assignment_id IS NULL
  AND a.resource_id = d.resource_id
  AND a.actor_id = d.actor_id
  AND a.revoked_at IS NULL;

CREATE INDEX protefl_diagnostic_attempt_assignment_idx
  ON protefl_diagnostic_attempt(assignment_id, attempt_number DESC);

ALTER TABLE protefl_diagnostic_attempt
  DROP CONSTRAINT IF EXISTS protefl_diagnostic_attempt_resource_id_actor_id_attempt_number_key;
CREATE UNIQUE INDEX protefl_diagnostic_attempt_assignment_number_idx
  ON protefl_diagnostic_attempt(assignment_id, actor_id, attempt_number)
  WHERE assignment_id IS NOT NULL;
CREATE UNIQUE INDEX protefl_diagnostic_attempt_legacy_number_idx
  ON protefl_diagnostic_attempt(resource_id, actor_id, attempt_number)
  WHERE assignment_id IS NULL;

DROP INDEX IF EXISTS protefl_diagnostic_primary_attempt_idx;
CREATE UNIQUE INDEX protefl_diagnostic_primary_attempt_assignment_idx
  ON protefl_diagnostic_attempt(assignment_id, actor_id, delivery_scope)
  WHERE is_primary AND archived_at IS NULL AND assignment_id IS NOT NULL;
CREATE UNIQUE INDEX protefl_diagnostic_primary_attempt_legacy_idx
  ON protefl_diagnostic_attempt(resource_id, actor_id, delivery_scope)
  WHERE is_primary AND archived_at IS NULL AND assignment_id IS NULL;

DROP INDEX IF EXISTS protefl_diagnostic_one_active_attempt_idx;
CREATE UNIQUE INDEX protefl_diagnostic_one_active_attempt_assignment_idx
  ON protefl_diagnostic_attempt(assignment_id, actor_id)
  WHERE status = 'in_progress' AND archived_at IS NULL AND assignment_id IS NOT NULL;
CREATE UNIQUE INDEX protefl_diagnostic_one_active_attempt_legacy_idx
  ON protefl_diagnostic_attempt(resource_id, actor_id)
  WHERE status = 'in_progress' AND archived_at IS NULL AND assignment_id IS NULL;

COMMENT ON COLUMN protefl_diagnostic_attempt.assignment_id IS
  'Exact learner assignment that created this attempt; additive assignment identity introduced by LFL-069.';
