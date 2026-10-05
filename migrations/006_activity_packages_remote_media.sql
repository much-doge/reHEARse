ALTER TABLE activity_version
  ADD COLUMN media_provider text NOT NULL DEFAULT 'bundled'
    CHECK (media_provider IN ('bundled', 'local', 's3')),
  ADD COLUMN media_content_type text,
  ADD COLUMN media_size_bytes bigint CHECK (media_size_bytes IS NULL OR media_size_bytes > 0),
  ADD COLUMN media_sha256 char(64)
    CHECK (media_sha256 IS NULL OR media_sha256 ~ '^[0-9a-f]{64}$'),
  ADD COLUMN transcript_segments jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(transcript_segments) = 'array'),
  ADD COLUMN question_set jsonb NOT NULL DEFAULT '[]'::jsonb
    CHECK (jsonb_typeof(question_set) = 'array'),
  ADD COLUMN import_manifest jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(import_manifest) = 'object');

UPDATE activity_version
SET media_content_type = 'audio/mpeg',
    media_sha256 = NULLIF(source_metadata->>'sha256', '')
WHERE media_storage_key IS NOT NULL;

ALTER TABLE listening_feedback
  ADD COLUMN provider_response_id text,
  ADD COLUMN usage_json jsonb NOT NULL DEFAULT '{}'::jsonb
    CHECK (jsonb_typeof(usage_json) = 'object');
