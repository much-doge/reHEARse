# LFL-099 Reading line geometry

Status: source-complete; deployment pending

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
- Deployment and authenticated responsive browser inspection remain pending.
