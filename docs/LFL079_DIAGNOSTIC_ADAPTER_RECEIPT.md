# LFL-079 — Descriptor-backed diagnostic adapter

## Purpose

The package catalogue introduced in LFL-078 must govern the actual content
loader as well as the page URL. Previously the diagnostic adapter still opened
Practice Test A's directory and filenames directly, so a future descriptor could
not safely select its own questions, keys, timing map, audio, or result version.

## Change

The diagnostic adapter now resolves a registered package descriptor before
reading package files. It uses descriptor-owned paths for:

- manifest and pinned content/timing hashes;
- directions and structured question content;
- answer keys and score conversion;
- Listening pause/question maps and teacher/learner audio;
- question-count validation; and
- full, section-assignment, section-retake, and section-reset result-version
  identifiers.

Candidate page loading and start/resume pass the requested package code into the
adapter. Attempt and teacher-review paths derive the package code from the
authorized resource row or attempt, so old evidence remains pinned while a
future registered package can use its own content boundary.

## Safety boundary

This is a code-only refactor. It does not rewrite attempts, events, results, or
resource rows. Practice Test B remains unavailable to candidates because it is
not registered as a complete package; registering a partial Listening-only
directory would be unsafe.

## Verification state

Source-complete. Changed-path ESLint, TypeScript, focused package/delivery/auth
tests, and `git diff --check` passed. Generic asset tracing, deployment, and an
authenticated browser journey remain later gates.
