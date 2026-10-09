# LFL-020B content and backend receipt

Status: source-complete in the isolated content lane; lead integration,
acceptance, push and deployment remain pending.

## Immutable content and public boundary

The registry retains the historical three-choice content reader and adds two
independently playable, neutrally named four-choice conversations. Original
A-D order is stable. Repair questions remain separate three-choice tasks.
Every item has a contextual integer-millisecond replay span, bilingual focus,
hint, fresh follow-up and bounded supported meaning.

`GET /api/ladder/catalogue` returns only validated published activities as
`{ activities: LadderActivityChoice[] }`. Keys, reasons, complete transcript,
source identifiers and provenance never enter catalogue, learner or host DTOs.
The second activity is omitted until its published current media version has
the expected checksum.

Solo and teacher starts accept optional `activityId`; omission keeps the first
conversation as the default for original-mode clients. PIN joins inherit the
session's activity, activity-version, content and mechanics pins. A conflicting
explicit activity is rejected. Changed-activity retries of a teacher creation
key are rejected, while historical same-key retries remain readable.

## Historical readers and rollback switch

Runs resolve content by stored `content_version` and audio by stored
`activity_version_id`; they do not follow an activity's newer current version.
Migration 013 backfills existing runs/sessions as legacy and adds immutable
activity/content/mechanics pins plus nullable saved movement fields.

`LADDER_START_VERSION=original|legacy` is read only in the adapter. The default
is `original`; `legacy` disables new original starts but retains all version
readers. After original runs exist, rollback must keep this code (or another
image with the same readers) and set the switch to `legacy`. A v1-only image
cannot resume new runs and is not a safe rollback.

## Saved chapter movement

New runs use `chapter-route.v1`. Each accepted event stores its event ID,
revision and ordered `walk`, `snake` and `ladder` steps in `transition_json`,
then atomically stores the same latest transition and final node on the run.
Request-key retries return the recorded transition without another event.
Legacy runs retain the earlier position formula and omit journey DTOs.

The reducer covers match ladders, mismatch snakes, neutral uncertainty,
repair retry, revised/support/teacher recovery ladders, and distinct finish
node 13. Exhaustive simulation closes all 81 mixed first-choice routes through
finite repair/support without loops or added debt.

## Private operator paths

These ignored, mode-0600 paths exist only in the worker worktree:

- `.secrets/lfl020-source-review.md`
- `.secrets/lfl020-import/ocean-currents.activity-package.json`
- `.secrets/lfl020-import/ocean-currents.mp3`

The guarded repeatable command is
`scripts/lfl020-import-second-activity.mjs`. Without `--apply` and `--owner` it
only prints its guard state. It requires the listening database, refuses a
duplicate activity/media checksum, and delegates storage/import to the existing
versioned importer. No production import was run.

## Verification

- Exact `pnpm check` passed in a disposable Node 24 image: ESLint, TypeScript,
  30 test files / 110 tests, and production Next build.
- Isolated Compose image build and migrations 001-013 passed.
- The private second-activity package passed the production-shaped importer
  into an isolated local PostgreSQL/media volume.
- Guarded PostgreSQL/API journey passed both catalogue publications, legacy and
  new starts, stored-version resume, new valid D, legacy invalid D, invalid
  repair D, saved/idempotent movement, changed activity fencing, session pin,
  closed session, teacher ownership and public leakage checks.
- Domain simulation covered every mixed match/mismatch/uncertain route and
  bounded recovery.
- `git diff --check` passed before commit.

Not run: lead-owned learner selector/A-D UI, board animation, browser audio-cut
review, combined avatar/effect reconciliation, production import, deployment,
or classroom pilot. The teacher still must hear every proposed span and approve
the second neutral title before enabling original starts in production.

## Integration order and rollback

Cherry-pick the content checkpoint, backend implementation, then this receipt.
Apply migration 013 before the new app. Review the ignored worksheet and import
package locally; import and validate the second published media version before
expecting it in catalogue. Lead wires selectors and animation to the frozen
DTO fields and runs combined acceptance.

To stop new original starts, set `LADDER_START_VERSION=legacy` without deleting
rows or readers. Migration 013 is additive and should remain. Reverting only UI
integration is safe; do not deploy an older image that cannot resolve already
created original content/mechanics versions.
