-- LFL-077: prevent newly-created diagnostic attempts from being pinned to a
-- different delivery scope than the exact learner assignment that owns them.
-- Existing rows are intentionally untouched; they remain immutable evidence and
-- are handled by the runtime compatibility path.
CREATE OR REPLACE FUNCTION protefl_diagnostic_attempt_assignment_scope_guard()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  assignment_scope text;
BEGIN
  IF NEW.assignment_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT delivery_scope INTO assignment_scope
  FROM protefl_resource_assignment
  WHERE id = NEW.assignment_id;

  IF assignment_scope IS NULL OR NEW.delivery_scope IS DISTINCT FROM assignment_scope THEN
    RAISE EXCEPTION 'diagnostic attempt delivery scope does not match assignment';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protefl_diagnostic_attempt_assignment_scope_guard
  ON protefl_diagnostic_attempt;

CREATE TRIGGER protefl_diagnostic_attempt_assignment_scope_guard
  BEFORE INSERT OR UPDATE OF assignment_id, delivery_scope
  ON protefl_diagnostic_attempt
  FOR EACH ROW
  EXECUTE FUNCTION protefl_diagnostic_attempt_assignment_scope_guard();

COMMENT ON FUNCTION protefl_diagnostic_attempt_assignment_scope_guard() IS
  'Keeps new attempt metadata aligned with its exact assignment scope without rewriting historical rows.';
