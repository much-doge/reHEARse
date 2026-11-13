# LFL-084 — Reset-aware compact cohort summary

## Problem

The detailed teacher history already projected completed teacher-issued section
resets through `effectiveDiagnosticResult`, but the compact roster's newly added
latest-completed projection initially exposed only the original result. A cohort
summary could therefore disagree with the expanded candidate history after a
section reset.

## Change

The completed projection now carries its child retake/reset evidence. The server
maps completed, non-archived teacher-issued section resets into an effective
result before returning the compact roster. The existing cohort snapshot then
uses that effective result for correct/incorrect/omitted totals and section
breakdowns, while live progress still comes from the separate latest attempt.

## Safety boundary

Reset attempts and original results remain immutable. The projection ignores
ordinary missed-item retakes for score totals and only applies completed,
non-archived teacher-issued section resets, matching the existing detailed
history semantics.

## Verification state

Source-complete. Changed-path ESLint, TypeScript, resource-adapter tests (7
passed), and `git diff --check` passed. Deployment and authenticated teacher
visual review remain pending.
