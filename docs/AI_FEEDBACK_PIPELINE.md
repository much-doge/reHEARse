# AI feedback implementation

Status: source-complete under LFL-013. Production deployment and latency
measurement remain separate gates.

This document describes the implemented individual-practice feedback path. It
does not describe the recreational classroom game, which has no AI feedback
dependency.

## Runtime path

```text
learner browser
  -> POST /api/attempts
  -> same-origin, session and learner-role checks
  -> PostgreSQL transaction commits immutable listening_attempt
  -> FeedbackProvider port
  -> OpenAI Responses adapter
  -> POST /v1/responses
  -> strict listening-feedback.v1 validation
  -> append-only listening_feedback row
  -> attempt-result.v2 response
  -> learner browser
```

Relevant source files:

| Responsibility | File |
|---|---|
| HTTP authorization and input bounds | `src/app/api/attempts/route.ts` |
| Attempt transaction and feedback persistence | `src/adapters/db/listening-repository.ts` |
| Provider-neutral input/output port | `src/application/feedback-provider.ts` |
| Runtime provider selection | `src/adapters/feedback/provider-factory.ts` |
| Responses request, deadline and parsing | `src/adapters/feedback/openai-responses-provider.ts` |
| Strict bilingual/no-score schema | `src/domain/feedback.ts` |
| Learner rendering | `src/components/persistent-learning-workspace.tsx` |

## What leaves the server

One Responses API request carries:

```json
{
  "contractVersion": "listening-review-input.v1",
  "activityVersionId": "opaque UUID",
  "transcript": "full transcript for the selected immutable activity version",
  "teacherGuide": "teacher-authored attention guidance",
  "learnerEvidence": {
    "notes": "current notes",
    "reconstruction": "current response",
    "previousReconstruction": "previous response or null"
  }
}
```

The adapter also sends its fixed system instructions and the strict JSON Schema
for `listening-feedback.v1`. It does **not** send audio, media URLs, the learner's
name, email, pseudonym, session, password, classroom state, other attempts, or
other activities. `feedback_template` exists on the provider-neutral request
type for the offline adapter but is not included in the OpenAI request.

The HTTP request uses `store: false`, low text verbosity, one structured output,
and no tools. Production uses `reasoning.effort=minimal`, a 1,200 generated-token
ceiling and a 30-second complete-response deadline. Model-generated reasoning,
visible output and formatting all count against the output ceiling.

Input limits before the provider call are 12,000 characters each for notes and
the current response and 120,000 UTF-8 bytes for the assembled dynamic review
input. Activity publishing is responsible for bounding transcript and teacher
guide content.

## Save and feedback workflow

1. The browser supplies an idempotent submission key, activity slug, pseudonym,
   notes and response.
2. The route rejects cross-origin, unauthenticated and non-learner requests.
3. PostgreSQL locks the learner/submission key, checks for an existing identical
   save and loads the published immutable activity version.
4. The attempt is committed **before** contacting OpenAI. Provider failure
   therefore cannot erase the response.
5. The repository invokes exactly one configured provider synchronously.
6. The OpenAI adapter constructs one request. No audio transcription, retrieval,
   second model call or translation call occurs.
7. The adapter requires a completed response, extracts the structured JSON and
   validates bilingual fields plus the no-score invariant.
8. Success or a content-free safe failure is appended to
   `listening_feedback`. Raw prompts, transcript, notes and provider output are
   not logged.
9. The original HTTP save request returns only after provider completion,
   failure or timeout. This synchronous coupling is the principal UX latency
   boundary; the interactive waiting panel does not make the request faster.

## Wording contract

Second person has one referent: the learner viewing the feedback.

- `you/your` and `kamu/-mu` may describe what the learner wrote, noticed, is
  uncertain about, or should listen for next.
- People inside the recording are always named by an unambiguous role such as
  `the male speaker`, `the student`, `the advisor`, `the first speaker`, or an
  appropriate third-person pronoun.
- Transcript dialogue cannot transfer its `I` or `you` perspective to the
  learner.

Incorrect:

> You're juggling three papers and considering a shared Romanticism theme.

This falsely assigns the male speaker's situation to the learner.

Correct:

> You noticed that the male speaker is juggling three papers and considering a
> shared Romanticism theme.

The equivalent Indonesian distinction is required: `Kamu mencatat bahwa
mahasiswa dalam percakapan itu...`, not `Kamu sedang...` when the audio speaker
is the person doing it.

This rule is prompt-versioned as `listening-review.2026-10-06.v4`. Previously
stored feedback remains immutable and is not rewritten.

## Latency controls and evidence

Every successful feedback record stores content-free operational measurements
inside `usage_json`:

- provider input, cached-input, output, reasoning and total token counts when
  supplied by OpenAI;
- `review_input_bytes` for the dynamic JSON;
- `request_body_bytes` for the complete serialized Responses request;
- `headers_latency_ms` from request start until response headers;
- `total_latency_ms` through body download, parsing and validation.

These measurements let an operator distinguish network/provider waiting from
response generation without retaining learning content. They are not learner
metrics and must never appear as assessment data.

Immediate LFL-013 changes:

- production output ceiling reduced from 6,000 to 1,200 tokens;
- production reasoning effort explicitly set to `minimal`;
- complete-response deadline reduced from 60 to 30 seconds;
- prompt tightened to short output and unambiguous learner/speaker references;
- payload byte size and provider timing recorded for future comparison.

The output ceiling and reasoning effort are expected to matter more than small
input reductions. OpenAI's latency guidance says generated tokens are normally
the dominant latency step, while halving ordinary prompt input may improve
latency only modestly. References:

- <https://developers.openai.com/api/docs/guides/latency-optimization>
- <https://developers.openai.com/api/docs/guides/reasoning>
- <https://developers.openai.com/api/docs/models/gpt-5-nano>

## Next optimization gate

Do not claim the request is fast from source changes alone. After deployment,
collect several real `usage_json` samples and compare median and slow-tail total
latency with input/output/reasoning token counts.

If feedback still blocks saves unacceptably, the next architectural change is
to remove provider generation from `POST /api/attempts`: return the committed
attempt immediately with `feedbackStatus=pending`, run feedback in a durable
worker, and let the existing owned status lookup retrieve completion. That
requires durable job ownership, recovery and bounded retries; it must not be
implemented as an untracked in-process promise that can disappear on restart.

Streaming is not currently appropriate because the strict bilingual JSON must
be complete and validated before persistence or rendering. A durable async path
improves perceived save latency without exposing partial, invalid feedback.
