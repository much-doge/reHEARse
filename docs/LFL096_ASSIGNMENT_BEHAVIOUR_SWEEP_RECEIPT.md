# LFL-096 assignment-behaviour sweep

Status: deployed to PCT128; authenticated learner/teacher journey remains pending

## Scope

This work audits the assignment lifecycle after LFL-095: teacher invite
creation, private/classroom claims, additive learner assignment identity,
scope pinning, start/resume, full and section retakes, teacher resets,
history/archiving, and database integrity. The sweep must preserve all active
and historical attempts.

## Findings

The additive assignment boundary from LFL-095 is sound in the current source
and production schema:

- claims remain idempotent for the same invite, while a new invite creates a
  separate assignment card;
- private and classroom invite paths use the same scoped assignment identity;
- start/resume locks the exact assignment and requires matching delivery scope;
- attempt numbering and active-attempt uniqueness are assignment-scoped, and
  historical legacy rows retain their null-assignment compatibility boundary;
- teacher section resets are scoped by section and keep prior attempts
  append-only; and
- learner history, teacher history, retakes, and resource visibility all carry
  assignment identity rather than collapsing by resource and learner.

The production data sweep found no orphaned attempts, assignment/attempt scope,
actor, or resource mismatches; no duplicate non-archived active attempts; no
duplicate active assignments for the same invite; no retake parent mismatch; no
assignment/invite setting drift; no missing pinned hashes; and no completed
attempt without a result. Current production inventory was 79 active
assignments, 41 invites, 96 attempts (24 active, 65 completed, 7 archived),
and 23 section assignments.

One real source defect remained: `startSectionRetake` resumed any active
retake in the assignment, regardless of the requested section. If a learner
had an active Listening retake and selected Reading, the API could return the
Listening attempt. The query now filters by the requested section, allowing
the existing assignment-scoped unique index to support independent active
section retakes without changing or archiving any existing evidence.

No database migration is required for this correction. Migration 044 remains
the deployed fix for repeated package assignments.

## Verification and deployment

- Focused adapter/resource/delivery tests: 20 passed.
- Full Vitest suite: 55 files, 210 tests passed.
- Changed-file ESLint and repository TypeScript passed.
- Source commit: `c7c8329`.
- PCT128 app-only image: `rehearse-app:c7c8329`, image digest
  `sha256:305fdea307abea6fcba9d24cd413317339cc87c98561f272a206759886be4881`.
- The release was built from the isolated tree
  `/opt/rehearse/.releases/c7c8329`; the dirty operator checkout and its
  unrelated edits were not used or modified. Only the app service was
  recreated. No migration or database write was performed.
- `rehearse-app-1` and `rehearse-postgres-1` are healthy with zero restarts.
- In-guest LAN and public `/api/health` both returned HTTP 200 with
  `{"status":"ok","service":"rehearse","contractVersion":"health.v1"}`.
- Signed-out `/test-center/teaching` returned HTTP 307 and unauthenticated
  `/api/test-center/resources` returned HTTP 401.
- Existing assignments, active attempts, historical attempts, events, and
  results were not rewritten. Authenticated browser and classroom checks remain
  operator-side verification items.

Rollback is app-only to the retained `rehearse-app:f384658` image; no database
rollback is required.
