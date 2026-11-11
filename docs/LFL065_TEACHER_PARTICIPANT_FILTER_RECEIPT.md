# LFL-065 - Teacher participant grouping and privacy view

Status: source-complete. Owner: integration lead.

## Change

The teacher workspace now provides local, teacher-only controls for the
candidate list:

- search by participant name, email, or assignment label;
- filter by the existing assignment title, which acts as the cohort/group
  label when issuing codes;
- keep all existing candidate sorting options; and
- hide participant names and email addresses in the visible list, replacing
  them with neutral participant numbers for screen sharing.

The assignment title is already persisted when a private or classroom code is
created, so no migration or new learner-facing field is needed. The filter and
privacy toggle are local view state. They do not alter assignments, attempts,
answer events, teacher tags, or learner DTOs.

## Verification and boundary

- Changed-path ESLint passed for `src/components/test-center/resources.tsx`.
- Repository TypeScript check passed.
- `git diff --check` passed.
- Authenticated teacher browser review remains pending; public and learner
  views were not changed.
- Rollback is the prior app image or removal of the two component changes; no
  database rollback is required.
