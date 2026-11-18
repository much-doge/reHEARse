# LFL-119 — Tidy Indonesian Ask Clippy guidance

Status: deployed to PCT128; authenticated teacher visual inspection pending.

## Problem

The paired English/Indonesian structured output introduced under LFL-117 is
not reliable with the configured production model. A real teacher response
rendered placeholder fragments such as `en-01`, `en-02`, and malformed text in
the Indonesian rows. The duplicated six-row presentation is also visually
noisy.

## Decision and objective

Ask Clippy will return one concise Bahasa Indonesia explanation for each of its
three pedagogical elements. English is retained only for exact phrases or
sentences quoted from the current question, transcript, passage, reference,
dictionary entry, or a clearly identified teaching example. The explanatory
frame around such source language remains Indonesian.

The teacher card keeps its English interface labels under D029. D050 records a
narrow exception for the generated teacher-only guidance body; candidate
interfaces remain English-only.

## Contract

- `notice`: Bahasa Indonesia description of the reasoning gap or attention
  target.
- `tryThis`: Bahasa Indonesia demonstration of a reasoning move, without
  completing the answer.
- `teacherPrompt`: one open Bahasa Indonesia question ending in `?`.
- Exact English source/example language, when pedagogically necessary, is
  enclosed in quotation marks and is never presented as the answer.
- Do not translate source quotations, invent quotations, identify/eliminate an
  option, state an answer letter, reproduce the keyed option, or add English
  meta-commentary.

## Boundaries and acceptance

- Preserve all LFL-116 authorization, current-item context, privacy,
  non-persistence, provider timeout, and fail-closed behavior.
- Remove EN/ID rows and render one clean Indonesian paragraph per teaching
  element with `lang="id"`.
- Reject placeholders, malformed output, missing fields, non-question teacher
  prompts, and direct-answer language.
- Do not change candidate DTOs, attempts, results, packages, transcripts,
  retries, scores, or the recently repaired Volume 1 records.
- Run focused tests, full repository checks, production build, app-only
  deployment, access/health checks, and an exact-config Indonesian provider
  canary using no licensed or learner content.

Rollback is app-only to `rehearse-app:fad5dbe`; no database rollback or learner
record repair may be required.

## Source-complete evidence

- The provider contract now requires exactly three strings rather than three
  paired language objects. Prompt version is
  `test-center-clippy.2026-11-18.v2`.
- The system instruction requires concise natural Bahasa Indonesia and permits
  English only inside quotation marks for exact supplied source language or a
  clearly introduced English example.
- The server rejects empty/oversized fields, a teacher prompt without `?`, the
  `en-01`/`id-01` family of placeholders, the malformed screenshot fragment,
  internal abstention text, direct-answer phrases, answer-letter syntax, and
  exact keyed-option reproduction.
- The teacher card renders one clean `lang="id"` paragraph under each existing
  English UI label. EN/ID badges, duplicate rows, and bilingual separators were
  removed.
- Focused suite: 3 files, 18 tests passed. Coverage includes placeholder
  rejection, quoted English source preservation, Indonesian question
  validation, structured provider output, access checks, correct-response
  short-circuiting, and answer-leak rejection.
- A pre-deployment exact-config synthetic production-model canary returned all
  three Indonesian fields, no placeholder or answer leak, a valid open
  question, and `store: false`.
- Full ESLint, TypeScript, 59 Vitest files/248 tests, `git diff --check`, and
  Next production build passed.
- No route input, authorization query, provider context, candidate component,
  attempt/result data, package, transcript, retry, score, or LFL-118 repair
  record changed.

## Deployment

- Source/release commit: `0b0c64a`.
- Release tree: `/opt/rehearse/.releases/0b0c64a`.
- App image: `rehearse-app:0b0c64a`; image ID
  `sha256:0cbf2dd6b9e38f79579f6926625b81b97bb6d0de7108ac12c341b04df875db51`.
- Only the app service was recreated. It is healthy with zero restarts. LAN and
  public health returned HTTP 200.
- PostgreSQL retained container ID
  `b8d72c028dc252b4d53fb7df208e51ca9d0c7af99ea6d87fb7618095603b03e3`,
  stayed healthy with zero restarts, and received no migration or write.
- Unauthenticated Ask Clippy returned 401 and a foreign-origin request returned
  403.
- The final runtime synthetic canary returned three non-empty Indonesian
  strings, a question-mark-terminated teacher prompt, no screenshot-style
  placeholder, no direct answer/keyed option, and `store: false`.
- The LFL-118 audit count remains four repaired attempts after deployment.
- No authenticated teacher browser session was available. Refreshing the real
  teacher page and visually inspecting one regenerated hint remains an operator
  check; classroom verification is not claimed.

Rollback is app-only to `rehearse-app:fad5dbe`. Keep PostgreSQL, the LFL-118
repair results/events, attempts, package content, and learner records unchanged.
