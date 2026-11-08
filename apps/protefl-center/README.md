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
- an owner-only ignored location for private source material;
- a versioned resource catalogue, one-use candidate access codes, assigned-only learner listing, and teacher/admin visibility controls;
- the supervised Listening pilot gated by assignment checks at page, API, attempt and media boundaries.

The resource workflow does not yet upload or compose a full diagnostic package.
Real Structure and Reading content, answer keys, scoring provenance, and a
published full-test journey remain separate gated work. The local implementation
does not imply that production migrations have been applied or that a classroom
journey has been verified.

## Proposed source layout

```text
apps/protefl-center/
  docs/                 Product, source and delivery decisions
  src/                  Application code, when the walking skeleton begins
  tests/                Synthetic contract and journey tests
  private/              Ignored owner-only source workspace
```

The Test Center currently shares the repository build and authenticated session
adapter while keeping assessment records and content in its own persistence
boundary. Future full-package work must preserve the separate product and
runtime boundary recorded in D-027.

## Before real diagnostic content

The owner and implementer must resolve the gates in
[`docs/DELIVERY_PLAN.md`](docs/DELIVERY_PLAN.md). In particular: source-use
authorization, the exact test form, timing and interruption policy, result
interpretation, accommodation policy, retention/deletion, and who may view or
export results. Until then, use synthetic questions only.
