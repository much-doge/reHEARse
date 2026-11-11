# LFL-062 teacher sorting receipt

Status: source-complete pending deployment

The teacher workspace now exposes sorting for every practical list field it
already renders: activities by newest, title, status, assignment count, or
teacher-only tags; candidates by name, email, latest activity, status, current
score, answered-question count, or section-retake count. Sorting is local to
the teacher view and does not alter learner payloads or expose teacher tags.

Verification: changed-path ESLint, repository TypeScript, Next production
build, and `git diff --check` passed locally. Deployment and authenticated
teacher/browser review remain pending.
