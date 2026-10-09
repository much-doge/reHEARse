# LFL-019B implementation receipt

Status: source-complete avatar lane; awaiting lead review and integration.

## Contracts

- `Avatar({ id, size = 72, animate = true })`: safe fallback for unknown IDs;
  layered SVG; no per-character JavaScript animation loop.
- `AvatarPicker({ value, onChange, disabled = false, animate = true })`:
  bilingual labelled region, 30 native buttons, pressed state, visible keyboard
  focus, live selected name and cryptographically random alternative.
- `AvatarControls({ view, disabled = false, animate = true, onView })`:
  saves only acknowledged selections, blocks duplicate in-flight saves, retains
  the prior view after failure, and presents paired retry/success/save copy.
- `POST /api/ladder/avatar` accepts strict JSON
  `{ "runId": "<uuid>", "avatarId": "<catalogue-id>" }` and returns
  `{ "view": <LadderView> }` with `Cache-Control: private, no-store`.
- `LadderView` and each `HostView.players` member add `avatarId`; public ladder
  contract is deliberately `listening-ladder.v2`.
- Repository boundary is
  `setAvatar(actor, runId, avatarId: AvatarId): Promise<LadderView>`.
- Migration: `migrations/011_ladder_appearance.sql`.

## Persistence and security

`ladder_avatar_preference` stores one current cosmetic preference per user;
`ladder_avatar_change` records actual changes append-only with private actor/run
context. A repeated current selection is a no-op. The owned run is locked while
changing preference so a concurrent answer save serializes safely; no gameplay
column is written. Server checks cover same origin, JSON content type, 256-byte
body limit, strict keys, UUID, catalogue membership, authentication and run
ownership. Teacher/admin roles do not gain authority over another learner.

## Verification snapshot

- Focused TypeScript and unit checks passed after implementation.
- Guarded isolated Docker stack `rehearse-avatar-lfl019b`, bound only at
  `127.0.0.1:3011`, applied migration 011 and passed the API/database journey:
  own change, invalid ID, unauthenticated/foreign-run rejection, host
  projection, reload/later-run persistence, duplicate no-op, unchanged
  gameplay state/revision, and concurrent answer plus cosmetic preservation.
- Browser checked the actual picker on desktop: all 30 rendered, random choice
  changed the live selected name, native buttons were keyboard reachable, and
  visible focus CSS is present. Gallery checked at desktop and 390x844 phone
  viewport; `Avatar` samples checked at 48, 64, 88 and 112 CSS pixels.
- Animation pause is implemented by `animate={false}`; reduced-motion CSS
  disables all animation. Source inspection verified both. No 1/10/30-player
  board crowding or integrated game mount was tested because those are owned by
  the lead.
- Full `pnpm check` passed in a disposable Node 24 image using the repository's
  pinned pnpm 11.19.0: ESLint, TypeScript, 22 test files / 82 tests, and the
  production Next build. `git diff --check` also passed.

Exact commit SHAs and clean-tree confirmation are supplied in the return
handoff. No push or deployment was performed.

## Integration and rollback

Apply migration 011, mount `AvatarControls` through the lead's existing view
reconciliation, and render `view.avatarId`/player `avatarId` in lead-owned board
markers. Do not replace an in-progress choice/explanation with a stale cosmetic
response. Then run the lead's combined board/crowding/browser journey.

Application rollback is safe without dropping the two additive tables; the
earlier app ignores them and all learning/game records remain intact. If asset
rollback is needed, revert the LFL-019B commits after removing lead integration.
Dropping cosmetic tables is unnecessary and would discard appearance history.
