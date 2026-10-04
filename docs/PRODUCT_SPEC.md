# reHEARse — product specification

## Aim

Help learners build the processes beneath TOEFL Listening Part B and Part C
before asking them to perform under test conditions.

The product does not equate a learner's notes with comprehension. It invites a
learner to externalize what they think they heard, compares that evidence with
the source discourse and teacher guide, and gives one useful target for the
next listen.

## Core learning loop

1. **Listen for meaning.** The learner plays a teacher-selected conversation or
   talk and may take idiosyncratic notes in any language.
2. **Reconstruct.** The learner answers a non-test-like prompt such as “What do
   you think was happening?”
3. **Diagnose, do not grade.** The system describes evidenced meaning,
   mismatches, uncertainty, and what cannot be inferred.
4. **Focus.** The learner receives one bilingual next-listen target without an
   answer reveal.
5. **Relisten and revise.** A new immutable attempt records what changed.
6. **Reveal later.** A teacher-controlled capability may expose transcript
   excerpts, the transcript, or TOEFL-style questions after the learning loop.

## Diagnostic layers

Feedback may refer to four distinct layers without turning them into levels or
scores:

- speech decoding: words or phrases apparently recognized;
- local meaning: the meaning of a clause or nearby utterances;
- discourse meaning: how ideas and events fit together;
- inference: stance, implication, or purpose supported by the discourse.

When the evidence is insufficient, the system says so. It never assigns a
percentage of understanding.

## Bilingual contract

The primary language pair is English and Indonesian (`en`, `id`). Learner
feedback stores both versions together under one immutable feedback record.
The learner may write notes and reconstruction in either or both languages.
Language quality is not evaluated unless a future activity explicitly teaches
language production.

## MVP personas and journey

### Learner

- creates a local account and signs in;
- sees active and completed activities;
- chooses an activity pseudonym that is not their login identity;
- plays self-paced audio, takes notes, and reconstructs meaning;
- submits an immutable attempt;
- receives bilingual, non-scored feedback and one relistening target;
- opens earlier attempts and compares changes across retries.

### Teacher

- signs in with a teacher account created by the seed process;
- creates a draft activity from modular sections;
- uploads audio and supplies a transcript, reconstruction prompt, and teacher
  guide;
- publishes the activity;
- can inspect learner attempt status without receiving invented proficiency
  analytics.

## Explicit MVP boundary

Included in the first runnable slice:

- local email/password identity;
- individual, self-paced activities;
- private audio storage served through an authorized route;
- activity draft/publish flow;
- notes plus a reconstruction prompt;
- versioned attempts and bilingual feedback;
- provider-neutral feedback port, deterministic demo adapter, and optional
  OpenAI Responses adapter;
- Docker Compose with PostgreSQL.

Deferred capabilities:

- Google SSO;
- synchronized teacher-led playback;
- public response wall or word cloud;
- transcript/excerpt unlock workflow;
- paper-note image capture/OCR;
- TOEFL-style practice mode;
- recreational quiz scoring;
- cohort analytics and exports.

Nothing deferred should appear to work in the MVP UI.

## Acceptance journey

From a fresh database, Compose starts the app and PostgreSQL. A seed command
creates one teacher and one published sample activity. A learner can register,
sign in, open that activity, submit notes and a reconstruction, receive paired
English/Indonesian diagnostic guidance with no numeric assessment, relisten,
submit again, and reopen both immutable attempts. A teacher can create and
publish another activity with an uploaded audio file.
