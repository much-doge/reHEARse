# LFL-076 Teacher rendered question review receipt

## Outcome

Teacher question analytics now behave like an inspectable quiz response view rather than a numbers-only table. A populated question number opens an in-place rendered review card with:

- the structured question prompt and A–D options;
- cohort answer percentages and response counts for A, B, C, and D;
- omitted count and percentage of attempts;
- correct/wrong totals for that question;
- the package's correct option highlighted in the teacher-only rendered view.

Listening questions reuse the existing teacher-authorized question route and audio source, with separate context and question controls for conversations/talks. Reading questions include the matching preserved passage and line references. Structure completion and error-identification prompts use the same editable package rendering as individual answer review.

The analytics response now carries a representative authorized attempt context per question solely so the existing teacher question/audio boundary can render the item. No raw result payload, answer history, or answer key is exposed to learner routes.

## Verification

- Changed-path ESLint: passed
- Repository TypeScript: passed
- Vitest: 53 files / 195 tests passed
- Next production build: passed
- `git diff --check`: passed
- Deployment: PCT128 app-only image `rehearse-app:7b15baf`
- Image digest: `sha256:6ff99fe3db6f3b4b17fc464c160a26c1ac86e681554c3676e428ead295bb6aed`
- Runtime: healthy, zero restarts after replacement
- Delta archive from deployed `ccee4c7`: SHA256 `01f769ef3786cba4e94139019b92371702764863e660e49f27f5a4efee019bff`
- Public health: HTTP 200 (`https://rehearse.najala.org/api/health`)
- Signed-out teacher page: HTTP 307 (`/test-center/teaching`)
- Unauthenticated teaching API: HTTP 401 (`/api/test-center/teaching`)
- Unauthenticated question API: rejected before authentication (`403` origin guard)

Authenticated teacher visual walkthrough remains operator-side follow-up; source, tests, build, container, and access-boundary checks are complete.

## Rollback

Redeploy the prior app-only image `rehearse-app:ccee4c7` from its isolated release tree. No migration or learner-data rollback is required.

