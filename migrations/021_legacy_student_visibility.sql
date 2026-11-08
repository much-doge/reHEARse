CREATE TABLE legacy_student_visibility (
  singleton boolean PRIMARY KEY DEFAULT true CHECK (singleton),
  enabled boolean NOT NULL DEFAULT false,
  changed_by uuid,
  changed_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO legacy_student_visibility(singleton, enabled) VALUES (true, false);

COMMENT ON TABLE legacy_student_visibility IS 'Staff-controlled global visibility switch for archived reHEARse learning materials.';
