# LFL-090 — Teacher answer-key reveal mode

Status: deployed

Rendered cohort question review now starts in explanation mode. The single
teacher-only toggle applies to Listening, Structure, and Reading question
details:

- default off: answer-key styling/labels and correct-versus-wrong outcome are
  hidden;
- neutral A–D cohort response distribution and omitted count remain available
  for discussion;
- enabling the toggle reveals the key styling and the per-question
  correct/wrong outcome.

The change is client-side teacher view state only. Learner payloads, answer
records, results, and formal score calculation are unchanged.

Verification: changed-path ESLint, TypeScript, `git diff --check`, and Next
production build passed. Deployed in PCT128 app image `rehearse-app:3732bca`;
app and public health endpoint are healthy (`health.v1`, HTTP 200).
