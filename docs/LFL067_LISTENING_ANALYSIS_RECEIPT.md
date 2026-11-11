# LFL-067 evening-class Listening analysis report

Status: source-complete. Owner: integration lead.

## Artifact

The private report was generated at:

`/home/miko/Downloads/reHEARse-evening-listening-2026-11-11-report.pdf`

The file is mode `0600` and is intentionally outside Git because it contains
learner names, requested addresses, account-match notes, responses and attempt
statistics.

## Contents

- coverage of all 12 requested participants, including the unmatched Tiara
  request;
- participant-level attempt and response totals;
- Longman Part A/Part B/Part C instructional skill-family summary;
- a complete Q1–Q50 frequency table with key, eligible attempts, recorded
  responses, wrong count, wrong percentage and omitted count; and
- a question-by-question wrong-response table naming the participant, attempt
  scope/number, selected option and answer key.

## Method

The source is the existing mode-0600 JSON export generated for LFL-063. For
each attempt and question, the report keeps the latest valid A–D answer event;
duplicate taps are not counted twice. Focused Listening retakes are separate
attempts. Percent wrong is `wrong / recorded responses` for that question.
Omitted counts include only eligible attempt records with no final response;
focused retakes are eligible only for their selected question set.

The Longman categories are instructional mappings derived from the repository's
reviewed Longman Part A preparation map and Part B/C group map. They are not
publisher-authenticated item-level skill labels. Skills 14–15, 7–10 and 16–17
are not forced into separate item groups without reviewed transcript-level
evidence.

## Verification

- ReportLab generator: `scripts/build_listening_analysis_pdf.py`.
- `pdfinfo`: 10 A4 pages; mode-600 artifact.
- `pdftotext` inspection confirmed Q1–Q50, Longman family table, wrong-response
  rows and participant summary.
- `pdftoppm` rendering was visually inspected for table wrapping, repeated
  table headers, clipping and page overflow.
- Report generation is read-only with respect to the application database and
  does not change learner attempts, answers or assignments.

The report is an instructional review of server-observed records. It does not
claim that a saved event proves audibility or explains a learner's reasoning.
