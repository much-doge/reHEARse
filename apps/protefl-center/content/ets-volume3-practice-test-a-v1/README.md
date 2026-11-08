# ETS TOEFL ITP Level 1 Volume 3 · Practice Test A

This is the source-backed content package for the ProTEFL Test Center diagnostic. The owner explicitly confirmed they hold full rights to digitize and deliver this book to their students, then instructed that the package artifacts be committed to Git.

## Package files

- `source/ets-toefl-itp-volume-3.pdf`: complete owner-authorized source eBook.
- `source/ets-toefl-itp-volume-3-layout.txt`: `pdftotext -layout` extraction retained as a searchable reference.
- `source/practice-test-a-listening.m4a`: complete Practice Test A listening recording, 35:02, mono AAC.
- `pages/`: private page-faithful extraction references retained for source comparison; they are not served to candidates.
- `metadata/answer-key-practice-test-a-v1.json`: Practice Test A answer key, transcribed from the answer key page.
- `metadata/score-conversion-practice-test-a-v1.json`: section conversion ranges and combined-score method from the scoring pages. Raw Structure counts 39–40 have no value in the source table; the application leaves those conversions unavailable rather than filling in a value.
- `metadata/listening-pauses-v1.json`: detected answer-window boundaries in the full audio.
- `metadata/listening-question-map-v1.json`: question-only and Part B/C context playback boundaries.
- `metadata/listening-alignment-audit-v1.json`: the transcript-anchor, detected-quiet-window, and Part B/C transition evidence used to validate the playback map.
- `metadata/questions-practice-test-a-v1.json`: web-native question model with all A–D options, explicit Structure blanks, exact Part B underlined spans, and line-marked Reading passages.
- `metadata/page-index-v1.json`: section/question-to-source-page map and reading passage groups.
- `metadata/page-texts-v1.json`: retained extraction reference from the superseded page-text implementation; it is not included in or served by the candidate runtime.
- `metadata/instructions-practice-test-a-v1.json`: source directions for each section and Structure part.
- `package-manifest.json`: versions, source provenance, and SHA-256 inventory.

## Source provenance

Official ETS eBook landing page: <https://www.ets.org/s/toefl-itp/l1v3_ebook/>.
The complete Listening recording was retrieved from ETS's embedded Test 1 audio player (Kaltura entry `1_x4oauw26`). The audio is not re-encoded; its MP4/AAC container is named `.m4a` to match its actual codec.

## Timing note

A full-track `ffmpeg silencedetect` pass (`noise=-42dB`, minimum duration 4s) found 50 pauses of approximately 12 seconds. The map applies a single transcript-to-audio offset, aligns answer windows to those pauses, checks known Part A transcript anchors, and checks every Part B/C group transition. This establishes structural sequence alignment; a classroom playback observation remains a separate release gate.

## Delivery boundary

The source PDF contains the answer key, scoring tables, and scripts. Never expose the PDF, source text, answer-key JSON, score-conversion JSON, or source directory through a public/static route or a pre-submission browser payload. Candidate delivery uses signed-in, assignment-, attempt-, section-, and question-checked Test Center routes. Section directions render from the structured instruction file. Source page images remain in the private package and are not used in learner test or review screens. Candidate responses/results are runtime-private and remain isolated from reHEARse learning records.
