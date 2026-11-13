# LFL-087 — Explicit package code at runtime boundaries

## Problem

The candidate page and package route already carried a package slug, but the
exported diagnostic loader/start functions still had a default Practice Test A
argument. A future caller could omit the slug and receive the wrong package
without an obvious error.

## Change

Diagnostic assignment lookup, directions/timing loading, and start/resume now
require an explicit package code. The route passes its validated slug directly;
the descriptor lookup fails closed for anything unregistered.

## Safety boundary

This is a function-signature/API guard. Existing attempt rows, assignment data,
and result semantics are unchanged. No fallback was removed from internal
legacy metadata helpers that need a compatibility value while deriving the
actual package from an authorized attempt/resource.

## Verification state

Source-complete. Changed-path ESLint, TypeScript, focused package/resource tests
(12 passed), and `git diff --check` passed. Deployment pending.
