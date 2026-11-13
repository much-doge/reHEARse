# LFL-082 — Completed-result selection for cohort analytics

## Problem

The cohort question-analytics query selected the newest root attempt by attempt
number and only then discarded rows that were still in progress. If a learner
had a completed result followed by a new in-progress root, that learner vanished
from the teacher's completed-result view.

## Change

The query now selects the newest non-archived root attempt that is already
`completed` and has a stored result. A newer in-progress root therefore remains
visible through the latest completed result until it finishes. The query still
keeps teacher ownership/resource scoping and the existing reset-aware aggregation
path.

## Safety boundary

This is a read-only query correction. It does not close, mutate, archive, or
re-score an in-progress or historical attempt. It only changes which immutable
completed result is included in the cohort analytics view.

## Verification state

Source-complete. Changed-path ESLint, TypeScript, resource-adapter/analytics
tests (9 passed), and `git diff --check` passed. Deployment and authenticated
teacher review remain pending.
