-- V4 grants the complete contextual deck and moves future claims/resumes to
-- the one-role practice queue. Earlier attempt rows and response events remain.
UPDATE vocabulary_deck
SET contract_version = 'toefl-vocabulary-package.v4', version = 4
WHERE id = 'toefl-itp-full-frequency' AND state = 'published' AND version = 3;

UPDATE vocabulary_invite
SET package_version = 4
WHERE deck_id = 'toefl-itp-full-frequency' AND revoked_at IS NULL AND package_version < 4;

UPDATE vocabulary_assignment
SET package_version = 4
WHERE deck_id = 'toefl-itp-full-frequency' AND revoked_at IS NULL AND package_version < 4;

CREATE TABLE vocabulary_practice_queue (
  assignment_id uuid PRIMARY KEY REFERENCES vocabulary_assignment(id) ON DELETE RESTRICT,
  package_version integer NOT NULL CHECK (package_version = 4),
  lineage_id uuid NOT NULL DEFAULT gen_random_uuid(),
  seed char(64) NOT NULL,
  unseen_order jsonb NOT NULL CHECK (jsonb_typeof(unseen_order) = 'array'),
  pending_retries jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(pending_retries) = 'array'),
  recent_headwords text[] NOT NULL DEFAULT '{}',
  headword_sequence integer NOT NULL DEFAULT 0 CHECK (headword_sequence >= 0),
  exposure_sequence integer NOT NULL DEFAULT 0 CHECK (exposure_sequence >= 0),
  unseen_since_revisit integer NOT NULL DEFAULT 0 CHECK (unseen_since_revisit >= 0),
  batch_exposure_count integer NOT NULL DEFAULT 0 CHECK (batch_exposure_count BETWEEN 0 AND 12),
  current_exposure_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Immutable lineage creation metadata; mutable queue state below is only the
-- current projection. Lifecycle changes are recorded in the append-only log.
CREATE TABLE vocabulary_queue_lineage (
  id uuid PRIMARY KEY,
  assignment_id uuid NOT NULL REFERENCES vocabulary_assignment(id) ON DELETE RESTRICT,
  generation integer NOT NULL CHECK (generation > 0),
  package_version integer NOT NULL CHECK (package_version = 4),
  seed char(64) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, generation),
  UNIQUE (id, assignment_id)
);
ALTER TABLE vocabulary_practice_queue
  ADD CONSTRAINT vocabulary_practice_queue_lineage_assignment_fk
  FOREIGN KEY (lineage_id, assignment_id) REFERENCES vocabulary_queue_lineage(id, assignment_id) ON DELETE RESTRICT;

CREATE TABLE vocabulary_practice_event (
  id bigserial PRIMARY KEY,
  assignment_id uuid NOT NULL REFERENCES vocabulary_assignment(id) ON DELETE RESTRICT,
  lineage_id uuid NOT NULL,
  attempt_id uuid REFERENCES vocabulary_attempt(id) ON DELETE RESTRICT,
  exposure_id uuid NOT NULL,
  queue_sequence integer NOT NULL CHECK (queue_sequence > 0),
  card_id text NOT NULL,
  headword text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('presented', 'answered', 'skipped')),
  exposure_kind text CHECK (exposure_kind IN ('new', 'review', 'requeue')),
  selected_part text CHECK (selected_part IN ('Noun', 'Verb', 'Adjective', 'Adverb')),
  is_correct boolean,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (event_type = 'presented' AND exposure_kind IS NOT NULL AND selected_part IS NULL AND is_correct IS NULL)
    OR (event_type = 'answered' AND exposure_kind IS NULL AND selected_part IS NOT NULL AND is_correct IS NOT NULL)
    OR (event_type = 'skipped' AND exposure_kind IS NULL AND selected_part IS NULL AND is_correct IS NULL)
  )
);
ALTER TABLE vocabulary_practice_event
  ADD CONSTRAINT vocabulary_practice_event_lineage_assignment_fk
  FOREIGN KEY (lineage_id, assignment_id) REFERENCES vocabulary_queue_lineage(id, assignment_id) ON DELETE RESTRICT;

CREATE UNIQUE INDEX vocabulary_practice_one_presentation_idx
  ON vocabulary_practice_event (exposure_id)
  WHERE event_type = 'presented';
CREATE UNIQUE INDEX vocabulary_practice_one_resolution_idx
  ON vocabulary_practice_event (exposure_id)
  WHERE event_type IN ('answered', 'skipped');
CREATE INDEX vocabulary_practice_assignment_history_idx
  ON vocabulary_practice_event (assignment_id, lineage_id, queue_sequence, id);
CREATE INDEX vocabulary_practice_daily_idx
  ON vocabulary_practice_event (assignment_id, event_type, created_at DESC);

-- Rebuildable spaced-review projection. Every change is derived from the
-- append-only practice events, with short requeues kept in the queue projection.
CREATE TABLE vocabulary_item_schedule (
  assignment_id uuid NOT NULL REFERENCES vocabulary_assignment(id) ON DELETE RESTRICT,
  lineage_id uuid NOT NULL REFERENCES vocabulary_queue_lineage(id) ON DELETE RESTRICT,
  card_id text NOT NULL,
  first_seen_at timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL,
  exposure_count integer NOT NULL CHECK (exposure_count >= 0),
  next_due_at timestamptz NOT NULL,
  PRIMARY KEY (assignment_id, lineage_id, card_id)
);
ALTER TABLE vocabulary_item_schedule
  ADD CONSTRAINT vocabulary_item_schedule_lineage_assignment_fk
  FOREIGN KEY (lineage_id, assignment_id) REFERENCES vocabulary_queue_lineage(id, assignment_id) ON DELETE RESTRICT;
CREATE INDEX vocabulary_item_schedule_due_idx
  ON vocabulary_item_schedule (assignment_id, lineage_id, next_due_at, last_seen_at);

CREATE TABLE vocabulary_queue_lineage_event (
  id bigserial PRIMARY KEY,
  assignment_id uuid NOT NULL REFERENCES vocabulary_assignment(id) ON DELETE RESTRICT,
  lineage_id uuid NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('lineage_created', 'legacy_attempt_archived', 'teacher_reset')),
  attempt_id uuid REFERENCES vocabulary_attempt(id) ON DELETE RESTRICT,
  actor_id uuid REFERENCES app_user(id) ON DELETE RESTRICT,
  related_lineage_id uuid,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE vocabulary_queue_lineage_event
  ADD CONSTRAINT vocabulary_queue_event_lineage_assignment_fk
  FOREIGN KEY (lineage_id, assignment_id) REFERENCES vocabulary_queue_lineage(id, assignment_id) ON DELETE RESTRICT,
  ADD CONSTRAINT vocabulary_queue_event_related_lineage_fk
  FOREIGN KEY (related_lineage_id) REFERENCES vocabulary_queue_lineage(id) ON DELETE RESTRICT;

CREATE INDEX vocabulary_queue_lineage_history_idx
  ON vocabulary_queue_lineage_event (assignment_id, id);

COMMENT ON TABLE vocabulary_practice_event IS
  'Append-only vocabulary-only exposure, first-choice, and skip evidence for v4. It never enters listening diagnostics, learner profiles, or formal test records.';
COMMENT ON TABLE vocabulary_queue_lineage_event IS
  'Append-only system transition and teacher reset evidence for full-deck vocabulary scheduling lineages.';
COMMENT ON TABLE vocabulary_item_schedule IS
  'Rebuildable per-assignment, per-lineage projection of spaced review due dates, derived from append-only presentation/response history.';
