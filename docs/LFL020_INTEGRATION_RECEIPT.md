# LFL-020 integration acceptance

Status: container-verified locally; production deployment pending.

The lead integrated worker commits `811154a`, `13e3eba`, `0c2e69d` as
`0ca50c8`, `f35cb28`, `e9bd431`, retaining the independently committed UI
checkpoint `da12166`. Both Part B conversations have four original A–D
questions, neutral titles, independently selectable starts and pinned class
sessions. New runs use saved functional chapter routes; old runs retain their
historical questions and movement.

## Review corrections — LFL-020C

- Corrected the closing exchange's follow-up key to the option describing the
  speaker's lack of subject experience. This content version has not yet been
  deployed, so no stored production run is reinterpreted.
- Recheck the winning row after simultaneous solo starts and fence competing
  teacher create requests by activity, including the race fallback.
- Pin authenticated local/private media URLs to the run's immutable activity
  version, as public object-storage URLs already were. A guarded real database
  journey advances current media, then verifies the old run still delivers its
  original checksum.
- Reject noninteger/nonfinite authored keys, in addition to existing request
  choice bounds.
- Wire and validate the production start switch. Legacy mode only advertises
  its available conversation; existing original-version games remain readable.
- Preserve protected operator input permissions while making the local imported
  audio copy readable by the unprivileged application. A fresh local import and
  actual Chromium playback exposed and verified this fix.
- Keep the complete chapter board visible at 1080p and 720p with readable name
  bubbles, and use neutral conversation-selection text before a game starts.

## Verification performed

- Final `pnpm check`: ESLint, TypeScript, 35 test files / 132 tests, production
  Next build. `git diff --check` passed.
- Runner `sha256:d908a2818c7e59e7dfb8865debdb738f3beaf9183d5f76db4b5bead24c1f003d`;
  tools `sha256:982e8b623baf6ad3c8c381c132153270cbd09caadddb2e20c962c517f53cfdd7`.
  A transient Docker registry DNS error was bypassed using Docker's bundled
  frontend with the same Dockerfile instructions, excluding its frontend hint.
- Local migration 013; fresh immutable second-activity import; protected input
  checksum, neutral media name, type and 1,585,897-byte size validated.
- Guarded actual PostgreSQL/API journey: two available activities; legacy/new
  reads; original D and rejected legacy/repair D; simultaneous changed-activity
  starts; session pinning/ownership/closure; saved idempotent movement; older
  audio delivery after advancing current version; owned feedback; DTO privacy.
- Actual combined backend + Chromium: both complete four-question journeys;
  first-choice snake, revised/support recovery and distinct finish; original D;
  contextual audio starts and whole-conversation replay; green/red/support
  feedback; saved appearance; refresh without old confetti; phone/reduced motion;
  teacher selection, learner PIN inheritance, live board and 1080p/720p fit.
  Playback ends were sought to bound automated UI checks; this is not a human
  listening review of every cut.
- Existing-game Chromium journey in legacy start mode: three-choice tasks,
  neutral uncertainty, repair draft/selection preserved across saved avatar and
  palette, supported completion, uncertain appearance-save reconciliation,
  phone/reduced motion and 30-character gallery. Existing original games remain
  readable through the legacy-mode server; catalogue hides unavailable starts.
- Built client JavaScript scan found zero confidential source identifiers,
  authored key fields or server-only content captures.

The first browser attempts exposed an actual local media-permission defect,
then temporary test assumptions about selector names, shared fixture latest-run
lookup, asynchronous animation state and already-selected appearance were
corrected. The final journeys use their returned run IDs and passed. No failed
attempt is being reported as a successful check.

## Release and rollback

Production import and deployment are lead-owned and separately receipted.
The user's authorized bootstrap does not require a new permission gate invented
by the worker worksheet. Content was reviewed against the supplied materials;
human listening approval of every proposed cut, classroom pace and the second
neutral title remain explicit classroom-review limitations. Whole-conversation
replay stays available. No classroom pilot or live provider call occurred in
these checks.

Keep migration 013 and both legacy/original readers after new games exist.
Set `LADDER_START_VERSION=legacy` to stop new original starts; do not restore a
v1-only application image after original games have been created. Preserve all
attempts, events, activity versions and existing classroom rooms. Cloudflare and
other services remain outside this release.
