ALTER TABLE listening_attempt
  ADD COLUMN submission_key uuid,
  ADD COLUMN submission_digest text,
  ADD CONSTRAINT listening_attempt_submission_pair CHECK (
    (submission_key IS NULL AND submission_digest IS NULL)
    OR (submission_key IS NOT NULL AND submission_digest IS NOT NULL AND submission_digest ~ '^[a-f0-9]{64}$')
  );
CREATE UNIQUE INDEX listening_attempt_submission_unique
  ON listening_attempt (learner_id, submission_key)
  WHERE submission_key IS NOT NULL;
