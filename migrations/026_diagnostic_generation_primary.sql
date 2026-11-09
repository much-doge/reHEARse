ALTER TABLE protefl_diagnostic_attempt
  DROP CONSTRAINT protefl_diagnostic_attempt_check;

ALTER TABLE protefl_diagnostic_attempt
  ADD CONSTRAINT protefl_diagnostic_primary_is_root_check
  CHECK (NOT is_primary OR scope = 'full');

COMMENT ON CONSTRAINT protefl_diagnostic_primary_is_root_check
  ON protefl_diagnostic_attempt IS
  'A current primary is a root/full attempt; its sequence number may exceed one after an archived generation.';
