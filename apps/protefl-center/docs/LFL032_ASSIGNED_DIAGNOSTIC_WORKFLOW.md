# LFL-032 assigned resource and diagnostic workflow

Status: planning

## Goal

After signing in, a candidate sees a tidy course home containing only resources
explicitly assigned to that candidate (or to a future, explicitly scoped
cohort). Authentication alone never grants access to every published resource.
Teachers and administrators control publication and assignment; server-side
checks remain authoritative even when a candidate guesses a URL or resource ID.

The first composed resource is a new full diagnostic package for TOEFL ITP and
ProTEFL preparation. It belongs in this Test Center, not in reHEARse listening
history or practice diagnostics.

## Proposed candidate journey

1. A candidate signs in and lands on **My assigned resources**.
2. The page lists only resources assigned to that candidate and currently
   available. A clean empty state explains that the teacher will add materials
   when they are ready.
3. The candidate opens an assigned diagnostic and sees its instructions,
   sections, timing and recovery rules before starting.
4. Starting creates an immutable parent diagnostic attempt pinned to one
   package version and its section versions.
5. The candidate completes Listening, Structure and Reading in the published
   order. Refresh/reconnect returns the server-owned current state; it cannot
   restart a clock, change a package version or replace an accepted response.
6. Submission freezes the attempt. The candidate sees only the result and
   review material allowed by the package policy.

## Teacher and administrator controls

- Build and review a draft package without making it visible to candidates.
- Publish an immutable version, then assign it to selected candidates. Cohort
  assignment can be added when cohort ownership and membership rules are
  defined; it is not required for the first vertical slice.
- Set a release window and close new starts without deleting the package or
  its attempts.
- Hide/unpublish a resource to stop new starts. Existing in-progress attempts
  remain resumable unless an authorized teacher deliberately invalidates one;
  invalidation is recorded and never overwrites the attempt.
- Candidate lists, attempts, results and exports are limited to the teacher's
  explicitly assigned scope. Administrative access is separately authorized
  and auditable.

## Efficient reuse of the supervised Listening pilot

Create a new versioned parent diagnostic manifest; do not mutate or relabel the
existing `ptc-listening-2000-10-v2` form as a full test. Pin that exact approved
Listening version as the diagnostic's Listening section, then add independently
prepared Structure and Reading section packages. The parent manifest records
section order, version IDs, timing, break/recovery policy and result visibility.

Reuse the pilot's proven implementation patterns where they fit:

- authenticated actor handoff through the existing narrow route adapter;
- server-side ownership and same-origin mutation checks;
- server-authoritative clocks and section/item state transitions;
- idempotent action keys and durable recovery after refresh or disconnect;
- immutable submissions and append-only invalidation/correction evidence;
- private media authorization, checksum-checked media versions and safe logs.

Keep Listening's audio playback, grouped passages and response-window rules in
the existing Listening domain adapter. Add section-specific Structure and
Reading delivery behind a small diagnostic orchestration boundary rather than
copying the Listening repository or turning it into a generic question engine
before a second use case proves that abstraction. A parent attempt coordinates
the pinned sections; each section retains a versioned contract and its own
content rules.

## Access-control contract

- Model resource publication separately from candidate assignment.
- Learner catalogue queries return assigned, published, in-window resources
  only; never query all published forms for a candidate-facing page.
- Check the same assignment on resource detail, attempt start, resume, media,
  submission, result, review and export boundaries. Return a non-disclosing
  not-found response for unassigned resources.
- Recheck role and scope on every teacher/admin mutation. UI hiding is not an
  authorization check.
- Pin the assignment's package version when a candidate starts. Publishing a
  later package version cannot retarget an existing assignment or attempt.
- Keep candidate identities/results in the Test Center persistence boundary.
  The reHEARse adapter may provide only the authenticated actor identifier.
- Log safe IDs and state changes only; never log item content, answers,
  responses, credentials or raw provider output.

## Package and result boundaries

Use a new package contract for the composed diagnostic, with synthetic fixtures
in Git only. The package references immutable section versions and captures
source/answer-key provenance, review status, timing and disclosure rules. Real
Structure/Reading source files, answer keys and transcripts stay in the ignored
private workspace. The upload/publish flow validates a complete package before
it can be assigned.

Raw section counts and any TOEFL-scale conversion are different result fields.
Do not claim an official TOEFL score or placement band. A conversion or
placement interpretation requires its source, version, uncertainty statement,
independent review, retention rule and explicit publication gate before it is
implemented or shown to candidates.

## Implementation sequence

1. Define the new composed package contract with synthetic Listening,
   Structure and Reading fixtures; write the source and answer-key receipt
   template without importing protected item text.
2. Add additive persistence for immutable diagnostic package versions,
   publication state, explicit candidate assignments and parent attempts.
3. Build the teacher/admin draft, review, publish, assign and hide workflow.
4. Build the candidate assigned-resource home and enforce assignment checks
   across every read and write route.
5. Compose the pinned Listening v2 section with new Structure/Reading sections;
   retain each section's own timing and interaction rules.
6. Complete authorized content review, scoring provenance, retention and
   interruption policy before real candidate use or deployment.

## Gates before real diagnostic content is published

- owner/source authorization for the new Structure and Reading material;
- immutable package manifest, exact item order and answer-key lineage;
- independent item/key review and correction procedure;
- final section timing, breaks, interruption, resume and invalidation behavior;
- decision on raw counts versus any validated score conversion and how results
  are explained;
- answer/review visibility and candidate-data retention/deletion policy;
- role-scoped teacher access and a complete authenticated end-to-end journey.

No assessment runtime, new content or deployment is claimed by this planning
document.
