# LFL-083 — Latest completed result in the teacher roster

## Problem

The teacher cohort snapshot used each candidate's single latest root attempt for
both live progress and completed response totals. A learner who had a completed
result and then started another root attempt appeared as in progress, but their
previous completed result was unavailable to the cohort summary.

## Change

The roster query now keeps the existing `latest_attempt` for live status and
adds `latest_completed_attempt`, selected from the newest non-archived completed
root with a stored result. The cohort snapshot uses the completed result for
response totals while retaining the live attempt for completion/in-progress
counts.

## Safety boundary

Both values are read-only projections over immutable attempt/result rows. No
attempt is closed, copied, archived, or re-scored. Detailed candidate history
continues to load through the existing authenticated teacher boundary.

## Verification state

Source-complete. Changed-path ESLint, TypeScript, resource-adapter tests (7
passed), and `git diff --check` passed. Deployment and authenticated teacher
visual review remain pending.
