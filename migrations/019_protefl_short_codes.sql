ALTER TABLE protefl_resource_invite
  ADD COLUMN listening_mode text NOT NULL DEFAULT 'question_click'
  CHECK (listening_mode IN ('autoplay', 'question_click'));

ALTER TABLE protefl_resource_assignment
  ADD COLUMN listening_mode text NOT NULL DEFAULT 'question_click'
  CHECK (listening_mode IN ('autoplay', 'question_click'));

CREATE TABLE protefl_resource_claim_rate_limit (
  actor_id uuid PRIMARY KEY,
  window_started_at timestamptz NOT NULL,
  attempt_count integer NOT NULL CHECK (attempt_count BETWEEN 1 AND 10)
);

INSERT INTO protefl_resource(code, version, kind, title, status, listening_form_id)
VALUES ('ets-volume3-practice-test-a', 1, 'diagnostic_package', 'TOEFL ITP Level 1 · Practice Test A Diagnostic', 'draft', NULL)
ON CONFLICT (code, version) DO NOTHING;

COMMENT ON COLUMN protefl_resource_invite.listening_mode IS 'Pinned at invite creation and copied to its assignment; applies to diagnostic package Listening playback.';
COMMENT ON COLUMN protefl_resource_assignment.listening_mode IS 'Listening playback preference selected by staff when issuing the assignment code.';
COMMENT ON TABLE protefl_resource_claim_rate_limit IS 'Limits each authenticated actor to ten invite-code claims per database hour; stores no attempted code.';
