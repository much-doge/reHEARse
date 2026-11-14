# LFL-097 Reading zoom and layout

Status: source-complete; deployment pending

## Scope

Repair the Reading candidate workspace without changing attempt, answer, timer,
passage, line-reference, or assignment contracts. Passage text zoom must work
from the visible controls, Ctrl/trackpad pinch gestures, and touch pinch
gestures. Passage resizing must remain useful but bounded to its content column,
so the question navigator never sits on top of the passage.

## Findings

The visible `− / 100% / +` controls were changing a wrapper's `font-size`,
but the passage paragraphs used a CSS `font` shorthand with a fixed `rem`
size, so the text itself did not zoom. The passage also used `resize: both`
inside the workspace's first grid column, allowing a manually widened card to
overflow into the question navigator. Touch and trackpad gestures were not
connected to the passage text at all.

The correction keeps line numbers and passage structure intact while applying
one bounded zoom value to paragraph text and line references. Ctrl/trackpad
pinch wheel events and two-pointer touch pinch both update that value. Ordinary
wheel/touch scrolling remains available. Passage resizing is now vertical-only
and width-constrained to its content column, with a contained scroll surface;
the navigator stays in its own column instead of overlapping the passage.

## Verification and deployment

- Changed-file ESLint passed.
- Repository TypeScript passed.
- Full Vitest suite: 55 files, 210 tests passed.
- Next production build passed locally.
- PCT128 deployment and responsive browser inspection: pending.
