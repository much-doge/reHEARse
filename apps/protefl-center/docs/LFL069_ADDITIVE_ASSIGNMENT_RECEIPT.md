# LFL-069 additive assignment and package-template receipt

## Scope

This change repairs the Test Center access boundary when one learner receives
the same diagnostic resource more than once with different scopes or teacher
labels. A new invite is now an additive assignment. The prior learner card and
all of its attempts remain visible, and the new card opens only the new
assignment's attempt lineage.

## Root cause

The old active-assignment unique index used only `(resource_id, actor_id)`, and
`claimResource` used an upsert on that pair. Claiming a Reading-only invite
after a full diagnostic therefore overwrote the earlier assignment's scope,
title, and invite identity. Diagnostic start/resume also selected one
assignment by resource and actor, so duplicate cards could not be addressed
reliably.

## Corrective design

- Active invite assignments are unique by `(resource_id, actor_id, invite_id)`;
  historical rows without an invite retain a separate one-row guard.
- Diagnostic attempts carry `assignment_id`. Existing attempts are backfilled
  to the sole active assignment that existed before this migration.
- Attempt-number, primary-attempt, and active-attempt guards are assignment
  scoped, with legacy partial indexes retained only for any unmapped rows.
- Candidate resource links include the opaque assignment ID, and all start,
  resume, history, retake, and candidate review queries select that exact
  assignment.
- Teacher history/reset queries use the assignment ID so two labels for the
  same learner do not share answer history or reset controls.

No answer, event, result, assignment, or attempt is deleted or rewritten.

## Repeatable bootstrap evaluation

The reusable package template is in
`apps/protefl-center/docs/FULL_TEST_BOOTSTRAP.md`. It requires editable
questions/options/directions, source-checked keys, timing/audio maps,
version/hash pins, scope-aware assignments, and separate content/audio/layout
verification gates. Raw page screenshots remain private source evidence only.

The current Practice Test A package passes the structural template audit:
Listening 50 items and 50 timing-map entries; Structure 15 Part A plus 25 Part
B items (40 keyed); Reading 50 questions across five passages; and directions
for Listening, Structure, and Reading with Structure Parts A/B represented in
the instruction contract. The manifest remains the package's source/hash
authority; classroom audibility and authenticated duplicate-card browser
review are still separate gates.

## Verification record

| State | Evidence |
|---|---|
| Source | Migration 038 and assignment-aware adapters/UI committed under LFL-069 |
| Type/test | `tsc --noEmit`; focused `postgres-resources.test.ts` (6 tests) |
| Database | Mode-0600 custom-format backup `/tmp/rehearse-dev1-lfl069-20261112-111810.dump` (2,487,081 bytes; `pg_restore --list` via PostgreSQL container); migration 038 applied once; 50 active assignments, 49 attempts, and 0 attempts without `assignment_id`; a rolled-back SQL canary created two same-resource assignments for one learner from different invites |
| Deployment | Debian dev1 image `rehearse-app:0dcb54d`; local/public `/api/health` HTTP 200; logged-out teaching route 307; unauthenticated teaching history API 401; app container running with PostgreSQL untouched after migration; legacy diagnostic URLs still resolve to the learner's active assignment when no query key is present |
| Classroom | Not run |

## Rollback

Application rollback is the previous dev1 image. Migration 038 is additive but
its index/column changes must remain in place while assignment-aware code is
running; restoring the pre-migration database requires the validated backup,
not a destructive down-migration.
