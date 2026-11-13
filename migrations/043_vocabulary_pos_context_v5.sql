-- V5 keeps the v4 contextual deck immutable for existing assignments while
-- publishing a corrected card package for future vocabulary codes.
-- No invite, assignment, attempt, event, or learner history is rewritten.

ALTER TABLE vocabulary_practice_queue
  DROP CONSTRAINT IF EXISTS vocabulary_practice_queue_package_version_check;
ALTER TABLE vocabulary_practice_queue
  ADD CONSTRAINT vocabulary_practice_queue_package_version_check
  CHECK (package_version >= 4);

ALTER TABLE vocabulary_queue_lineage
  DROP CONSTRAINT IF EXISTS vocabulary_queue_lineage_package_version_check;
ALTER TABLE vocabulary_queue_lineage
  ADD CONSTRAINT vocabulary_queue_lineage_package_version_check
  CHECK (package_version >= 4);

UPDATE vocabulary_deck
SET contract_version = 'toefl-vocabulary-package.v5', version = 5
WHERE id = 'toefl-itp-full-frequency'
  AND state = 'published'
  AND version = 4;
