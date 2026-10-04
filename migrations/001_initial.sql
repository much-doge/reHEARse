CREATE TABLE app_user (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  display_name text NOT NULL CHECK (char_length(display_name) BETWEEN 1 AND 80),
  password_hash text NOT NULL,
  role text NOT NULL DEFAULT 'learner' CHECK (role IN ('learner', 'teacher', 'admin')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX app_user_email_lower_unique ON app_user (lower(email));

CREATE TABLE app_session (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES app_user(id) ON DELETE CASCADE,
  token_hash char(64) NOT NULL UNIQUE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX app_session_user_idx ON app_session (user_id);
CREATE INDEX app_session_expiry_idx ON app_session (expires_at);

CREATE TABLE activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  owner_id uuid REFERENCES app_user(id) ON DELETE RESTRICT,
  state text NOT NULL DEFAULT 'draft' CHECK (state IN ('draft', 'published', 'archived')),
  current_version integer NOT NULL DEFAULT 1 CHECK (current_version > 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE activity_version (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activity(id) ON DELETE RESTRICT,
  version_number integer NOT NULL CHECK (version_number > 0),
  contract_version text NOT NULL DEFAULT 'listening-activity.v1',
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 180),
  part_label text NOT NULL CHECK (char_length(part_label) BETWEEN 1 AND 120),
  prompt_en text NOT NULL CHECK (char_length(prompt_en) BETWEEN 1 AND 1000),
  prompt_id text NOT NULL CHECK (char_length(prompt_id) BETWEEN 1 AND 1000),
  transcript text NOT NULL CHECK (char_length(transcript) BETWEEN 1 AND 50000),
  teacher_guide text NOT NULL CHECK (char_length(teacher_guide) BETWEEN 1 AND 12000),
  media_storage_key text,
  original_media_name text,
  playback_mode text NOT NULL DEFAULT 'self_paced' CHECK (playback_mode = 'self_paced'),
  feedback_template jsonb NOT NULL,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, version_number)
);

CREATE TABLE activity_identity (
  activity_id uuid NOT NULL REFERENCES activity(id) ON DELETE RESTRICT,
  learner_id uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  pseudonym text NOT NULL CHECK (char_length(pseudonym) BETWEEN 1 AND 40),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (activity_id, learner_id)
);

CREATE TABLE listening_attempt (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id uuid NOT NULL REFERENCES activity(id) ON DELETE RESTRICT,
  activity_version_id uuid NOT NULL REFERENCES activity_version(id) ON DELETE RESTRICT,
  learner_id uuid NOT NULL REFERENCES app_user(id) ON DELETE RESTRICT,
  attempt_number integer NOT NULL CHECK (attempt_number > 0),
  previous_attempt_id uuid REFERENCES listening_attempt(id) ON DELETE RESTRICT,
  notes text NOT NULL DEFAULT '' CHECK (char_length(notes) <= 12000),
  reconstruction text NOT NULL CHECK (char_length(reconstruction) BETWEEN 1 AND 12000),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (activity_id, learner_id, attempt_number)
);

CREATE INDEX listening_attempt_learner_idx
  ON listening_attempt (learner_id, created_at DESC);

CREATE TABLE listening_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL UNIQUE REFERENCES listening_attempt(id) ON DELETE RESTRICT,
  contract_version text NOT NULL,
  status text NOT NULL CHECK (status IN ('completed', 'failed')),
  provider text NOT NULL,
  model text,
  prompt_version text NOT NULL,
  result_json jsonb,
  safe_error_code text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (status = 'completed' AND result_json IS NOT NULL AND safe_error_code IS NULL)
    OR (status = 'failed' AND result_json IS NULL AND safe_error_code IS NOT NULL)
  )
);

WITH new_activity AS (
  INSERT INTO activity (slug, state, current_version)
  VALUES ('campus-radio', 'published', 1)
  RETURNING id
)
INSERT INTO activity_version (
  activity_id,
  version_number,
  title,
  part_label,
  prompt_en,
  prompt_id,
  transcript,
  teacher_guide,
  media_storage_key,
  playback_mode,
  feedback_template,
  published_at
)
SELECT
  id,
  1,
  'A change of plans',
  'Part B foundation · Campus conversation',
  'What do you think is happening, and what does each speaker decide to do?',
  'Menurutmu apa yang sedang terjadi, dan apa yang diputuskan oleh masing-masing pembicara?',
  'A student asks Professor Lee about Friday''s field trip because a chemistry lab was moved to the same afternoon. The museum requires the final list tomorrow, and another student asked to switch into the morning group. Professor Lee can exchange their places if the student can attend in the morning. The student asks whether to email the lab instructor. Professor Lee says to confirm the lab schedule first, then send a message before noon tomorrow.',
  'Main situation: an academic schedule conflict. Proposed solution: exchange morning and afternoon group places. Required sequence: confirm the lab schedule, then message Professor Lee. Deadline: before noon tomorrow. Do not evaluate spelling, grammar, note length, or English production.',
  '/demo/campus-radio.mp3',
  'self_paced',
  '{
    "contractVersion": "listening-feedback.v1",
    "summary": {
      "en": "You captured the scheduling problem and the possibility of changing groups. Your reconstruction does not yet show the order of the two actions the student must take.",
      "id": "Kamu menangkap masalah jadwal dan kemungkinan pindah kelompok. Rekonstruksimu belum menunjukkan urutan dua tindakan yang harus dilakukan mahasiswa itu."
    },
    "observations": [
      {
        "kind": "captured",
        "message": {
          "en": "The field trip conflicts with another academic commitment, and the morning group may solve it.",
          "id": "Kunjungan lapangan berbenturan dengan kegiatan akademik lain, dan kelompok pagi mungkin menjadi solusinya."
        }
      },
      {
        "kind": "unclear",
        "message": {
          "en": "Your notes mention an email, but they do not show who must be contacted first.",
          "id": "Catatanmu menyebut email, tetapi belum menunjukkan siapa yang harus dihubungi terlebih dahulu."
        }
      },
      {
        "kind": "insufficient_evidence",
        "message": {
          "en": "I cannot tell from this reconstruction whether you noticed the deadline.",
          "id": "Dari rekonstruksi ini, belum dapat diketahui apakah kamu menangkap batas waktunya."
        }
      }
    ],
    "nextListeningTarget": {
      "en": "Listen for the professor''s final instruction: what should happen first, and by when?",
      "id": "Dengarkan instruksi terakhir profesor: apa yang harus dilakukan lebih dulu, dan sebelum kapan?"
    }
  }'::jsonb,
  now()
FROM new_activity;
