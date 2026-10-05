# Importing activities

## Contract

Every import is a `listening-activity-package.v1` JSON document. The required
spine is deliberately small:

- slug, title, and part label;
- paired English/Indonesian reconstruction prompt;
- transcript text and teacher guide;
- source provenance.

The same package can optionally carry timed or untimed transcript segments,
typed questions, options, teacher-only answers, rationales, tags, segment
links, fallback feedback, media checksum/duration, and JSON extension maps.

Question `kind` is a bounded string rather than a closed enum. A package can
therefore retain source forms such as `multiple_choice`, `main_idea`,
`ordering`, or a future custom type without weakening stable identity,
provenance, and prompt fields.

Validate the example without writing data:

```sh
pnpm activity:import -- \
  --manifest imports/examples/minimal.activity-package.json \
  --owner teacher@rehearse.local \
  --dry-run
```

## Import with Docker

Put private manifests and audio beneath `imports/private/`, which Git ignores.
Then run:

```sh
docker compose --profile tools run --rm import-activity \
  --manifest /imports/private/activity.json \
  --media /imports/private/audio.mp3 \
  --owner teacher@rehearse.local \
  --publish
```

Without `--publish`, a new activity stays draft. For an existing slug, the
import creates a new immutable version but leaves the currently published
version selected. With `--publish`, the imported version becomes current. A
published package must have uploaded media or reuse media from the current
version.

## Backblaze B2

Create a private bucket and a scoped application key. Backblaze's S3-compatible
API uses the application key ID as the access-key ID and the application key as
the secret. The master application key is not supported for this API.

Configure these values outside Git:

```dotenv
MEDIA_STORAGE_PROVIDER=s3
B2_REGION=us-west-004
B2_S3_ENDPOINT=https://s3.us-west-004.backblazeb2.com
B2_BUCKET_NAME=rehearse-private-media
B2_APPLICATION_KEY_ID=replace-me
B2_APPLICATION_KEY=replace-me
MEDIA_SIGNED_URL_TTL_SECONDS=600
MEDIA_MAX_UPLOAD_BYTES=262144000
```

The bucket remains private. Imports use a randomized
`activities/<slug>/...` object key with checksum metadata. On playback,
reHEARse verifies the signed-in user and published activity, then returns a
short-lived signed download redirect. Credentials and raw object keys are
never sent in learner DTOs.

Backblaze setup reference:
<https://www.backblaze.com/docs/cloud-storage-get-started-with-a-backblaze-integration>

## Live AI feedback

The template provider remains the offline default. Enable live review only with
an explicit configuration:

```dotenv
FEEDBACK_PROVIDER=openai
OPENAI_API_KEY=replace-me
OPENAI_MODEL=replace-with-an-approved-model
OPENAI_API_URL=https://api.openai.com/v1/responses
OPENAI_TIMEOUT_MS=60000
OPENAI_MAX_OUTPUT_TOKENS=1800
```

The adapter sends only the selected activity version, transcript, teacher
guide, current learner evidence, and previous reconstruction. Requests use
strict structured output and `store: false`. Returned data must pass the
bilingual `listening-feedback.v1` schema and the no-score invariant before it
is stored or rendered. Failure preserves the attempt, stores only a safe error
code and provider provenance, and does not silently substitute template
feedback.
