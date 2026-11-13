# LFL-093 — Inline answer-key reveal control

Status: deployed

The answer-key/correctness toggle now lives inside each opened rendered
question item, alongside its Close control. Each Listening, Structure, and
Reading question keeps its own hidden-by-default state, so a teacher can reveal
one item while explaining it without scrolling back to the analytics header or
changing other questions.

Verification: changed-path ESLint, TypeScript, and `git diff --check` passed;
the production Next build completed. Deployed in PCT128 app image
`rehearse-app:e344174`; the app container is healthy and the public health
endpoint returned HTTP 200 with `health.v1`. No migration or learner-data write
was performed.
