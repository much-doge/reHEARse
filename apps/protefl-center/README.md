# ProTEFL Course Companion and Test Center

Status: active companion boundary under `LFL-027`; assigned-resource access implemented under `LFL-032`

This directory is the boundary for a companion web application for the
small-class/semi-private ProTEFL TOEFL ITP preparation course. It can grow to
support the course hub, a full diagnostic/placement test, asynchronous course
activities, Zoom meeting links and public course information.

It remains in the reHEARse Git repository for now so changes can be reviewed,
versioned and operated together. It is not a feature folder inside the current
reHEARse runtime. Product rules, runtime state and deployment remain separate
under D-027.

## What exists now

- a product charter with users, boundaries and safety rules;
- a phased delivery plan with the first decisions we must make;
- an ignored private staging location for work in progress; owner-authorized
  LFL-035 source artifacts are tracked under `content/` by explicit owner
  instruction;
- a versioned resource catalogue, one-use candidate access codes, assigned-only learner listing, and teacher/admin visibility controls;
- the supervised Listening pilot gated by assignment checks at page, API, attempt and media boundaries.

LFL-035 is assembling a full ETS TOEFL ITP Level 1 Volume 3 Practice Test A
diagnostic. Its source book, audio, page-faithful question renders, answer key,
scoring tables, and provenance are committed under `content/` by explicit owner
instruction. The runtime still needs a protected delivery and attempt workflow;
source files in Git do not imply that content is published or accessible to
candidates.

## Proposed source layout

```text
apps/protefl-center/
  docs/                 Product, source and delivery decisions
  src/                  Application code, when the walking skeleton begins
  content/              Versioned, owner-authorized diagnostic package assets
  tests/                Synthetic contract and journey tests
  private/              Ignored staging for unreviewed source material
```

The Test Center currently shares the repository build and authenticated session
adapter while keeping assessment records and content in its own persistence
boundary. Future full-package work must preserve the separate product and
runtime boundary recorded in D-027.

## Diagnostic content and access boundary

The owner authorized this specific source form and requested its artifacts be
tracked in Git. Candidate access still requires a published Test Center
resource and a server-enforced assignment. Never serve the complete source PDF,
answer key, scoring data, or listening scripts to a candidate before submission.
The remaining policy and implementation gates are recorded in
[`docs/LFL035_FULL_DIAGNOSTIC.md`](docs/LFL035_FULL_DIAGNOSTIC.md).

Before creating or publishing another full test, follow
[`docs/FULL_TEST_BOOTSTRAP.md`](docs/FULL_TEST_BOOTSTRAP.md). Candidate tests
must use editable question/option/directions/passage data. Page screenshots,
crops, and page-text dumps may be private source-comparison material only; they
must never become the delivered question interface.
