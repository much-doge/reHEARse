CREATE TABLE ladder_avatar_preference (
  user_id uuid PRIMARY KEY REFERENCES app_user(id) ON DELETE CASCADE,
  avatar_id text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ladder_avatar_change (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid NOT NULL REFERENCES app_user(id),
  run_id uuid NOT NULL REFERENCES ladder_run(id),
  avatar_id text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX ladder_avatar_change_actor_time
  ON ladder_avatar_change(actor_id, created_at DESC);
