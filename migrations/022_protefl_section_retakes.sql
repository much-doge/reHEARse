ALTER TABLE protefl_diagnostic_attempt
  ADD COLUMN scope text NOT NULL DEFAULT 'full'
    CHECK (scope IN ('full', 'listening', 'structure', 'reading')),
  ADD COLUMN parent_attempt_id uuid REFERENCES protefl_diagnostic_attempt(id) ON DELETE RESTRICT,
  ADD COLUMN section_retake_number integer CHECK (section_retake_number > 0),
  ADD CHECK (
    (scope = 'full' AND parent_attempt_id IS NULL AND section_retake_number IS NULL)
    OR
    (scope <> 'full' AND parent_attempt_id IS NOT NULL AND section_retake_number IS NOT NULL AND is_primary = false)
  );

CREATE UNIQUE INDEX protefl_diagnostic_section_retake_number_idx
  ON protefl_diagnostic_attempt(parent_attempt_id, scope, section_retake_number)
  WHERE scope <> 'full';

CREATE INDEX protefl_diagnostic_active_scope_idx
  ON protefl_diagnostic_attempt(actor_id, resource_id, status, scope, attempt_number DESC);

COMMENT ON COLUMN protefl_diagnostic_attempt.scope IS 'full for the immutable diagnostic lineage; otherwise one isolated post-completion section retake.';
COMMENT ON COLUMN protefl_diagnostic_attempt.parent_attempt_id IS 'Completed full diagnostic that authorized this section retake; its result is never updated.';
