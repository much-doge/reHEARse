CREATE TABLE protefl_test_form (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  version integer NOT NULL,
  title text NOT NULL,
  contract_version text NOT NULL,
  response_window_ms integer NOT NULL CHECK (response_window_ms BETWEEN 1000 AND 60000),
  source_digest char(64) NOT NULL,
  published_at timestamptz NOT NULL DEFAULT now(),
  retired_at timestamptz,
  UNIQUE (code, version)
);

CREATE TABLE protefl_test_item (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES protefl_test_form(id),
  ordinal integer NOT NULL CHECK (ordinal BETWEEN 1 AND 200),
  part text NOT NULL CHECK (part IN ('A', 'B', 'C')),
  passage_group text NOT NULL,
  options_json jsonb NOT NULL,
  answer text NOT NULL CHECK (answer IN ('A', 'B', 'C', 'D')),
  media_storage_key text NOT NULL,
  media_duration_ms integer NOT NULL CHECK (media_duration_ms > 0),
  media_sha256 char(64) NOT NULL,
  media_size_bytes integer NOT NULL CHECK (media_size_bytes > 0),
  UNIQUE (form_id, ordinal)
);

CREATE TABLE protefl_attempt (
  id uuid PRIMARY KEY,
  actor_id uuid NOT NULL,
  form_id uuid NOT NULL REFERENCES protefl_test_form(id),
  kind text NOT NULL CHECK (kind IN ('full', 'remedial')),
  parent_attempt_id uuid REFERENCES protefl_attempt(id),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'submitted', 'invalidated')),
  revision integer NOT NULL DEFAULT 0,
  current_position integer NOT NULL DEFAULT 0 CHECK (current_position >= 0),
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  invalidated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX protefl_attempt_actor_idx ON protefl_attempt(actor_id, created_at DESC);

CREATE TABLE protefl_attempt_item (
  attempt_id uuid NOT NULL REFERENCES protefl_attempt(id),
  item_id uuid NOT NULL REFERENCES protefl_test_item(id),
  sequence integer NOT NULL CHECK (sequence >= 0),
  opened_at timestamptz,
  answer_opens_at timestamptz,
  answer_deadline_at timestamptz,
  choice text CHECK (choice IN ('A', 'B', 'C', 'D')),
  locked_at timestamptz,
  correct boolean,
  PRIMARY KEY (attempt_id, item_id),
  UNIQUE (attempt_id, sequence),
  CHECK ((locked_at IS NULL AND correct IS NULL) OR locked_at IS NOT NULL)
);

CREATE TABLE protefl_attempt_event (
  id bigserial PRIMARY KEY,
  attempt_id uuid NOT NULL REFERENCES protefl_attempt(id),
  actor_id uuid NOT NULL,
  request_key uuid NOT NULL,
  request_digest char(64) NOT NULL,
  action_json jsonb NOT NULL,
  result_json jsonb NOT NULL,
  accepted_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, request_key)
);

COMMENT ON TABLE protefl_attempt IS 'D-028 isolated Test Center pilot attempts; actor_id is an opaque route-adapter subject and has no reHEARse foreign key.';
