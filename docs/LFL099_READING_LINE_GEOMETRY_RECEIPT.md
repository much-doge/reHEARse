# LFL-099 Reading line geometry

Status: deployed to PCT128; authenticated responsive inspection pending

## Scope

Preserve each stored Reading source line as one visual row while the learner
zooms the passage. Line references are part of the instructional content, so a
zoomed line must overflow horizontally like a PDF page rather than reflow into
new wrapped rows. Passage order, text, line numbers, questions, answers,
timers, assignments, and attempt records remain unchanged.

## Correction

The passage text rows will use `white-space: nowrap` and normal non-breaking
overflow behavior inside the existing scroll surface. The surface will retain
vertical scrolling and gain horizontal scrolling only when the zoomed source
line exceeds its viewport. This is a presentation-only change; no content
normalization or line reconstruction is performed.

## Verification and deployment

- Changed-file ESLint passed.
- Repository TypeScript passed.
- Full Vitest suite: 55 files, 210 tests passed.
- Next production build passed locally.
- `git diff --check` passed.
- Source commit: `1360204` (`fix(test-center): preserve reading line geometry on zoom`).
- PCT128 release tree: `/opt/rehearse/.releases/1360204`.
- Runtime image: `rehearse-app:1360204` (`sha256:cc203de2945e3e0a87783b05d3b77f21aa682f2ea01fd0b7990a601a07617f02`).
- Deployment was app-only (`docker compose up -d --no-deps app`); no migration,
  database write, attempt rewrite, answer change, or timer change was performed.
- Runtime checks after deployment: app healthy, PostgreSQL healthy, both restart
  counts 0, LAN `/api/health` HTTP 200, public `/api/health` HTTP 200,
  signed-out `/test-center/teaching` HTTP 307, and unauthenticated
  `/api/test-center/resources` HTTP 401.
- Application startup logs show a clean Next.js ready state. Authenticated
  responsive browser inspection remains pending; HTTP checks do not prove the
  learner touch/trackpad journey.
- Rollback is app-only: redeploy the previous `rehearse-app:d21d502` image from
  its release tree if the line-geometry change must be withdrawn.
