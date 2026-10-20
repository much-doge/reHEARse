# LFL-023 — Part A listening workshop

Owner: integration lead. Status: coordination.

## Outcome for the first release

Build one teacher-led Part A workshop from the operator-provided set of thirty
short conversations. Learners work at their own computers with headphones.
The teacher controls which skill group is open, projects the same preparation
material the class can read, and sees enough live counts to decide when to
pause, discuss, or continue.

This is a listening lesson, not a scored mock test. It has no points,
leaderboard, percentage, grade, rank, mastery label, or AI dependency.

## Source and classification

The private source audio is under the operator's ConTEFL package. The public
application and repository must not expose the package number, source code,
archive URL, answer sheet, full transcript, or online match used to verify it.
The imported activity uses a neutral public ID and title.

Classify every item only after listening to the complete clip, checking the
spoken question and the original A-D options, and corroborating uncertain
wording against a legitimate online copy or catalogue. A search result is not
answer authority. Record URLs, match confidence, discrepancies, transcripts,
keys, and source item numbers only in the ignored private review file.

The primary classification uses the Part A framework in Deborah Phillips's
Longman paper-test course. Its broad sequence is:

1. second-line meaning, restatement/synonym, and similar-sound distractors;
2. who/what/where inference, passives, and multiple-noun reference;
3. negatives, double negatives, almost-negative expressions, and comparative
   negatives;
4. agreement, uncertainty/suggestion, surprise, wishes, and unreal conditions;
5. two- or three-part verbs and idioms.

Pearson describes the introductory course as intermediate and the preparation
course as high-intermediate to advanced. The detailed paper-test contents and
Part A strategy sequence are corroborated by the accessible course contents.
References:

- <https://www.pearson.com/languages/educators/connected-english-learning-program/adult/longman-introduction-and-preparation-for-toefl>
- <https://books.google.com/books/about/Longman_Preparation_Course_for_the_TOEFL.html?id=46rpAfl9EMYC>
- <https://www.svu.edu.eg/faculties/alsun/wp-content/uploads/2023/11/longman-1.pdf>

Each item receives one primary skill, optional secondary skills, the literal
question task (for example speaker meaning, inference, next action, location,
or reference), the decisive audio evidence, and the distractor mechanism for
each wrong option. Group items by what learners must do, not merely by item
number or vocabulary topic. Preserve source order inside each group unless the
teacher guide records a specific reason to reorder it.

## Classroom sequence

### 1. Join and prepare

The signed-in teacher creates the workshop and receives a six-digit PIN.
Learners enter the PIN; the server gives each browser an opaque HttpOnly
membership token whose hash alone is stored. The teacher sees joined aliases.
The activity does not require student names.

For the current skill group, both projector and learners receive the same
bilingual preparation card:

- what this question type asks;
- what to listen for;
- a short decision procedure;
- common distractor patterns;
- one newly written analogous example, not an item from this activity;
- two questions learners should ask themselves before listening;
- a compact English-Indonesian language note where it genuinely helps.

Preparation must not reveal a live item's dialogue, answer, transcript, or a
paraphrase that makes the answer obvious. Copy should be direct and academic:
no fantasy framing, mascot narration, slogans, invented mastery labels, or
marketing language.

### 2. Timed first listen

The teacher opens practice for the current group. Each learner starts each
clip on their own device. The server records an idempotent listen start and
derives `answerOpensAt = startedAt + durationMs` and
`deadline = answerOpensAt + 12_000`. A-D become actionable when the clip ends.
The server rejects early, late, duplicate, changed-payload, and out-of-order
submissions. Refresh returns the same deadline and current state; it never
grants a fresh first attempt.

No transcript or captions appear during the timed listen. Options retain their
original A-D wording and order. The learner may explicitly mark uncertainty,
but this still enters the guided-relisten path.

### 3. Correct answer: explain the distractors

After a correct selection, show a restrained confetti effect that respects
reduced motion. Then require one short explanation for each of the three wrong
options: why it does not fit this conversation or question. Each response is
saved append-only, 3-400 characters, and remains visible after refresh.
Completion requires all three fields, not AI approval of their prose.

### 4. Incorrect or uncertain answer: relisten with a purpose

Save the first selection before giving help. Show one item-specific bilingual
tip that identifies what to attend to without naming the correct option. Replay
the complete clip, then reopen the same A-D choice without the 12-second test
deadline. A second miss gives a more explicit contrast tip and another replay.
After two misses, show a bounded guided comparison and allow a final selection;
the learner still completes the three distractor explanations. This finite
exit prevents guessing loops and gives the teacher a clear point for support.

Tips, contrasts, evidence spans, and wrong-option reasons are authored per
item. A generic “listen carefully” message is not acceptable.

### 5. Teacher decision

For each current item the teacher sees raw counts for not started, first-listen
correct, relistening after an incorrect/uncertain answer, and completed. The
teacher does not see learner prose on the projector. There is no total score or
ranking. The teacher explicitly opens the next skill group; learners cannot
race ahead. Closing the session preserves all accepted events.

## Frozen public contracts

Use a new `part-a-workshop.v1` capability rather than changing the historical
`classroom-game.v1` or ladder contracts. Existing rooms, runs, attempts, and
media readers remain byte-compatible.

Public learner projections may contain:

- neutral activity/group/item IDs and bilingual titles;
- group preparation cards and public skill labels;
- original A-D options only while an item is active;
- clip URL, duration, server time, answer-open time, deadline, saved selection
  state, attempt count, current non-revealing hint, and the learner's own
  distractor explanations;
- correct/incorrect acknowledgement only after the learner's accepted choice.

They must never contain answer keys, other learners' choices or text, full
transcripts, source identifiers, private rationale, future hints, or online
source URLs. Teacher projections add aggregate operational counts, not keys or
learner prose.

All mutations use a client-generated idempotency key plus observed revision.
Accepted state changes and text evidence are append-only. Content, grouping,
media hash, and pedagogy version are pinned when a room is created.

## Storage and delivery

Question audio is imported through the existing S3-compatible media adapter to
the configured public bucket under a fresh neutral reHEARse prefix. Browsers
fetch audio directly from object storage/Cloudflare; PCT128 and the operator's
home uplink must not proxy the bytes. Validate all thirty local SHA-256 hashes,
sizes, MIME types, durations, public range requests, and imported object keys
before publication. Re-import of one immutable version is a no-op; corrections
use a new version.

Use additive migration `016_part_a_workshop.sql`. Keep room membership,
teacher ownership, pinned content, learner state, and append-only events in
dedicated workshop tables. Do not add Redis, WebSockets, a worker, or AI for
this release; bounded polling is sufficient for a supervised lab.

## One-hour cut line

Required: all thirty source items reviewed and importable; every item assigned
to a useful skill group; teacher PIN/join; shared preparation card; individual
audio; server-derived 12-second first-choice deadline; correct/distractor and
incorrect/relisten branches; item-specific tips; saved explanations; teacher
counts; teacher-controlled next group; refresh/idempotency/ownership checks;
desktop and narrow-screen browser acceptance.

If time must be cut, remove visual polish and optional glossary details first.
Do not cut source verification, original A-D fidelity, deadline enforcement,
finite support, saved evidence, privacy, or historical compatibility.

## Acceptance ownership

The second desktop owns private source research, classification, immutable
content/import tooling, persistence, domain transitions, and backend APIs. The
integration lead owns learner and teacher UI, the confetti/reduced-motion
effect, combined browser acceptance, final documentation, push, and deployment.
Only the integration lead may accept the content, merge it, publish media, or
deploy. Source-complete is not deployed, and deployment is not a classroom
pilot.
