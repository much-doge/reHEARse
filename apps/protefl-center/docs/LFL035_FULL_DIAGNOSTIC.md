# LFL-035 full diagnostic package

Status: original diagnostic deployed to PCT128; LFL-037 web-native rebuild is locally container-verified and intentionally not deployed

## Objective

Create an assigned, three-section diagnostic in the ProTEFL Test Center from
ETS's *TOEFL ITP Level 1 Practice Tests, Volume 3, Practice Test A*. The owner
confirmed in chat that they have full rights to digitize and deliver the
book's content to their students and explicitly instructed that the artifacts
be committed. ETS's official Volume 3 eBook and Listening audio were located
at `https://www.ets.org/s/toefl-itp/l1v3_ebook/`. The owner-authorized source
book, audio, page renders, keys, scoring data and versioned maps are tracked
under `apps/protefl-center/content/ets-volume3-practice-test-a-v1/`. Candidate
attempts and results remain private Test Center data and never enter reHEARse
learning records.

The existing Form 2000-10 listening pilot is a workflow/reference only. Do not
substitute its questions or audio for Practice Test A.

## Candidate journey

1. Candidate signs in and claims a teacher-issued, one-use code.
2. Candidate sees a welcome page describing this diagnostic and its Listening,
   Structure and Written Expression, and Reading sections.
3. Sections run in that order. Each has a clear instruction page and Begin
   action. The candidate can navigate questions within the current section.
4. Accepted answers autosave. Refresh/reconnect uses server-owned timing and
   restores the same attempt. Section results are not exposed during the test.
5. Results and item review become available only after all three sections are
   submitted. A whole-test retake starts a new full attempt. A focused section
   retake starts a separate child attempt after full completion. Neither can
   replace, improve, or change the completed parent result.

## Section contract

- **Listening:** all 50 Practice Test A items; test time follows the complete
  audio sequence. Teacher selects one playback mode on each issued code:
  autoplay or click-to-play by question. Autoplay uses a 12-second response
  interval after each question. For Parts B/C, every question references its
  full conversation/talk context and offers direct access to the relevant
  question audio. Reuse LFL-028 server timing, idempotency, recovery and private
  media authorization where they fit; preserve this package's own version.
- **Structure and Written Expression:** 40 items, 25 minutes. Preserve the
  book's two part directions, Part A sentence completion/omissions, and Part B
  underlined error segments. Provide an answered/unanswered number grid and
  in-section navigation. The source conversion table does not provide
  converted ranges for raw counts 39–40 in this section; preserve the raw
  count and leave that conversion unavailable rather than extrapolating.
- **Reading Comprehension:** 50 items, 55 minutes. Preserve source paragraph
  order, line arrangement, and line references through responsive rendering.

Timer display precision is an interface choice; server time remains
authoritative. A 100 ms display tick may show tenths of a second where useful,
but must not change recorded deadlines or imply false precision about network
delivery.

## Result and retake contract

- After the complete diagnostic only: show correct, incorrect, and omitted
  counts by section and overall; show the book's Practice Test A converted
  score using its exact versioned conversion method; offer a question review
  with the candidate answer and correct answer.
- Do not expose answer keys before whole-test submission.
- Retakes are separate immutable attempts. Keep the first completed result as
  the primary result shown in summaries; show later attempts separately and
  never replace or add them to the first score. Focused Listening, Structure,
  and Reading retakes point to the completed full attempt and have their own
  result/review lineage.
- Result page should be a polished, accessible summary with clear section
  breakdown, visual progress, question-review and whole-test retake actions.

## Teacher controls and access

- Teacher/admin can publish or hide the immutable package and issue a one-use,
  expiring access code.
- Access code creation includes a Listening mode choice (autoplay or
  click-to-play). Store the choice on the invite/assignment and pin it into the
  candidate's first attempt; later teacher changes cannot alter an in-progress
  attempt.
