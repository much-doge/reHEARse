# Listening ladder release — LFL-016

Status: container-verified locally; production deployment pending.

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
- Local template feedback verified; no production learner attempt or live AI call made for this work. Classroom pilot and independent teacher review remain pending.
- Production deployment checks pending.

## Rollback

Restore the protected pre-release environment image tag and recreate only the
production app with `--no-deps`. Retain additive migration 010 and all game
records. Earlier app images ignore these tables. Do not erase learner events.
