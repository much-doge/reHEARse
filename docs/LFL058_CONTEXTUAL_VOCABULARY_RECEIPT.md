# LFL-058 contextual vocabulary queue

Status: source-complete; production deployment is recorded separately.

## Outcome

The vocabulary activity now grants the complete reviewed deck while presenting
one contextual headword-role exposure at a time. Twelve resolved non-requeue
encounters form the default daily target and batch size; they do not limit the
assignment. Learners can continue into successive batches from the same
deterministic scheduling lineage.

Each exposure shows a complete sentence before the response, highlights the
headword, accepts one irreversible part-of-speech choice, and returns immediate
item feedback. A missed item returns after three to five different headwords;
a skipped item returns after two to four. Regular headword variants remain
separated, and due reviews are interleaved without starving unseen items.

The learner view has no fixed card navigator and never restores a previous
choice into a new exposure. It may show today's bounded target, practice-day
streak, and new/revisited activity counts, but it does not calculate or display
an accuracy percentage, mastery value, grade, rank, or proficiency judgment.

## Content package

- Immutable package: `toefl-vocabulary-package.v4`
- Contextual exposures: 2,948
- Normalized headwords: 2,823
- Roles: 1,441 nouns, 702 verbs, 599 adjectives, and 206 adverbs
- Source adjudications: 51 corrected labels and 18 excluded artifacts
- Merged duplicate provenance records: 4

Every published item contains one reviewed role, a complete contextual
sentence, a UTF-16-safe highlight span, and retained authoring provenance.
The learner DTO excludes source provenance and the target role before the first
choice. WordNet examples retain the existing attribution and license link.

## Evidence and reset model

Migration 036 adds an immutable queue-lineage record, append-only presentation
and resolution events, append-only lifecycle events, and rebuildable scheduling
projections. Existing v1-v3 attempts and events are not rewritten. Opening an
upgraded assignment archives an active legacy round with an explicit lineage
event before v4 begins.

A teacher reset archives all current-lineage batches, retains their events and
item-level review, records the reset and related lineage IDs, and starts a clean
deterministic queue. Activity counters are scoped to the current lineage.
Private and classroom access-code ownership rules are unchanged.

## Verification

- The v4 generator completed with exact segment coverage and all 69 invalid
  labels adjudicated.
- The generated package test checks 2,948 unique single-role items, complete
  examples, exact highlight spans, and rejected metadata frames.
- ESLint passed without findings.
- TypeScript passed.
- Vitest passed: 52 files and 194 tests.
- Next production build passed.
- Migration 036 applied successfully to an isolated clone after migrations
  033-035.
- A production-shaped local container journey passed: staff code creation,
  private learner claim, first presentation, wrong first choice, refresh
  recovery, automatic next exposure, missed-item return after four different
  headwords, 12-presentation completion, teacher item review, teacher lineage
  reset, clean post-reset counters, and answer-key exclusion from the
  pre-response learner payload.

Authenticated browser visual review and classroom use are not claimed by this
source-complete receipt.
