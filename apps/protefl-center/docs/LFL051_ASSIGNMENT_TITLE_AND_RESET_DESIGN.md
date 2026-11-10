# LFL-051 assignment title and reset design

Status: designed; implementation delegated after design commit

## Assignment-title contract

- New private and classroom codes require a trimmed teacher-authored title of
  1–120 characters.
- Store the title on the invite and copy it into every assignment created from
  that invite. Classroom claimants receive separate assignments with the same
  pinned title.
- Existing invite and assignment rows remain nullable and render the resource
  title as their fallback. Do not backfill an invented class/cohort name.
- Return and render the title only where the authenticated actor already has
  access to that assignment. It is not an authorization input.
- Show it in the code-created receipt, staff candidate context, learner
  assigned-resource card, and diagnostic framing/history where available.
- Treat it as escaped plain text. Do not log it with credentials or learner
  answers.

## Restart contract

- A diagnostic root is any attempt with `parent_attempt_id IS NULL`, regardless
  of whether its scope is `full`, `listening`, `structure`, or `reading`.
- Staff history must return all such roots. Child section retakes remain nested
  beneath their parent root.
- Restart archives all currently unarchived attempts for the selected learner
  and resource in one existing audited archive batch. This includes root and
  child attempts, keeps their events/results immutable, and preserves archived
  history.
- The next start uses the existing assignment's pinned delivery scope,
  Listening mode, question-text setting, and assignment title.
- The UI uses one restart control for every supported diagnostic delivery
  scope and describes the actual scope rather than assuming a full test.
- Unknown resource kinds fail closed. Adding a future resource kind requires a
  recorded restart handler that defines its root evidence and archive rules.

## Acceptance

- Migration is additive and preserves old rows with a deterministic display
  fallback.
- Private and classroom claims pin the supplied title.
- Learner and teacher DTOs expose only the assignment title needed by their
  existing authorized views.
- Full and each section-only diagnostic assignment appear in staff history and
  can be archived/restarted without deleting or rewriting evidence.
- Child retakes archive with the selected diagnostic lineage.
- Cross-learner, cross-resource, revoked-assignment, and unsupported-kind
  reset requests remain unavailable.
- Existing production attempts remain resumable through deployment.