- Replace the current 24-character invite with a shorter, case-insensitive
  10-character Crockford-style code, stored hashed. Add server-side failed-claim
  throttling and retain one-use and seven-day expiration rules.
- Assignment, role, ownership, content, media, answer, submission and result
  authorization are server-enforced. Keep content private/no-store.
- Preserve the diagnostic URL through the allowlisted sign-in return path; do
  not silently send candidates to the dashboard after authentication.

## Durable data and evidence

- Add a new versioned diagnostic package/section/attempt contract; do not
  mutate the listening pilot schema or existing attempts.
- Pin the immutable resource version, listening mode, package content hash,
  answer-key hash, score-table hash and timing-map hash at attempt creation.
- Candidate answers are private append-only attempt evidence. A completed
  retake is a new attempt and cannot update an earlier result.
- Keep item text, options, passage/line layout, keys, audio, and conversion
  tables out of browser payloads until the attempt's authorized review state.
- Record source provenance and owner authorization in the tracked package
  receipt. Keep all candidate records separate from the source artifacts.

## Acceptance checklist

- [x] Owner-authorized Practice Test A source PDF, layout-preserving text,
  full audio, question-page renders, keys, score table and provenance are
  tracked with a SHA-256 inventory in the package manifest.
- [x] Listening item order, Parts A-C, audio/question grouping, 12-second
  autoplay answer pauses, click mode and direct Part B/C question playback are
  structurally verified against the source transcript anchors, a fresh 50-window
  silence scan, and all conversation/talk transitions. Classroom playback
  observation remains pending.
- [x] Structure has all 40 items and exact A/B visual distinctions, omissions,
  directions, 25-minute server timer, grid and navigation.
- [x] Reading has all 50 items and five source-line/paragraph passage models;
  the first passage and question were visually inspected at desktop width.
- [x] Conversion values and formula are cross-checked against the book's
  Practice Test A scoring pages and independently rechecked.
- [x] Complete submission gates all results/review; local full completion and
  focused Reading retake created separate immutable results and the parent
  result remained unchanged. Full-retake production behavior is unchanged.
- [ ] Short-code format, hash-only storage, expiry, one-use claim, rate limiting
  and teacher playback-mode selection are verified.
- [x] The protected diagnostic URL survives sign-in using a narrow, test-covered
  authentication return-path allowlist.
- [ ] No-score reHEARse invariant, Test Center storage boundary, access checks,
  no-store headers, role views, mobile layout and recovery behavior remain
  intact.
- [x] ESLint, TypeScript, 47 test files/175 tests, production build, package
  verifier, additive local migrations, container render, logged-out guards,
  full completion, focused Reading retake, and return-to-parent journey pass.

The initial deployed candidate screen used page crops and its interim
page-text implementation is now superseded locally by the LFL-037 structured
item model. The learner receives one question with full A-D choices, explicit
Structure blanks/underlines, or the relevant line-marked Reading passage.
Legacy page-image and page-text routes have been removed. Migration 022 adds
focused retake lineage without altering completed results. Migrations 019 and
020 are applied in PCT128; migration 022 and the LFL-037 application are not.
The production candidate journey and classroom verification remain outstanding; see
[`docs/LFL035_DEPLOYMENT_RECEIPT.md`](../../../docs/LFL035_DEPLOYMENT_RECEIPT.md).

## Current gaps

The source package is ingested and structurally validated. A fresh full-track
scan detected exactly 50 answer-sized quiet intervals (12.031-12.246 seconds),
with zero difference from the stored window starts. Known Q2-Q5 transcript
anchors differ from mapped starts by at most 1.043 seconds, and all five Part
B/C context transitions are checked. This is structural sequence alignment,
not a classroom audibility observation. Production deployment, a real
candidate journey, and classroom verification remain outstanding. PCT128
evidence for the superseded deployed build is recorded in
[`docs/LFL035_DEPLOYMENT_RECEIPT.md`](../../../docs/LFL035_DEPLOYMENT_RECEIPT.md).
