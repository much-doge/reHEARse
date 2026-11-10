ALTER TABLE vocabulary_invite
  ADD COLUMN package_version integer NOT NULL DEFAULT 1 CHECK (package_version > 0);

ALTER TABLE vocabulary_assignment
  ADD COLUMN package_version integer NOT NULL DEFAULT 1 CHECK (package_version > 0);

UPDATE vocabulary_deck
SET contract_version = 'toefl-vocabulary-package.v2', version = 2
WHERE id = 'toefl-itp-full-frequency' AND version = 1 AND state = 'published';

COMMENT ON COLUMN vocabulary_invite.package_version IS
  'Pins future learner claims to an immutable vocabulary content package version.';
COMMENT ON COLUMN vocabulary_assignment.package_version IS
  'Keeps each learner assignment on the exact vocabulary content version claimed.';
