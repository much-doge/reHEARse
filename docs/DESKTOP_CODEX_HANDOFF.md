# Manual desktop-to-desktop sprint handoff

Work ID: LFL-019; implementation lanes LFL-019A/B; coordination LFL-019C.
Prepared 2026-10-09. The human carries messages between two separate desktop
Codex installations. Do not substitute subagents for the second desktop.

## Objective and split

Ship a lively individual listening game with saved-answer effects and at
least 30 distinct, licensed animated avatar choices. Characters must be large
enough to recognize on the teacher board, with learner alias bubbles above
them. Learners can select/change their character; bootstrap customization is
character selection plus random assignment, not a full character editor.

**Second desktop Codex owns LFL-019B:** finish the avatar artwork, renderer,
picker, saved appearance boundary, local verification and catalogue/recap.
**Original desktop Codex owns LFL-019A and integration:** answer effects,
large board markers/name bubbles/crowding, teacher roster, removing inert
snakes/ladders, gameplay/host wiring, final acceptance, main integration,
push and PCT128 deployment. Only the original desktop accepts the release.

Game mechanics/fairness and original A–D questions are **review/planning** in
this slice. Do not silently rewrite questions, keys, movement or old attempts.
Read `docs/MECHANICS_REVIEW_AND_SPRINT.md` for the proposed later sprint.

## Repository and starting state

Main checkout: `/home/miko/Documents/playground/reHEARse`.
Remote: `https://github.com/much-doge/reHEARse.git` (public).

- `ed31b17`: baseline before this sprint.
- `69feee8`: saved-answer effects checkpoint, LFL-019A.
- `edfa46f`: explicitly incomplete, unintegrated avatar scaffold, LFL-019B.
- This handoff/review is a subsequent documentation checkpoint. Read it from
  the main checkout before making your isolated worktree.
- `pnpm check` passed with these code drafts present: lint, TypeScript,
  **85 tests in 23 files**, production build. This is not avatar visual,
  database, browser, container or production acceptance.
- No part of LFL-019 has been deployed. Refresh deployment facts at release
  time rather than assuming an old receipt is current.

Read `AGENTS.md`, `docs/PROJECT_CONTROL.md`, the LFL-019 ledger rows, relevant
product/architecture/decision/design documents, `docs/AVATAR_DRAFT_STATUS.md`
and the mechanics review. Read relevant Next.js guides under
`node_modules/next/dist/docs/` before writing Next/React/route code.

Use an isolated Git worktree so the lead can work on the board simultaneously.
After checking branch/worktree ownership, create a new branch such as
`codex/lfl019-avatars` in `/tmp/rehearse-lfl019-avatars` from current local
`main`, recording the exact base SHA. Do not reuse/reset an existing branch or
directory without checking ownership. Example, if both names are unused:

```sh
git -C /home/miko/Documents/playground/reHEARse worktree add \
  -b codex/lfl019-avatars /tmp/rehearse-lfl019-avatars main
```

Install/reuse dependencies in your own worktree using the pinned package
manager. Do not change dependencies or lockfiles without a demonstrated need.
Do not change the branch or working tree of the lead checkout. Do not stash,
reset, clean or blanket-stage the lead's work. Commit your own paths only.

## Owned paths and boundaries

You may change these paths in your own worktree:

- `src/domain/ladder/avatars.ts` and dedicated avatar tests.
- `src/components/ladder/avatar.tsx`, `avatar-picker.tsx`, `avatar.css`, and
  a new `avatar-controls.tsx` or equivalent isolated appearance controller.
- `public/art/avatars/**`, including original licence and optional gallery.
- `src/domain/ladder/model.ts`: additive avatar DTO fields and public contract
  version only; **do not change movement/actions/outcomes**.
- `src/application/ladder/repository.ts`: narrow appearance method only.
- `src/adapters/ladder/postgres-ladder.ts`: appearance lookup/write and player
  projection only; preserve learning/save/content/session semantics.
