# LFL-108 Listening resume and transition receipt

## Delivered

- Restored Listening autoplay from the best known checkpoint after a hidden,
  frozen, or restored browser tab. The client keeps a throttled attempt-local
  checkpoint and combines it with the server's append-only `audio_played`
  position; this does not autoplay without a user gesture and cannot unlock an
  answer window.
- Saved the position on pause, `visibilitychange`, `pagehide`, and playback
  updates. A `pageshow`/visible refresh rehydrates the attempt and seeks the
  player forward only when the audio element has fallen behind the checkpoint.
- Replaced question-number-only group rendering with timing-map helpers. At a
  Part B/C `contextStartMs`, the complete mapped conversation/talk question
  group is shown. At each mapped question cue, the display returns to one
  question and its answer controls. Selected-question assignments filter the
  group without changing the source timing map.
- Kept transition directions tied to mapped part starts and group lead-ins,
  rather than leaving a Part B/C direction banner visible through the response
  window.

## Package coverage

The same implementation is used for every registered full package:

- `ets-volume1-practice-test-a`
- `ets-volume3-practice-test-a`

The Volume 3 Practice Test B directory remains a partial, unregistered source
and was intentionally not modified.

## Data and safety

- No database migration or data write was required.
- Existing attempts, answer events, timing maps, and package content remain
  unchanged.
- The server remains authoritative for answer timing and section completion.
- The local checkpoint is browser convenience data only and is ignored if it
  would move playback backwards.

## Verification

- Focused helper tests: 2 passed.
- Full Vitest suite: 56 files, 216 tests passed.
- Full ESLint: passed.
- TypeScript no-emit check: passed.
- Next production build: passed.
- `git diff --check`: passed.

Authenticated mobile/browser resume behavior and classroom audio audibility
remain deployment/classroom verification items, not claims made by these local
checks.
