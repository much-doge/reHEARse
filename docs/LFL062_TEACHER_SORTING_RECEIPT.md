# LFL-062 teacher sorting receipt

Status: deployed to PCT128; authenticated browser review pending

The teacher workspace now exposes sorting for every practical list field it
already renders: activities by newest, title, status, assignment count, or
teacher-only tags; candidates by name, email, latest activity, status, current
score, answered-question count, or section-retake count. Sorting is local to
the teacher view and does not alter learner payloads or expose teacher tags.

Verification: changed-path ESLint, repository TypeScript, Next production
build, and `git diff --check` passed locally. App image `rehearse-app:fe5c590`
is healthy on PCT128 and LAN/public health returned HTTP 200. Authenticated
teacher/browser review remains pending.
