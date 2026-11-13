-- LFL-088: register the additive ETS Volume 1 Practice Test A package.
-- The resource remains draft until the package receipt's publication gates are
-- complete. Existing Volume 3 resources, assignments, and attempts are untouched.
INSERT INTO protefl_resource(code, version, kind, title, status, listening_form_id)
VALUES (
  'ets-volume1-practice-test-a',
  1,
  'diagnostic_package',
  'TOEFL ITP Level 1 · Volume 1 Practice Test A Diagnostic',
  'draft',
  NULL
)
ON CONFLICT (code, version) DO NOTHING;
