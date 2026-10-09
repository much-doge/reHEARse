# LFL-020 afternoon sprint — manual desktop handoff

Prepared 2026-10-09, Asia/Jakarta. User allocation: second desktop 60%; lead
40% plus acceptance. The human relays this assignment to the other Codex
installation. Do not spawn substitute agents or message another chat.

## Delivery target

The next ordered slice in `MECHANICS_REVIEW_AND_SPRINT.md` is Next A: one
complete passage using its original four questions/options (A, B, C, D), with
purposeful replay and historical version resolution. Deliver this first.
Keep the existing game playable, preserve all old runs, and retain finite
repair/support and cosmetic settings. This afternoon's deployment is owned by
the lead after combined acceptance, not by either worker declaring its own
slice done. The human explicitly added functional snakes/recovery ladders today.
Implement the exact topology and saved movement contract below. No multi-floor or video expansion today.

## Current source and isolation

Main checkout: `/home/miko/Documents/playground/reHEARse`.
Source baseline: `17b382d251f43731df0d1dd24937b2ae1b797ba4` (clean at claim).
Runtime: `rehearse-app:f24a97c` in PCT128; main also has its receipt.
Existing older worktree `/tmp/rehearse-lfl019-avatars` belongs to the previous
avatar lane. Preserve it and its branch; create a fresh worktree/branch.

Read main's AGENTS.md, PROJECT_CONTROL, CHANGE_LEDGER, this handoff,
MECHANICS_REVIEW_AND_SPRINT, SOURCE_REGISTER, and relevant architecture/design
contracts. Read Next's installed guides before Next/route edits. Start from
the new coordination commit containing this document; record its exact SHA.
Check branch/worktree names before creating:

`codex/lfl020-content` at `/tmp/rehearse-lfl020-content`.

The lead continues only in main. Do not change its checkout, use blanket
stash/reset/clean, stage unrelated work, push, deploy, or touch Cloudflare.
Use pinned pnpm; no new dependencies without measured need. The fallback
pnpm directory in this environment is
`/home/miko/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback`.

## Second desktop — LFL-020B, approximately 60%

Own the content, backend compatibility and executable movement vertical slice:

1. Preserve the current authored three-choice content version byte-for-byte
   in behaviour. Add a new immutable, neutrally named content version for the
   same passage with the original four prompts/options and original A–D order.
   Verify against operator audio and source materials, including the spoken
   question clips. Do not invent D or silently substitute a different target.
   First passage only; no pretending all twenty later questions are ready.
2. Use the protected/local source inventory to corroborate wording, key and
   contextual spans. Source-register URLs are starting points, not official
   answer authority. Check online if needed. Do not publish confidential source
   names, numbers, codes or archive URLs in new public docs, DTOs, titles or
   bundles. Preserve operator source provenance privately. Record uncertainties
   and a bounded teacher review sheet in `.secrets/lfl020-source-review.md`
   (ignored, restrictive permissions); do not log full transcripts or keys.
3. Resolve content, transcript/guide and audio by each run's stored immutable
   versions. Existing runs must resume and request feedback after newer content
   or activity versions exist. Never retarget an old run to latest content.
   Session joins must use the session's pinned version; reserve additive
   migration 013 if session/content pinning needs storage. Do not edit 001–012.
4. Generalize validation to the actual first/repair option counts. Original
   first-pass choices have four; fresh diagnostic repair choices can still
   have three. Reject out-of-range/noninteger choices at the server boundary.
   Preserve action/revision/idempotency semantics, finite support, neutral
   uncertainty, character colours, aliases and append-only events.
5. Remap each original target to useful contextual spans in integer
   milliseconds. Do not merely reuse four arbitrary cuts. Keep complete
   conversation replay possible, and retain enough context for inference.
   Keys/transcript/reasons remain server-only; bounded supported meaning remains
   gated. Author bilingual repair focus/hints and a fresh follow-up task for
   each original target. Do not reveal missing answers in the first nudge.
6. Test legacy/new side-by-side starts, resume, expired/closed session,
   stale/idempotent retries, invalid D on a legacy item, valid D on a new item,
   invalid repair bounds, no leaked keys/transcript, teacher ownership and
   feedback/media version resolution. Add a guarded local PostgreSQL/API
   journey; do not seed or test with writes in production.

7. Implement the new deterministic chapter movement reducer and persist each
   accepted transition together with its event. Pin content and mechanics on
   session/run creation. Legacy runs retain legacy movement. Include exhaustive
   mixed-choice/repair/support simulation and idempotent movement tests.

Owned paths:

- `src/domain/ladder/model.ts`, model tests, and new domain content/version
  schema/resolver files and their tests.
- `src/adapters/ladder/content.ts`, content tests, new server-only versioned
  content files, `postgres-ladder.ts` and dedicated adapter tests.
- `src/adapters/db/listening-repository.ts` plus dedicated version-resolution
  tests, narrowly to read a stored activity version while preserving access.
- `src/application/ladder/repository.ts`, ladder API routes and route tests,
  only for this content/version slice. Do not change appearance endpoints.
- Additive `migrations/013_ladder_content_version.sql` if needed; dedicated
  `scripts/lfl020-content-local-journey.mjs` with local guards.
- `src/components/ladder/view-reconciliation.test.ts` only to update fixture
  contract versions/required DTO fields if the public contract changes.
- `.secrets/lfl020-source-review.md` for confidential operator review only.
- `docs/LFL020_CONTENT_RECEIPT.md` and the LFL-020B ledger row in your worktree.

