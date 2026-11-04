# ProTEFL companion product charter

Status: planning under `LFL-027`

## Purpose

Give a small-class/semi-private TOEFL ITP preparation course one coherent home
without forcing every course interaction into reHEARse. The companion should
make it easy for a learner to know what happens next and for a teacher to run
the course with minimal administrative work.

## People

- **Candidate/learner:** joins a cohort, completes an assigned diagnostic,
  sees an appropriately explained result, opens asynchronous activities and
  meeting information.
- **Teacher:** assigns work, runs Zoom sessions, reviews progress and discusses
  results with the learner.
- **Operator/admin:** controls cohorts, test publication, source versions,
  access, corrections, retention and exports.

Small classes do not remove the need for ownership checks. A learner sees only
their own private records; a teacher sees only explicitly assigned cohorts;
operator actions are auditable.

## Capability map

1. **Course home:** schedule, next action, announcements and bounded links.
2. **Diagnostic/placement test:** one versioned full-length test derived from
   an owner-authorized ConTEFL archive source, with explicit timing, recovery
   and result interpretation.
3. **Asynchronous activities:** assigned preparation and follow-up work. These
   are not scored unless they are explicitly authored as practice tests.
4. **Live meetings:** Zoom meeting information and attendance guidance; an
   external link is sufficient for the first release.
5. **Public course information:** promotion and enrolment interest, isolated
   from authenticated candidate records.

This is a map, not an instruction to build all five capabilities at once.

## Product boundaries

- The root reHEARse product remains the deliberate listening environment.
- The Test Center owns formal assessment and result records.
- No direct database reads or writes cross the product boundary.
- No result is described as official TOEFL certification.
- Placement interpretation is a course decision aid, not a claim about a
  learner's mind, permanent ability or guaranteed official score.
- Marketing pages cannot read candidate or course records.

## Source and test integrity

Before real source ingestion, record:

- who owns or supplied the archive and what use is authorized;
- exact source/test form and immutable content version;
- original item order, options and answer-key provenance;
- adaptations, corrections and teacher approvals;
- section timing, pauses, interruptions and resume rules;
- scoring conversion provenance and uncertainty;
- exposure controls and what a learner may review after submission.

Real archives, answer keys and transcripts belong in `private/`, which is
ignored by Git. Repository tests use synthetic fixtures with no reconstructable
protected content.

## Privacy baseline

Collect only the identity needed to operate the course. Candidate responses and
results are private and access-controlled. Define retention and deletion before
the first real candidate sits a test. Do not place item text, responses, answer
keys, credentials or session tokens in logs, analytics or AI-provider payloads.

## First coherent journey

The initial walking skeleton should be intentionally small:

1. an operator creates a synthetic diagnostic assignment;
2. one candidate signs in and sees the assignment;
3. the candidate completes a short synthetic section with durable autosave;
4. submission freezes that attempt;
5. the authorized teacher sees completion and a clearly labeled synthetic
   result;
6. the candidate sees the next course action.

This proves identity, assignment, timing, recovery, immutable submission,
result ownership and course navigation before protected content is introduced.
