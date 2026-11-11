# LFL-066 PCT128 teacher cohort filter deployment

Date: 2026-11-11 (Asia/Jakarta)

Status: deployed to PCT128; authenticated teacher browser review remains
pending.

## Runtime release

The teacher participant filter/privacy controls are running at
`https://rehearse.najala.org/test-center/teaching` in app image
`rehearse-app:1d1043d`.

The PCT128 checkout was at `f75779f`. The app-only release applied the exact
two changed teacher-view files from the source-complete `1d1043d` commit. The
overlay archive SHA-256 was
`2093e7af1c8d22aab076fe8cc37a841e5a7e365f460a2aa9735ba89adbcb49bf`.
PostgreSQL was not recreated and no migration was required.

## Cohort grouping

The eleven matched assignments from the requested evening-class list now share
the assignment label `Evening Class · Listening Review`. This label is used by
the teacher-only Assignment group filter. It is stored on the existing
assignment rows; attempts, answer events, results, identities and access-code
claims were not rewritten.

The requested Ainnur Tiara Wulandari account was not present in the production
export, so no assignment or account was invented for it.

Before the label update, a mode-0600 custom-format backup was created at
`/opt/rehearse/.secrets/lfl066-pre-cohort-label.dump` and validated with
`pg_restore --list` inside the PostgreSQL container. The transaction selected
11 active target assignments and updated exactly 11 rows. Post-update counts
were 92 diagnostic attempts and 7,792 diagnostic events.

## Verification

- PCT128 app image build passed with the Next production build and TypeScript
  check inside the image.
- The app container is healthy with zero PostgreSQL recreation.
- Public `https://rehearse.najala.org/api/health` returned HTTP 200 and
  `{"status":"ok","contractVersion":"health.v1"}`.
- The unauthenticated teaching route returned HTTP 307.
- Authenticated teacher browser filtering and screen-share review remain an
  operator verification step.

Rollback is app-only to `rehearse-app:f75779f`. If the cohort label needs to be
reverted, restore the eleven prior assignment-title values from the validated
backup or an explicit operator-generated SQL transaction; do not restore the
whole database over newer learner activity.
