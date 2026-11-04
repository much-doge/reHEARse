# ProTEFL companion delivery plan

Status: planning under `LFL-027`

## Slice 0 — Boundary and decisions (current)

- establish the subproject, product charter and assessment isolation;
- keep protected sources and learner data outside Git;
- choose the first coherent user journey;
- record unresolved product and operational gates.

Exit: the boundary is committed and no runtime or deployment is claimed.

## Slice 1 — Synthetic walking skeleton

- separate application package under `apps/protefl-center/`;
- candidate, teacher and operator roles with deny-by-default ownership;
- one synthetic timed section with durable autosave and honest reconnect state;
- immutable submission and versioned synthetic scoring rule;
- candidate next-action page and teacher completion view;
- local checks and a production-shaped container path.

Exit: the synthetic end-to-end journey passes without any ConTEFL source,
answer key or real candidate data.

## Slice 2 — Full diagnostic source preparation

- record source-use authorization and private source receipt;
- inventory sections, audio, items, answer key and scoring references;
- preserve original order/content and record every adaptation;
- implement full-test timing, break, interruption, resume and invalidation
  policies;
- complete independent content/key review before publication.

Exit: one immutable diagnostic form is source-complete. This is not yet a
validated placement instrument or deployed test.

## Slice 3 — Supervised diagnostic pilot

- test browser/audio compatibility and accessibility accommodations;
- rehearse device failure, reconnect, late start and operator correction;
- verify private results and role-scoped exports;
- run a supervised non-production/proctor journey;
- document what the score can and cannot support.

Exit: named artifact and test form are proctor-verified. Course use still needs
owner approval.

## Later slices

- cohort schedule and asynchronous activity assignments;
- simple Zoom links and reminders;
- candidate-facing result discussion and teacher notes;
- isolated public promotion/enrolment pages;
- integrations only after repeated manual work demonstrates their value.

## Decisions required before implementation

These are intentionally open; we can answer them as work reaches each gate.

1. **Identity:** invitation link, local account, or an existing identity
   provider? Start with the least data and least support burden.
2. **Test conditions:** at home, supervised Zoom, or classroom; fixed start or
   flexible window; allowed devices and headphones.
3. **Interruption:** whether the clock continues, when resume is allowed, and
   who may invalidate or reopen an attempt.
4. **Results:** raw correct counts, converted section/total scores, placement
   bands, or teacher-only interpretation; every conversion needs provenance.
5. **Review:** whether candidates may see items, answers, explanations or only
   a result discussion after exposure-sensitive tests.
6. **Retention:** how long identities, responses, results and operational logs
   remain, and how deletion/export requests work.
7. **Source authorization:** what the ConTEFL archive license/ownership permits
   for digitization, delivery, copying, review and storage.
8. **Course operations:** cohort size, teacher roles, assignment cadence and
   whether Zoom links are per cohort or per meeting.
9. **Deployment:** separate host/origin, database, backups and rollback. Sharing
   the current production database is not the default.

## Not now

- no shared reHEARse database or hidden cross-product profile;
- no AI scoring or AI-authored answer keys;
- no proctoring surveillance, webcam recording or browser lockdown;
- no Zoom API integration when a controlled meeting link suffices;
- no payment system, CRM, message broker or microservices;
- no claim that a diagnostic predicts an official TOEFL ITP score until the
  interpretation has defensible evidence.
