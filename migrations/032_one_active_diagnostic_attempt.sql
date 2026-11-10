CREATE UNIQUE INDEX protefl_diagnostic_one_active_attempt_idx
  ON protefl_diagnostic_attempt(resource_id, actor_id)
  WHERE status = 'in_progress' AND archived_at IS NULL;

COMMENT ON INDEX protefl_diagnostic_one_active_attempt_idx IS
  'Prevents concurrent teacher resets or learner starts from creating overlapping active diagnostic attempts.';
