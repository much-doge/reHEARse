CREATE TABLE ladder_session (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 pin char(6) NOT NULL UNIQUE,
 owner_id uuid NOT NULL REFERENCES app_user(id),
 closed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '7 days'
);
CREATE TABLE ladder_run (
 id uuid PRIMARY KEY,
 learner_id uuid NOT NULL REFERENCES app_user(id),
 activity_version_id uuid NOT NULL REFERENCES activity_version(id),
 content_version text NOT NULL,
 session_id uuid REFERENCES ladder_session(id),
 alias text NOT NULL,
 revision integer NOT NULL DEFAULT 0,
 state_json jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX ladder_one_session_run ON ladder_run(session_id,learner_id) WHERE session_id IS NOT NULL;
CREATE INDEX ladder_own_runs ON ladder_run(learner_id,created_at DESC);
CREATE TABLE ladder_event (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 run_id uuid NOT NULL REFERENCES ladder_run(id),
 request_key uuid NOT NULL,
 request_digest char(64) NOT NULL,
 revision integer NOT NULL,
 action_json jsonb NOT NULL,
 feedback_json jsonb,
 created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(run_id,request_key),
 UNIQUE(run_id,revision)
);
