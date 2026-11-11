ALTER TABLE vocabulary_practice_queue
  DROP CONSTRAINT IF EXISTS vocabulary_practice_queue_batch_exposure_count_check;

ALTER TABLE vocabulary_practice_queue
  ADD CONSTRAINT vocabulary_practice_queue_batch_exposure_count_check
  CHECK (batch_exposure_count BETWEEN 0 AND 20);