- New `src/app/api/ladder/avatar/route.ts` and focused boundary tests.
- New additive `migrations/011_ladder_appearance.sql` (reserved for this lane).
- New `scripts/avatar-local-journey.mjs`, guarded for a local fixture DB only.
- `docs/AVATAR_DRAFT_STATUS.md`, `docs/AVATAR_CATALOG.md`,
  `docs/AVATAR_LICENSES.md`, `docs/AVATAR_IMPLEMENTATION_RECEIPT.md`.
- The **LFL-019B row only** in your worktree's `docs/CHANGE_LEDGER.md`.
  The lead will serialize integration of shared ledger edits.

Do not edit `game.tsx`, `board.tsx`, `host.tsx`, global CSS, answer-effect
files, existing content, authentication, other migrations, production config,
deployment receipts or the mechanics review. If a meaningful test requires
another path, report the exact proposed exception through the human first.
Do not push to main, deploy, change Cloudflare, or contact providers.

## Avatar deliverable

Use at least **30 genuinely distinct** characters, not just recolours. The
scaffold has named Kenney modular creatures with varied bodies, limbs, eye
arrangements and accessories. Improve or replace it if actual renders look
poor, preserving the component contracts. Make characters cute/cool and
coherent with the existing forest board. Avoid unlicensed franchise artwork.

Creator reference: `https://kenney.nl/assets/monster-builder-pack` (CC0).
Temporary archive: `/tmp/kenney-monsters.zip`; contact sheet:
`/tmp/monster-parts.jpg`. These are disposable handoff aids, not a durable
dependency. Re-download from a verified source if absent; inspect the archive
and licence before use. Copy only required PNGs into
`public/art/avatars/parts/`, verify every referenced file and preserve the
original licence. Record creator, exact source/download links, licence,
modifications and attribution. No tracking/hotlinked runtime artwork.

The pack supplies static parts. The component/CSS authors layered animation;
describe this honestly. Each character must visibly animate (blink/wave/body
motion), rather than merely moving its container while remaining a static
portrait. Honor `prefers-reduced-motion` and an explicit `animate={false}`.
Avoid needless network requests, 30 independent JS animation loops and heavy
canvas/WebGL dependencies. Check legibility at 48, 64, 88 and 112 CSS pixels.

Keep these APIs, or report a necessary change before integration:

```ts
AVATARS // readonly catalogue, with at least { id, name }
type AvatarId // allowed identifiers
isAvatarId(value: unknown): value is AvatarId
avatarFor(seed: string): AvatarId // stable fallback for existing identities
avatarDefinition(id: string) // safe known fallback

Avatar({ id, size = 72, animate = true })
AvatarPicker({ value, onChange, disabled = false })
```

Picker: selected state, keyboard focus, bilingual guidance, random/surprise
button and understandable save state. No custom image upload/free-text name
collection in this bootstrap. All appearances have identical game privileges.
Do not recolour a learner's character to represent answer correctness.

Provide an easily opened gallery of all 30 characters with their names, and
a concise catalogue describing distinctive silhouettes/features/motions.
Capture actual rendered output; a catalogue count does not prove visual quality.

## Saved appearance boundary

Add `avatarId` to `LadderView` and every `HostView.players` entry. Version the
changed public DTO contract deliberately (the ladder view's current version
is `listening-ladder.v1`); do not change stored content/mechanics versions.
Existing runs/users need a stable, valid fallback. New users should receive
a distributed default character, without changing on reload/poll.

Use a narrow repository method such as
`setAvatar(actor, runId, avatarId): Promise<LadderView>`.
The agreed HTTP surface is:

```text
POST /api/ladder/avatar
Content-Type: application/json
{ "runId": "<uuid>", "avatarId": "<catalogue-id>" }
200 { "view": <owned LadderView> }
```

Validate authentication, same-origin, JSON type, small body size, strict keys,
UUID, catalogue ID and run ownership server-side. Reject arbitrary asset paths.
Use existing safe error handling and `Cache-Control: private, no-store`.
All existing roles may customize their **own** run; teacher/admin status must
not authorize changing another learner's appearance. Teacher projection must
receive only its owned session's existing public avatar/alias fields.

