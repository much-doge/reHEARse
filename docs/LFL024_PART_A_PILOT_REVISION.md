# LFL-024 — Part A pilot revision

Status: in progress. Owner: integration lead. Part B/C bootstrap is explicitly
deferred until the Part A pilot revision is accepted.

## Pilot problems and decisions

- The first preparation cards contain fictional written dialogues and typed
  question stems. Some imported learner prompts also contain dialogue. These
  are not to appear in either teacher-projected or learner-facing DTOs/views.
- During the timed question, learners hear the original recording and see only
  the A–D options; do not render a written source question, transcript, or
  dialogue. This applies to old room versions as well as new ones.
- Preparation should teach the tested listening operations, not expose an
  answer before playback. Map the five actual groups to the Longman Part A
  Short Dialogues skills identified by the supplied book's table of contents.
  Cite skill numbers and paraphrase the strategies; do not reproduce the
  book's prose. The PDF's TOC/body pagination is inconsistent, so learner cards
  use skill numbers and topics, not page numbers.
- Early finishers receive optional, untimed, unscored enrichment using only the
  existing real recording and original A–D options. It must not use generated
  speech, transcripts, or written source prompts. New answers append to the
  learner's extension record and never overwrite core attempts. Peers and the
  teacher do not see an individual's extension response.
- Provide graded support in the ordinary activity through its existing
  item-specific listening targets, finite replay, and guided comparison.
  Extension work is optional; no one is penalized for leaving it unfinished.
- The teacher can select any of the five groups. Changing sections returns
  the room to preparation without deleting or resetting any learner cursor,
  answer, explanation, replay, or extension event.
- Remove joined totals, per-item not-started/completed totals, participant
  names, and any other denominator from the teacher live projection. Retain
  only non-identifying answer/replay signals that help the teacher decide
  whether to pause or discuss. Do not display or make unfinished counts
  inferable from the rendered view.
- Add an explicit role-aware dashboard entry to `/workshop`.
- Keep the existing Part A media objects and shared-bucket scope. Publish any
  content change as a new immutable version; existing rooms and evidence stay
  pinned to their original version. Do not modify Writing Analysis Studio.

## Longman skill mapping

Reference: Deborah Phillips, *Longman Complete Course for the TOEFL Test:
Preparation for the Paper Tests* (2001), Part A Short Dialogues, Skills 1–17,
as identified from the supplied table of contents. This is a teaching map, not
a claim of publisher endorsement or publisher-authenticated source content.

| Current item group | Longman skill range | Adapted focus |
|---|---:|---|
| Restatement and sequence | 1–3 | Last-line meaning, paraphrase rather than word matching, similar-sound traps |
| Supported inference | 4–6 | Who/what/where, passive agent, reference among multiple nouns |
| Negatives and near-negatives | 7–10 | Negative scope, double/near negatives, comparative negatives |
| Suggestions, responses and intentions | 11–13 | Agreement, uncertainty/suggestion, surprise and response function |
| Idioms and multiword expressions | 16–17 | Multi-part verbs and idiomatic meaning in context |

Skills 14–15 concern wishes and untrue conditions; do not force them into a
group without reviewed source items that actually exercise them.

## Enrichment design

The source recordings are the only enrichment audio. Each completed clip can
be revisited in three optional modes: a cold replay with choices hidden until
the recording ends; a focus-led replay using the group's skill target; and a
delayed replay to compare a new choice with the learner's earlier listening.
All three present the real A–D options and return immediate individual
diagnostic feedback without a score, leaderboard, public record, or transcript.
An incorrect selection gives the existing item-specific replay tip and another
bounded opportunity. No audio is synthesized or uploaded by this revision.

## Acceptance boundary

Required before Part B/C work begins:

1. The learner and host APIs/views contain no dialogue or written item stem,
   including for a room pinned to the original version.
2. Learners see A–D source choices for the timed activity and every optional
   real-audio enrichment activity; source option order and answer keys remain
   intact and keys are never sent to the client.
3. Every extension choice is stored separately from core attempts, receives
   an individual response, and is omitted from teacher projections.
4. The teacher can select any skill group without destroying progress; the
   control is keyboard-accessible and bilingual.
5. Teacher UI exposes no participant roster/total or unfinished/completed
   denominator. No-score and privacy invariants remain in force.
6. `/dashboard` offers a clear, role-aware workshop link.
7. A new immutable Part A revision reuses existing public media objects; the
   old version and room evidence remain unchanged. Part B/C remain untouched.
8. Source, deployment, and classroom verification are reported separately.

Student free-text responses have not been inspected. The earlier production
free-text query was blocked by the safety gate because open response text may
contain identifying or sensitive content. Aggregate length and event counts
were used instead. Obtain renewed approval before any raw-text audit.
