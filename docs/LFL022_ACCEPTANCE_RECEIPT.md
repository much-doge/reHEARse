# LFL-022 — Lobby and finish acceptance

Status: deployed; runtime and live checks are recorded in
`docs/LFL022_DEPLOYMENT_RECEIPT.md`.

New class sessions show a large waiting roster with each joined alias, animated
character and ready status. Students configure a nickname or random animal name,
colour and character, then confirm readiness. Only the owning teacher can release
the game. Late joiners configure normally and enter after readiness if already
released. Solo runs use the same setup before beginning.

Readiness locks the profile at the server boundary. Appearance is pinned to each
run, while the shared preference seeds future setup. Audio URLs and questions are
withheld until personal readiness and teacher release. Existing sessions/runs
migrate as started/ready so in-flight games continue. On full completion, the
learner automatically returns to the activities dashboard with an owned recap.
No scores or rankings are added.

## Verification

- `pnpm check`: 143 tests in 38 files, lint, TypeScript and production build passed.
- Local runner/tools built; migration 015 applied to real local PostgreSQL.
- `scripts/lobby-local-journey.mjs`: six concurrent readiness and teacher-start
  retries, hidden pre-start media/items, name validation, role/ownership guards,
  profile locks, per-run appearance, late join, full eight-question completion,
  owned dashboard recap and foreign recap suppression, closed-session start guard.
- Updated avatar PostgreSQL/API journey passed owned profile changes, duplicate
  no-op, six concurrent cross-run writes, pinned cosmetics and ready lock.
- Updated complete-game PostgreSQL/API journey passed both games, all five audio
  recordings/ranges, passage-scoped replay/support, teacher assistance, checkpoint
  retries, media pins, historical content readers and final completion.
- Chromium passed teacher creation/empty lobby, visible joined name/character and
  ready status, learner setup, waiting across refresh, automatic teacher release,
  absence of in-game appearance controls, completion dashboard redirect/recap,
  new solo setup/random alias and 390px fit; no page errors.
- UI review moved the setup/waiting content ahead of the game board on phones.
  The final rebuilt image passed the same complete browser journey.

No classroom pilot is claimed. Browser completion used saved API actions for
pace, with the redirect and recap observed in the UI. Earlier complete-game
acceptance covers normal player controls/replay paths.

Rollback must retain migration 015 and compatible content readers. An earlier
app ignores lobby gating and must not be deployed while waiting rooms exist.
Restore a compatible image or disable new joins while fixing a release. Do not
remove learning attempts, game events or profile history.
