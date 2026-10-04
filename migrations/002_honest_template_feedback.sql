UPDATE activity_version
SET feedback_template = '{
  "contractVersion": "listening-feedback.v1",
  "summary": {
    "en": "Your reconstruction has been saved as evidence for this listen. This MVP is using a teacher-authored attention guide, so it does not yet make content-specific claims about what you understood.",
    "id": "Rekonstruksimu telah disimpan sebagai bukti untuk sesi menyimak ini. MVP ini masih menggunakan panduan perhatian yang ditulis guru, sehingga belum membuat klaim khusus tentang apa yang kamu pahami."
  },
  "observations": [
    {
      "kind": "insufficient_evidence",
      "message": {
        "en": "Until the live review adapter is enabled, this activity cannot reliably distinguish captured meaning from uncertainty.",
        "id": "Sebelum adaptor tinjauan langsung diaktifkan, aktivitas ini belum dapat membedakan makna yang tertangkap dari bagian yang masih belum pasti secara andal."
      }
    }
  ],
  "nextListeningTarget": {
    "en": "Listen for the professor''s final instruction: what should happen first, and by when?",
    "id": "Dengarkan instruksi terakhir profesor: apa yang harus dilakukan lebih dulu, dan sebelum kapan?"
  }
}'::jsonb
WHERE activity_id = (SELECT id FROM activity WHERE slug = 'campus-radio')
  AND version_number = 1;
