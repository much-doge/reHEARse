# LFL-050 PCT128 production deployment receipt

Date: 2026-11-10 (Asia/Jakarta)

Environment: Countryroad Proxmox PCT 128, public origin
`https://rehearse.najala.org`

Application commit/image: `2919a92` / `rehearse-app:2919a92`

## Capability and authorization

The teaching workspace now offers **Reset sign-in password** for an authorized
assigned learner. A teacher receives the control only when that learner's
active resource assignment was issued by the same teacher. An administrator
may reset any learner with an active assignment to the selected resource. The
server repeats the assignment and role check for every request; the UI flag is
not treated as authorization.

On confirmation, the server generates a high-entropy temporary password,
stores only its scrypt hash, revokes all existing sessions for the learner,
and returns the plaintext once in a private no-store response. The workspace
shows copy and dismiss controls. The plaintext is not written to logs, URLs,
resource DTOs, analytics, or the audit table. Assignments, attempts, answers,
results, retakes, and archived generations remain unchanged.

## Database and rollback boundary

Before migration, a PostgreSQL custom-format backup was written to
`.secrets/lfl050-pre-migration.dump` with mode 0600 and validated using
`pg_restore --list`. The prior protected production environment was copied to
`.secrets/lfl050-env-before`, also mode 0600.

Migration `029_staff_password_resets.sql` applied successfully. It adds the
append-only `app_password_reset` audit table and indexes. The audit stores only
learner, staff actor, resource, timestamp, and revoked-session count; it has no
password or password-hash column. The table contained zero rows immediately
after deployment, confirming that deployment itself reset no accounts.
Production reported 25 active learner assignments with a staff issuer, which
are eligible for teacher-scoped authorization subject to the exact acting
teacher match.

For an application rollback, restore `REHEARSE_IMAGE_TAG=7e1ccdc` from the
protected environment backup and recreate only the app service. Keep migration
029 and any audit evidence in place. Do not restore the database dump over live
learner data except as an explicit disaster-recovery decision.

## Verification

- Local mode-0600 backup and `pg_restore --list` validation passed.
- Migration 029 applied locally; a rolled-back synthetic transaction verified
  teacher assignment authorization, credential update, session revocation, and
  password-free audit insertion with zero residual fixture or audit rows.
- Final local `pnpm check` passed: ESLint, TypeScript, 48 test files/182 tests,
  and the Next production build.
- PCT128 production Compose validated and built
  `rehearse-tools:2919a92` plus `rehearse-app:2919a92`; the in-image Next build
  and TypeScript phase passed.
- Migration 029 appears in the production migration ledger.
- `rehearse-app-1` is healthy with zero restarts on image `2919a92`;
  PostgreSQL remains healthy.
- PCT LAN and public `/api/health` returned the expected `health.v1` response.
- The logged-out teaching route remained protected with HTTP 307 and private
  no-store cache controls.

No real learner password was reset during deployment. An authenticated staff
click-through, one deliberate learner reset, delivery of the temporary
password, and learner sign-in remain operator verification; this receipt does
not claim that production mutation was performed.
