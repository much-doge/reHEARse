# LFL-051 PCT128 production deployment receipt

Date: 2026-11-10 (Asia/Jakarta)

Environment: Countryroad Proxmox PCT 128, public origin
`https://rehearse.najala.org`

Implementation commit: `57522c888ef7e3a22cdf829c971f4ef1ab39175c`

Follow-up UI fix: `afb2b0db8ac948ea93caf6dc645d6ca58490f906`

Final application image: `rehearse-app:afb2b0d`

## Delivered behavior

New private and classroom access codes require a teacher-authored assignment
title of 1–120 trimmed characters. The title is stored on the invite, copied
into each claimed assignment, and rendered as plain text in the issued-code
receipt, learner resource card, teacher candidate context, and diagnostic
welcome. Legacy null titles display the resource title without a backfill.
Titles are descriptive metadata only and are not used for access decisions.

Teacher history now includes every diagnostic root (`parent_attempt_id IS
NULL`) regardless of attempt scope. Restart remains one audited archive batch
for all unarchived attempts for that learner and resource, including child
retakes. The archive action accepts only diagnostic-package resources and is
restricted to administrators or the teacher who issued the active assignment.
No answers or results are deleted or rewritten. Unsupported resource kinds
remain unavailable until they have explicit restart semantics.

The follow-up fix stores title drafts by resource ID. Each resource card now
validates and submits only its own trimmed title, preventing drafts from
appearing on or being issued for another activity.

## Database and rollback boundary

Before production migration, a custom-format PostgreSQL backup was written to
`/opt/rehearse/.secrets/lfl051-pre-migration.dump` with mode `0600`. The file
was 2,457,928 bytes and passed `pg_restore --list` validation. The backup was
retained in the protected PCT128 secrets directory and was not restored.

Migration `030_assignment_titles.sql` applied successfully. It adds nullable,
constrained title columns to invites and assignments and performs no backfill.
The production migration ledger now lists `030_assignment_titles.sql` above
029 and 028. Existing assignment and attempt evidence was not intentionally
modified; no learner reset or archive operation was performed during release.

To roll back only the follow-up UI correction, set
`REHEARSE_IMAGE_TAG=57522c8` and recreate only the `app` service. To roll back
the full LFL-051 application change, use `REHEARSE_IMAGE_TAG=2919a92`. Keep
migration 030 in place; its nullable columns remain compatible with both
images. Do not restore the database backup over live data except as an
explicit disaster-recovery decision.

## Verification

- Local `git diff --check`, changed-path ESLint, TypeScript, and the final full
  Vitest suite passed: 50 files and 188 tests. Two new tests verify that two
  resource title drafts stay isolated, submit trimmed values, and validate
  independently.
- Local migration 030 applied after a mode-0600 custom-format backup; its
  archive listing validated and the app container remained healthy with zero
  restarts.
- PCT128 production Compose configuration and production configuration checks
  passed. The `57522c8` worktree built `rehearse-tools:57522c8` and
  `rehearse-app:57522c8`; the in-image Next.js production build and TypeScript
  phase passed.
- Production migration 030 applied after the validated backup. The production
  migration ledger reports 030, 029, and 028.
- Follow-up `rehearse-app:afb2b0d` was built from the exact follow-up commit
  after its Next.js production build and TypeScript phase passed. Compose
  configuration validated, and only the `app` service was recreated with
  `--no-deps`; migration 030 was not rerun and Postgres was not modified.
- `rehearse-app-1` runs `rehearse-app:afb2b0d`, is healthy, and has zero
  restarts. The PostgreSQL container remains healthy with zero restarts.
- PCT128 LAN health at `http://192.168.8.63:3001/api/health` and public
  `https://rehearse.najala.org/api/health` both returned HTTP 200.
- The logged-out teaching page returned HTTP 307 with private/no-store cache
  controls. An unauthenticated same-origin teaching API request returned HTTP
  401 with private/no-store cache controls.
- An authenticated teacher/candidate browser journey and classroom use were
  not observed. Those remain operator verification; this receipt does not
  claim classroom verification.

The `pnpm check` wrapper could not run in the local shell because `pnpm` was
not on `PATH`; its component checks were run directly with the installed
ESLint, TypeScript, Vitest, and Next.js binaries. No real learner reset or
attempt archive was used as a deployment test.
