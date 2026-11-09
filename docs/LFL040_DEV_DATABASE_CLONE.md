# LFL-040 development database clone

Status: completed on 2026-11-09 (Asia/Jakarta).

## Outcome

The hosted Countryroad/PCT128 `rehearse` PostgreSQL database was cloned into
the laptop's isolated `listening` development database. The development app is
available at <https://dev1-rehearse.najala.org/>. The hosted database was read
only throughout the operation.

## Safeguards and archives

- Local pre-clone backup:
  `.secrets/rehearse-local-pre-countryroad-seed-20261109-110130.dump`
- Hosted clone archive:
  `.secrets/rehearse-countryroad-clone-20261109-110130.dump`
- Both files are private mode 600 and passed `pg_restore --list`.
- The hosted clone archive is 2,264,214 bytes.
- The local app was stopped before replacing the local database.
- The local database was dropped and recreated explicitly as database
  `listening`, owned by local role `listening`.
- The hosted archive was restored with ownership and ACL remapping
  (`--no-owner --no-acl`).
- A validated automatic rollback path to the local pre-clone archive was
  included in the restore command; it was not needed because the hosted restore
  completed successfully.

## Reconciliation evidence

Counts from Countryroad before the clone and from the laptop after restore
match exactly:

| Record | Hosted | Local after restore |
|---|---:|---:|
| Users | 59 | 59 |
| Resource assignments | 27 | 27 |
| Diagnostic attempts | 7 | 7 |
| Diagnostic events | 494 | 494 |
| Diagnostic results | 2 | 2 |

Migration `024_diagnostic_section_assignments.sql` is recorded once in the
local `app_migration` ledger.

## Runtime verification

- `rehearse-app-1`: healthy.
- `rehearse-db-1`: healthy.
- Public dev health: HTTP 200 with `health.v1`.
- Logged-out `/test-center/teaching`: HTTP 307 to authentication.
- Unauthenticated diagnostic-run API: HTTP 401.
- Responses retain private/no-store cache controls and HSTS through Cloudflare.
- Authenticated teacher and candidate browser journeys were not performed.

## Isolation warning

The clone is a point-in-time development copy, not replication. Changes made
on `dev1` do not synchronize back to Countryroad. Do not accept real learner
traffic on both databases with an expectation that attempts will merge.

## Rollback

Stop the local app, drop and recreate only the local `listening` database, and
restore
`.secrets/rehearse-local-pre-countryroad-seed-20261109-110130.dump` with
`--no-owner --no-acl`. Never apply that rollback operation to Countryroad.
