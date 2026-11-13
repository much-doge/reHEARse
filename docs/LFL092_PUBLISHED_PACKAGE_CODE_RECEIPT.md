# LFL-092 — Teacher code creation for published packages

Status: deployed

The teacher catalogue now exposes published diagnostic packages before they
have assignments. The invite, staff-tag, and published-resource status mutation
boundaries now accept that same published diagnostic-package discovery rule.
This fixes code creation for a newly uploaded/published package with zero
assignments, rather than showing a package that cannot be used.

Hidden resources, drafts, learner access, assignments, attempts, answers, and
results are unchanged. No migration or database data rewrite was required.

Verification: focused resource adapter tests (9 passed), ESLint, TypeScript,
and `git diff --check` passed. Deployed in PCT128 app image
`rehearse-app:3732bca`; app and public health endpoint are healthy
(`health.v1`, HTTP 200).
