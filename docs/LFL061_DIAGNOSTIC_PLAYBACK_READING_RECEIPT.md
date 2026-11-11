# LFL-061 diagnostic playback and Reading receipt

Status: source-complete pending deployment

This revision keeps existing diagnostic attempts and answer events append-only.
It corrects the ETS Volume 3 Practice Test A Structure answer key for question
39 to `D` and updates the package manifest hash. Existing attempts retain their
pinned package metadata and stored result records; new calculations use the
corrected key.

Listening playback now resolves retake questions by their explicit question
number rather than array position, shows all questions in the active Part B/C
conversation or talk while that context is playing, then returns to the active
question at its answer window. The existing autoplay/manual assignment setting
is preserved. Teacher audio review continues to use the protected attempt-
checked audio route.

Structure and Reading deadlines remain server-owned. A visibility/pageshow
resynchronization refreshes the attempt when a learner returns to a tab so
browser timer throttling cannot pause the 25-minute or 55-minute section.

Reading passages retain source line references while using a larger readable
type scale, responsive spacing, bounded resize support, and learner-controlled
zoom controls.

Verification: package verifier, changed-path ESLint, repository TypeScript,
Vitest, Next production build, and `git diff --check` passed locally. PCT128
deployment and authenticated retake/browser playback review remain pending.
