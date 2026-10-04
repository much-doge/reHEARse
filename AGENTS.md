# Repository instructions

These instructions apply to the entire repository.

Read this file, `docs/PROJECT_CONTROL.md`, and the active work item before
editing. Keep the application runnable after every milestone and preserve
unrelated work. Record durable product and architecture decisions in the
repository, not only in chat or commit messages.

## Product constitution

This is a listening-learning environment, not an assessment platform.

1. **Build listening before testing it.** The core loop is listen, externalize
   understanding, receive diagnostic guidance, relisten with a purpose, revise,
   and notice what changed.
2. **No-score learning invariant.** Instructional activities must not calculate
   or display scores, percentages, grades, bands, mastery values, ranks,
   traffic-light proficiency, or aggregate correctness. Numerical points are
   permitted only inside an explicitly recreational game capability, isolated
   from learner diagnostics and history.
3. **Do not pretend to read minds.** Notes and reconstructions are evidence of
   understanding, not understanding itself. Feedback must distinguish captured
   meaning, contradiction, uncertainty, and insufficient evidence.
4. **Guide the next listen.** Just-in-time feedback gives one bounded attention
   target without revealing locked answers or the full transcript.
5. **Bilingual by contract.** Learner feedback and critical UI guidance have
   paired English and Indonesian fields. Translation is not an optional display
   afterthought.
6. **Preserve attempts.** Notes, reconstructions, transcript versions, activity
   versions, teacher guides, and feedback remain immutable evidence. A retry
   creates a new attempt; it does not overwrite an earlier one.
7. **Teacher authority remains visible.** AI output is advisory and bounded by
   the selected transcript and teacher guide. It cannot publish an activity,
   alter source material, infer proficiency, or make a formal judgment.
8. **Private by default.** Minimize personal data and provider payloads. Never
   log transcripts, learner notes, reconstructions, prompts, credentials, raw
   provider output, or session tokens.

## Rhizomatic modularity

Use ports and adapters. Domain code must not know Next.js, React, PostgreSQL,
Docker, OpenAI, Google, or a particular file store. Authentication, persistence,
feedback providers, media storage, realtime classroom control, exports, and
game scoring attach through narrow typed ports.

New branches should be additive. A future Google identity adapter, local model,
teacher-led playback channel, paper-note image extractor, or game activity must
not require surgery on the individual listening loop.

Do not mistake modularity for a mandate to prebuild abstractions. Add a port
when the current vertical slice needs one and keep the interface as narrow as
the use case.

## Engineering rules

- Build the smallest coherent end-to-end slice before broad infrastructure.
- Separate public DTOs from persistence rows and provider payloads.
- Version every external, stored, prompt, and AI-output contract.
- Use append-only evidence and additive migrations by default.
- Deny access by default and check ownership/role at server boundaries.
- External AI is optional: provider failure must preserve the attempt and expose
  an honest retry state.
- Validate all provider output on the server. Never render raw model output.
- A transcript or teacher guide may leave the host only through the configured
  feedback provider adapter and only for the current attempt.
- Never invent a metric because it makes a dashboard prettier.
- Do not add Redis, a message broker, microservices, Kubernetes, or a separate
  API service without a measured need and a recorded decision.
- Keep source-complete, container-verified, deployed, and classroom-verified
  states distinct.

## Workflow and commits

1. Claim or create a Work ID in `docs/CHANGE_LEDGER.md` before implementation.
2. Read the linked decisions and acceptance criteria.
3. Update contracts, tests, docs, and both sides of a boundary together.
4. Run `pnpm check` plus relevant container and journey tests.
5. Record exact verification and known gaps in the ledger.
6. Commit coherent work with `type(scope): outcome`; non-trivial commits include
   a body naming the Work ID, invariant changes, security/privacy effects,
   rollback, and tests actually run.

Never claim deployed or live classroom verification from local tests.


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
