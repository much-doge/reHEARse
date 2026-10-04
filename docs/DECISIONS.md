# Decisions

## D-001 — Learning before assessment

Status: accepted

The first mode is a repeatable learning loop, not TOEFL simulation. Practice
conditions arrive later as a distinct capability.

## D-002 — No-score learning invariant

Status: accepted

Learning submissions and feedback contain no numerical performance fields.
Game points, if added, live in a separate capability and never feed learner
diagnostics or profiles.

## D-003 — Evidence, not mind reading

Status: accepted

The system describes what a learner's notes/reconstruction evidence,
contradict, or leave unknown. “Insufficient evidence” is a valid output.

## D-004 — Bilingual feedback is atomic

Status: accepted

English and Indonesian text are required together in the feedback contract and
stored in one version. A partial translation is an invalid provider result.

## D-005 — Modular monolith first

Status: accepted

Use one Next.js Node application, PostgreSQL, and private volume under Compose.
Maintain ports and adapters inside the repository. Split processes only after a
measured scaling, reliability, or security requirement.

## D-006 — Local identity first

Status: accepted

Deliver email/password accounts for the MVP. Google SSO is a future identity
adapter and must not alter learner ownership or attempt records.

## D-007 — PostgreSQL owns durable state

Status: accepted

Use append-only SQL migrations and transactions. Do not introduce a queue or
cache service in the first slice.

## D-008 — Provider-neutral structured feedback

Status: accepted

Use a narrow feedback-provider port and validate `listening-feedback.v1`.
Provide an explicitly labeled deterministic demo adapter and an optional OpenAI
Responses adapter. Provider output never writes directly to persistence.

## D-009 — Self-paced playback first

Status: accepted

Only self-paced playback is available in the MVP. Teacher-led synchronized
playback needs its own realtime contract, late-join behavior, clock-drift
policy, and classroom failure design before implementation.

## D-010 — Node and container baseline

Status: accepted

Use Node 24 LTS in production containers, Next.js 16 App Router, React 19,
TypeScript, PostgreSQL 18, pnpm, and multi-stage Docker builds. The host may use
another supported Node LTS for local checks.

