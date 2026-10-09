-- Additive: older single-recording runs retain their existing immutable pin.
ALTER TABLE ladder_run ADD COLUMN passage_versions_json jsonb;
ALTER TABLE ladder_session ADD COLUMN passage_versions_json jsonb;
ALTER TABLE ladder_run ADD CONSTRAINT ladder_run_passage_versions_array
  CHECK (passage_versions_json IS NULL OR (jsonb_typeof(passage_versions_json)='array' AND jsonb_array_length(passage_versions_json) BETWEEN 2 AND 3));
ALTER TABLE ladder_session ADD CONSTRAINT ladder_session_passage_versions_array
  CHECK (passage_versions_json IS NULL OR (jsonb_typeof(passage_versions_json)='array' AND jsonb_array_length(passage_versions_json) BETWEEN 2 AND 3));
