ALTER TABLE ladder_session
  ADD COLUMN activity_id text,
  ADD COLUMN activity_version_id uuid REFERENCES activity_version(id),
  ADD COLUMN content_version text,
  ADD COLUMN mechanics_version text;

ALTER TABLE ladder_run
  ADD COLUMN activity_id text,
  ADD COLUMN mechanics_version text,
  ADD COLUMN position integer,
  ADD COLUMN last_transition_json jsonb;

ALTER TABLE ladder_event
  ADD COLUMN transition_json jsonb;

UPDATE ladder_run
SET activity_id = 'three-papers-one-thread',
    mechanics_version = 'legacy-linear.v1'
WHERE activity_id IS NULL;

UPDATE ladder_session s
SET activity_id = 'three-papers-one-thread',
    content_version = 'three-papers-ladder.2026-10-06.v1',
    mechanics_version = 'legacy-linear.v1',
    activity_version_id = coalesce(
      (SELECT r.activity_version_id FROM ladder_run r WHERE r.session_id=s.id ORDER BY r.created_at,r.id LIMIT 1),
      (SELECT av.id
       FROM activity a
       JOIN activity_version av ON av.activity_id=a.id AND av.version_number=a.current_version
       WHERE a.slug='three-papers-one-thread'
       LIMIT 1)
    )
WHERE s.activity_id IS NULL;

ALTER TABLE ladder_run
  ALTER COLUMN activity_id SET NOT NULL,
  ALTER COLUMN mechanics_version SET NOT NULL;

ALTER TABLE ladder_session
  ALTER COLUMN activity_id SET NOT NULL,
  ALTER COLUMN activity_version_id SET NOT NULL,
  ALTER COLUMN content_version SET NOT NULL,
  ALTER COLUMN mechanics_version SET NOT NULL;

CREATE INDEX ladder_activity_runs
  ON ladder_run(activity_id, created_at DESC);
