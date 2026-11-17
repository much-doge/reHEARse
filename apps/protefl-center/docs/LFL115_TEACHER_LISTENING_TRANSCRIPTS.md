# LFL-115 — Teacher-only Listening transcript review

Status: deployed to PCT128; authenticated teacher browser inspection pending.

## Objective

Add an optional transcript view when a teacher or administrator opens a
Listening question in individual-attempt review or cohort question review.
Part A shows the complete short exchange and spoken question. Part B and Part C
show the complete shared conversation or talk plus the selected question cue.

## Source boundary

- Volume 1 and Volume 3 transcripts come from the owner-authorized published
  Listening Comprehension Scripts retained in each package's source PDF/layout
  extraction.
- May 2005 uses the matching transcript indexed at
  `https://tingroom.com/print_68978.html`, reviewed against the already aligned
  recording/question map. Its provenance and unofficial-transcription caveat
  remain visible to teachers.
- Transcript metadata is supplemental teacher-review content. It is not added
  to the candidate package manifest, does not change pinned package hashes, and
  does not rewrite existing attempts or results.

## Access and presentation

- Only the existing authenticated teacher/admin question-review endpoint may
  return transcript text after resource, assignment, candidate, attempt, and
  role checks pass.
- Candidate item, attempt, result, and audio DTOs remain unchanged and contain
  no transcript field.
- The transcript is closed by default behind **Show transcript**.
- Every question maps to exactly one transcript group. Multi-question Part B/C
  items expose the entire shared conversation/talk, not an isolated question
  fragment.

## Acceptance

1. All 50 Listening questions in each of the three registered packages have a
   non-empty transcript context and spoken-question cue.
2. Every mapped conversation/talk group covers the same question range and
   group identity as its Listening timing map.
3. Teacher individual and cohort review can toggle the transcript without
   revealing it to candidate routes.
4. Source/provenance notes distinguish published scripts from the reviewed
   unofficial May 2005 transcript.
5. Package-backed coverage tests, access tests, lint, TypeScript, full tests,
   production build, Compose validation, deployment, and authenticated teacher
   readback are recorded separately.

## Source-complete evidence

- Volume 1 transcript SHA-256:
  `1830d0e12a201971c645f7c4a61d7d1127061a826fd99078c05b6cd81a834ad5`.
- Volume 3 transcript SHA-256:
  `fc336f4bb0b6b7f80441f9fb52982605b06ae979da0aa58d4399250b36139d08`.
- May 2005 transcript SHA-256:
  `a8f1e8a695a8b03f859104fc4eb1b23db40bfa68cdd9cece620746df5fc8004f`.
- Each file contains exactly 50 ordered question mappings and 35 transcript
  groups: 30 Part A exchanges and five complete Part B/C contexts.
- The real package timing maps and transcript metadata were cross-checked in
  automated tests. Every conversation/talk group has the same identifier,
  type, and inclusive question range in both files; every group contains
  non-empty speaker/text content.
- The May 2005 generator removes non-English annotations and presents its
  source caveat in English. Published Volume 1/3 scripts retain their source
  wording.
- The teacher review adapter regression opens Volume 3 Question 42 and confirms
  that the complete Questions 42–46 Mesopotamian talk is returned after the
  teacher-assignment boundary query.
- Candidate item/result DTOs were not changed. Transcript metadata is read only
  by `teacherDiagnosticReviewItem`, which is called by the existing
  teacher/admin-only, same-origin, no-store review endpoint.
- Focused transcript/package/adapter tests: 2 files, 19 tests passed.
- Full ESLint, repository TypeScript, 56 Vitest files/230 tests, transcript
  regeneration, `git diff --check`, and Next production build passed.
- The standalone build contains all three transcript files. Deployment,
  authenticated teacher UI inspection, and classroom verification remain
  pending.

## Deployment

- Source/release commit: `46df50d`.
- Release tree: `/opt/rehearse/.releases/46df50d`.
- App image: `rehearse-app:46df50d`; image ID
  `sha256:77b0cfe52e47b9e2b18162c41ecca645f5481e12cfbe5dfa01d9cb6051f2cc89`.
- Only the app service was recreated. It is healthy with zero restarts.
- PostgreSQL retained its existing container ID, stayed healthy, and was not
  migrated or recreated.
- LAN and public health returned HTTP 200. A cross-origin/no-session teacher
  question request was denied with 403, and an unauthenticated candidate-item
  request was denied with 401.
- All three transcript files are present inside the running container and
  match the source-complete SHA-256 values above.
- No authenticated teacher browser session was available for final visual
  interaction with **Show transcript**. The server boundary, runtime content,
  and deployed health are verified; the clicked teacher journey remains
  pending and is not described as classroom verified.

Rollback is app-only to `rehearse-app:4323cee`. Keep PostgreSQL, package
manifests, attempts, and learner results unchanged.
