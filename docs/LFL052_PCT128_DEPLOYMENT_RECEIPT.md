# LFL-052 PCT128 production deployment receipt

Date: 2026-11-10 (Asia/Jakarta)

Environment: Countryroad Proxmox PCT 128, public origin
`https://rehearse.najala.org`

Implementation commit: `007a361`

Application image: `rehearse-app:007a361`

## Delivered behavior

Authorized teachers and administrators now see separate Reset Listening,
Reset Structure and Reset Reading controls on each completed, unarchived full
diagnostic. A reset appends one complete-section child attempt and records the
authorizing staff actor as an opaque ID. It does not mutate or partially
archive the completed full attempt.

When a reset section is completed, the current diagnostic score is
recalculated from the latest completed teacher reset for each affected section
and the original result for unaffected sections. The original full result and
all earlier reset/retake results remain immutable and visible. Learner-created
missed-question retakes are excluded from the recalculation and remain
score-neutral.

The action requires a published diagnostic, active assignment, completed full
root, matching learner/resource, and an administrator or the teacher who
issued the assignment. A database partial unique index and application check
prevent overlapping active attempts.

## Database and rollback boundary

Before migration, `/opt/rehearse/.secrets/lfl052-pre-migration.dump` was
written with mode `0600`, size 2,459,231 bytes, and validated with
`pg_restore --list` inside the PostgreSQL container.

Migration 031 adds nullable `teacher_restarted_by` metadata with a constraint
that permits it only on full-section child attempts. Migration 032 adds the
one-active-attempt partial unique index. Both migrations are additive and
performed no backfill. The production ledger head is 032 above 031 and 030.

Application rollback may recreate only the app service with
`REHEARSE_IMAGE_TAG=afb2b0d`. Keep migrations 031-032 in place: the nullable
column is ignored by the older image and the unique index reinforces behavior
the previous application already expected. Do not restore the backup over
live data except as an explicit disaster-recovery decision.

## Verification

- Changed-path ESLint, TypeScript, `git diff --check`, 51 Vitest files/192
  tests, and the local Next production build passed.
- Migrations 031-032 applied locally after a mode-0600 backup validated with
  `pg_restore --list`; the local database accepted the new column and index.
- The release archive was generated from commit `007a361`; its SHA-256 was
  verified after transfer before the production image build.
- PCT128 production configuration validation and in-image Next/TypeScript
  build passed for `rehearse-tools:007a361` and `rehearse-app:007a361`.
- The production pre-migration backup validated, migrations 031-032 applied,
  and the expected column/index and ledger entries were observed.
- Only the app service was recreated. `rehearse-app:007a361` and PostgreSQL are
  healthy with zero restarts. LAN and public health returned HTTP 200.
- Logged-out teaching access returned HTTP 307 with private/no-store controls;
  a same-origin unauthenticated reset request returned HTTP 401 with
  private/no-store controls.
- Before and after deployment, production retained 46 diagnostic attempts and
  35 results. No row had `teacher_restarted_by`; no real participant reset was
  used as a deployment test.

Authenticated teacher-button rendering, learner completion, and the resulting
score projection remain operator/browser verification. This release is
deployed, not classroom-verified.
