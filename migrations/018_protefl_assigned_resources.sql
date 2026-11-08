CREATE TABLE protefl_resource (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL,
  version integer NOT NULL CHECK (version > 0),
  kind text NOT NULL CHECK (kind IN ('listening_form', 'diagnostic_package')),
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'hidden', 'retired')),
  listening_form_id uuid REFERENCES protefl_test_form(id) ON DELETE RESTRICT,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (code, version),
  CHECK (
    (kind = 'listening_form' AND listening_form_id IS NOT NULL)
    OR (kind = 'diagnostic_package' AND listening_form_id IS NULL)
  )
);

CREATE UNIQUE INDEX protefl_resource_listening_form_version_idx
  ON protefl_resource(listening_form_id, version)
  WHERE listening_form_id IS NOT NULL;
CREATE INDEX protefl_resource_visibility_idx
  ON protefl_resource(status, created_at DESC);

CREATE TABLE protefl_resource_invite (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES protefl_resource(id) ON DELETE RESTRICT,
  code_hash char(64) NOT NULL UNIQUE,
  created_by uuid NOT NULL,
  expires_at timestamptz NOT NULL,
  claimed_at timestamptz,
  claimed_by uuid,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX protefl_resource_invite_resource_idx
  ON protefl_resource_invite(resource_id, created_at DESC);

CREATE TABLE protefl_resource_assignment (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES protefl_resource(id) ON DELETE RESTRICT,
  actor_id uuid NOT NULL,
  assigned_by uuid,
  invite_id uuid REFERENCES protefl_resource_invite(id) ON DELETE RESTRICT,
  assignment_kind text NOT NULL CHECK (assignment_kind IN ('invite', 'historical')),
  starts_at timestamptz NOT NULL DEFAULT now(),
  ends_at timestamptz,
  revoked_at timestamptz,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at IS NULL OR ends_at > starts_at)
);
CREATE UNIQUE INDEX protefl_resource_assignment_active_idx
  ON protefl_resource_assignment(resource_id, actor_id)
  WHERE revoked_at IS NULL;
CREATE INDEX protefl_resource_assignment_actor_idx
  ON protefl_resource_assignment(actor_id, assigned_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE protefl_resource_event (
  id bigserial PRIMARY KEY,
  resource_id uuid NOT NULL REFERENCES protefl_resource(id) ON DELETE RESTRICT,
  actor_id uuid NOT NULL,
  invite_id uuid REFERENCES protefl_resource_invite(id) ON DELETE RESTRICT,
  event_type text NOT NULL CHECK (event_type IN ('published', 'hidden', 'invite_created', 'invite_claimed')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX protefl_resource_event_resource_idx
  ON protefl_resource_event(resource_id, created_at DESC);

INSERT INTO protefl_resource(code, version, kind, title, status, listening_form_id, published_at)
SELECT 'ptc-listening-2000-10', f.version, 'listening_form', f.title, 'published', f.id, f.published_at
FROM protefl_test_form f
WHERE f.code = 'ptc-listening-2000-10-v2' AND f.retired_at IS NULL
ON CONFLICT (code, version) DO NOTHING;

-- Preserve access for people who already have a pilot attempt. New candidates
-- receive access only after claiming a teacher/admin-issued invite.
INSERT INTO protefl_resource_assignment(resource_id, actor_id, assignment_kind)
SELECT DISTINCT r.id, a.actor_id, 'historical'
FROM protefl_attempt a
JOIN protefl_resource r ON r.listening_form_id = a.form_id
ON CONFLICT (resource_id, actor_id) DO NOTHING;

COMMENT ON TABLE protefl_resource IS 'D-031 Test Center-only resource catalogue; learner visibility requires an assignment.';
COMMENT ON TABLE protefl_resource_invite IS 'One-use invite codes are stored only as SHA-256 hashes and are never logged.';
COMMENT ON TABLE protefl_resource_assignment IS 'Opaque actor IDs are supplied by the authenticated route adapter; no foreign key to reHEARse identity.';
