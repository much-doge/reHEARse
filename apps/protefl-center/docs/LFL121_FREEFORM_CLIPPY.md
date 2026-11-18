# LFL-121 — Free-form teacher Ask Clippy

Status: deployed to PCT128 app service; authenticated teacher visual inspection pending.

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

## Verification record

- Commit: `5361767` (`feat(test-center): allow free-form Clippy text`).
- Checks: focused Clippy tests (11 passed), full Vitest (59 files / 241 tests),
  ESLint, TypeScript, diff check, and Next production build passed.
- Deployment: PCT128 app-only image
  `rehearse-app:536176723f79bf86628ccedcbb40c8abff17205f`, digest
  `sha256:ed67073c96b49dcbca4a9017610c91ccef862e684be1d5fc4040480ce9d2c3f6`;
  container running with zero restarts.
- Runtime: `https://rehearse.najala.org/api/health` returned 200;
  same-origin unauthenticated Clippy returned 401; foreign-origin Clippy
  returned 403. The live `gpt-5-mini` canary returned a non-empty string note
  under the free-form schema with `store:false` (`freeform_canary=passed`).
- Database: app-only rollout made no migration; post-deploy checks found 147
  diagnostic results and four Volume 1 attempts at the LFL-118 repair timestamp.

The old rigid output behavior can be restored by rolling the app service back
to `rehearse-app:ce03cde`; no database rollback is required.

Rollback is app-only to `rehearse-app:ce03cde`; no database rollback or learner
record repair may be required.
