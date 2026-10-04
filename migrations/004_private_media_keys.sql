UPDATE activity_version
SET media_storage_key = 'campus-radio.mp3'
WHERE activity_id = (SELECT id FROM activity WHERE slug = 'campus-radio')
  AND version_number = 1;

UPDATE activity_version
SET media_storage_key = 'contefl-1163-31-34.mp3'
WHERE activity_id = (SELECT id FROM activity WHERE slug = 'three-papers-one-thread')
  AND version_number = 1;
