-- v3 is additive: active v1/v2 attempts stay pinned, while unrevoked
-- assignments use v3 when their next round is created. Existing invites retain
-- their pinned version so a code already shared with learners stays stable.
UPDATE vocabulary_deck
SET contract_version = 'toefl-vocabulary-package.v3', version = 3
WHERE id = 'toefl-itp-full-frequency'
  AND state = 'published'
  AND version = 2;

UPDATE vocabulary_assignment
SET package_version = 3
WHERE deck_id = 'toefl-itp-full-frequency'
  AND revoked_at IS NULL
  AND package_version = 2;

COMMENT ON COLUMN vocabulary_attempt.package_version IS
  'Pins the complete word-card content and examples to an immutable package version.';
