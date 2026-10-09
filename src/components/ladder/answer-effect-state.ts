import type { BilingualText } from "@/domain/feedback";
import type { LadderAction, LadderView } from "@/domain/ladder/model";

export type AnswerEffect = {
  id: string;
  kind: "celebrate" | "revisit" | "neutral";
  text: BilingualText;
};

type ConfirmedView = Pick<LadderView, "runId" | "revision" | "state">;

/** Derive a local celebration from a newly acknowledged transition, never a prediction. */
export function confirmedAnswerEffect(
  previous: ConfirmedView | null,
  next: ConfirmedView,
  action?: LadderAction,
): AnswerEffect | null {
  if (
    !previous || previous.runId !== next.runId ||
    next.revision <= previous.revision || !action ||
    action.kind === "help" || action.kind === "continue" || action.kind === "teacher_close"
  ) return null;
  const before = previous.state.choices[action.item];
  const after = next.state.choices[action.item];
  if (!after || (before && before.outcome !== "repair")) return null;
  if (before && before.tries === after.tries && before.outcome === after.outcome) return null;
  const id = `${next.runId}:${next.revision}`;
  if (action.kind === "choice" && action.choice === null)
    return {
      id, kind: "neutral",
      text: { en: "Saved for another listen.", id: "Tersimpan untuk kamu dengar lagi." },
    };
  if (after.outcome === "repair")
    return {
      id, kind: "revisit",
      text: {
        en: "That choice needs another listen. Revisit this part at the replay checkpoint.",
        id: "Pilihan itu perlu kamu dengar lagi. Cek bagian ini di titik dengar ulang.",
      },
    };
  return {
    id, kind: "celebrate",
    text: after.outcome === "supported"
      ? { en: "You worked through this part. Onward!", id: "Kamu sudah membahas bagian ini. Yuk, lanjut!" }
      : after.outcome === "revised"
        ? { en: "Your new choice fits. A way forward!", id: "Pilihan barumu sesuai. Kamu bisa lanjut!" }
        : { en: "That choice fits this part!", id: "Pilihanmu sesuai dengan bagian ini!" },
  };
}
