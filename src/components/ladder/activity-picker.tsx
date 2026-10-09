"use client";
import { useEffect, useState } from "react";
import type { LadderActivityChoice } from "@/domain/ladder/journey-contract";
import "./guided-listen.css";
export function ActivityPicker({ value, onChange, disabled = false }: {
  value: string | null; onChange: (id: string) => void; disabled?: boolean;
}) {
  const [choices, setChoices] = useState<LadderActivityChoice[]>([]);
  const [unavailable, setUnavailable] = useState(false);
  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    fetch("/api/ladder/catalogue", { cache: "no-store", signal: controller.signal })
      .then(async (response) => {
        // Compatibility while the UI slice is integrated before its backend.
        if (response.status === 404) return;
        if (!response.ok) throw new Error("catalogue_unavailable");
        const result = await response.json() as { activities?: LadderActivityChoice[] };
        if (!Array.isArray(result.activities)) throw new Error("invalid_catalogue");
        setChoices(result.activities.filter((item) => typeof item.id === "string" && typeof item.title?.en === "string" && typeof item.title?.id === "string" && Number.isInteger(item.durationMs) && item.durationMs > 0 && Number.isInteger(item.questionCount) && item.questionCount > 0));
      }).catch(() => { if (mounted) setUnavailable(true); })
      .finally(() => clearTimeout(timeout));
    return () => { mounted = false; controller.abort(); clearTimeout(timeout); };
  }, []);
  if (!choices.length) return unavailable ? <p role="status">Conversation choices could not load. You can still open the default activity. / Pilihan percakapan belum dimuat. Kamu tetap bisa membuka aktivitas awal.</p> : null;
  return <fieldset className="ladder-activity-picker" disabled={disabled}>
    <legend>Choose a conversation / Pilih percakapan</legend>
    {choices.map((choice, index) => <label key={choice.id} className={(value ?? choices[0].id) === choice.id ? "is-selected" : ""}>
      <input type="radio" name="ladder-conversation" checked={(value ?? choices[0].id) === choice.id} onChange={() => onChange(choice.id)} />
      <span><strong>{choice.title.en}</strong><small lang="id">{choice.title.id}</small>
        <small>{Math.ceil(choice.durationMs / 1000)} s · {choice.questionCount} questions / pertanyaan</small></span>
      <b aria-hidden="true">{String(index + 1).padStart(2, "0")}</b>
    </label>)}
  </fieldset>;
}
