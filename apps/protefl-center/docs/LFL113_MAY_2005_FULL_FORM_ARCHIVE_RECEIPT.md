# LFL-113 — May 2005 full-form private PDF archive receipt

Status: source complete; private local archive only.

## Authorization and purpose

- On 17 November 2026, the owner confirmed that ULB's license covers the full
  form, including Listening, Structure and Written Expression, and Reading.
- This work preserves the licensed source in one PDF for internal source review.
  It does not change the deployed Listening-only candidate package, publish the
  full form, create an assignment, or alter learner evidence.
- The archive is a private source-checking artifact, not a candidate-ready Test
  Center package. It is explicitly Git-ignored and must remain outside public or
  candidate delivery.

## Archive identity and contents

- Local artifact:
  `output/pdf/TOEFL_2005-05_Full_Form_Source_Archive.pdf`.
- Final archive: 24 letter-size pages, PDF 1.4, 151,513 bytes.
- Final archive SHA-256:
  `e6bb3c213475e44329e47d1bc6f61da4f7b4840d2225bba856ab1ec5377304c3`.
- Pages 1–2 are a new archive guide and Listening transcript/source map.
- Pages 3–9 retain original source pages 1–7: Section I, Listening
  Comprehension, Questions 1–50.
- Pages 10–13 retain original source pages 8–11: Section II, Structure and
  Written Expression, Questions 1–40.
- Pages 14–24 retain original source pages 12–22: Section III, Reading
  Comprehension, Questions 1–50. The final source page completes Question 50.
- Total assessment extent: 140 questions.

## Source and transcript map

- Full-form source mirror:
  <https://pdfcoffee.com/toefl-2005-05-pdf-free.html>.
- The retained 22-page source PDF SHA-256 is
  `ada9361958b0a549b55f23299ecdf04e89538145e37b2e785ae26faa5e5018d1`.
- Matching unofficial Listening transcript index:
  <https://tingroom.com/print_68978.html>.
- The archive map records independent anchors spanning the supplied recording:
  Museum of Fine Arts (Q1), bank job offer (Q15), Mike and the instructor's
  manual (Q30), *Sister Carrie* (Q31–33), child language acquisition (Q34–38),
  Canadian couriers and wampum (Q39–41), birdwatching and eggshells (Q42–46),
  and landslide prevention (Q47–50).
- The transcript host was not reachable during final artifact construction.
  Its text is therefore linked and indexed but not copied into the archive or
  represented as authoritative. The deployed Listening package's reviewed
  editable content and timing evidence remain governed by LFL-111.

## Source limitations

- The original scan contains OCR and transcription defects. It is preserved as
  source evidence, not converted into page screenshots for candidate delivery.
- The scan does not contain a trustworthy complete answer key or a form-specific
  score-conversion table. This archive makes no answer-key or converted-score
  claim.
- No Structure or Reading material was added to the deployed Listening-only
  package. Any later candidate delivery requires a separate editable package,
  reviewed key and score evidence, pinned hashes, access checks, and the full
  Test Center publication gates.

## Verification

- `qpdf --check`: passed with no syntax or stream-encoding errors after the
  final compatibility rewrite.
- `pdfinfo`: title, author, subject, 24-page count, letter page size, file size,
  and PDF 1.4 metadata confirmed.
- Text extraction confirmed the archive guide, transcript reference, all three
  section labels, question/options content, and final Reading Question 50
  continuation.
- All 24 pages were rendered for visual review. The complete contact sheet was
  inspected, and the final clean cover, transcript/source map, section
  transitions, representative dense source pages, and last source page were
  checked individually for clipping, overlap, ordering, and legibility.
- No application code, database migration, package registration, deployment,
  assignment, learner attempt, or classroom journey was performed under this
  work item.

## Rollback and handling

The archive is additive and local. Rollback is deletion of the exact ignored
PDF artifact; no repository history, package state, or learner data needs to be
reversed. Keep the artifact owner-controlled and do not attach it to public
issues, commits, candidate routes, or unauthenticated storage.
