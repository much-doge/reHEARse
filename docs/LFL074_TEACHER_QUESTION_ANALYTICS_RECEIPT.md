# LFL-074 Teacher question analytics receipt

## Outcome

The teacher Test Center cohort review now exposes question-level response analytics beneath the response summary. The analytics follow the active participant and assignment filters and use each visible learner's latest non-archived completed attempt.

Each expandable section lists every question number in its package range:

- Listening Comprehension: Q1–Q50;
- Structure and Written Expression: Q1–Q40;
- Reading Comprehension: Q1–Q50.

For each question the teacher can see:

- how many visible completed attempts included the question;
- correct responses;
- incorrect responses;
- omitted responses;
- selected-option distribution for A, B, C, and D.

Questions with no recorded response in the current filtered view remain visible as `—`, so the 50/40/50 structure is explicit rather than inferred from a shortened list. Existing cohort totals remain above the tables for a quick section-level view. Live, in-progress answers remain in the individual learner history and are not silently converted into completed-result statistics.

## Verification

- Changed-path ESLint: passed (`src/components/test-center/resources.tsx`)
- Repository TypeScript: passed (`node_modules/.bin/tsc --noEmit`)
- Vitest: 52 files / 194 tests passed
- Next production build: passed
- `git diff --check`: passed
- Deployment: PCT128 app-only image `rehearse-app:be6164d`
- Image digest: `sha256:ad06f1a860803148aeca0f9b0798d5f0a4a85ad0888bc924be45e671d36ff125`
- Runtime: healthy, zero restarts after replacement
- Delta archive from deployed `c394ed3`: SHA256 `1601b8a5b24efb52fa281c4fd7848b6e146d496d2ae7e8a718caa279c19625ef`
- Public health: HTTP 200 (`https://rehearse.najala.org/api/health`)
- Signed-out teacher page: HTTP 307 (`/test-center/teaching`)
- Unauthenticated teaching API: HTTP 401 (`/api/test-center/teaching`)

No migration or learner-data write was performed. Authenticated browser visual verification remains operator-side follow-up.

## Security and rollback

The tables are rendered only in the existing authenticated teacher/admin workspace from the existing teacher-scoped result payload. No learner route, learner DTO, or new API endpoint exposes the analytics. Roll back by redeploying the prior app-only image `rehearse-app:c394ed3` from its isolated release tree.

