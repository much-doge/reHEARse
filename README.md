# reHEARse

A bilingual, no-score listening-learning environment for building the
foundations beneath TOEFL Listening Part B and Part C.

The first loop is:

`listen → jot/reconstruct → diagnostic guidance → relisten → revise → compare`

Start with [the product specification](docs/PRODUCT_SPEC.md), then read
[the delivery plan](docs/DELIVERY_PLAN.md) and [architecture](docs/ARCHITECTURE.md).

## Run the MVP

```sh
docker compose up --build
```

Open <http://localhost:3000>, create a local learner account, and use the
published sample activity. The Compose path runs PostgreSQL migrations before
seeding its local demo roles and starting the application.

### Local demo accounts

These credentials are intentionally known and only for the local Compose MVP:

| Role | Email | Password |
|---|---|---|
| Learner | `student@rehearse.local` | `ReHEARse-Learner-2026!` |
| Teacher | `teacher@rehearse.local` | `ReHEARse-Teacher-2026!` |
| Admin | `admin@rehearse.local` | `ReHEARse-Admin-2026!` |

Override every value through the `DEMO_*` environment variables before sharing
the stack. The seeder refuses to run unless `ALLOW_DEMO_SEED=true`; Compose sets
that flag only for its local demo service. Teacher authoring and administration
screens remain a planned slice, so those roles currently open a labeled preview
of the same activity dashboard.

Current state: the persistent learner loop is container-verified locally. Its
immediate feedback uses a clearly identified teacher-authored bilingual
attention guide by default. A bounded OpenAI Responses adapter is implemented
and enabled only when `FEEDBACK_PROVIDER=openai`, `OPENAI_API_KEY`, and
`OPENAI_MODEL` are configured. Nothing is externally deployed or
classroom-verified.

## Import activities and move audio off-host

Activity content uses the versioned `listening-activity-package.v1` JSON
contract. See [the import guide](docs/IMPORTING_ACTIVITIES.md) and the checked-in
example under `imports/examples/`.

Backblaze B2 is supported through its S3-compatible API. With
`MEDIA_STORAGE_PROVIDER=s3`, imports upload audio to a private bucket and the
authorized media route redirects learners to a short-lived signed B2 URL. The
application host therefore authorizes playback but does not relay the audio
bytes.
