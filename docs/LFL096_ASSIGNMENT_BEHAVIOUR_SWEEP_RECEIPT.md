# LFL-096 assignment-behaviour sweep

Status: source-complete; deployment pending

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
- PCT128 deployment and live health verification: pending.
