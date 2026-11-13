# LFL-081 — Package-driven teacher analytics counts

## Problem

Teacher question analytics constructed every section as Listening 50,
Structure 40, and Reading 50. That happens to describe Practice Test A but it is
not a reusable package boundary and could silently create rows that do not exist
in a future package.

## Change

The analytics aggregator now resolves the registered package descriptor and
uses its section counts for empty rows, validation, and summary dimensions. The
teacher resource adapter resolves the package code from the authorized resource
before aggregating a filtered cohort, including the empty-cohort case.

The response shape remains compatible for the current package, so existing
teacher rendering and stored result payloads are unchanged.

## Safety boundary

Unknown or unregistered resource package codes fail closed rather than falling
back to Practice Test A dimensions. This is read-only analytics code; no
attempts, answers, results, or score calculations are changed.

## Verification state

Source-complete. Changed-path ESLint, TypeScript, focused analytics/package
tests, and `git diff --check` passed. Deployment and authenticated teacher
analytics review remain pending.
