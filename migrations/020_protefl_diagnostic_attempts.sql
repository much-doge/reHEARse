CREATE TABLE protefl_diagnostic_attempt (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES protefl_resource(id) ON DELETE RESTRICT,
  actor_id uuid NOT NULL,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  is_primary boolean NOT NULL,
  package_version integer NOT NULL CHECK (package_version > 0),
  content_hash char(64) NOT NULL CHECK (content_hash ~ '^[0-9a-f]{64}$'),
  answer_key_hash char(64) NOT NULL CHECK (answer_key_hash ~ '^[0-9a-f]{64}$'),
  score_table_hash char(64) NOT NULL CHECK (score_table_hash ~ '^[0-9a-f]{64}$'),
  timing_map_hash char(64) NOT NULL CHECK (timing_map_hash ~ '^[0-9a-f]{64}$'),
  status text NOT NULL DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed')),
  current_section text NOT NULL DEFAULT 'listening' CHECK (current_section IN ('welcome', 'listening', 'structure', 'reading', 'completed')),
  listening_mode text NOT NULL CHECK (listening_mode IN ('autoplay', 'question_click')),
  listening_started_at timestamptz,
  structure_started_at timestamptz,
  structure_deadline_at timestamptz,
  reading_started_at timestamptz,
  reading_deadline_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE (resource_id, actor_id, attempt_number),
  CHECK (NOT is_primary OR attempt_number = 1),
  CHECK ((status = 'completed' AND current_section = 'completed' AND completed_at IS NOT NULL)
      OR (status = 'in_progress' AND current_section <> 'completed' AND completed_at IS NULL))
);
CREATE UNIQUE INDEX protefl_diagnostic_primary_attempt_idx
  ON protefl_diagnostic_attempt(resource_id, actor_id) WHERE is_primary;
CREATE INDEX protefl_diagnostic_actor_attempts_idx
  ON protefl_diagnostic_attempt(actor_id, resource_id, attempt_number DESC);

CREATE TABLE protefl_diagnostic_event (
  id bigserial PRIMARY KEY,
  attempt_id uuid NOT NULL REFERENCES protefl_diagnostic_attempt(id) ON DELETE RESTRICT,
  idempotency_key uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('answer', 'audio_played', 'section_started', 'section_finished', 'diagnostic_submitted')),
  section text CHECK (section IN ('listening', 'structure', 'reading')),
  question_number smallint CHECK (question_number BETWEEN 1 AND 50),
  answer_choice char(1) CHECK (answer_choice IN ('A', 'B', 'C', 'D')),
  event_data jsonb NOT NULL DEFAULT '{}'::jsonb CHECK (octet_length(event_data::text) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, idempotency_key),
  CHECK ((event_type = 'answer' AND section IS NOT NULL AND question_number IS NOT NULL AND answer_choice IS NOT NULL)
      OR event_type <> 'answer'),
  CHECK ((event_type = 'audio_played' AND section = 'listening' AND question_number IS NOT NULL)
      OR event_type <> 'audio_played')
);
CREATE INDEX protefl_diagnostic_event_attempt_order_idx
  ON protefl_diagnostic_event(attempt_id, id DESC);

CREATE TABLE protefl_diagnostic_result (
  attempt_id uuid PRIMARY KEY REFERENCES protefl_diagnostic_attempt(id) ON DELETE RESTRICT,
  is_primary boolean NOT NULL,
  result_version text NOT NULL,
  package_version integer NOT NULL,
  result_data jsonb NOT NULL CHECK (octet_length(result_data::text) <= 20000),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX protefl_diagnostic_primary_result_idx
  ON protefl_diagnostic_result(attempt_id) WHERE is_primary;

CREATE FUNCTION protefl_diagnostic_event_immutable() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'diagnostic events are append-only';
END;
$$;
CREATE TRIGGER protefl_diagnostic_event_no_update
  BEFORE UPDATE OR DELETE ON protefl_diagnostic_event
  FOR EACH ROW EXECUTE FUNCTION protefl_diagnostic_event_immutable();
CREATE TRIGGER protefl_diagnostic_result_no_update
  BEFORE UPDATE OR DELETE ON protefl_diagnostic_result
  FOR EACH ROW EXECUTE FUNCTION protefl_diagnostic_event_immutable();

COMMENT ON TABLE protefl_diagnostic_attempt IS 'Test Center-only append-lineage diagnostic attempt metadata; never joins reHEARse learning attempts.';
COMMENT ON TABLE protefl_diagnostic_event IS 'Append-only candidate answers and section actions for the ETS Practice Test A diagnostic.';
COMMENT ON TABLE protefl_diagnostic_result IS 'Immutable completed diagnostic summary; retakes get separate rows and cannot change the primary result.';
