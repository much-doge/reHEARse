# LFL-045 deployment receipt

Date: 2026-11-09 (Asia/Jakarta)  
Environment: Countryroad Proxmox, PCT 128  
Application commit/image: `77e9d93` / `rehearse-app:77e9d93`

## Incident and correction

The first real archive action correctly preserved the owner's test attempt,
but the subsequent start was rejected. The archived attempt was primary number
1, while the replacement would be primary number 2. A legacy database check
still required every primary to have sequence number 1, conflicting with the
new archived-generation model. Migration 026 replaces that condition with the
durable invariant that a primary must be a full/root attempt; the partial
unique index continues to allow exactly one unarchived primary per candidate,
resource, and delivery scope.

The learner assignment list also inherited the redesigned teacher card because
both views used `.ptc-resource-card`. Learner cards now use the independent
`.ptc-assigned-resource-card` selector, restoring their padded horizontal card
layout without undoing the teacher workspace hierarchy.

## Database safety and verification

- Pre-migration custom-format backup:
  `/opt/rehearse/backups/pre-lfl045-77e9d93.dump`
- Backup mode: `0600`; `pg_restore --list` passed.
- Migration `026_diagnostic_generation_primary.sql` applied successfully.
- PostgreSQL was not restarted or recreated.
- A local production-clone transaction archived the known owner fixture,
  inserted its next-numbered primary, and rolled back successfully.
- After deployment, a production transaction selected the already archived
  `ne.windianto@gmail.com` root, inserted the next-numbered primary, and rolled
  back successfully.
- Post-rollback production state remained 1 archived attempt, 9 unarchived
  attempts, 10 total attempts, and 1 archive audit batch. No replacement
  attempt was left by verification.

## Application verification

- Changed-path ESLint, project TypeScript, and `git diff --check`: passed.
- Local and PCT migrator/runner builds and Next production builds: passed.
- PCT production configuration validation: passed.
- `rehearse-app:77e9d93`: healthy.
- PCT LAN and public health endpoints: HTTP 200.

The authenticated owner click-through and refreshed learner-page appearance
remain operator verification. They were not automated because no reusable
browser session or account credential was available to this deployment run.

## Rollback

Restore `pre-lfl045-77e9d93.dump` before returning to
`rehearse-app:da9dad7`. Reverting only the application or only migration 026
would restore the constraint conflict for any archived generation.
