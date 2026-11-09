ALTER TABLE protefl_resource_invite
  ADD COLUMN invite_kind text NOT NULL DEFAULT 'private'
  CHECK (invite_kind IN ('private', 'classroom'));

COMMENT ON COLUMN protefl_resource_invite.invite_kind IS
  'Private codes bind to one account; classroom codes may create one isolated assignment per authenticated account until expiry or revocation.';

COMMENT ON TABLE protefl_resource_invite IS
  'Hashed Test Center access codes; private codes are single-account and classroom codes are multi-account assignment issuers.';
