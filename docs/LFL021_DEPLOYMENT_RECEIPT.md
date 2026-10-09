# LFL-021 / LFL-021A — Complete listening games

Status: deployed to PCT128 on 2026-10-09 (Asia/Jakarta).

Implementation: `a4ff55073c31a59ac4120765952175850356932e`.
Final runtime source, including older-browser compatibility:
`91af3bbd0e5b15fa4e610817740a8fe2507ae326`.
Image: `rehearse-app:91af3bb`.
Running image ID:
`sha256:1d8f6bbc389fc7ba9e417cf3ba1e15e2180d3717d539115f2c70f3a0be54fda6`.

## Delivered

**Conversation journey** joins both conversations into one game: two recordings
and eight original A–D questions. **Talk journey** contains all three talks:
three recordings and twelve original A–D questions, distributed five/three/four.

Each complete game uses one saved run or classroom PIN. After the current
passage's replay and supported-review tasks close, an explicit checkpoint action
opens the next recording and its functional route. Only the final passage ends
the game. Refresh and repeated checkpoint requests preserve ordered progress.
Teacher passage tabs show participants on their current board. Named animated
companions, appearance choices and acknowledged answer effects remain available.

New interfaces explicitly select complete games. Unversioned catalogue requests
and unspecified starts retain the original single-recording contracts for older
browser tabs. Existing PINs/runs keep their pinned content and recordings;
create a new PIN to use a complete game. Learner diagnostics gain no scores,
ranks or proficiency judgments.

## Deployment and isolation

Committed main was pushed, then pulled with `--ff-only` in `/opt/rehearse` through
root on Proxmox `192.168.8.50` and `pct exec 128`. Matching app/tools images were
built, additive migration 014 applied, and three protected talk activities imported
through the configured object-storage adapter. Only the app was recreated.
The two conversation recordings were reused. New audio totals 4,427,084 bytes.

Private database dumps, environment copies and baselines were saved before both
the initial release and compatibility follow-up under `/opt/rehearse/.secrets/`.
Dump sizes were 78,217 and 84,560 bytes. The initial import-script helper error was
corrected before switching the app; the retry completed successfully.

All ten prior listening attempts and six prior ladder runs remain. Classroom
room phase/index/revision values were unchanged. PostgreSQL and eight Writing
Analysis Studio containers retained their exact IDs and images. Cloudflare,
DNS and credentials were not changed. Source mapping, import inputs and
alignment outputs remain outside tracked/public files.

## Verification

- Final `pnpm check`: 140 tests in 37 files, lint, TypeScript and production build.
- Real local PostgreSQL/API journeys covered both complete games, all five
  recordings, passage scoping, wrong-choice replay/support, teacher assistance,
  final finish, role/ownership checks, immutable media pins, late PIN joins and
  six concurrent same-key checkpoint retries producing one event. Both catalogue
  contracts, unknown formats and unspecified older-client starts were checked.
- Complete local Chromium journeys covered both games, real audio playback and
  contextual seeks, A–D choices, replay revision, checkpoint refresh, recording
  changes, functional five/three/four-question routes, teacher tabs, 1080p/720p
  projection, phone layout and draft preservation. No page errors were reported.
  Playback completion used controlled seeking rather than normal listening time.
- Legacy-start picker/start checks and historical saved-game compatibility passed
  locally. New server-only context/repair samples were absent from all 17 client
  JavaScript chunks.
- Final image is healthy. LAN `http://192.168.8.63:3001/api/health` and public
  `https://rehearse.najala.org/api/health` return 200.
- Public authenticated v2 catalogue exposes two complete games / twenty questions;
  unversioned catalogue preserves two original single-recording choices.
  Unauthenticated catalogue returns 401. An existing administrator-owned historical
  game resumed with its original contract and working media.
- All five live recordings passed full checksum/byte-size and range-206 checks;
  newly imported talk objects also passed content-type checks.
- Final live HTTPS Chromium passed learner/teacher selectors, talk selection,
  neutral public wording, 390px layout, signed-in homepage/dashboard navigation,
  and signed-out return destination, with no page errors. An earlier selector
  wait timed out; a diagnostic retry and the full rerun passed without a code change.

No new production learning attempt, game, class session or live AI request was
created for verification. The separate temporary verification login was revoked
and its guest/local cookie fixtures removed.

## Limits and rollback

No human classroom pilot or independent teacher listening review is claimed.
New talk bounds use local speech alignment with sentence-context padding.
Automated playback/seeking checks do not replace human review of cuts or pacing.

Retain migration 014 and compatible multi-passage content readers. To stop new
complete-game starts, set `LADDER_START_VERSION=legacy` in the private production
environment and recreate only the app with production Compose `--no-deps`.
Existing complete games must remain readable. Do not restore the earlier
single-passage-only image after new games exist, delete attempts/events, or
overwrite activity/media versions. The checkout may advance to the documentation
receipt while the runtime remains the code artifact named above.
