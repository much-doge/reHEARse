# Full TOEFL-like Test Center package bootstrap

This is the repeatable operator/agent workflow for adding a full diagnostic or
another form from an already approved source. It records the working Practice
Test A process and the Listening Practice Test B importer. Read this before
creating, importing, publishing, or changing a full test. The active package
receipt remains the source of truth for that form's exact content and status.

## Non-negotiable delivery rule

The candidate app is a purpose-built test interface, never a PDF or image
viewer. Do not put source-page screenshots, page crops, scanned question
pages, or extracted page-text dumps in candidate routes. Do not use an image as
a shortcut for a missing transcription. Page images and source PDFs may exist
inside the private package as comparison evidence; candidate screens must
render editable web content from the package metadata.

Each item must be represented as real content: complete prompt, four separate
A-D choices, question/part identity, and where applicable paragraph/line
references, explicit sentence blanks, or the exact underlined span. Directions
are distinct structured content for each section and for Structure Parts A
and B, and are shown at the section start and at the relevant transition.
Question navigation, timers, passages, retake selection, and review all operate
on these structured records.

## 1. Confirm source and package boundary

1. Read D-027 and D035/D036 in `docs/DECISIONS.md`, this guide, the current
   package README/manifest, and its work item/receipt in `docs/CHANGE_LEDGER.md`.
2. Confirm the owner has authorized the specific source and the intended
   digitization/delivery. Record provenance and the authorization in the
   package receipt. Do not infer rights from a URL or a previously approved
   book/form.
3. Keep source files, working transcripts, keys, score tables, and learner
   attempts inside the Test Center boundary. Never route them through reHEARse
   learning history, diagnostics, media, or analytics.
4. Create a new immutable package directory/version. Never silently replace
   files used by active attempts. Keep staging or unreviewed material private
   and ignored.

## 2. Build editable package content

Use `apps/protefl-center/content/ets-volume3-practice-test-a-v1/` as the
reference model for a full form. Keep the package's own source-specific files
and schema versions. Typical inputs are:

- `metadata/questions-<form>-vN.json`: complete web-native question content;
- `metadata/instructions-<form>-vN.json`: section/part directions;
- `metadata/answer-key-<form>-vN.json`: source-checked keys;
- `metadata/score-conversion-<form>-vN.json`: only values/formulae present in
  the source; preserve unavailable ranges as unavailable;
- `metadata/page-index-vN.json`: private question/page and passage mapping for
  source audits;
- source audio, transcript/alignment evidence, answer-window map, and a
  package manifest with file lengths and SHA-256 digests.

Transcribe every Listening, Structure/Written Expression, and Reading item.
Verify every item number is present exactly once, options A-D are non-empty,
and each key maps to one valid option. For Structure A, encode the exact
missing part as an explicit blank in the sentence; do not flatten it into a
page image. For Structure B, encode and visually render the exact underlined
word/phrase as the interaction target. Preserve Reading passage paragraphs,
line arrangement/labels, references, and the relationship between each passage
and its questions. Keep source wording and item logic intact; do not author
replacement distractors to fill a transcription gap.

Use the source page render only to compare the editable rendering and resolve
transcription/layout ambiguity. Candidate UI should show one test item at a
time where that is the established section workflow, with readable choices,
keyboard/touch affordances, part-aware question navigation, and responsive
passage/question layout. Include responsive visual inspection at desktop and
mobile widths; an importer success message is not a content review.

## 3. Align Listening audio and parts

Practice Test A's implementation is the full-test reference; the immutable
Listening Practice Test B bootstrap is `scripts/import-volume3-test-b-listening.mjs`.
Treat that script as an auditable source-specific recipe, not a universal
black-box importer. Re-check all page numbers, column boundaries, source text,
answer key, group map, offsets, and transcript anchors for each new form.

For each Listening form:

1. Match the correct source recording to the source transcript/question set;
   record why the recording is the right one and its provenance.
2. Preserve the original audio asset when possible. Record codec/duration and
   its digest; do not substitute clips from another form.
3. Determine question/answer boundaries with a coarse transcript offset and
   quiet-window analysis. The established audit used `ffmpeg silencedetect` at
   `-42dB` for 4 seconds, then checked that the native answer windows are
   approximately 12 seconds. This is a locating aid, not proof of audible
   alignment by itself.
