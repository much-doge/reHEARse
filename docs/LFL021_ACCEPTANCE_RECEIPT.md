# LFL-021 — Combined game acceptance

Status: container verified; production release pending.

## Product

- Conversation journey: both existing conversations, eight original A–D questions.
- Talk journey: all three supplied talks, twelve original A–D questions (5/3/4).
- One saved run and PIN per complete game; one final finish.
- Durable passage checkpoint after current replay/support tasks close; explicit
  continuation changes the recording and its functional board.
- Teacher passage tabs show participant locations. Historical games remain resumable.

## Verification completed

- Final `pnpm check`: lint, TypeScript, 138 tests in 37 files, production build.
- Matching local runner and import/migration tools built; migration 014 applied.
- Three new activities imported through the existing operator CLI and local media adapter.
- `scripts/passage-local-journey.mjs`: both complete games, five distinct recording
  URLs with range 206, current-passage action bounds, replay/support, teacher assistance,
  final finish, ownership/roles, six concurrent same-key checkpoint retries yielding one
  event, immutable media pins, late PIN join after a changed publication pointer, and
  suppression of a game with missing current media.
- Historical content journey: original single-recording routes, three-choice diagnostic
  resume, concurrent activity identity, immutable private media URL, closed-session and
  ownership guards passed against the new runner.
- Chromium: both complete learner games, real audio metadata/playback and contextual
  seek boundaries, A–D choices, replay revision, refreshed passage checkpoints, correct
  audio change, 5/3/4 route maps, teacher passage tabs, 1080p/720p board fit, phone selector,
  preserved draft while opening character controls, no page errors.
- Browser completion used controlled seeking rather than waiting through every recording.
- New server-only repair/context samples absent from all 17 client JavaScript chunks.
- `git diff --check` passed. Private source mapping/manifests/audio are ignored.

## Review corrections

Continuation request fingerprints include the current passage, so retries refer to a
specific checkpoint. Feedback pins the recording associated with the repaired item;
the generic fallback also applies to talks. New public game and route contracts are
versioned while earlier content registrations retain their identities.

## Limits and release policy

No human classroom pilot or independent teacher listening review is claimed. New talk
bounds use local speech alignment and sentence-context padding. No production learner
attempt or paid AI request is required for deployment verification.

Deploy only committed main through the Proxmox host into PCT128. Back up before migration,
import/check the three audio objects, then recreate only the app. Preserve earlier
attempts/runs/room state and unrelated containers. After new multi-passage runs exist,
retain compatible readers; a start-only fallback may use `LADDER_START_VERSION=legacy`.
Do not restore an older image that cannot read the new content versions.
