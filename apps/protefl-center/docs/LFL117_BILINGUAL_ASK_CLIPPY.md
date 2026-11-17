# LFL-117 — Bilingual Ask Clippy guidance

Status: deployed to PCT128; authenticated teacher interaction pending.

## Objective

Preserve the current English Ask Clippy guidance and add a faithful Bahasa
Indonesia version directly beneath each English teaching element in the
teacher-only Test Center pilot.

## Contract

The three existing elements remain unchanged in purpose:

1. What to notice
2. Try this
3. Teacher prompt

Each element contains exactly `en` and `id` text. English is rendered first;
Bahasa Indonesia is rendered second and visibly labeled. Both teacher prompts
must be open questions ending in a question mark.

The Indonesian text must translate the pedagogical move, not add an answer,
eliminate options, or introduce source facts absent from the English guidance.
Direct-answer and keyed-option guards apply to the combined English and
Indonesian output, including common Indonesian answer-giving phrases.

## Boundaries and acceptance

- Retain the LFL-116 teacher/admin, assignment, resource, candidate, attempt,
  question, same-origin, privacy, non-persistence, and provider boundaries.
- Do not change candidate interfaces, DTOs, attempts, results, package files,
  transcripts, retries, or scores.
- Wrong and omitted responses return all six required strings; malformed,
  monolingual, unsafe, timed-out, or unavailable output fails closed.
- Render English first and Bahasa Indonesia immediately below it in individual
  and cohort question review.
- Run focused contract/provider/route tests, full repository checks, production
  build, app-only deployment, access gates, and an exact-config bilingual
  provider canary.

Rollback is app-only to the prior Ask Clippy image. No database rollback or
learner-record repair may be required.

## Source-complete evidence

- The structured provider contract now requires `en` and `id` strings for
  `notice`, `tryThis`, and `teacherPrompt`; both prompt strings must end in a
  question mark. The provider JSON Schema enforces the question-mark suffix,
  and the server validates it again after parsing.
- The system instruction requires natural Bahasa Indonesia that faithfully
  translates the English pedagogical move without adding facts, option
  elimination, or an answer.
- The server combines all six strings for leakage validation. Existing English
  guards remain, and Indonesian direct-answer/selection phrases are rejected.
- The teacher UI renders labeled **EN** text first and labeled **ID** text
  immediately below it for every element. The Indonesian paragraphs carry the
  `lang="id"` attribute.
- Focused contract/provider/route suite: 3 files, 15 tests passed, including
  bilingual completeness, paired question punctuation, Indonesian answer-leak
  phrases, provider request/response validation, authorization, and keyed
  option rejection.
- Full ESLint, TypeScript, 59 Vitest files/245 tests, `git diff --check`, and
  Next production build passed.
- No route input, authorization query, provider context, persistence path,
  candidate component, diagnostic package, attempt, result, retry, transcript,
  or score behavior changed.

## Deployment

- Initial source commit: `175e48b`. The first deployed bilingual canary
  returned all six strings but one teacher prompt lacked its question mark.
  Server validation would have rejected that output; no teacher or learner
  record was involved.
- Follow-up commit `fad5dbe` also requires the question-mark suffix in the
  provider JSON Schema. Focused 15 tests, TypeScript, changed-file ESLint, and
  diff check passed before the replacement build.
- Final release tree: `/opt/rehearse/.releases/fad5dbe`.
- Final app image: `rehearse-app:fad5dbe`; image ID
  `sha256:31e52a49ea1b7e3db485c0080adca5e80a21fcf9fbeaeb394f12939a93a3d889`.
- Only the app service was recreated. It is healthy with zero restarts. LAN and
  public health returned HTTP 200.
- PostgreSQL retained container ID
  `b8d72c028dc252b4d53fb7df208e51ca9d0c7af99ea6d87fb7618095603b03e3`,
  stayed healthy with zero restarts, and received no migration or write.
- The final exact-config synthetic provider canary returned all six English and
  Indonesian strings, both teacher prompts ended in question marks, the
  direct-answer checks passed, and `store: false` was used. It contained no
  learner, package, transcript, or licensed source material.
- No authenticated teacher browser session was available. The real protected
  click and visual bilingual review remain an operator test; classroom
  verification is not claimed.

Rollback is app-only to `rehearse-app:f616f95`. Keep PostgreSQL, package files,
attempts, results, and learner records unchanged.
