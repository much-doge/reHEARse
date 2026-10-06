export function attemptSaveError(code: unknown): string {
  switch (code) {
    case "learner_role_required":
      return "This account can preview the activity. To save a response, sign in with a learner account. Your text is still here. / Akun ini dapat meninjau aktivitas. Untuk menyimpan jawaban, masuk dengan akun peserta. Teks tetap tersedia.";
    case "authentication_required":
      return "Your session has ended. Sign in again in another tab, then return here to save your response. Your text is still here. / Sesi berakhir. Masuk kembali di tab lain, lalu kembali ke sini untuk menyimpan jawaban. Teks tetap tersedia.";
    case "invalid_attempt":
      return "Enter a nickname of up to 40 characters and a response. Notes and responses can each contain up to 12,000 characters. Your text is still here. / Isi nama panggilan hingga 40 karakter dan jawaban. Catatan dan jawaban masing-masing dapat berisi hingga 12.000 karakter. Teks tetap tersedia.";
    case "origin_rejected":
      return "Open this activity at rehearse.najala.org to save your response. Your text is still here. / Buka aktivitas di rehearse.najala.org untuk menyimpan jawaban. Teks tetap tersedia.";
    case "activity_not_found":
      return "This activity is no longer available for new responses. Your text is still here. / Aktivitas ini tidak lagi tersedia untuk jawaban baru. Teks tetap tersedia.";
    case "save_unconfirmed":
    case "confirmation_unavailable":
      return "We couldn’t confirm the save. Your text is still here. When the connection returns, try saving this same response again. / Penyimpanan belum dapat dipastikan. Teksmu tetap tersedia. Saat koneksi kembali, coba simpan jawaban yang sama lagi.";
    case "submission_changed":
      return "This submission has already been saved with different text. Your current text is still here; start a new response to save a revision. / Kiriman ini sudah tersimpan dengan teks berbeda. Teks saat ini tetap tersedia; mulai jawaban baru untuk menyimpan revisi.";
    default:
      return "Saving could not be confirmed. Your text is still here. Check your practice history in another tab before trying again. / Penyimpanan belum dapat dipastikan. Teks tetap tersedia. Periksa riwayat latihan di tab lain sebelum mencoba lagi.";
  }
}
