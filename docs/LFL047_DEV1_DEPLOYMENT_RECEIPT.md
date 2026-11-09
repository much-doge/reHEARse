# LFL-047 Debian dev1 deployment receipt

Date: 2026-11-10 (Asia/Jakarta)  
Environment: Debian laptop fallback at `dev1-rehearse.najala.org`  
Application commit/image: `7bc8e0d` / `rehearse-app:7bc8e0d`

## Outcome

The teacher resource workspace now defaults to a compact list suitable for a
larger catalogue. A workspace toggle switches between compact and expanded
views. Each resource may also be expanded or collapsed independently of that
global choice. Compacting a resource changes presentation only; assignment,
candidate, attempt, and result state remain loaded and unchanged.

Staff may edit comma-separated organizational tags inside an expanded
resource. Tags appear beneath the resource title in both views. The server
trims whitespace, collapses repeated spaces, removes case-insensitive
duplicates, and accepts at most eight tags of forty characters. Each successful
edit appends a `tags_updated` staff resource event. Tags are metadata only and
never participate in visibility, assignment, scoring, or learner access.

## Database safety and verification

- Durable pre-migration custom-format backup:
  `/home/miko/Documents/playground/reHEARse/backups/dev1-pre-lfl047-7bc8e0d.dump`
- Backup mode: `0600`; `pg_restore --list` passed.
- Migration `028_resource_tags.sql` applied successfully.
- Both existing resources retained empty tag arrays.
- A rolled-back transaction stored `Full TOEFL Practice Test` and `Diagnostic`
  on the diagnostic resource and appended the tag audit event. After rollback,
  dev1 retained zero tagged resources and zero tag events.

## Application verification

- Changed-path ESLint, project TypeScript, and `git diff --check`: passed.
- Migrator/runner images and Next production build: passed.
- New runner health against the migrated database: passed.
- Emergency Compose configuration: passed.
- `rehearse-app:7bc8e0d`: healthy.
- Localhost and public Cloudflare health endpoints: HTTP 200.

The authenticated teacher visual journey and a real saved tag were not
performed. The deployed interface and persistence path are source-, schema-,
and runtime-verified but await operator browser verification.

## Rollback

Stop the dev1 application, restore
`dev1-pre-lfl047-7bc8e0d.dump`, and recreate image
`rehearse-app:3578e5d`. Reverting only the application would leave harmless
unused tag columns/events, but the backup is the complete rollback boundary.
