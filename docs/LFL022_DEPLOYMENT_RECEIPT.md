# LFL-022 — Teacher-controlled lobby release

Status: deployed to PCT128 on 2026-10-09 (Asia/Jakarta).

Runtime source: `ca07eaebf01c9fd88dab1e0bc3d93b120913fa86`.
Image: `rehearse-app:ca07eae`.
Running image ID:
`sha256:4398004f18d341886c61064ee9bd59b21f13e1ae4ed24038649ceaece3ba9ff0`.

## Delivered

New class sessions open in a large waiting room showing every joined player's
name, animated character and readiness. Students choose a bounded nickname or
random animal name, colour and character, then confirm. The owning teacher
starts the game; students' waiting pages open automatically on refresh/poll.
Late joiners can finish setup and enter an already-started game.

Character/name setup closes at readiness. The server rejects later changes and
each run pins its own character/colour, so another game's setup cannot change
it. Playback URLs/questions and gameplay writes are gated until personal
readiness and teacher release. Solo play confirms setup without a teacher gate.

Every fully finished run returns automatically to the activities dashboard with
an owned completion recap and a new-game link. No diagnostic score or rank is
introduced. Passage checkpoints remain individual after the initial teacher
release. Existing games and sessions retain their in-flight play; create a new
class session/PIN to use the waiting room.

## Deployment and preservation

Main was committed/pushed, pulled with `--ff-only` through root on Proxmox
`192.168.8.50` and `pct exec 128`, and matching app/tools images built. A private
87,875-byte database dump, environment copy and container/data baseline were
saved under `/opt/rehearse/.secrets/lfl022-*` before changes.

Only the app was briefly paused while additive migration 015 backfilled existing
sessions/runs as started/ready, preventing old-reader writes during the switch.
Only the app was recreated. All ten prior listening attempts, ten prior ladder
runs and classroom room phase/index/revision values were preserved. PostgreSQL
and eight Writing Analysis Studio containers retained their exact IDs and
images. Cloudflare, DNS, credentials, activity/media versions and audio objects
were not changed.

## Verification and limits

- Final `pnpm check`: 143 tests in 38 files, lint, TypeScript and production build.
- Real local PostgreSQL/API lobby, avatar and both complete-game journeys passed:
  six concurrent ready/start retries, hidden pre-start media/items, name bounds,
  role/ownership checks, profile locks and per-run cosmetics, late joins, passage
  replay/support, media pins, completion and foreign recap suppression.
- Final local Chromium observed empty teacher lobby, visible joined character/name
  and ready status, setup, waiting across refresh, teacher release, locked in-game
  appearance, completed-run dashboard redirect/recap, new solo/random setup and
  390px fit, without page errors. Setup no longer puts the game board ahead of the
  controls on a phone. See `LFL022_ACCEPTANCE_RECEIPT.md`.
- Final image is healthy. LAN `192.168.8.63:3001` and public HTTPS health return 200.
- Public verification checks migration 015, catalogue, new teacher-start/ready
  ownership and authentication guards, and existing administrator-owned runs'
  v5 readiness/media/profile-lock contract. Public Chromium checks learner/teacher
  selectors, phone layout, session-aware homepage/dashboard navigation and signed-out
  return destination.

No new production game, class session, learning attempt or AI request was created
for verification. The short-lived verification login is revoked after live checks
and its private fixtures removed. Full lobby interaction was verified locally,
not with a live class; no human classroom pilot is claimed.

## Rollback

Retain migration 015, immutable history and compatible content/lobby readers.
An earlier app ignores readiness/release and must not be restored while waiting
rooms exist. Restore a compatible app or disable new joins while fixing the
release; never delete learning records to roll back. The checkout may advance
with this documentation receipt while the runtime remains the code artifact above.
