# LFL-023A — workshop interface checkpoint

Status: source complete against the early `part-a-workshop.v1` contract. Not
container-verified, integrated with final private content, deployed, or tested
in a classroom.

## Implemented

- Separate teacher `/workshop` and learner `/workshop/join` routes.
- Teacher create/resume, six-digit PIN, joined aliases, current skill group,
  full projected preparation material, raw per-item operational counts, group
  release/advance, and session close controls.
- Learner join, the same bilingual preparation card, individual audio,
  server-clock-aligned opening/deadline display, original A-D choices, bespoke
  relisten guidance, guided comparison, and saved explanation for every wrong
  option.
- Correct-answer acknowledgement with a restrained confetti effect; reduced
  motion removes the effect without hiding the textual result.
- Responsive two-column/one-column presentation. No points, percentages,
  leaderboard, skill judgment, AI grading, fantasy language, or mascot voice.

The client does not invent a new deadline. It estimates current server time
from the latest projection and uses the backend's stored `answerOpensAt`,
`deadline`, and `replayEndsAt`; server validation remains authoritative.
Polling is deliberately bounded to the existing two-second classroom pattern.

## Verification

The initial interface `pnpm check` passed after its render-purity correction:

- ESLint;
- TypeScript;
- 41 Vitest files and 150 tests;
- Next 16 production build, including `/workshop`, `/workshop/join`, and both
  workshop API routes.

Final integration subsequently added durable lost-response request recovery.
The integrated check passed 44 Vitest files and 163 tests; see
`docs/LFL023_INTEGRATION_RECEIPT.md`.

The first check exposed React's render-purity rule for eager `Date.now()` state
initializers. Initial time state now starts inert and is set only when a server
projection is accepted. The final check passed.

## Open acceptance

- Cherry-pick/integrate the other desktop's final content/backend commits after
  reviewing the private source worksheet and all thirty items.
- Run migration 016 and the guarded local PostgreSQL/API journey.
- Exercise both complete learner branches in Chromium with real imported
  content; confirm playback activation, refresh during the timed window,
  deadline expiry, replay completion, saved prose, teacher polling, narrow
  layout, keyboard use, and reduced motion.
- Inspect every preparation card and item-specific hint for usefulness and
  leakage before any publication.
- Publish media, push, and deploy only after combined acceptance.

Rollback is removal of the two new pages and workshop component directory;
historical classroom and ladder interfaces are not modified.
