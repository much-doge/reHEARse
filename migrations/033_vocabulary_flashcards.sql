CREATE TABLE vocabulary_deck (
  id text PRIMARY KEY,
  contract_version text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  title text NOT NULL,
  state text NOT NULL CHECK (state IN ('published', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO vocabulary_deck (id, contract_version, version, title, state)
VALUES ('toefl-itp-full-frequency', 'toefl-vocabulary-package.v1', 1,
  'TOEFL ITP Vocabulary · Frequency Review', 'published');

CREATE TABLE vocabulary_invite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id text NOT NULL REFERENCES vocabulary_deck(id) ON DELETE RESTRICT,
  code_hash char(64) NOT NULL UNIQUE,
  invite_kind text NOT NULL CHECK (invite_kind IN ('private', 'classroom')),
  assignment_title text NOT NULL CHECK (char_length(assignment_title) BETWEEN 1 AND 120),
  created_by uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  revoked_at timestamptz
);

CREATE TABLE vocabulary_assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invite_id uuid NOT NULL REFERENCES vocabulary_invite(id) ON DELETE RESTRICT,
  deck_id text NOT NULL REFERENCES vocabulary_deck(id) ON DELETE RESTRICT,
  learner_id uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  assigned_by uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  assignment_title text NOT NULL CHECK (char_length(assignment_title) BETWEEN 1 AND 120),
  created_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  UNIQUE (invite_id, learner_id)
);

CREATE INDEX vocabulary_assignment_learner_idx
  ON vocabulary_assignment (learner_id, created_at DESC) WHERE revoked_at IS NULL;
CREATE INDEX vocabulary_assignment_teacher_idx
  ON vocabulary_assignment (assigned_by, created_at DESC) WHERE revoked_at IS NULL;

CREATE TABLE vocabulary_attempt (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES vocabulary_assignment(id) ON DELETE RESTRICT,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  previous_attempt_id uuid REFERENCES vocabulary_attempt(id) ON DELETE RESTRICT,
  package_version integer NOT NULL,
  card_order jsonb NOT NULL CHECK (jsonb_typeof(card_order) = 'array'),
  status text NOT NULL CHECK (status IN ('active', 'completed', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  archived_at timestamptz,
  archived_by uuid REFERENCES app_user(id) ON DELETE RESTRICT,
  UNIQUE (assignment_id, attempt_number)
);

CREATE UNIQUE INDEX vocabulary_one_active_attempt_idx
  ON vocabulary_attempt (assignment_id) WHERE status = 'active';

CREATE TABLE vocabulary_event (
  id bigserial PRIMARY KEY,
  attempt_id uuid NOT NULL REFERENCES vocabulary_attempt(id) ON DELETE RESTRICT,
  card_id text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('opened', 'answered')),
  selected_parts text[],
  is_correct boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (event_type = 'opened' AND selected_parts IS NULL AND is_correct IS NULL)
    OR (event_type = 'answered' AND selected_parts IS NOT NULL AND is_correct IS NOT NULL)
  )
);

CREATE INDEX vocabulary_event_attempt_card_idx
  ON vocabulary_event (attempt_id, card_id, id DESC);

COMMENT ON TABLE vocabulary_event IS
  'Append-only, vocabulary-only item opens and responses; never joined into listening diagnostics, learner profiles, or formal test records.';
