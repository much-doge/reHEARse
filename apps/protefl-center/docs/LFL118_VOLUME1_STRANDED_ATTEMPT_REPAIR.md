# LFL-118 — Volume 1 stranded-attempt repair

Status: production repair complete; learner refresh confirmation pending.

## Incident

Some ETS Volume 1 Practice Test A learners reached the final assigned section
before the LFL-114 score-table compatibility fix was deployed. Their answers
were saved, but final result creation rolled back, leaving the attempts marked
`in_progress` without a result.

The newly reported 17 November attempt is a full three-section assignment and
was still progressing normally through Listening Question 38 at 19:12 Jakarta
time. It is not eligible for completion repair and must remain untouched.

## Production audit

- Published resource: one, version 1.
- Assignments: 31.
- Non-archived attempts: 28.
- Already completed attempts with results: 2.
- Repair eligibility is deliberately narrow. An attempt must be in progress,
  have no result, be in the final section for its immutable scope/delivery
  scope, and contain every required distinct answer:
  - full diagnostic: 140 distinct answers and current section Reading;
  - Reading-only assignment: 50 Reading answers and current section Reading;
  - Structure section reset: 40 Structure answers and current section
    Structure;
  - Listening-only assignment: 50 Listening answers plus the existing audio
    completion evidence (none matched this repair set).
- Four attempts match the first three criteria: two full diagnostics, one
  Reading-only assignment, and one teacher-issued Structure reset.
- Partial attempts—including Reading attempts with 130–138 distinct answers
  and the currently active Listening Question 38 attempt—are excluded.

## Repair contract

1. Take and validate a mode-0600 custom-format database backup before writes.
2. Recheck all eligibility inside one transaction with row locks.
3. Recalculate the result from the immutable pinned answer key and Volume 1
   section-map score table using the same result shapes and version identifiers
   as the deployed adapter.
4. Insert one immutable result and one `diagnostic_submitted` event per eligible
   attempt; mark it completed without rewriting answer events.
5. Include `repairWorkId=LFL-118` in event data and retain the prior last-event
   timestamp for auditability.
6. Roll back the entire transaction unless exactly four attempts still match.
7. Verify result/review cardinality, completed state, event lineage, unaffected
   partial attempts, health, and application logs.

No assignment, answer event, selected response, package file, key, transcript,
or score rule may be changed. No partial attempt may be completed by inference.

## Production repair evidence

- Pre-write backup:
  `/opt/rehearse/backups/lfl118-before-volume1-repair-20261117.dump`.
  It is a 3,896,862-byte PostgreSQL custom-format backup with mode 0600 and
  passed `pg_restore --list` inside the PostgreSQL container.
- The first transaction rehearsal rolled back on an invalid human-readable
  idempotency key before any write. The repaired rehearsal used a database UUID
  event key, retained `repairWorkId=LFL-118` in event data, matched exactly four
  attempts, generated all results, and rolled back successfully.
- The identical guarded transaction committed at 08:48:09 Jakarta on
  18 November 2026. It repaired four attempts across four assignments:
  - two full diagnostics with 140-item review/result records;
  - one Reading-only assignment with a 50-item review/result record;
  - one teacher-issued Structure reset with a 40-item review/result record.
- Result versions match the deployed adapter contract:
  - two `ets-volume1-practice-test-a.result.v1`;
  - one `ets-volume1-practice-test-a.section-assignment.v1`;
  - one `ets-volume1-practice-test-a.section-reset.v1`.
- Every repaired attempt is `completed/completed`, has exactly one immutable
  result and one `diagnostic_submitted` event, and retains the pre-repair last
  event timestamp in the audit payload.
- Zero answer events were rewritten. Assignments, attempts, selected answers,
  package files, package hashes, keys, transcripts, and score rules were not
  changed.
- The post-write eligibility query reports zero remaining fully answered,
  final-section, result-less Volume 1 attempts.
- The newly reported full assignment remains `in_progress/listening` with 38
  distinct saved answers, no result, and its last save at 19:12:18 Jakarta on
  17 November. It was not touched because it has not finished Listening,
  Structure, or Reading.
- Partial Reading and Structure attempts remain in progress. No omitted or
  incomplete work was inferred to be finished.
- App and PostgreSQL stayed healthy with zero restarts. LAN and public health
  returned HTTP 200; application logs contained no repair error.

The four repaired learners need only refresh or reopen the Test Center to load
their completed result. The active Question 38 learner should refresh once and
continue the full diagnostic; they should not be told that their test is
complete.
