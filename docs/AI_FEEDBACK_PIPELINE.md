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
  <- attempt-result.v2 with feedbackStatus=pending
learner browser
  -> POST /api/feedback with owned attempt ID
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
| Separate owned feedback request | `src/app/api/feedback/route.ts` |
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
5. The save request returns immediately with `feedbackStatus=pending`; it does
   not wait for OpenAI.
6. The browser starts a separate owned `POST /api/feedback` request. A
   PostgreSQL advisory lock serializes generation for that attempt. Reloading or
   losing the request leaves the durable attempt pending rather than losing it.
7. The OpenAI adapter constructs one request. No audio transcription, retrieval,
   second model call or translation call occurs.
8. The adapter requires a completed response, extracts the structured JSON and
   validates bilingual fields plus the no-score invariant.
9. Success or a content-free safe failure is appended to
   `listening_feedback`. Raw prompts, transcript, notes and provider output are
   not logged.
10. The feedback request returns the completed or failed attempt. A repeated
    request returns the existing append-only record instead of generating a
    duplicate. The existing private status lookup recovers the result.

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

This rule is prompt-versioned as `listening-review.2026-10-06.v5`. Previously
stored feedback remains immutable. Conservative presentation-only replacements
repair common reviewer phrases such as `the learner notes` when old or
nonconforming feedback is displayed; the stored record is not rewritten.

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

## Two-phase asynchronous save

LFL-014 removes model generation from the save request. The learner's work is
committed and acknowledged first; feedback generation is a separate request.
This makes saving fast but does not make OpenAI inference itself faster.

The durable state is the committed attempt plus the absence or presence of its
unique feedback row. Generation is client-triggered and serialized in
PostgreSQL; there is no untracked in-process background promise. If the browser
closes, the attempt remains pending and a later explicit feedback request can
resume it. This avoids introducing a queue before measured classroom need.

Streaming is not currently appropriate because the strict bilingual JSON must
be complete and validated before persistence or rendering. A durable async path
improves perceived save latency without exposing partial, invalid feedback.

After deployment, compare real `usage_json` median and slow-tail latency with
input/output/reasoning token counts. A continuously running worker is a future
option only if feedback must complete after every browser disconnect without a
later learner request.
