# LFL-028 supervised listening pilot

Status: implementation in progress

## Outcome

Deliver one closed, authenticated fifty-item listening test for a supervised
ProTEFL class. Learners use an existing reHEARse account or create a learner
account, open the assigned form, complete the timed test, submit once, review
correct and incorrect item outcomes, and start a separate remedial run containing
only missed items.

Internal form code: `ptc-listening-2000-10-v1`.

## Boundary

- The protected source, transcript, answer key and media-review files remain in
  `apps/protefl-center/private/` with owner-only permissions and are ignored by
  Git.
- Immutable question clips are delivered from the existing Najala Dumpster
  Backblaze object store through the configured public media route; PCT128 does
  not serve or retain the runtime audio set.
- The reHEARse route adapter supplies only the authenticated actor identifier.
- Assessment persistence uses `protefl_*` tables and does not read or write
  reHEARse attempts, feedback, games or learner history.
- The first attempt and every remedial attempt are immutable records. A remedial
  run references the missed items from one submitted parent attempt.
- Raw correct/incorrect outcomes are course-pilot feedback. No converted TOEFL
  score, placement band or official-result claim is permitted.

## Learner journey

1. Sign in or register and return to the protected test route.
2. Review the pilot notice, headphones check and one-play timing rules.
3. Start a new full attempt or resume an unfinished attempt honestly.
4. Listen once, choose A-D during the twelve-second response window, and advance.
5. Submit after the final item and view raw correct/incorrect counts plus an
   item-by-item outcome list.
6. Start a remedial run containing only missed or omitted items. Remedial audio
   may replay once per new remedial attempt; it never alters the original.

## Timing and recovery

- The answer window opens after the pinned audio segment ends and lasts twelve
  seconds according to server time.
- The first accepted choice locks the item and advances immediately. If no
  choice is accepted, expiry locks an omitted response and advances.
- Duplicate request keys replay the original acknowledgement. Refresh or retry
  cannot reset a timer or overwrite an accepted answer.
- A disconnected learner resumes the server-authoritative state. Elapsed items
  remain elapsed.

## Acceptance

- Exactly fifty items with original numbering and A-D order.
- Part A items 1-30; Part B items 31-39; Part C items 40-50.
- Grouped Part B/C source audio is not replayed between its dependent questions.
- Authentication, ownership, foreign-attempt denial and same-origin mutation
  checks pass.
- Key material is absent from pre-submission learner payloads and logs.
- Full attempt, immutable submission, result review and missed-item remedial
  journey pass against PostgreSQL.
- `pnpm check`, production-shaped container and authenticated browser journey
  pass before a deployment claim.

## Honest limits

This is a supervised pilot sourced from machine-assisted transcription and
secondary option/key evidence. It is not source-complete, an official TOEFL
administration or a validated placement instrument. Deployment and classroom
use require separate receipts.
