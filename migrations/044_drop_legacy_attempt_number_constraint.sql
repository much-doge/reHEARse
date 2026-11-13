-- LFL-095: migration 038 replaced the pre-additive attempt-number boundary,
-- but PostgreSQL truncated the original constraint name at 63 characters.
-- Drop both spellings so the exact legacy constraint cannot block a learner's
-- first attempt on a second assignment for the same resource.
ALTER TABLE protefl_diagnostic_attempt
  DROP CONSTRAINT IF EXISTS protefl_diagnostic_attempt_resource_id_actor_id_attempt_num_key,
  DROP CONSTRAINT IF EXISTS protefl_diagnostic_attempt_resource_id_actor_id_attempt_number_key;

COMMENT ON INDEX protefl_diagnostic_attempt_assignment_number_idx IS
  'Assignment-scoped attempt numbering; repeated assignments for one resource and learner are independent.';

COMMENT ON INDEX protefl_diagnostic_attempt_legacy_number_idx IS
  'Legacy rows without assignment identity retain resource-scoped numbering until their historical evidence is retired.';
