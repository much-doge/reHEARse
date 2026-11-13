# LFL-077 — Assignment-scope start/resume repair

## Problem

Section-only assignments (`listening`, `structure`, or `reading`) can encounter
historical attempt rows whose pinned `delivery_scope` is `full`. Those rows were
created before additive assignment identity and section delivery were fully
deployed. The old rows are valid evidence, but they must not block or impersonate
a new section assignment.

## Change

- Start/resume now reuses an attempt only when its pinned delivery scope matches
  the exact assignment scope.
- A mismatched active or latest root attempt returns an explicit conflict state
  instead of the generic resource-unavailable response.
- Migration 041 adds a database trigger for new inserts and scope metadata
  updates. It does not rewrite, archive, or delete historical attempts/events.
- Learner-facing error text tells the learner to request a fresh code while
  preserving the old attempt in history.

## Safety boundary

Historical mismatches remain untouched. The migration is additive and should be
applied after migrations 024 and 038. Before deployment, take the usual mode-0600
database backup and inspect mismatched rows read-only. Do not backfill them by
rewriting `delivery_scope`; if a learner must continue, issue a fresh assignment
code and keep the old lineage available to staff.

## Verification state

Source-complete only until the repository checks, migration dry-run, deployed
database backup, and authenticated section-assignment journey are recorded in the
ledger.
