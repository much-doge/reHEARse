-- LFL-070: keep credential-reset audit tied to the exact additive assignment.
ALTER TABLE app_password_reset
  ADD COLUMN assignment_id uuid REFERENCES protefl_resource_assignment(id) ON DELETE RESTRICT;

CREATE INDEX app_password_reset_assignment_created_idx
  ON app_password_reset (assignment_id, created_at DESC);
