# ProTEFL Course Companion and Test Center

Status: planning under `LFL-027`

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
- an owner-only ignored location for future source material;
- no runtime app, real test content, candidate records or deployment claim.

## Proposed source layout

```text
apps/protefl-center/
  docs/                 Product, source and delivery decisions
  src/                  Application code, when the walking skeleton begins
  tests/                Synthetic contract and journey tests
  private/              Ignored owner-only source workspace
```

We will add a package manifest and application framework only in the walking
skeleton slice. That keeps this planning milestone reversible and avoids
changing the production reHEARse build before the first user journey is chosen.

## Before real diagnostic content

The owner and implementer must resolve the gates in
[`docs/DELIVERY_PLAN.md`](docs/DELIVERY_PLAN.md). In particular: source-use
authorization, the exact test form, timing and interruption policy, result
interpretation, accommodation policy, retention/deletion, and who may view or
export results. Until then, use synthetic questions only.