Do not edit learner/host/board components, global/component CSS, avatar assets,
answer effects, authentication, production config or other ledgers/receipts.
If another path is necessary, propose the exact change through the human.

## Lead — LFL-020A, approximately 40% plus acceptance

Own the functional snake/ladder board and saved-transition animation, learner-facing A–D presentation, clear question/replay checkpoints,
robust timestamp/audio controls, bilingual guidance and accessible responsive
layout. Remove hardcoded four-item indexing from the UI, keep original option
letters/order, and preserve drafts/selection across cosmetic/feedback updates.
Maintain speech priority, reduced motion and honest supported completion.

Owned: `src/components/ladder/game.tsx`, `board.tsx`, `board-layout.ts` and tests,
`board.css`, `host.tsx`, `src/domain/ladder/journey-contract.ts`, new listening UI helper/components and
focused tests, scoped styles, `view-reconciliation.ts` if needed, and later
integration/browser/journey checks. Lead serializes shared ledger/decision edits,
reviews confidential content worksheet, integrates actual commits, runs final
pnpm/container/API/browser checks, pushes main and deploys only reHEARse app
via root Proxmox `192.168.8.50` -> `pct exec 128`. Preserve other services,
private source details, provider credentials and all prior records.

## Frozen compatibility contract

- `LadderItemView.options` stays an ordered bilingual array; index 0..3 maps
  to A..D. Do not shuffle. Repair options are separately bounded.
- `startMs`/`endMs` stay integer millisecond contextual replay bounds. These
  describe the current item's purposeful listen, not arbitrary timeline slices.
- `items.length` is the total task count. UI must not assume index 3 exists.
- Existing fields/actions and appearance contracts remain available. Legacy movement stays unchanged; new runs use the separately pinned
  chapter-route.v1 mechanics below. No scores or ranks. An explicit DTO bump is permitted, but report it
  before handoff and update both legacy/new projected results consistently.
- New optional `contentVersion`/`questionFormat` metadata may be proposed; keys,
  source identifiers, complete transcript and reasons must never cross the
  public boundary. No required new UI field without lead agreement.
- The lead can build against the existing DTO while backend work is isolated.
  If any contract must change incompatibly, stop that portion and report it
  through the human before implementing dependent changes.

## Approved chapter topology and movement contract

The user approved this scope after the initial coordination commit. This
revision supersedes the earlier Next A-only movement boundary.

Public types and map live in the lead-owned
`src/domain/ladder/journey-contract.ts`; import them, do not edit them.
`LadderView` adds optional `journey?: LearnerJourney`; `HostView` adds optional
`journey?: HostJourney`, and each host player adds optional
`lastTransition?: JourneyTransition | null`. Legacy DTOs omit journey. New
DTOs always supply the immutable map and latest saved transition. The lead
renders these fields, not an inferred snake from a position delta.

Four chapters use entry/replay nodes E = 3*i+1, snake-trigger nodes T =
3*i+2 and camp nodes C = 3*i+3 for i=0..3. Start is 0; finish is 13.
The immutable map has snakes T->E and ladders E->C for each chapter.
Finish is distinct from camp 12, so pending repairs cannot appear finished.

For a new first choice:

- Match: walk current->E, then ladder E->C (`first_match`).
- Mismatch: walk current->T, then snake T->E (`first_mismatch`), queue repair.
- Uncertain: walk current->E (`uncertain`), queue repair, no snake.
- Proceed to the next first-listen question without forced earlier replay.

After all four first choices, an accepted repair first walks current->that
chapter's E if necessary. A failed repair stays there (`repair_retry`) with
no extra snake. A revised, supported or teacher-assisted closure uses E->C
ladder (`repair_revised`, `supported`, `teacher_assisted`). When all chapters
close, append walk current->13 (`finish`) to the same accepted transition.
Skip zero-length walks. Help-only events do not invent movement. Uncertainty
is neutral and legitimate supported completion receives equal celebration.

Store eventId, revision and ordered steps from the public contract. Event
retries must return the recorded transition, not a new animation event. A
reload shows the saved final node without replaying old movement. The client
may animate a newly acknowledged higher revision and must stop motion for
speech/reduced-motion/unmount. The latest transition and `position` must agree.

Reserve migration 013 for additive content/mechanics pinning and nullable
movement JSON. Never modify old events/state. Treat imported old rows as legacy.
The worker may choose an internal state shape but must expose the frozen
public contract. Validate both first and repair option cardinalities.

Provide an adapter-level `LADDER_START_VERSION=legacy|original` switch (default
original once accepted) to disable new original starts while retaining readers
for already-created versions. No process/env dependency in domain functions.
Rollback after new runs exist must retain their version readers; do not claim
that an old v1-only image can resume a new version. Explain this in the receipt.
The lead owns any production Compose/environment wiring needed for the switch.

## Handoff and release gate

Commit coherent work with Work ID, invariants, privacy, rollback and tests
actually run. Provide an early contract/content checkpoint before the complete
lane so integration can begin while you finish tests. Return exact commit SHAs
in cherry-pick order, base SHA, changed paths, pnpm check output summary,
local API/browser checks actually performed, failed/unavailable checks,
confidential worksheet path, known gaps and rollback. Do not report source-
complete as deployed. Keep the worktree clean; no credentials in commits.

Lead accepts only when old/new runs work side by side, original options and
spans are reviewed, no key/transcript/source identifiers leak, finite repair
works, retries/expired login preserve text, coloured avatars still save, and
phone/keyboard/reduced-motion checks pass. Reserve a final acceptance/deployment
window; reduce optional scope before weakening these gates. Main integration,
push and production switch remain lead-only.
