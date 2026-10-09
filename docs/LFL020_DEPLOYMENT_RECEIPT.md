# LFL-020 two-conversation release

Status: deployed to PCT128 on 2026-10-09 (Asia/Jakarta).

Runtime source: `065f16482b3ca732be4bac8b7a5d6dc3c9ee36f5`.
Image: `rehearse-app:065f164`.
Running image ID:
`sha256:7f1a0abb96a4d752edcf0b16aa0279584b55ce045dbcbfef3c496d965d3cf121`.

## Delivered

Both Part B conversations are independently playable: **Three papers, one
thread** and **Ocean currents in motion**. Each contains four original ordered
A–D questions with contextual replay, separate follow-up tasks, bounded support
and a visible finish. The learner selects a solo conversation; the teacher
selects a conversation when creating a class session and its PIN pins that
choice for joining learners.

New games have executable snakes and recovery ladders, saved ordered movement,
a separate finish tile, named animated companions, existing colour choices and
acknowledged green/red/neutral feedback. Existing games keep their historical
three-choice questions and movement. Projection includes the complete chapter
route at 1080p and 720p. Learner diagnostics do not gain scores or ranks.

## Deployment and isolation

The lead pushed main, connected as root to Proxmox `192.168.8.50`, then used
`pct exec 128`. The guest pulled main with `--ff-only`, built matching runner
and tools, applied additive migration 013, imported the second protected
activity through the existing configured object-storage adapter, validated
its public delivery, and recreated only the reHEARse app.

Before changes, a private database dump (74,339 bytes), environment copy and
container/data baseline were saved under `/opt/rehearse/.secrets/lfl020-*`.
All 10 prior listening attempts and five prior ladder runs remain. Existing
classroom room phase/index/revision values were unchanged. PostgreSQL and eight
Writing Analysis Studio containers retained their exact IDs and images.
Cloudflare, DNS, credentials and other services were not changed.

## Verification and limits

- Final local `pnpm check`: 132 tests, lint, TypeScript and production build.
- Guarded real PostgreSQL/API and Chromium checks for both original games and
  historical/rollback-mode games passed; see `LFL020_INTEGRATION_RECEIPT.md`.
- Runtime healthy; LAN `192.168.8.63:3001` and public HTTPS health return 200.
  A fresh connection retry through Proxmox and PCT128 also returned LAN 200.
- Public authenticated catalogue returns both conversations / eight questions;
  unauthenticated catalogue returns 401. No confidential source identifiers,
  transcript or keys appear in this response.
- Both public audio files passed full checksum/byte-size and partial-range
  delivery checks (206). The new audio is 1,585,897 bytes, type audio/mpeg.
- The existing administrator-owned historical game resumed through the public
  API with its original three choices and no new chapter DTO. Other old record
  IDs were preserved and their compatibility was tested locally; private
  learners' games were not impersonated in production.
- Final live HTTPS Chromium: both learner/teacher conversation selectors,
  second selection, neutral wording, 390px layout, session-aware homepage and
  signed-out return destination passed with no page errors. This was read-only;
  no new production game/session was created.

No production learning attempt, game or class session was created for these
checks. The separate short-lived verification login was revoked after browser
acceptance and its private fixture removed. No new live feedback-provider call or classroom pilot was run.
Human listening review of every replay cut and classroom pacing remain pending;
automated player checks seek to segment boundaries and do not establish that a
human heard every cut. Whole-conversation replay remains available.

## Rollback

Keep migration 013 and the compatible content/mechanics readers. To stop new
original games, set `LADDER_START_VERSION=legacy` in the private production
environment and recreate only `app` using production Compose `--no-deps`.
Existing original games remain readable. Do not deploy an older v1-only image
after original games exist. Never delete attempts/events or overwrite activity
versions to roll back. The source checkout may advance to this documentation
receipt while the runtime remains the code artifact named above.
