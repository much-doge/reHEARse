-- LFL-111: publish the owner-authorized May 2005 Listening-only package.
-- Publication creates only the catalog resource; it creates no assignments
-- and does not touch existing candidate attempts or results.
INSERT INTO protefl_resource(code, version, kind, title, status, listening_form_id)
VALUES (
  'ets-toefl-pbt-2005-05-listening',
  1,
  'diagnostic_package',
  'TOEFL PBT · May 2005 Listening',
  'published',
  NULL
)
ON CONFLICT (code, version) DO NOTHING;
