# LFL-098 Reading workspace sweep

Status: source-complete; deployment pending

## Scope

Correct the Reading candidate layout after LFL-097 without changing passage
content, line references, question data, answers, timers, assignment scope, or
attempt records. The resizable passage card must give its entire remaining
height to the scrollable text surface, and the question navigator must remain a
separate, non-overlapping column at large and small viewports. Trackpad and
touch pinch gestures must zoom the passage only; ordinary page and passage
scrolling must remain available.

## Findings

The previous correction left a `max-height: 34vh` rule on the passage text
surface while the card itself was roughly 66vh tall. That created the visible
blank canvas below the truncated text and meant that vertical resizing changed
the outer card more than the usable text viewport. The passage card was also
not a flex column, so the header and text surface did not share the resized
height predictably. Trackpad pinch handling existed only as a React `onWheel`
handler; the browser-level page zoom was still able to receive the gesture in
some browsers.

## Planned correction

- Make the passage card a flex column and the text surface the sole flexing,
  scrollable child.
- Remove the fixed viewport cap and let vertical resizing expand the text
  surface, while constraining width and preserving the question column.
- Add a native non-passive wheel listener on the passage surface for Ctrl/Meta
  pinch events so the page itself does not zoom.
- Keep two-pointer touch pinch scoped to the passage and keep regular vertical
  touch scrolling intact.
- Add responsive min-width/overflow guards and verify the mobile override uses
  the same flex sizing rules.

## Verification and deployment

- Changed-file ESLint passed.
- Repository TypeScript passed.
- Full Vitest suite: 55 files, 210 tests passed.
- Next production build passed locally.
- `git diff --check` passed.
- Deployment and authenticated responsive browser inspection remain pending.
