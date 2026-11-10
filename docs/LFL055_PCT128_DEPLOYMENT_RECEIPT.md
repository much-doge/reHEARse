# LFL-055 PCT128 deployment receipt

Date: 2026-11-10 (Asia/Jakarta)

Environment: PCT128 production, `https://rehearse.najala.org`

Implementation commit/image: `bd7c4a8` / `rehearse-app:bd7c4a8`

## Change

The owner reported that the learner account could not open its assigned
vocabulary activity. A follow-up production inspection found that account's
existing private assignment, but no saved card attempts. The same assignment
was preserved and pinned to package v2 after verifying its attempt history was
empty; no duplicate code or assignment was created.

Migration 034 added version pins to vocabulary invites and assignments and
advanced the published TOEFL vocabulary deck to v2. Existing invite and
assignment rows retain v1 by default. The owner's existing assignment was the
only row explicitly advanced to v2; it has no saved attempts. New attempts
created from it use the v2 package. Previous attempts, if any, remain pinned to
their stored version.

Every v2 card now has an example sentence. There are 1,582 exact-headword
WordNet 3.0 examples from matching part-of-speech synsets and 1,262 original
sentences that state the source list's label where a matching usage example is
unavailable. The target word is bolded. Examples appear after answer feedback.
The WordNet license and attribution are available in the app and in
`content/vocabulary/WORDNET-3.0-LICENSE.txt`.

## Deployment and data preservation

The release was assembled at
`/opt/rehearse/.releases/bd7c4a8` from the retained `b53b45e` release plus the
committed LFL-055 paths. The transferred archive SHA-256 was
`10b4180b9a0fcc46dc1ad841608e7a0c7b40cfcb4550c2c23c6c7dcff3647893`.

Before migration 034, a custom-format PostgreSQL backup was created at
`/opt/rehearse/.secrets/lfl055-pre-migration.dump`, mode `0600`, size
2,510,469 bytes; `pg_restore --list` validated it. Migration 034 is recorded
in `app_migration`. Only the app container was recreated after migration.
PostgreSQL remained running and healthy with zero restarts. The account's
existing assignment remains in place at package version 2 with zero saved
attempts at deployment time.

The persistent production Compose image tag was updated to `bd7c4a8`, then
Compose configuration validation passed without printing secret values.

For app-only rollback, run the retained `rehearse-app:b53b45e` image. Keep the
additive migration and the learner assignment in place; do not restore the
pre-migration backup over live data. The v1/v2 cards retain stable card IDs and
the prior image may serve v1 content until the new app is restored.

## Verification and limits

- Local changed-path ESLint, TypeScript, Next production build, package
  highlight-range validation for all 2,844 cards, and `git diff --check` passed.
  No tests were run; `pnpm` was unavailable on the host, so installed tools
  were invoked directly.
- PCT128 built `rehearse-app:bd7c4a8` and the tools/migrator image from the
  committed release; the production Next build passed.
- App and PostgreSQL are healthy with zero restarts. LAN and public health
  endpoints returned HTTP 200.
- Signed-out vocabulary page returned HTTP 307 with private/no-store headers;
  the learner API returned HTTP 401 with private/no-store and `Vary: Cookie`.
  The public WordNet license file returned HTTP 200.
- The owner reports trying this assignment before the update. A signed-in
  learner browser session was not available for a post-deployment click-through,
  so the authenticated page-open remains unverified here.
