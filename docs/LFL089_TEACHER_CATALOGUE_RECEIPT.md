# LFL-089 — Published diagnostic visibility in the teacher catalogue

Status: deployed

## Finding

The Volume 1 Practice Test A resource was published in production, but it was
not visible to the teacher workspace before any assignment existed. The
teacher catalogue query only returned resources created by that teacher or
resources already connected to one of that teacher's assignments/invites.
That made a newly published package impossible to discover and assign from the
teacher UI.

## Change

Teacher catalogue reads now include resources that are both:

- `status = 'published'`; and
- `kind = 'diagnostic_package'`.

Hidden resources, unpublished drafts, learner DTOs, assignments, attempts,
answers, and results are unchanged. The change is read-side visibility only;
the existing teacher ownership checks for mutations remain in force.

## Verification

- Focused resource adapter tests: 8 passed.
- ESLint, TypeScript, and `git diff --check` passed.
- Release commit: `b1996fe`.
- Deployed image: `rehearse-app:b1996fe` on PCT 128.
- App container became healthy after recreation; Postgres was not recreated.
- Public health endpoint returned HTTP 200 with `health.v1` after rollout.
- Production database contains both published diagnostic packages, including
  `ets-volume1-practice-test-a`; no assignments or attempts were modified by
  this change.

## Rollback

Redeploy the previous app image `rehearse-app:891b8f9`. No migration or data
rollback is required.