Prefer a separate per-user cosmetic preference plus append-only appearance
change records. Record actor/run context privately; never log tokens or learner
content. Repeated selection of the current ID should be an idempotent no-op.
Use a transaction/lock where needed. Avatar changes must not modify gameplay
revision, choices, repair tries, explanations, learning events, attempt history,
content/media versions, aliases, session membership or teacher ownership.
Do not implement appearance as a synthetic gameplay action. Preserve concurrent
legitimate answer saves; never write stale state back while saving appearance.

Persistence must survive reload and a later run. Clearly document whether a
preference changes cosmetics on all owned runs (acceptable) or a per-run
override is used; cosmetic appearance is distinct from immutable learning
records. Do not mutate historical diagnostic outcomes.

Provide an isolated controller for the lead to mount, for example:

```ts
AvatarControls({
  view, disabled, animate,
  onView: (next: LadderView) => void,
})
```

It can wrap the picker and endpoint, retaining the existing selection on a
failed save and showing paired EN/ID retry guidance. Do not claim saved before
acknowledgement. Disable duplicate in-flight selections. Report the final
props contract. The lead will mount it in `game.tsx` using existing state
reconciliation so a cosmetic save cannot erase a draft explanation or choice.

## Product constraints and mechanics context

The learning loop is listen, express meaning, guidance, purposeful replay,
revise. Feedback should speak directly as you/kamu, can use aku, and should be
warm and plain. No cringeworthy victory/failure labels, no full-answer dumping.
Never publish the confidential package name, source code/number, transcript,
original question bank, learner text or secrets in UI, bundles or new public
docs. Keep the repository public; do not change visibility/history.

Do not add scores, percentages, ranks, proficiency colours or mastery claims.
Movement is recreational, not listening ability. Current formula: matching
first choice +3; non-matching +1 and a repair; uncertainty queues repair without
the two-tile reduction. Repeated failed repair adds no debt. Finite supported
completion remains valid. No movement reducer change in your lane.

The current drawn snakes/ladders are inert; the lead removes them. Do not add
replacement graphics implying executable rules. Original A–D items differ
from today's authored three-option tasks: a D distractor cannot restore them.
Content changes also require historical version resolution; the current
adapter is tied to a single content constant/latest activity. Plan only now.

## Verification, commits and return message

Run `pnpm check`. If pnpm is missing, this machine currently has a wrapper at
`/home/miko/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm`;
verify it and put its directory on PATH so nested scripts also work. Record
exact executable versions/results; do not silently skip checks.

Add meaningful tests for catalogue validity, asset completeness and persistence
boundaries. Verify in a local PostgreSQL/API journey: own change; invalid ID;
unauthenticated and foreign-run rejection; host projection; reload/new-run
persistence; duplicate no-op; gameplay state/revision/events unchanged; answer
save concurrent with cosmetic change preserves both. Use guarded local fixtures,
never production SQL sessions or provider calls. Reuse patterns from
`scripts/ladder-local-journey.mjs` without editing the lead-owned script.

Preview actual characters/picker on desktop and phone, keyboard operation,
reduced motion and paused animation. Record what you checked and what the lead
must still check. The lead handles 1/10/30-player board crowding and production.

Commit coherent milestones under **LFL-019B** on your branch, staging only
owned paths. Non-trivial commit bodies name invariants, privacy/security,
rollback and tests actually run. Update your receipt and ledger accurately;
do not call the overall feature complete before integration acceptance.
No deployment/push from this lane. Additive cosmetic storage survives rollback
to the earlier app; saved learning records must remain intact.

Return a message for the human to paste into the original Codex containing:

1. Branch, worktree, exact base SHA and ordered commit SHAs to cherry-pick.
2. Owned files and final component/HTTP/DTO contracts; migration name.
3. Catalogue of 30 names, gallery path/screenshots and source/licence details.
4. Exact checks passed/failed/not run; database and browser results separately.
5. Known gaps, integration steps, privacy effects and rollback procedure.

The original Codex will review the diff/licences, run integrated journeys,
request fixes where needed, then integrate, commit, push and deploy. The human
relays any acceptance questions/fixes; do not invent a direct messaging channel.
