# LFL-046 Debian dev1 deployment receipt

Date: 2026-11-10 (Asia/Jakarta)  
Environment: Debian laptop fallback at `dev1-rehearse.najala.org`  
Application commit/image: `3578e5d` / `rehearse-app:3578e5d`

## Outcome

The Debian fallback now includes all fixes through LFL-045 and the new
teacher-selected access-code kind. Private codes retain the existing
single-account behavior. A classroom code may be claimed by multiple signed-in
learners during its seven-day validity, but each claim produces an independent
learner/resource assignment. Attempts, answers, timers, results, retakes,
archives, and history are never shared between learners.

The teacher assignment panel presents **Access code type** before the existing
scope and Listening controls. Its confirmation distinguishes a private code
from a classroom code and states whether one or many signed-in learners may
claim it.

## Database safety and verification

- Durable pre-migration custom-format backup:
  `/home/miko/Documents/playground/reHEARse/backups/dev1-pre-lfl046-3578e5d.dump`
- Backup mode: `0600`; `pg_restore --list` passed.
- Migration `027_classroom_resource_invites.sql` applied successfully.
- All 7 existing invites migrated as `private`.
- A rolled-back transaction created one classroom invite and attached two
  different learner actors to two separate assignments. The transaction left
  no classroom invite or assignment mutation behind.
- Migration 026 from the current PCT release is also recorded in dev1.

## Application verification

- Changed-path ESLint, project TypeScript, and `git diff --check`: passed.
- Migrator/runner images and Next production build: passed.
- New runner health against the migrated database: passed.
- Emergency Compose configuration: passed.
- `rehearse-app:3578e5d`: healthy.
- Localhost and public Cloudflare health endpoints: HTTP 200.
- Logged-out teaching route: HTTP 307 to the dev1 sign-in flow.

An authenticated teacher code-creation click and two real learner browser
claims were not performed. The multi-learner persistence behavior is therefore
database-verified on dev1 but not yet classroom/browser-verified.

## Rollback

Stop the dev1 application, restore
`dev1-pre-lfl046-3578e5d.dump`, and recreate the prior application image. Do
not run old application code against a database containing classroom codes,
because it treats every invite as single-use.
