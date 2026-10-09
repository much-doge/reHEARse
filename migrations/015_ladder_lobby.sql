ALTER TABLE ladder_session ADD COLUMN started_at timestamptz;
-- Preserve sessions already in use; new sessions have no start timestamp.
UPDATE ladder_session SET started_at=created_at;
ALTER TABLE ladder_run ADD COLUMN ready_at timestamptz;
ALTER TABLE ladder_run ADD COLUMN avatar_id text;
ALTER TABLE ladder_run ADD COLUMN avatar_palette text;
UPDATE ladder_run r SET ready_at=r.created_at,
  avatar_id=p.avatar_id,avatar_palette=p.avatar_palette
FROM ladder_avatar_preference p WHERE p.user_id=r.learner_id;
UPDATE ladder_run SET ready_at=created_at WHERE ready_at IS NULL;
CREATE TABLE ladder_profile_change (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id uuid NOT NULL REFERENCES ladder_run(id),
  actor_id uuid NOT NULL REFERENCES app_user(id),
  alias text NOT NULL,
  avatar_id text NOT NULL,
  avatar_palette text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
