ALTER TABLE protefl_diagnostic_attempt
  ADD COLUMN archived_at timestamptz,
  ADD COLUMN archived_by uuid,
  ADD COLUMN archive_batch_id uuid,
  ADD CONSTRAINT protefl_diagnostic_attempt_archive_metadata_check CHECK (
    (archived_at IS NULL AND archived_by IS NULL AND archive_batch_id IS NULL)
    OR
    (archived_at IS NOT NULL AND archived_by IS NOT NULL AND archive_batch_id IS NOT NULL)
  );

DROP INDEX protefl_diagnostic_primary_attempt_idx;
CREATE UNIQUE INDEX protefl_diagnostic_primary_attempt_idx
  ON protefl_diagnostic_attempt(resource_id, actor_id, delivery_scope)
  WHERE is_primary AND archived_at IS NULL;

CREATE INDEX protefl_diagnostic_current_attempt_idx
  ON protefl_diagnostic_attempt(actor_id, resource_id, attempt_number DESC)
  WHERE archived_at IS NULL;

CREATE TABLE protefl_diagnostic_attempt_archive (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id uuid NOT NULL REFERENCES protefl_resource(id) ON DELETE RESTRICT,
  actor_id uuid NOT NULL,
  archived_by uuid NOT NULL,
  archived_at timestamptz NOT NULL DEFAULT now(),
  attempt_count integer NOT NULL CHECK (attempt_count > 0)
);

ALTER TABLE protefl_diagnostic_attempt
  ADD CONSTRAINT protefl_diagnostic_attempt_archive_batch_fk
  FOREIGN KEY (archive_batch_id)
  REFERENCES protefl_diagnostic_attempt_archive(id)
  ON DELETE RESTRICT;

CREATE TRIGGER protefl_diagnostic_attempt_archive_no_update
  BEFORE UPDATE OR DELETE ON protefl_diagnostic_attempt_archive
  FOR EACH ROW EXECUTE FUNCTION protefl_diagnostic_event_immutable();

COMMENT ON COLUMN protefl_diagnostic_attempt.archived_at IS 'Teacher reset boundary; attempts, events, results, and lineage remain immutable evidence.';
COMMENT ON COLUMN protefl_diagnostic_attempt.archive_batch_id IS 'Audit batch that archived one current candidate/resource generation.';
COMMENT ON TABLE protefl_diagnostic_attempt_archive IS 'Staff-authorized reset audit; contains opaque actor IDs and never deletes assessment evidence.';
