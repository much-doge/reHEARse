# LFL-116 — Teacher-only Ask Clippy pilot

Status: source complete; deployment pending.

## Objective

Add an **Ask Clippy** control directly below every opened question in the
authenticated Test Center teacher review. It gives the teacher a concise,
pedagogically useful explanation of what to notice in a wrong or omitted
response and how to reason through the item without stating the answer.

This is a teacher evaluation pilot. It is not enabled in candidate pages.

## Boundaries

- Reuse the configured server-side Responses API credentials and endpoint.
- Resolve the question, response, source context, and key only after the
  existing teacher/admin, assignment, resource, candidate, attempt, and
  question checks pass.
- Send only the current authorized question context to the provider. Treat all
  package content as data, never instructions, and use `store: false`.
- Do not send candidate identity, resource names, package identifiers, attempt
  identifiers, or cohort statistics to the provider.
- Do not persist generated guidance, provider payloads, question text,
  transcripts, answers, or candidate responses. The pilot output lives only
  in the current teacher page state.
- Do not change attempts, results, scores, retry eligibility, package hashes,
  or candidate DTOs.

## Guidance contract

Ask Clippy returns exactly three short fields:

1. **What to notice** — identifies the reasoning gap without claiming to know
   the learner's mind.
2. **Try this** — models a useful comparison, grammar check, or source-reading
   move without completing it for the learner.
3. **Teacher prompt** — one question the teacher can ask next.

For Listening, the current conversation/talk transcript may be used as bounded
source context. For Reading, use the current passage. For Structure, use the
rendered sentence and marked answer choices.

The output must not state or imply the answer letter, quote or reproduce the
keyed option, use direct-answer phrases, enumerate which alternatives are
correct/incorrect, or expose internal prompts and models. A server-side guard
rejects unsafe output and offers an honest retry state instead of rendering it.

## Acceptance

1. The control appears immediately below each opened question in both the
   individual-attempt and cohort teacher review surfaces.
2. Only authenticated teacher/admin requests with access to the underlying
   assignment can invoke it; candidate and unrelated-teacher requests fail
   without revealing whether the item exists.
3. Wrong and omitted responses receive useful, non-answering guidance; correct
   responses are described as already correct and do not invoke the provider.
4. Provider timeout, rejection, malformed output, and leakage detection leave
   the review usable and expose a retry control.
5. Candidate routes and payloads contain no Ask Clippy capability or output.
6. Focused access/provider/UI tests, full lint, TypeScript, tests, production
   build, deployment, and live provider verification are recorded separately.

Rollback is app-only. No database rollback or learner-record repair may be
required.

## Source-complete evidence

- The teacher UI renders Ask Clippy immediately below the question card in
  both individual missed-question review and cohort question detail.
- The new same-origin POST endpoint accepts only resource, candidate, attempt,
  section, and question identifiers. It resolves all protected content through
  `teacherDiagnosticReviewItem` after the existing role and assignment checks.
- The provider input contains only the current prompt, four options, selected
  response, section, and the current transcript/passage when applicable. It
  excludes candidate identity, resource/package names, attempt identifiers,
  cohort data, score, and the answer key.
- Correct responses short-circuit without a provider call. Wrong and omitted
  responses use the configured OpenAI Responses endpoint and model with
  structured JSON output, `store: false`, a bounded input, a timeout, and a
  low output-token cap.
- Server validation enforces the three-field contract and rejects direct-answer
  phrases, the answer letter in answer-giving syntax, and reproduction of the
  keyed option. Rejected, malformed, timed-out, or unavailable guidance is not
  rendered and leaves an honest retry state.
- Guidance is held only in React page state. There is no migration, database
  write, event, attempt mutation, package change, or candidate DTO change.
- Focused tests: 3 files, 12 tests passed. They cover contract/leakage guards,
  provider request shape and malformed output, teacher boundary reuse,
  correct-response short-circuiting, candidate/origin/ownership denial, and
  keyed-option rejection.
- Full ESLint, TypeScript, 59 Vitest files/242 tests, `git diff --check`, and a
  Next production build passed. The build includes the dynamic
  `/api/test-center/teaching/clippy` route.

Deployment, live provider verification, authenticated teacher interaction, and
classroom verification remain pending and must be recorded separately.