4. Check representative transcript anchors near the beginning, middle, and
   end, plus every Part A/B/C transition. Record source offset, acoustic
   boundaries, and any exceptions in a machine-readable alignment audit.
5. Model Part A as single-question audio. Model each Part B conversation and
   Part C talk as a group: every dependent question must carry its full group
   context start and its own question-audio start/end, so a candidate can
   jump directly to that question without losing the associated dialogue/talk.
6. Confirm the player advances the active question, returns the view to the
   active item after look-ahead, presents directions at part transitions,
   and prevents revisiting audio-passed questions. Do not infer that a timing
   map is classroom-verified without a human listening check.

The current teacher invite controls pin autoplay versus click-per-question
playback and whether Listening question text is shown. Autoplay uses the
source-mapped 12-second response interval. Do not change settings on an
existing attempt; settings for a new access code are immutable on claim.

## 4. Wire the package to the application

1. Add package-specific, server-side loaders for instructions, question
   content, keys, score conversion, and timing. Keep filesystem/source loading
   on the server; send only the minimum authorized DTO to the candidate.
2. Add the package to resource initialization/catalogue with an explicit
   version and publication state. A file in Git is not automatically
   published or assigned.
3. At attempt creation, pin package/version and the content, answer-key,
   score-table, and timing-map hashes. Keep candidate answers/events and
   results append-only. Retakes are separate attempts; focused retries include
   only the most recent review's incorrect or omitted questions and remain
   children of the original full attempt.
4. Enforce sign-in, role, assignment, resource visibility, scope, attempt,
   section, and question ownership on the server for page data, APIs, media,
   submission, and review. Default to deny. Use private/no-store behavior for
   protected content and attempt records.
5. Keep answers and conversion data out of candidate payloads until that
   attempt's permitted completion/review state. Teacher review is available
   only from a server-authorized teacher/admin workspace. Never put private
   answer keys in a static/public asset path.
6. Present the full diagnostic's Welcome, Listening, Structure, Reading, and
   completed-result states as distinct useful screens. Listening runs to its
   mapped end; Structure is 25 minutes; Reading is 55 minutes. A selected
   single-section assignment must use its own section path, result, and retry
   flow without exposing the other sections.
7. Show a polished completion view with raw correct/incorrect/omitted counts,
   section breakdown, score conversion only when the source defines it,
   item review, and separate retake actions. A retake never increases,
   replaces, or combines with the prior attempt's score.

## 5. Verify before publication

Use the package verifier and relevant changed-path lint/type checks. Verify
that:

- item counts, numbering, A-D choices, answer keys, part membership, directions,
  and source references are complete and consistent;
- Structure blanks/underlines and Reading passage lines render as text and
  semantics, not as page images;
- Listening offsets, all answer windows, dialogue/talk groups, and direct
  question playback match the same form's audio;
- the candidate payload contains no keys or score conversion before review;
- full and single-section assignments, timers, missed-only retakes, and
  immutable history use the pinned package version;
- unauthorized, signed-out, wrong-role, unassigned, hidden/new-start, and
  wrong-scope requests are denied server-side;
- teacher attempt history shows the primary/full attempts and child retakes
  without changing candidate records;
- responsive desktop/mobile views are visually inspected; and
- content hashes/manifests and the receipt are refreshed after the final
  content edit.

Do not publish when a question, answer key, part map, score conversion, or
audio mapping is unresolved. Record each unresolved item and keep the package
draft/hidden. Record local, container, deployed, and classroom states
separately in the ledger/receipt. Deploy only the named app artifact; preserve
the database and all active attempts unless an independently reviewed
additive migration is required.

## Established source package references

- Full Practice Test A content and implementation receipt:
  `content/ets-volume3-practice-test-a-v1/README.md` and
  `docs/LFL035_FULL_DIAGNOSTIC.md`.
- Practice Test B Listening source-specific importer:
  `scripts/import-volume3-test-b-listening.mjs`.
- Immutable attempt and review contracts: D035/D036 and migrations
  `020_protefl_diagnostic_attempts.sql`, `022_protefl_section_retakes.sql`,
  `023_diagnostic_focus_and_teacher_view.sql`, and
  `024_diagnostic_section_assignments.sql`.
