# ETS TOEFL ITP Level 1 Volume 3 · Practice Test B Listening

This is the owner-authorized, Listening-only source package for the separately
bounded TOEFL-like Test Center. The complete book source is retained once in
the adjacent `ets-volume3-practice-test-a-v1/source/` package; this package
stores the Test B web model, answer key, timing evidence, and matched recording.

## Package files

- `source/practice-test-b-listening.m4a`: complete matched Practice Test B
  Section 1 recording, 34:54, AAC.
- `metadata/questions-practice-test-b-listening-v1.json`: all 50 written
  questions and A-D options transcribed from source pages 63-72.
- `metadata/answer-key-practice-test-b-listening-v1.json`: the Section 1 key
  from source page 105.
- `metadata/listening-pauses-v1.json`: all 50 acoustically detected native
  answer windows.
- `metadata/listening-question-map-v1.json`: question and Part B/C context
  playback boundaries using the same model as Practice Test A.
- `metadata/listening-alignment-audit-v1.json`: recording/script match and
  group-transition evidence.
- `metadata/instructions-practice-test-b-v1.json`: source Listening directions.
- `metadata/score-conversion-practice-test-b-v1.json`: the book's shared raw
  score conversion table, retained for the Listening completion summary.
- `package-manifest.json`: version, provenance, and SHA-256 inventory.

## Audio match

The recording was located as YouTube video `FGSAKtHwjXc`, titled “TOEFL ITP
TEST 4 Section 1”. Its transcript matches the Test B script at independent
anchors: the first study-break/library item, the Part B baryton conversation,
and the Part B polarized-light conversation. A full-track `ffmpeg`
`silencedetect` scan found exactly 50 answer windows of approximately 12
seconds. The original AAC stream was retained without re-encoding.

## Delivery boundary

The recording, answer key, and metadata stay inside the server image. They are
served only through signed-in, assignment-, attempt-, section-, and
question-checked Test Center routes. Practice Test B is a Listening-only
assignment; it does not expose empty Structure or Reading sections.
