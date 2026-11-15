# LFL-109 Listening recovery grace receipt

## Delivered

- Added a three-second rewind only when a Listening attempt is recovering from
  a hidden/frozen/restored browser tab or a newly opened attempt.
- Clamped recovery to the active timing-map boundary. During a conversation or
  talk lead-in it cannot move before the group context; after the mapped
  question cue it cannot move before that question cue.
- Applied recovery once per recovery event. Ordinary pause, explicit replay,
  and normal playback do not silently rewind.
- Kept server position, `heardListeningQuestions`, passed-question locking,
  answer-window validation, and `audio_played` reporting unchanged.

## Safety

The grace point is a media seek only. It cannot unlock a passed question,
create a new heard event, or move the authoritative attempt checkpoint
backwards. No database migration or attempt rewrite was required.

## Verification

- Focused listening helper tests: 3 passed.
- Full Vitest: 56 files, 217 tests passed.
- Full ESLint and TypeScript no-emit: passed.
- Next production build: passed.
- `git diff --check`: passed.

## Deployment

- App-only release deployed on PCT128 from `425e0c8` using
  `/opt/rehearse/.releases/425e0c8`.
- Image: `rehearse-app:425e0c8`
- Digest: `sha256:7a0da043592d22097b6ed7c8d542562834f73402395b634ccd1e3b8771b754ce`
- App healthy, restart count 0; PostgreSQL healthy and untouched.
- LAN/public health HTTP 200; signed-out teaching 307; unauthenticated
  resources 401.

Authenticated mobile playback and classroom audibility still require a real
browser journey; automated health checks do not claim those outcomes.
