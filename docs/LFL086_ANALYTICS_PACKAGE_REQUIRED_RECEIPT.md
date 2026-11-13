# LFL-086 — Explicit package identity for teacher analytics

## Problem

Even after deriving question counts from descriptors, the analytics function
still defaulted to Practice Test A when a caller omitted the package code. That
could make a future integration appear to work while analyzing it with the
wrong dimensions.

## Change

Teacher analytics aggregation now requires a package code. The resource adapter
already resolves that code from the authorized resource before handling both
empty and populated cohorts, and the descriptor lookup fails closed for unknown
codes.

## Safety boundary

This is a type/API guard only. It changes no result payloads, attempts, events,
or scores. Existing Practice Test A calls pass its explicit code in tests and
the resource adapter.

## Verification state

Source-complete. Changed-path ESLint, TypeScript, analytics/resource tests (9
passed), and `git diff --check` passed. Deployment pending.
