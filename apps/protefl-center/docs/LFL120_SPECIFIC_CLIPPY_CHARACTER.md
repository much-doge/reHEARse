# LFL-120 — Specific Ask Clippy pedagogy and character

Status: deployed to PCT128; authenticated teacher visual inspection pending.

## Problem

The Indonesian-only LFL-119 output is tidy but still generic. A real Listening
Question 4 response said only to find the part that shows the speaker's intent,
identify an alternative action, and ask where the implication appears. It did
not identify a usable audio cue, explain why the selected response misses that
cue, or model the reasoning move a teacher could demonstrate.

## Objective

Give Clippy a recognizable teaching voice: observant, brisk, curious, slightly
playful, and concrete—like a sharp margin note from a listening coach. Character
must come from precise noticing and memorable phrasing, not jokes, role-play,
verbosity, praise, or pretending to be human.

## Item-specific contract

- `notice` identifies the exact mismatch between the learner's selected
  response and one short verbatim cue from the current source. It distinguishes
  what the selection assumes from what the cue actually signals, without
  supplying the missing conclusion.
- `tryThis` demonstrates a two-step reasoning move applied to this item: first
  attend to the quoted cue and its conversational/grammatical/textual function;
  then test the selected response against that function.
- `teacherPrompt` asks one short Socratic question tied to the same cue. It
  invites the learner to make the final inference rather than giving it.
- At least one English source quotation of two or more words is required. Every
  quotation must appear verbatim in the current question, transcript, passage,
  or sentence; answer options are not an allowed quotation source.
- The Indonesian prose surrounds the source quotation. Clippy may use one light
  signature turn of phrase, but it must not become a mascot monologue.

## Enforcement and boundaries

- The route validates quoted text against the already authorized current-item
  source context. Missing, invented, option-only, or one-word quotations fail
  closed with the existing retry state.
- Existing direct-answer, keyed-option, placeholder, schema, timeout, access,
  privacy, `store:false`, and non-persistence controls remain.
- Candidate interfaces, attempts, results, packages, transcripts, retries,
  scores, and LFL-118 repair evidence remain unchanged.
- Focused tests cover grounded/unGrounded quotes, generic output rejection,
  answer leakage, provider structure, and authorization. Full checks,
  production build, app-only deployment, access/health checks, and a real-item
  no-output-content runtime validation are required.

Rollback is app-only to `rehearse-app:0b0c64a`; no database rollback or learner
record repair may be required.

## Source-complete evidence

- The provider instruction now defines Clippy as observant, brisk, curious,
  slightly playful, and concrete. It explicitly excludes jokes, role-play,
  praise, mascot monologues, and generic meta-advice.
- `notice` must diagnose the selected response by name and include a short exact
  quoted cue. `tryThis` must pass the visible `1) ... 2) ...` contract.
  `teacherPrompt` remains one open cue-anchored question.
- `assertClippyIsSourceGrounded` requires at least one two-or-more-word quoted
  cue, verifies every such quotation against the authorized prompt plus source
  context, excludes answer options as quote sources, and requires an explicit
  selected-response or omitted-response diagnosis.
- Ask Clippy now uses `CLIPPY_OPENAI_MODEL`, defaulting in production to
  `gpt-5-mini`; the existing general feedback path retains `OPENAI_MODEL` and
  its current model. Provider credentials, endpoint, timeout, reasoning effort,
  token cap, and `store:false` behavior are shared unchanged.
- The provider input now includes only the learner's selected response text;
  the other three options and answer key are withheld. This lets Clippy
  diagnose the selection against the source while materially reducing the
  chance of restating the correct option.
- The existing nano model failed the real-item specificity canary on grounding,
  diagnosis, and two-step pedagogy. The isolated `gpt-5-mini` canary passed a
  real Volume 1 Listening item with grounded source cue, explicit selected-
  response diagnosis, visible two-step move, no option quote, and no answer
  leak. No response text was printed in the recorded validation output.
- Focused suite: 3 files, 22 tests passed. Full ESLint, TypeScript, 59 Vitest
  files/252 tests, `git diff --check`, and Next production build passed.
- No database, route authorization, candidate UI/DTO, package, transcript,
  attempt, result, score, retry, or LFL-118 repair data changed.

## Deployment

- Initial source commit/image: `bc673b5` / `rehearse-app:bc673b5`. The first
  runtime response met grounding, diagnosis, and two-step requirements but
  reproduced the keyed option text. The server-side key guard would have
  rejected it; it was not accepted as rollout evidence.
- Follow-up commit `ce03cde` removed all unselected options from provider input.
  The model now receives only the selected response text plus the authorized
  question/source context; the key remains server-only for post-generation
  rejection.
- Final release tree: `/opt/rehearse/.releases/ce03cde`.
- Final app image: `rehearse-app:ce03cde`; image ID
  `sha256:37bdf9cc74121d211fcbf3300f32406681bb48a9ac9f5366e5d2b18088a4a7e7`.
- Production confirms `CLIPPY_OPENAI_MODEL=gpt-5-mini`; the general
  `OPENAI_MODEL` remains different and unchanged.
- The final real-item runtime canary passed: exact source grounding, explicit
  selected-response diagnosis, visible two-step move, no answer leak, correct
  option withheld, and `store:false`. Validation output did not print the
  generated protected guidance.
- Only the app service was recreated. App and PostgreSQL are healthy with zero
  restarts; LAN/public health returned HTTP 200. Unauthenticated Ask Clippy is
  401 and foreign-origin is 403.
- PostgreSQL retained container ID
  `b8d72c028dc252b4d53fb7df208e51ca9d0c7af99ea6d87fb7618095603b03e3`;
  no migration or write occurred, and all four LFL-118 repairs remain present.
- No authenticated teacher browser session was available. Refreshing the page,
  pressing **Ask again**, and judging the visible character/pedagogy remains an
  operator check; classroom verification is not claimed.

Rollback is app-only to `rehearse-app:0b0c64a`. Keep PostgreSQL, attempts,
results, packages, transcripts, scores, and LFL-118 repair evidence unchanged.
