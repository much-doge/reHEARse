ALTER TABLE protefl_resource
  ADD COLUMN tags text[] NOT NULL DEFAULT '{}'::text[],
  ADD CONSTRAINT protefl_resource_tags_count_check
  CHECK (cardinality(tags) <= 8);

ALTER TABLE protefl_resource_event
  DROP CONSTRAINT protefl_resource_event_event_type_check;

ALTER TABLE protefl_resource_event
  ADD CONSTRAINT protefl_resource_event_event_type_check
  CHECK (event_type IN ('published', 'hidden', 'invite_created', 'invite_claimed', 'tags_updated'));

COMMENT ON COLUMN protefl_resource.tags IS
  'Staff-authored organizational labels; normalized by the server, never used for access control.';
