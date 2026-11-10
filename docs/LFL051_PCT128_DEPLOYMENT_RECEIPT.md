# LFL-051 PCT128 production deployment receipt

Date: 2026-11-10 (Asia/Jakarta)

Environment: Countryroad Proxmox PCT 128, public origin
`https://rehearse.najala.org`

Implementation commit: `57522c888ef7e3a22cdf829c971f4ef1ab39175c`

Application image: `rehearse-app:57522c8`

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

If application rollback is needed, set `REHEARSE_IMAGE_TAG=2919a92` and
recreate only the `app` service with the production Compose configuration.
Keep migration 030 in place; its nullable columns remain compatible with the
previous app. Do not restore the database backup over live data except as an
explicit disaster-recovery decision.

## Verification

- Local `git diff --check`, changed-path ESLint, TypeScript, and the full
  Vitest suite passed: 49 files and 186 tests.
- Local migration 030 applied after a mode-0600 custom-format backup; its
  archive listing validated and the app container remained healthy with zero
  restarts.
- PCT128 production Compose configuration and production configuration checks
  passed. The `57522c8` worktree built `rehearse-tools:57522c8` and
  `rehearse-app:57522c8`; the in-image Next.js production build and TypeScript
  phase passed.
- Production migration 030 applied after the validated backup. The production
  migration ledger reports 030, 029, and 028.
- `rehearse-app-1` runs `rehearse-app:57522c8`, is healthy, and has zero
  restarts. The PostgreSQL container remains healthy.
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
