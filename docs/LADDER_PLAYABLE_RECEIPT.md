# Listening ladder release — LFL-016

Status: deployed to PCT128 on 2026-10-06. Runtime source: `d0b96194587ce1471f1cbee13700baec9a9829e3`. Classroom pilot pending.

## Playable scope

Individual signed-in play at `/ladder`; teacher-owned live class board at
`/ladder/host`. One conversation, four meaning tasks, media-time cues, saved
choices, replay explanations, separate follow-up interpretations, short snake
detours, recovery ladders, supported exits and help requests. Teacher-created
PIN sessions use learner sign-in; teachers/admins can try a solo journey.

One finite floor is playable. General imports, the remaining four passages,
video and expandable multi-floor sessions are not implemented. No fake next
floor is displayed. Help is available deterministically, with no speed reward
or random advantage. Board movement is recreational and isolated from practice
history. Completion is not proficiency or a judgment of the whole explanation.

## Content preparation

The exact existing audio checksum binds spans 8.250–26.500, 26.500–45.050,
45.050–71.300 and 71.300–97.000 seconds. The source announcement is outside the
playable spans. Local faster-whisper base.en word/segment alignment was compared
with the existing corroborated source transcript. End boundaries occur between
utterances; no external transcription upload. Browser/device playback and
classroom content review are separate checks to record below. No claim of an
independent teacher or native-speaker review is made.

Three parallel first-pass options per task, three follow-up options, documented
distractor reasons, bounded listening cues and supported meaning statements.
Server-only content contains keys and source paraphrases. Public DTOs expose
neither keys nor transcript; supported meaning unlocks after a repair attempt.

## Media, privacy and persistence

Migration 010 adds isolated sessions, runs and append-only events. The mutable
run projection has an optimistic revision and row lock. Event request keys and
digests prevent duplicated movement; stale concurrent tabs are rejected.
Explanation feedback is requested separately after saving, has an owned guard,
uses the existing strict feedback adapter, and falls back to prepared guidance.
It never blocks completion. No provider/learner content is logged. No existing
practice or classroom-game records are modified.

CC0 icons and license are recorded in REUSE_REGISTER.md; game board artwork is
original. Keyboard controls, paired English/Indonesian guidance, mobile layout
and reduced motion are included.

## Verification

- `pnpm check`: ESLint, TypeScript, 74 tests across 20 files and Next production build passed.
- Final local runner image `12bcb3798cc8` and tools image `0ae3b7c14eae` built successfully; migration 010 applied locally.
- Guarded local PostgreSQL/API journey passed: six concurrent retries produce one event; altered request and stale revision reject with 409; ownership and role guards; bounded all-wrong repair; supported completion; owned feedback; idempotent teacher assistance; saved resume; finish and closed-session behavior.
- Local learner browser completed all four spans and one replay explanation. Observed pauses: 26.501144, 45.051568, 71.303827 and 97.000662 seconds. This is one desktop browser observation, not a universal timing guarantee.
- Final-image browser verified game start, canonical URL and refresh recovery. Phone breakpoint 390 px had document/scroll widths of 375/375 px, with no horizontal overflow. Teacher live board displayed joined learner alias; projector mode hid private help controls.
- Local template feedback verified. Production administrator solo preview saved one choice, advanced to part two and restored after refresh; one empty teacher class session was created through the normal signed-in UI. No learner practice attempt or live AI call made. Classroom pilot and independent teacher review remain pending.
- PCT128 runner `rehearse-app:d0b9619`, image `sha256:09e0ba7d60a28d59c8171bbfcdd6f58f2f34664745a9fa341be03249d4e033a8`, is healthy with zero restarts. Tools image `sha256:dcdd780a861ba4db7fc0280a8436a8a0d573b65991fa9384489a2897078eaade`; additive migration 010 applied once.
- LAN `192.168.8.63:3001` and public HTTPS health returned 200. Public unauthenticated game/host APIs returned 401; CC0 SVG returned 200. TLS verification returned 0. A Python urllib request was denied with 403 at the edge; normal curl and the actual browser succeeded.
- Public signed-in browser loaded the actual game, played the source media without error, and paused the first span at 26.515112 seconds. Production save and refresh recovery passed. Teacher dashboard created a ready-to-join PIN session.
- PostgreSQL and all 13 unrelated container IDs/images/states matched the baseline. Existing practice attempt IDs and classroom room phase/index/revision were unchanged.
- Local final-image teacher board visibly moved the learner token after a saved choice; projector mode hid help controls. Production multi-device classroom use is not yet observed.

## Rollback

Restore `/opt/rehearse/.secrets/lfl016-env-before` (previous image tag `228c1ab`) and recreate only the
production app with `--no-deps`. Retain additive migration 010 and all game
records. Earlier app images ignore these tables. Do not erase learner events.

Protected database backup: `/opt/rehearse/.secrets/lfl016-db-before.sql` (96,257 bytes). No credentials or learner content are recorded in this receipt.
