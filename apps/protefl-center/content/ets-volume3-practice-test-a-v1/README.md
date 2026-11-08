# ETS TOEFL ITP Level 1 Volume 3 · Practice Test A

This is the source-backed content package for the ProTEFL Test Center diagnostic. The owner explicitly confirmed they hold full rights to digitize and deliver this book to their students, then instructed that the package artifacts be committed to Git.

## Package files

- `source/ets-toefl-itp-volume-3.pdf`: complete owner-authorized source eBook.
- `source/ets-toefl-itp-volume-3-layout.txt`: `pdftotext -layout` extraction retained as a searchable reference.
- `source/practice-test-a-listening.m4a`: complete Practice Test A listening recording, 35:02, mono AAC.
- `pages/`: page-faithful renders of only Practice Test A question and direction pages. The reading passage layout and Structure Part B underlines remain intact.
- `metadata/answer-key-practice-test-a-v1.json`: Practice Test A answer key, transcribed from the answer key page.
- `metadata/score-conversion-practice-test-a-v1.json`: section conversion ranges and combined-score method from the scoring pages.
- `metadata/listening-pauses-v1.json`: detected answer-window boundaries in the full audio.
- `metadata/page-index-v1.json`: section/question-to-source-page map and reading passage groups.
- `package-manifest.json`: versions, source provenance, and SHA-256 inventory.

## Source provenance

Official ETS eBook landing page: <https://www.ets.org/s/toefl-itp/l1v3_ebook/>.
The complete Listening recording was retrieved from ETS's embedded Test 1 audio player (Kaltura entry `1_x4oauw26`). The audio is not re-encoded; its MP4/AAC container is named `.m4a` to match its actual codec.

## Timing note

A full-track `ffmpeg silencedetect` pass (`noise=-42dB`, minimum duration 4s) found 50 pauses of approximately 12 seconds. These are preserved in the original audio and recorded as an alignment aid. Acoustic detection alone does not prove each boundary's semantic alignment. Human spot-check and full candidate-flow verification are still required before publication.

## Delivery boundary

The source PDF contains the answer key, scoring tables, and scripts. Never expose the PDF, source text, answer-key JSON, score-conversion JSON, or source directory through a public/static route or a pre-submission browser payload. Candidate delivery must use the protected Test Center route and allowlisted page renders only. Candidate responses/results are runtime-private and remain isolated from reHEARse learning records.
