ALTER TABLE protefl_diagnostic_attempt
  ADD COLUMN teacher_restarted_by uuid,
  ADD CONSTRAINT protefl_diagnostic_teacher_section_restart_check CHECK (
    teacher_restarted_by IS NULL OR (
      scope <> 'full'
      AND parent_attempt_id IS NOT NULL
      AND selected_questions IS NULL
      AND is_primary = false
    )
  );

COMMENT ON COLUMN protefl_diagnostic_attempt.teacher_restarted_by IS
  'Opaque staff actor who issued a full-section child restart; null for roots and learner-created focused retakes.';
