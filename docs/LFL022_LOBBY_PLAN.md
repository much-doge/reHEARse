# LFL-022 — Ready, wait, listen

Owner: integration lead. Status: deployed. See `docs/LFL022_DEPLOYMENT_RECEIPT.md`.

New class sessions open in a waiting room. Learners join, choose a bounded game
name or random animal alias, and configure their character before confirming
readiness. The teacher sees everyone who joined and who is ready, then explicitly
starts the game. Late joiners can configure and enter an already-started session.
Solo players confirm their setup to begin. Character/name changes are locked
once ready; each run pins its appearance so another run cannot change it.

Server boundaries enforce readiness and teacher start, including old browser
requests. Audio/questions are withheld while waiting. Existing sessions/runs are
migrated as already started/ready to preserve in-flight play. Teacher start is
idempotent, owned, unavailable on closed/expired sessions. A finished run returns
to the activities dashboard with an owned completion recap, without scores.

Acceptance: full pnpm check; real PostgreSQL/API lobby/role/ownership/start races,
profile locks, late joins and historical resume; Chromium teacher/learner waiting,
setup, release, completion redirect and phone view; app-only guest deployment
with prior records and nine other containers preserved. No classroom pilot claim.
