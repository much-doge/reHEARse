# LFL-023B — other desktop content/backend handoff

Prepared 2026-10-20, Asia/Jakarta. The human relays this assignment between two
desktop Codex accounts. The original Codex is integration lead and final
acceptor. Do not replace this collaboration with subagents.

## Start and isolation

Repository: `/home/miko/Documents/playground/reHEARse`

Read in the main checkout before creating a worktree:

1. `AGENTS.md`
2. `docs/PROJECT_CONTROL.md`
3. `docs/CHANGE_LEDGER.md` (`LFL-023`, `LFL-023A`, `LFL-023B`)
4. `docs/LFL023_PART_A_WORKSHOP_PLAN.md`
5. this handoff
6. `docs/CLASSROOM_GAME.md`, `docs/LFL022_LOBBY_PLAN.md`, and relevant
   architecture/decision records
7. relevant installed Next 16 guides before editing routes

Start from the coordination commit named in the human's pasted message. Check
that both names are unused, then create branch `codex/lfl023-content` and
worktree `/tmp/rehearse-lfl023-content`. Preserve the main checkout and every
older avatar/content worktree. Do not stash, reset, clean, push, deploy, access
PCT128, alter Cloudflare, or touch production storage/database.

## Source inputs and confidentiality

Review local audio from:

`/home/miko/Documents/playground/ConTEFL/artifacts/ConTEFL-2026-10-16-package-1467/listening/package-audio`

Scope is `1.mp3` through `30.mp3` only. Treat filenames as private source
ordering, not public activity IDs.

Locate the matching questions/options/answer evidence online by searching from
phrases you independently hear in the audio. Cross-check a complete matched set
against every clip, spoken question, local hash/duration, and original A-D
order. Do not trust an answer-blog key without checking the audio and option
meaning. If a wording/key cannot be established confidently, mark it blocked;
do not fill the gap by inference.

Keep the following ignored and mode 0600:

- `.secrets/lfl023-source-review.md`: source URLs, package/source numbering,
  verbatim working transcript, item-by-item match confidence, discrepancies,
  key reasoning, and unresolved issues.
- `.secrets/lfl023-import.json`: the complete validated import payload,
  including original options, keys, authored tips, evidence, classifications,
  and local media mapping.

Do not place source codes, archive URLs, full transcripts, answer sheets, or
copyrighted source captures in commits, tests, logs, screenshots, DTO fixtures,
titles, browser bundles, or handoff prose. Sanitize test fixtures.

## Your LFL-023B scope

Deliver the complete content/backend slice:

1. Define a framework-free `part-a-workshop.v1` domain contract and exhaustive
   transition tests for prepare, timed first listen, choice, guided relisten,
   correct-answer distractor explanations, completion, and teacher advance.
2. Add immutable import validation for exactly thirty items. Every item needs:
   neutral ID; original A-D order; answer key; duration/hash; public question
   task; one primary Longman skill and optional secondary skills; group ID;
   item-specific first and second replay tips; bounded guided comparison;
   private decisive evidence and private reason for each option.
3. Produce useful bilingual preparation material for every actual skill group:
   question task, listening target, decision procedure, distractor patterns,
   an original analogous example, two inquiry prompts, and only necessary
   language notes. Use plain academic language. No fantasy vocabulary,
   journeys, mascot voice, motivational slogans, or renamed correctness.
4. Add migration `016_part_a_workshop.sql` with dedicated, additive tables for
   immutable content/version pins, teacher-owned rooms, hashed browser
   memberships, participant state, and append-only events/evidence. Existing
   schema and rows remain untouched.
5. Add a narrow repository port and PostgreSQL adapter. Serialize room and
   participant mutations, use observed revisions and client idempotency keys,
   pin content/media/grouping/pedagogy versions at room creation, and make
   retries return the original accepted result.
6. Add same-origin, size-bounded API routes for teacher create/read/advance,
   learner join/read/listen/choose/explain, and session close. Teacher/admin
   ownership is required for host operations. A PIN alone may join, but the
   resulting opaque HttpOnly token is required for subsequent learner reads and
   writes; store only its hash.
7. On accepted listen start, derive `answerOpensAt` from database time plus the
   pinned clip duration and `deadline` twelve seconds later. Reject early,
   late, repeated, changed, and out-of-order first choices. A refresh must not
   reset timing. Relistens are untimed and finite as defined in the plan.
8. Project separate public DTOs. Keys, transcripts, private evidence/reasons,
   source data, future hints, other learners' choices/text, and teacher-only
   data must not cross the learner boundary. Teacher counts are limited to not
   started, first-listen correct, relistening, and completed per item.
