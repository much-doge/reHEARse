CREATE TABLE app_password_reset (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  reset_by uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  resource_id uuid NOT NULL REFERENCES protefl_resource(id) ON DELETE RESTRICT,
  sessions_revoked integer NOT NULL CHECK (sessions_revoked >= 0),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX app_password_reset_user_created_idx
  ON app_password_reset (user_id, created_at DESC);

CREATE INDEX app_password_reset_actor_created_idx
  ON app_password_reset (reset_by, created_at DESC);

COMMENT ON TABLE app_password_reset IS
  'Staff-initiated learner credential reset audit. Temporary passwords and password hashes are never recorded here.';
