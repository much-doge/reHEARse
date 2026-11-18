# LFL-121 — Free-form teacher Ask Clippy

Status: implementing.

## Rationale

LFL-120 made the model pass a long chain of grounding, quotation, diagnosis,
two-step, option, answer-leak, and placeholder rules. In practice, that chain
caused useful model output to be discarded and produced the teacher-facing
“Clippy could not prepare safe guidance” state shown in the incident screenshot.

The pilot is intentionally exploratory. Teachers need to see what a capable
language model can produce before imposing a pedagogy rubric.

## New contract

Ask Clippy returns one free-form text note in Indonesian. It may choose its own
organization, voice, examples, quotations, questions, and level of detail. The
prompt asks for a concrete, characterful teaching note, but the application
does not enforce that shape.

The only output validation is:

- provider response is completed;
- output contains text;
- text is non-empty and within a generous transport bound.

No output is rejected for being generic, unquoted, non-bilingual, differently
structured, direct, indirect, playful, or logically unconventional.

## Preserved boundaries

- Existing teacher/admin and assignment/attempt/question authorization remains.
- Provider input remains minimized: current section, question/prompt,
  selected response text, and current transcript/passage/sentence context.
- The answer key and unselected options remain out of provider input.
- `store:false`, timeout, no provider credentials in logs, no persistence, and
  candidate isolation remain.
- The note remains teacher-only. It is not sent to candidates or learner history.
- Teachers decide whether and how to use a note with a learner.

## Acceptance

1. The screenshot-style safe retry state is reserved for provider transport,
   timeout, authentication, or empty-output failure—not pedagogical shape.
2. A valid free-form text response renders as one readable Clippy note.
3. Focused tests cover arbitrary text, multiline text, punctuation, source
   quotes, unexpected organization, access denial, and provider failure.
4. Full checks, build, app-only deployment, health/access checks, and a runtime
   free-form canary pass.

Rollback is app-only to `rehearse-app:ce03cde`; no database rollback or learner
record repair may be required.
