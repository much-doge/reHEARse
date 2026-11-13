# LFL-078 — Diagnostic package catalogue

## Purpose

Practice Test A had become an implicit package contract: several candidate
routes, resource links, and sign-in return paths each repeated its slug. That
made a future package easy to wire incorrectly and made an unready package look
candidate-routable.

## Change

`apps/protefl-center/src/application/diagnostic-package.ts` is now the explicit
catalogue boundary. A descriptor records the package code, content directory,
candidate route, supported sections, and expected question counts. Candidate
pages and attempt APIs accept a package only when the catalogue contains it;
resource cards build their diagnostic link from the resource code, and safe
authentication return paths accept the generic diagnostic slug shape.

Practice Test A is the only registered descriptor in this change. Practice Test
B is deliberately not registered: the repository currently contains its
Listening package only, not a complete Structure and Reading diagnostic. This
prevents a partial package from being presented as a full candidate test.

## Registration contract for a future package

Before adding a descriptor, the package must have its own versioned structured
content, directions, A–D options, answer key, timing/media maps, score contract,
and package receipt. Then add the descriptor and tests for section support and
question counts, pass the full package bootstrap gates, and only then publish
the resource.

## Verification state

Source-complete for this catalogue boundary. Changed-path ESLint, TypeScript,
focused package-catalogue/auth tests, and `git diff --check` passed. Runtime
loader metadata, generic asset tracing, deployment, and authenticated browser
verification remain later milestones.
