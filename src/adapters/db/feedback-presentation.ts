import { containsConfidentialSourceLabel } from "../../domain/activity-presentation";
import type { ListeningFeedback } from "../../domain/feedback";

// Presentation only: previously saved responses and feedback remain unchanged.
function en(text: string): string {
  return text
    .replace(
      /saved as evidence for this listen/gi,
      "saved for this listening activity",
    )
    .replace(/as evidence of understanding/gi, "to explain your understanding")
    .replace(
      /does not yet make (?:content-specific|attempt-specific) claims about what you understood/gi,
      "offers a listening focus rather than comments on your response",
    )
    .replace(
      /Until the live review adapter is enabled, reHEARse cannot reliably distinguish captured meaning from uncertainty in this attempt\./gi,
      "This guidance was prepared for the activity. Use it to check your explanation against the audio.",
    )
    .replace(
      /there is insufficient evidence/gi,
      "your response needs more detail",
    )
    .replace(/the learner[’']s notes/gi, "Your notes")
    .replace(/the learner[’']s response/gi, "Your response")
    .replace(/the learner captured/gi, "You noticed")
    .replace(/the learner did not mention/gi, "You haven’t mentioned")
    .replace(/the learner did not reference/gi, "You haven’t mentioned")
    .replace(/\bevidences\b/gi, "describes")
    .replace(/\bevidenced\b/gi, "described")
    .replace(/\bevidence\b/gi, "details")
    .replace(/\breconstruction\b/gi, "explanation")
    .replace(
      /teacher-authored attention guide/gi,
      "teacher-prepared listening guidance",
    )
    .replace(/live review adapter/gi, "feedback service");
}
function id(text: string): string {
  return text
    .replace(
      /sebagai bukti untuk sesi menyimak ini/gi,
      "untuk latihan menyimak ini",
    )
    .replace(
      /Sebelum adaptor tinjauan langsung diaktifkan, reHEARse belum dapat membedakan makna yang tertangkap dari bagian yang masih belum pasti secara andal\./gi,
      "Panduan ini disiapkan untuk aktivitas ini. Gunakan untuk memeriksa penjelasanmu dengan mendengarkan audio.",
    )
    .replace(/catatan pembelajar/gi, "Catatanmu")
    .replace(/pembelajar menangkap/gi, "Kamu menangkap")
    .replace(/pembelajar tidak menyebut/gi, "Kamu belum menyebut")
    .replace(/\bAnda\b/g, "kamu")
    .replace(/\bbukti\b/gi, "detail")
    .replace(/rekonstruksimu/gi, "penjelasanmu")
    .replace(/rekonstruksi/gi, "penjelasan");
}
export function feedbackPresentation(
  feedback: ListeningFeedback,
): ListeningFeedback {
  const pair = (text: { en: string; id: string }) =>
    containsConfidentialSourceLabel(text.en) ||
    containsConfidentialSourceLabel(text.id)
      ? {
          en: "Check your explanation against the audio.",
          id: "Periksa penjelasanmu dengan mendengarkan audio.",
        }
      : { en: en(text.en), id: id(text.id) };
  return {
    ...feedback,
    summary: pair(feedback.summary),
    observations: feedback.observations.map((x) => ({
      ...x,
      message: pair(x.message),
    })),
    nextListeningTarget: pair(feedback.nextListeningTarget),
  };
}
