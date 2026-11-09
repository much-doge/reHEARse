# LFL-049 Debian dev1 deployment receipt

Date: 2026-11-10 (Asia/Jakarta)

Environment: Debian laptop fallback at `dev1-rehearse.najala.org`

Application commit/image: `7e1ccdc` / `rehearse-app:7e1ccdc`

Focused Listening retakes now inherit the autoplay or question-by-question
mode pinned to their source assignment. Autoplay retakes sequence only the
incorrect or omitted items, use a 12-second answer window, automatically move
to the next selected item, and preserve Part B/C context for the first selected
question in each conversation or talk group. Pause/resume freezes the active
answer window. Manual retakes retain their existing per-question playback.

The server accepts audio events only for the pinned selected questions and in
their selected order. Selected autoplay completion no longer requires the
elapsed duration of the complete 50-question audio track. Existing attempt
rows, events, answers, and results were not rewritten; there is no migration.

`pnpm check` passed: ESLint, TypeScript, 48 test files/182 tests, and the Next
production build. The final changed paths also passed ESLint, TypeScript, and
`git diff --check`. The production-shaped runner image built successfully,
the emergency Compose configuration validated, and both localhost and public
`/api/health` returned the `health.v1` success response. Container
`rehearse-app-1` reports healthy on `rehearse-app:7e1ccdc`.

An authenticated browser retake journey and classroom audio observation remain
unverified. Rollback is an app-only return to `rehearse-app:c308e1f`; the
database requires no rollback.
