CREATE TABLE workshop_content (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 version text NOT NULL UNIQUE,
 activity_id text NOT NULL,
 grouping_version text NOT NULL,
 pedagogy_version text NOT NULL,
 digest char(64) NOT NULL,
 content_json jsonb NOT NULL,
 media_json jsonb NOT NULL,
 published_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE workshop_room (
 id uuid PRIMARY KEY,
 owner_id uuid NOT NULL REFERENCES app_user(id),
 content_id uuid NOT NULL REFERENCES workshop_content(id),
 pin char(6) NOT NULL UNIQUE,
 phase text NOT NULL DEFAULT 'preparation' CHECK(phase IN ('preparation','practice','finished','closed')),
 group_index integer NOT NULL DEFAULT 0 CHECK(group_index>=0),
 revision integer NOT NULL DEFAULT 0 CHECK(revision>=0),
 created_at timestamptz NOT NULL DEFAULT now(),
 expires_at timestamptz NOT NULL DEFAULT now()+interval '24 hours'
);
CREATE TABLE workshop_participant (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 room_id uuid NOT NULL REFERENCES workshop_room(id),
 token_hash char(64) NOT NULL UNIQUE,
 alias text NOT NULL,
 state_json jsonb NOT NULL DEFAULT '{"items":{},"cursors":{}}',
 revision integer NOT NULL DEFAULT 0,
 joined_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX workshop_participant_room ON workshop_participant(room_id);
CREATE TABLE workshop_event (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 room_id uuid NOT NULL REFERENCES workshop_room(id),
 participant_id uuid REFERENCES workshop_participant(id),
 actor_id uuid REFERENCES app_user(id),
 request_key uuid NOT NULL,
 request_digest char(64) NOT NULL,
 action_json jsonb NOT NULL,
 result_json jsonb NOT NULL,
 created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX workshop_participant_retry ON workshop_event(participant_id,request_key) WHERE participant_id IS NOT NULL;
CREATE UNIQUE INDEX workshop_host_retry ON workshop_event(room_id,request_key) WHERE participant_id IS NULL;
CREATE TABLE workshop_join (
 request_key uuid NOT NULL,
 room_id uuid NOT NULL REFERENCES workshop_room(id),
 token_hash char(64) NOT NULL,
 participant_id uuid NOT NULL REFERENCES workshop_participant(id),
 PRIMARY KEY(room_id,request_key)
);
