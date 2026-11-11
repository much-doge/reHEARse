# LFL-060 — Teacher live/archived answer review and Listening playback

## Scope

The TOEFL-like Test Center teaching workspace now exposes the answers already
saved for an attempt while the learner is still working, without waiting for a
section result. The same answer review remains available after an attempt is
archived. Staff can open an answer to reveal the source question and choices.
For Listening items, the review card also provides protected playback controls:
Part A has one question-audio button; Part B and Part C have separate
dialogue/talk and question-audio buttons. Playback uses the pinned Practice
Test A audio and question-map offsets; learner playback behavior is unchanged.

The workspace also includes staff-only sorting for activities (newest, title,
status, assignment count) and candidates (name, recent activity, status,
score). Sorting is presentation-only and does not modify assignment or attempt
records.

## Evidence-preserving/access boundaries

- `protefl_diagnostic_event` remains append-only; the live answer list reads the
  latest answer event per section/question.
- Teacher question reveal accepts completed, in-progress, and archived attempts
  only after the staff assignment/ownership check. Learners cannot call the
  route successfully.
- Audio is served only through the staff-authorized route with private,
  no-store, cookie-varying headers. The browser receives no answer key until a
  teacher opens a question review.
- Existing attempts, results, events, retakes, and archives are not rewritten.

## Verification

- Changed-path ESLint: passed.
- Repository TypeScript check: passed.
- Vitest: 52 files / 194 tests passed.
- Next production build: passed.
- `git diff --check`: passed.
- Local database query exercised the live-answer JSON aggregation against the
  existing Test Center schema.
- Authenticated teacher/browser and production classroom playback remain
  operator verification; this receipt does not claim those journeys were
  observed.

## Deployment

Deployment evidence is appended here after the app-only PCT128 rollout.
