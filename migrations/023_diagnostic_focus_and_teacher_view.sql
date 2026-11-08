ALTER TABLE protefl_resource_invite
  ADD COLUMN show_listening_question_text boolean NOT NULL DEFAULT true;

ALTER TABLE protefl_resource_assignment
  ADD COLUMN show_listening_question_text boolean NOT NULL DEFAULT true;

ALTER TABLE protefl_diagnostic_attempt
  ADD COLUMN show_listening_question_text boolean NOT NULL DEFAULT true,
  ADD COLUMN selected_questions jsonb;

ALTER TABLE protefl_diagnostic_attempt
  ADD CONSTRAINT protefl_diagnostic_selected_questions_valid CHECK (
    selected_questions IS NULL OR (
      jsonb_typeof(selected_questions) = 'array'
      AND jsonb_array_length(selected_questions) BETWEEN 1 AND 50
    )
  );

COMMENT ON COLUMN protefl_diagnostic_attempt.selected_questions IS 'Original question numbers included in a focused wrong-answer retake; null means the full section. Immutable attempt scope.';
COMMENT ON COLUMN protefl_diagnostic_attempt.show_listening_question_text IS 'Teacher setting pinned at attempt creation; does not change existing attempts.';
