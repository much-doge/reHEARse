# LFL-109 Listening recovery grace plan

## Goal

Give a learner a short audio context replay when a mobile/browser tab is
restored, without reopening a passed question or changing the authoritative
attempt state.

## Design

- Apply a three-second rewind only after a recovery signal (`pageshow`, visible
  restoration, or `pagehide` followed by a new media load), never after every
  ordinary pause or teacher replay.
- Clamp the target to the current mapped `contextStartMs` or
  `questionAudioStartMs` so recovery cannot cross into the preceding question
  or Listening part.
- Choose the maximum of the server checkpoint and the attempt-local checkpoint
  first; then subtract the grace interval only for the media element's seek.
- Keep the server checkpoint, `heardListeningQuestions`, passed-question lock,
  and answer-window validation unchanged. A recovery seek is playback-only.
- Do not emit a new `audio_played` event merely because the grace replay was
  applied. Existing idempotent answer-window reporting remains authoritative.
- Apply the same helper to every registered full package using its timing map;
  do not add form-specific offsets.

## Safety tests

- Recovery rewinds at most three seconds and never below a mapped context or
  question boundary.
- A rewind cannot make a passed question selectable or create a new heard
  event.
- Repeated visibility events do not repeatedly rewind the same recovery.
- Existing exact-resume behavior remains unchanged for ordinary pause/replay.

No database migration is expected.
