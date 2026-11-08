ALTER TABLE protefl_resource_invite
  ADD COLUMN delivery_scope text NOT NULL DEFAULT 'full'
    CHECK (delivery_scope IN ('full', 'listening', 'structure', 'reading'));

ALTER TABLE protefl_resource_assignment
  ADD COLUMN delivery_scope text NOT NULL DEFAULT 'full'
    CHECK (delivery_scope IN ('full', 'listening', 'structure', 'reading'));

ALTER TABLE protefl_diagnostic_attempt
  ADD COLUMN delivery_scope text NOT NULL DEFAULT 'full'
    CHECK (delivery_scope IN ('full', 'listening', 'structure', 'reading'));

COMMENT ON COLUMN protefl_resource_invite.delivery_scope IS 'Teacher-selected diagnostic section access pinned when the code is claimed.';
COMMENT ON COLUMN protefl_resource_assignment.delivery_scope IS 'Full diagnostic or one independently assigned section.';
COMMENT ON COLUMN protefl_diagnostic_attempt.delivery_scope IS 'Assignment scope pinned at creation; existing attempts remain full.';
