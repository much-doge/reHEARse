# LFL-044 deployment receipt

Date: 2026-11-09 (Asia/Jakarta)  
Environment: Countryroad Proxmox, PCT 128  
Source commit: `da9dad7`  
Application image: `rehearse-app:da9dad7`

## Outcome

The teacher workspace now separates resource status, new-assignment controls,
candidate summaries, detailed attempt history, and the reset action. Reset is
implemented as an archive boundary: it records an immutable audit batch and
marks the candidate's current attempt lineage as archived without deleting or
rewriting attempts, answer events, results, or section-retake relationships.
The candidate may then begin a new current primary attempt from the assigned
scope's beginning, while staff continue to see the archived history.

## Database safety

- Backup created before migration:
  `/opt/rehearse/backups/pre-lfl044-da9dad7.dump`
- Backup format: PostgreSQL custom format, mode `0600`
- `pg_restore --list` completed successfully before migration.
- Migration `025_diagnostic_attempt_archives.sql` applied successfully.
- The PostgreSQL container was not recreated or restarted.
- Post-deployment evidence: 10 diagnostic attempts, 848 diagnostic events,
  2 diagnostic results, 0 archived attempts, and 0 archive audit batches.
  No participant was reset during deployment verification.

## Verification

- Changed-path ESLint: passed.
- Project TypeScript check: passed.
- `git diff --check`: passed.
- Local migrator and runner image builds: passed.
- Local migration against the production-clone database: passed after a
  validated custom-format backup.
- Local new-runner health against the migrated database: passed.
- PCT128 production configuration validation: passed.
- PCT128 Next production build: passed.
- App container: healthy on `rehearse-app:da9dad7`.
- PCT LAN health endpoint: HTTP 200.
- Public `https://rehearse.najala.org/api/health`: HTTP 200.
- Logged-out `/test-center/teaching`: HTTP 307 to sign-in/dashboard flow.

An authenticated teacher reset, the candidate's subsequent clean restart, and
the final visual browser journey were not performed because doing so would
alter a real participant's current assessment generation. They remain live
operator verification rather than deployment evidence.

## Rollback

Application rollback is to image `rehearse-app:765c340`. Because the old
application does not know the new archive columns and migration 025 changes a
primary-attempt uniqueness rule, a full rollback must restore
`pre-lfl044-da9dad7.dump` before returning to that image. Do not attempt to
manually delete archive metadata after staff have used the reset capability;
that would discard the audit boundary and can invalidate new-generation
attempt ownership.
