-- LFL-070: allow independent teacher-issued section resets while preserving
-- one active attempt per assignment, learner, and section.
DROP INDEX IF EXISTS protefl_diagnostic_one_active_attempt_assignment_idx;
DROP INDEX IF EXISTS protefl_diagnostic_one_active_attempt_legacy_idx;

CREATE UNIQUE INDEX protefl_diagnostic_one_active_attempt_assignment_scope_idx
  ON protefl_diagnostic_attempt(assignment_id, actor_id, scope)
  WHERE status = 'in_progress' AND archived_at IS NULL AND assignment_id IS NOT NULL;

CREATE UNIQUE INDEX protefl_diagnostic_one_active_attempt_legacy_scope_idx
  ON protefl_diagnostic_attempt(resource_id, actor_id, scope)
  WHERE status = 'in_progress' AND archived_at IS NULL AND assignment_id IS NULL;

COMMENT ON INDEX protefl_diagnostic_one_active_attempt_assignment_scope_idx IS
  'Prevents overlapping active attempts for the same assignment, learner, and section while allowing independent section resets.';
