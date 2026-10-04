# Delivery plan

## Slice 0 — Design and walking skeleton (`LFL-001`)

- establish constitution, decisions, architecture, design language, reuse
  provenance, and ledger;
- scaffold the Node/Next/PostgreSQL Compose application;
- implement a framework-free feedback contract and no-score tests;
- render the visual prototype with realistic bilingual content.

Exit: repository checks pass and the interface can be reviewed in a browser.

## Slice 1 — Runnable individual loop (`LFL-002`)

- local registration/session flow;
- migration and seed tooling;
- learner dashboard and activity page;
- immutable attempts and history;
- demo feedback adapter;
- private media authorization;
- container journey test.

Exit: the acceptance journey in `PRODUCT_SPEC.md` passes with the demo adapter.

## Slice 2 — Teacher authoring and live AI (`LFL-003`)

- teacher-only draft, audio upload, transcript, teacher guide, and publish flow;
- OpenAI Responses adapter with structured output, `store: false`, timeouts,
  safe errors, and bounded retries;
- feedback retry without duplicate attempts;
- provider contract/evaluation fixtures.

Exit: one synthetic activity passes both demo and configured live-provider
paths; provider outage preserves attempts.

## Slice 3 — Classroom hardening (`LFL-004`)

- rate limits, upload scanning/limits, backup/restore, health/readiness;
- learner/teacher journey accessibility and mobile review;
- deployment runbook and a classroom pilot checklist.

Exit: named container artifact is recoverable and ready for a supervised pilot.

## Later rhizomes

- Google identity adapter;
- transcript reveal and excerpt alignment;
- teacher-led playback over a versioned realtime channel;
- paper-note image extraction with explicit consent/retention;
- public word cloud with moderation and pseudonym rules;
- practice mode and isolated game scoring;
- educator-reviewed semantic-map authoring assistance.

