-- Retire the synthetic browser-TTS prototype without rewriting applied history.
-- The row remains archived for provenance and cannot appear in learner listings.
UPDATE activity
SET state = 'archived'
WHERE slug = 'campus-radio';
