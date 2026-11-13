# LFL-094 vocabulary contextual POS audit

Status: source-complete pending deployment

## Scope

The complete contextual deck was audited as card data, not as a generic word-list
classification. For each of the 2,948 exposures, the audit checks the single
contextual role, the exact highlighted headword, the UTF-16 highlight offsets,
the sentence boundary, and duplicate contextual identities. A contextual review
of parser disagreements and source-labelled examples found two authored
sentences whose highlighted usage did not match the stored role.

## Corrections

- `combat` remains a noun exposure, but now uses “The army prepared for combat
  near the border.” instead of a verb construction after `to`.
- The source-labelled noun `condense` was replaced by the contemporary noun
  `condensation`, using “Condensation formed on the cold glass of the
  greenhouse.” The previous sentence used `condense` as a verb.

The corrected package is `toefl-vocabulary-package.v5`. The v4 package and all
existing v4 invitations, assignments, attempts, and events remain immutable.
Only new vocabulary codes issued after migration 043 use v5. No learner history
was rewritten.

## Context note

The learner and teacher vocabulary views now state:

> Labels describe the highlighted word in this sentence. A word may take another
> class in a different construction, and some familiar adverb forms can function
> adjectivally in context. Use the sentence as the deciding evidence.

Teacher history now labels the recorded response as “Learner choice” and the
package label as “Expected role in this context,” so a wrong learner selection
cannot be mistaken for the card’s contextual answer.

## Verification

- `python3 scripts/build-toefl-vocabulary-v5.py`
- `python3 scripts/audit-toefl-vocabulary-pos.py`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test` (54 files, 209 tests)
- `corepack pnpm build`
- `git diff --check`

Deployment evidence and migration status will be appended after the release is
built and the PCT128 health/migration gates pass.
