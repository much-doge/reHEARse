# LFL-080 — Diagnostic asset tracing boundary

## Purpose

The adapter now resolves package files dynamically from registered descriptors.
Next's default tracer therefore warned that the entire project could be pulled
into the server image, including private source archives. The tracing boundary
must stay explicit.

## Change

`next.config.ts` derives the include list from every registered descriptor's
manifest, structured metadata, and learner/teacher audio file. It derives the
exclude list from the same descriptor's private source files. Adding a package
descriptor automatically updates both lists without copying a new Practice
Test A path into configuration.

The adapter marks its descriptor-resolved `readFile`/`join` calls with the
Next/Turbopack ignore annotation. The explicit tracing lists remain the source
of truth for files that belong in the standalone image; the annotation prevents
the dynamic path from causing whole-project tracing.

## Safety boundary

Only files named by a registered descriptor are candidate-routable and traced.
The ETS PDF and layout text remain excluded from both candidate and API routes.
This change is configuration/code only and does not alter attempts, results,
source archives, or database records.

## Verification state

Source-complete. Changed-path ESLint, TypeScript, package-catalogue tests, Next
production build, no-warning scan for dynamic filesystem tracing, and
`git diff --check` passed. Deployment and installed-image inspection remain
pending.
