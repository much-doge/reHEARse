# LFL-098 Reading workspace sweep

Status: deployed to PCT128; authenticated responsive inspection pending

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
- Source commit: `d21d502` (`fix(test-center): fill reading passage workspace`).
- PCT128 release tree: `/opt/rehearse/.releases/d21d502`.
- Runtime image: `rehearse-app:d21d502` (`sha256:54952ca65a3b839fa830ef34e1c08e5085b761f0a715db164829dcebc4a00ef3`).
- Deployment was app-only (`docker compose up -d --no-deps app`); no migration,
  database write, attempt rewrite, answer change, or timer change was performed.
- Runtime checks after deployment: app healthy, PostgreSQL healthy, both restart
  counts 0, LAN `/api/health` HTTP 200, public `/api/health` HTTP 200,
  signed-out `/test-center/teaching` HTTP 307, and unauthenticated
  `/api/test-center/resources` HTTP 401.
- Application startup logs show a clean Next.js ready state. Authenticated
  responsive browser inspection remains pending; HTTP checks do not prove the
  learner touch/trackpad journey.
- Rollback is app-only: redeploy the previous `rehearse-app:70395bd` image from
  its release tree if the new reading layout must be withdrawn.
