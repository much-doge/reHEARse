# LFL-023B — Content/backend checkpoint

Owner: other desktop content/backend lane. Base: `a5be797fa898fdedebf078a1cd19580da7f8281b`.
Branch: `codex/lfl023-content`; worktree: `/tmp/rehearse-lfl023-content`.
Status: early contract checkpoint; not integration accepted, imported or deployed.

## Stable public boundary

`src/domain/workshop/contracts.ts` exports `part-a-workshop.v1`.
Learner actions: `listen_start {itemId}`, `choose {itemId,choice:A|B|C|D|null}`,
`explain {itemId,option:A|B|C|D,text}`, `next_item {itemId}`.
Teacher actions: `open_practice`, `next_group`, `close`.
Request/DTO field names are frozen in that file; no UI implementation is included.
API responses are the DTO directly, not `{view: DTO}`. Learner writes use
participant `revision`; host writes use room `revision`. Every write has UUID
`key`. Join uses `{kind:join,pin,key}` and an opaque HttpOnly membership cookie.
`listen_start` also starts the allowed replay; repeat starts cannot reset time.
`next_item` follows all three saved explanations. Teacher `next_group` opens
preparation for the next group or finishes after the last group.

## Group structure

The machine-aided source review found five actual primary groups, in this order:

| ID | Primary skill | Items |
|---|---|---|
| meaning-in-context | Restatement and sequence | 2 |
| supported-inference | Supported inference | 9 |
| negative-meaning | Negatives and near-negatives | 2 |
| speaker-intentions | Suggestions, responses and intentions | 10 |
| expressions-in-context | Idioms and multiword expressions | 7 |

Distractor recognition is secondary across these items. No passive-primary
item was identified; do not manufacture a group to fill the taxonomy.
Original source order remains inside each group. Full original bilingual
preparation cards are in `src/adapters/workshop/preparation.ts`.

All thirty items, including a representative from each group, have matched
original four-option sets and independent semantic key review. This used local
CPU ASR of each complete operator-supplied clip plus an online matching option
copy and key corroboration. It is machine-aided source review; independent human
listening acceptance remains a lead gate. No transcript/options/source map is
committed. English prompts follow spoken questions; Indonesian prompts are
paired task translations. A local decoder mismatch was corrected before review.

Private inputs (ignored, mode 0600):
`/tmp/rehearse-lfl023-content/.secrets/lfl023-source-review.md` and
`/tmp/rehearse-lfl023-content/.secrets/lfl023-import.json`.
They contain source mapping, original ordered options, working transcripts,
private reasons, all thirty classifications, bespoke tips and local media pins.
The public preparation examples are newly authored and do not reproduce live
items. The private package assembly command is documented in its script.

## Backend scaffold and checks

Dedicated migration 016, narrow port, PostgreSQL adapter and two route handlers
are included. The adapter serializes room/participant mutations, pins an
immutable content row, preserves accepted mutation results for retries, enforces
observed revisions and derives time from the database. Keys/private reasons and
future hints are projected out. Historical game/ladder files are unchanged.

Passed so far: direct TypeScript check; five focused domain/projection tests;
private thirty-item/five-group schema assembly. The first pnpm invocation hit a
local package-manager store/preflight error; direct checks bypassed that tooling
failure. Final pnpm check, importer dry-run, real PostgreSQL/API journey,
expiry/races and historical resume are pending. Do not accept the draft backend
from unit tests alone. No production or object-storage operation was performed.

## Remaining before final handoff

Complete importer and guarded local journey; exercise role/ownership, timing
edges, retries, close/expiry and both branches; broaden focused tests; run final
pnpm check and record exact results. Return ordered SHAs and any changes needed
at the frozen public boundary through the human. Never publish unverified
content or alter an existing version. Rollback leaves additive tables/history
in place and uses a compatible application; no learning record deletion.
