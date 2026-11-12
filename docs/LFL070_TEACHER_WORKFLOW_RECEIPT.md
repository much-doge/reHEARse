# LFL-070 teacher workflow hardening

Status: source-complete; deployment pending

## Scope

This work hardens the Test Center teacher boundary and corrects the section-reset
control contract without rewriting learner attempts or results.

- Teacher resource and candidate summaries are scoped to resources owned by the
  teacher through `created_by`, issued invites, or issued assignments; admins
  retain the global workspace.
- Candidate history reads require the exact assignment issuer at the adapter
  boundary. The role check in the route is not treated as ownership.
- Resource tags, issue-code, and publish/hide mutations require the same owner
  check.
- Credential resets are tied to the exact additive assignment and the audit row
  records that assignment ID.
- Teacher-issued Listening, Structure, and Reading resets are independently
  guarded. A duplicate reset for the same assignment, learner, and section is
  still rejected, while a reset in another section may be created immediately.
- Local teacher state updates match the additive assignment ID rather than only
  the learner actor ID.
- Access-code controls are stored per resource card so one resource's scope or
  playback choice cannot silently carry into another.

## Preservation and rollback

No attempt, event, result, assignment, or source package is deleted or rewritten.
Migrations 039 and 040 only add assignment-scoped reset behavior and replace the
active-attempt uniqueness indexes with scoped variants. Rollback is to restore
the previous indexes from migration 038 and leave the nullable audit column in
place, after confirming there are no same-assignment cross-section active
attempts.

## Verification

- Changed-path ESLint passed.
- Repository TypeScript check passed.
- 52 Vitest files / 194 tests passed.
- Next production build passed.
- `git diff --check` passed.
- No deployment or authenticated browser journey was performed in this source
  milestone.

## Remaining follow-up

Generic package routing is intentionally not guessed in this milestone. The
diagnostic route and adapter still require the currently supported package
manifest; a future Practice Test B full-package integration must add its own
manifest/content/key/timing resolver before exposing a learner link.
