ALTER TABLE activity_version
ADD COLUMN source_metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

WITH new_activity AS (
  INSERT INTO activity (slug, state, current_version)
  VALUES ('three-papers-one-thread', 'published', 1)
  ON CONFLICT (slug) DO UPDATE SET state = excluded.state
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
  original_media_name,
  playback_mode,
  feedback_template,
  source_metadata,
  published_at
)
SELECT
  id,
  1,
  'Three papers, one thread',
  'Part B foundation · Conversation · ConTEFL 1163 · Questions 31–34',
  'What problem is the student facing, and how does the other speaker change his approach?',
  'Masalah apa yang dihadapi mahasiswa itu, dan bagaimana pembicara lain mengubah pendekatannya?',
  'Woman: I haven''t seen you here for a couple of weeks. Have you stopped eating or something? Man: No. Does it look like I''ve stopped eating? I''ve been spending a lot of time in the library. Woman: Working on a paper? Man: I wish I was working on a paper! I''m working on three different papers: anthropology, English literature, and history. Woman: Wow, that is a lot of work. Man: Yeah, and what''s frustrating is that I''m studying the nineteenth-century British Empire in all three classes, but I can''t just write a single paper for all three. Woman: Why not? Man: The professors won''t let me, even if I make it three times as long as the suggested length. Woman: That''s too bad. Could you write your papers on three aspects of one topic? Man: What do you mean? Do you have something in mind? Woman: Maybe you could do something with Romanticism: write your anthropology paper on its cultural basis, your history paper on the influence of the Romantic poets on British foreign policy, and your English paper on an analysis of some Romantic poems. Man: Hey, that''s not a bad idea! I''ve already started the research for one of the papers, so I can use that. What can I do to repay you? Woman: You want to write up my chemistry lab for me? Man: I''d love to, but I''ve never taken chemistry, so I''m not sure you''d like the results. Woman: No thanks necessary, then. Have a good weekend, and try to get out of the library and get some sleep. You have big circles under your eyes. Man: Okay, I''ll try. See you later.',
  'Main situation: the student is exhausted while researching three separate papers about the same broad historical period. Constraint: the professors will not accept one combined paper. Strategy: keep one shared theme, Romanticism, but give each discipline a distinct angle. Closing exchange: the chemistry-lab offer is playful, and the final advice is to sleep. Focus on problem, constraint, proposed organizing strategy, and the tone of the closing exchange. Do not evaluate spelling, grammar, note length, or English production.',
  '/demo/contefl-1163-31-34.mp3',
  '31_34_Dialog.mp3',
  'self_paced',
  '{
    "contractVersion": "listening-feedback.v1",
    "summary": {
      "en": "Your reconstruction has been saved as evidence for this listen. This activity is using a teacher-authored attention guide, so it does not yet make content-specific claims about what you understood.",
      "id": "Rekonstruksimu telah disimpan sebagai bukti untuk sesi menyimak ini. Aktivitas ini masih menggunakan panduan perhatian yang ditulis guru, sehingga belum membuat klaim khusus tentang apa yang kamu pahami."
    },
    "observations": [
      {
        "kind": "insufficient_evidence",
        "message": {
          "en": "Until the live review adapter is enabled, reHEARse cannot reliably distinguish captured meaning from uncertainty in this attempt.",
          "id": "Sebelum adaptor tinjauan langsung diaktifkan, reHEARse belum dapat membedakan makna yang tertangkap dari bagian yang masih belum pasti secara andal."
        }
      }
    ],
    "nextListeningTarget": {
      "en": "Listen for how one broad historical period becomes three related but distinct paper topics.",
      "id": "Dengarkan bagaimana satu periode sejarah yang luas diubah menjadi tiga topik makalah yang saling terkait tetapi berbeda."
    }
  }'::jsonb,
  '{
    "sourceKind": "authorized-local-archive",
    "packageCode": "1163",
    "sourceRelativePath": "ConTEFL/artifacts/ConTEFL-listening-1163/package-audio/31_34_Dialog.mp3",
    "sha256": "d728ede236948a4877dc38926114abdad19ff358dc35414f9be107ffbeed42c2",
    "durationSeconds": 97.115533,
    "paper": "1996-12 North America",
    "questionRange": "31-34"
  }'::jsonb,
  now()
FROM new_activity
ON CONFLICT (activity_id, version_number) DO NOTHING;
