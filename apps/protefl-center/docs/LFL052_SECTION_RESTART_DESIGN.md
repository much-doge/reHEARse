# LFL-052 teacher-issued section restart design

Status: designed

## Problem corrected

LFL-051 made assignment-level restart work for every delivery scope. It did
not provide three independent controls inside an already completed full
diagnostic. A full root stores all three original sections together, so
partially archiving that root would corrupt its historical meaning.

## Contract

- A completed, unarchived full root exposes Listening, Structure and Reading
  restart controls in the authorized teaching workspace.
- A section reset creates a new child attempt for every question in that
  section. `selected_questions` remains null; this distinguishes a full-section
  run from the subset used by a focused missed-question retake.
- The child records that it was teacher-issued and stores only the opaque staff
  actor ID. It pins the parent package version/hashes, Listening mode,
  question-text setting and delivery scope.
- On completion, the latest teacher-issued reset for that section replaces only
  that section in the learner's current recalculated diagnostic score. The
  other sections come from their latest completed teacher-issued resets, or
  from the original full result when no reset exists.
- The recalculation is a read projection over immutable stored results. It does
  not update or replace the original full-result row. Missed-only focused
  retakes never affect it.
- The parent result, answer events, previous focused retakes and previous
  teacher-issued restarts remain immutable and visible.
- At most one unarchived attempt may be in progress for the learner/resource.
  A second restart request fails safely instead of replacing or merging work.
- Authorization requires an active diagnostic assignment and either an admin
  or the teacher who issued it. The parent must belong to the same resource and
  learner and be a completed, unarchived full root.
- Learner and teacher history label the child as a section reset rather than
  a focused retake. After completion, the learner may use the existing
  missed-only retry workflow from that new section result.

## Acceptance

- The teacher sees three independent controls on each eligible completed full
  attempt.
- Each control creates only the requested full-section child attempt and does
  not alter the parent result or sibling-section history.
- Completing it updates the current recalculated score for only that section;
  ordinary retakes leave that score unchanged.
- Active-attempt, cross-learner, cross-resource, non-issuer teacher,
  non-completed-root and unsupported-resource requests are rejected.
- The learner resumes the new section through the existing attempt delivery,
  timing, audio and result workflow.
- Existing attempts remain readable without backfill and production deployment
  performs no real participant restart as a verification step.
