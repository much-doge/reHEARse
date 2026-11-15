# LFL-110 Teacher review highlight plan

## Goal

Let an authenticated teacher highlight text while explaining a rendered item,
with Reading passage text as the primary use case and question/prompt text as a
secondary use case.

## Design

- Add a small local review toolbar to rendered teacher question details.
- The teacher selects text, chooses `Highlight selection`, and can clear the
  highlights for that open item.
- Render highlights as semantic `<mark>` ranges over the existing passage line
  structure; line-number references and paragraph boundaries remain intact.
- The same interaction is available for Reading passages, Listening prompts,
  Structure completion prompts, and Structure error-identification sentences.
- Highlight state is scoped to the open review component and is not written to
  the database, learner payload, URL, or persistent browser storage. This keeps
  private source text out of new durable records and avoids implying that a
  teaching annotation is learner evidence.
- The control is teacher-only because it is mounted only in the authenticated
  teacher question-review workspace. Candidate payloads and learner views are
  unchanged.

## Acceptance criteria

- A selected range can be highlighted and remains visible while the question
  detail is open.
- A highlight can be cleared without reloading the question or changing cohort
  analytics.
- Reading line numbers, passage order, audio controls, answer-key reveal, and
  cohort distribution continue to work.
- Mobile and desktop selection do not cause layout overlap.
- No migration or server write is required.