9. Add a guarded repeatable importer that validates the private payload and all
   local audio before any upload, uses the existing S3-compatible public-media
   adapter and a fresh neutral prefix, verifies returned public range delivery,
   then publishes one immutable version transactionally. Dry-run must require
   no network or credentials. Do not run a live import.
10. Add a guarded local PostgreSQL/API journey covering roles/ownership,
    changed-key conflicts, expiry/close, timing edges, duplicate/race handling,
    both learning branches, all three explanations, teacher counts/advance,
    refresh, source/key leakage, and an existing historical game/ladder resume.

## Frozen learner state machine

Within the teacher-opened group, items retain their authored order.

- `ready` -> accepted `listen_start` -> `timed_choice`
- correct timed choice -> `explain_distractors`
- incorrect or uncertain timed choice -> `relisten_1`
- incorrect relisten choice -> `relisten_2`
- incorrect second relisten choice -> `guided_compare`
- accepted correct/final guided choice -> `explain_distractors`
- three saved wrong-option explanations -> `item_complete`
- all group items complete -> `group_complete`

The server may return the acknowledged result as `correct` or `incorrect` to
that learner. It must not reveal the key or private reasons. Learner prose is
required but is not semantically graded. One explanation event per wrong option
is immutable; a changed retry under the same key is a conflict.

Only the teacher can move the room from preparation to practice or open the
next group. Advancing never rewrites an earlier participant state or event.

## Frozen public API/DTO boundary

Use `/api/workshop` for learner membership/read/actions and
`/api/workshop/host` for authenticated teacher operations. Exact internal type
names are yours, but export the final public TypeScript contracts from
`src/domain/workshop/contracts.ts` and keep `contractVersion:
"part-a-workshop.v1"`.

Coordinate the following fields without incompatible invention:

- learner: room PIN/revision, alias, room phase, active group preparation,
  ordered public item summaries, current item state, own timing, active A-D
  options, own accepted choice result, current allowed hint, own explanation
  drafts/saves, and server time;
- host: room PIN/revision/phase, neutral activity title, group list/current
  group, participant count, and per-current-item operational counts;
- catalogue/import: neutral activity/version IDs, bilingual titles, media
  duration/hash/storage reference, group pedagogy version, and publication
  state.

Report the exact final action union before the early checkpoint. Do not add a
required UI field after that checkpoint without first routing the proposal
through the human to the lead.

## Owned paths

You own:

- new `src/domain/workshop/**` and tests;
- new `src/application/workshop/**`;
- new `src/adapters/workshop/**` and tests;
- new `src/app/api/workshop/**` route handlers/tests;
- `migrations/016_part_a_workshop.sql`;
- new guarded `scripts/lfl023-*` import/local-journey tools;
- sanitized content-schema fixtures under a new workshop test-fixture path;
- `.secrets/lfl023-source-review.md` and `.secrets/lfl023-import.json`
  (ignored, never staged);
- `docs/LFL023_CONTENT_RECEIPT.md`;
- only the `LFL-023B` ledger row in your worktree.

Do not edit existing learner/teacher pages or components, global CSS, game or
ladder domain/adapters/routes, auth implementation, Compose/production config,
other ledgers/receipts, or existing migrations. If a shared-path change is
genuinely necessary, report the exact proposal before editing it.

## Lead-owned paths and acceptance

The integration lead owns all learner and teacher pages/components/styles,
client polling/audio/deadline reconciliation, confetti/reduced-motion behavior,
navigation, UI tests, shared documentation/decisions, integration corrections,
private content review, media publication, push, deployment, and final browser
acceptance. Do not implement or deploy the UI.

The lead will reject content that has generic tips, unverified keys/options,
classification by guess, question leakage in preparation cards, vague skill
labels, fake source certainty, public source metadata, resettable deadlines,
unbounded guessing, or correctness presented as a score.

## Commits and reporting

Make an early committed contract/content checkpoint as soon as the public
contract, schema, group plan, and the first fully verified representative item
from each discovered skill group are ready. Then commit coherent backend,
content/import, and verification milestones separately under Work ID LFL-023B.
Every change, however small, is documented and committed. Stage only owned
paths.

Run focused tests throughout and final `pnpm check`. Run the guarded dry-run and
local PostgreSQL/API journey. Record passed, failed, and not-run checks honestly.

Return a paste-ready handoff containing:

- branch, worktree, exact coordination base, and ordered commit SHAs;
- changed paths and exact final DTO/action contracts;
- all thirty private source item numbers mapped to neutral IDs, primary skill,
  secondary skills, question task, group, match confidence, and review status
  (put sensitive details in the private file and summarize safely in chat);
- group names and complete preparation-card text;
- private source-review and import paths, without their contents;
- migration/import/integration instructions;
- actual tests passed, failed, and not run;
- known gaps, uncertainties, and rollback.

Do not push or deploy. Source completion is not integration acceptance.
