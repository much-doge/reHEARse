ALTER TABLE protefl_resource_invite
  ADD COLUMN assignment_title text;

ALTER TABLE protefl_resource_assignment
  ADD COLUMN assignment_title text;

ALTER TABLE protefl_resource_invite
  ADD CONSTRAINT protefl_resource_invite_assignment_title_check
  CHECK (assignment_title IS NULL OR (length(btrim(assignment_title)) BETWEEN 1 AND 120));

ALTER TABLE protefl_resource_assignment
  ADD CONSTRAINT protefl_resource_assignment_assignment_title_check
  CHECK (assignment_title IS NULL OR (length(btrim(assignment_title)) BETWEEN 1 AND 120));

COMMENT ON COLUMN protefl_resource_invite.assignment_title IS
  'Teacher-authored descriptive title pinned to an invite; nullable for legacy invites and never used for authorization.';

COMMENT ON COLUMN protefl_resource_assignment.assignment_title IS
  'Teacher-authored title copied from the claiming invite; nullable for legacy assignments and never used for authorization.';
