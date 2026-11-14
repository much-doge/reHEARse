# LFL-097 Reading zoom and layout

Status: deployed to PCT128; authenticated responsive inspection pending

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
- Source commit: `70395bd` (`fix(test-center): make reading passage zoom usable`).
- PCT128 release tree: `/opt/rehearse/.releases/70395bd`.
- Runtime image: `rehearse-app:70395bd` (`sha256:11a00b6e79caee66c5aaec2a0c218edb57e24fc9ea016dced35e2a66152b68e4`).
- Deployment was app-only (`docker compose up -d --no-deps app`); no migration,
  database write, attempt rewrite, or answer/timer change was performed.
- Runtime checks after deployment: app healthy, PostgreSQL healthy, app restart
  count 0, PostgreSQL restart count 0, LAN `/api/health` HTTP 200, public
  `/api/health` HTTP 200, signed-out `/test-center/teaching` HTTP 307, and
  unauthenticated `/api/test-center/resources` HTTP 401.
- Application startup logs show a clean Next.js ready state. Authenticated
  browser/responsive inspection remains pending; the HTTP checks do not prove a
  learner journey or touch-device rendering.
- Rollback is app-only: redeploy the previous `rehearse-app:c7c8329` image
  from its release tree if the new reading layout must be withdrawn.
