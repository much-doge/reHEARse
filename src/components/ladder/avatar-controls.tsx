"use client";

import { useState } from "react";

import type { LadderView } from "@/domain/ladder/model";
import { PALETTES, isAvatarPaletteId } from "@/domain/ladder/appearance";
import { isAvatarId } from "@/domain/ladder/avatars";
import { anonymousAlias } from "@/domain/ladder/anonymous-alias";
import { validGameAlias } from "@/domain/ladder/lobby";
import { AvatarPicker } from "./avatar-picker";

export function AvatarControls({
  view,
  disabled = false,
  animate = true,
  onView,
}: {
  view: LadderView;
  disabled?: boolean;
  animate?: boolean;
  onView: (next: LadderView) => void;
}) {
  const [name, setName] = useState(view.alias);
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<"saved" | "failed" | null>(null);

  async function choose(avatarId: string, paletteId = view.avatarPalette, confirm = false) {
    if (!isAvatarId(avatarId) || !isAvatarPaletteId(paletteId) || saving || !validGameAlias(name.trim()) || (!confirm && avatarId === view.avatarId && paletteId === view.avatarPalette)) return;
    setSaving(avatarId);
    setMessage(null);
    try {
      const response = await fetch("/api/ladder/avatar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId: view.runId, avatarId, paletteId, ...(confirm ? { alias: name.trim() } : {}) }),
        signal: AbortSignal.timeout(8000),
      });
      const body = (await response.json()) as { view?: LadderView };
      if (!response.ok || !body.view || body.view.runId !== view.runId) throw new Error("avatar_save_failed");
      onView(body.view);
      if (confirm) {
        const ready = await fetch("/api/ladder", { method: "POST", headers: { "content-type": "application/json" },
          body: JSON.stringify({ kind: "ready", runId: view.runId }), signal: AbortSignal.timeout(10000) });
        const result = await ready.json();
        if (!ready.ok || !result.view) throw new Error("ready_failed");
        onView(result.view);
      }
      setMessage("saved");
    } catch {
      // A lost response can follow a committed write. Reconcile before asking
      // for another selection, and never claim the earlier choice is unchanged.
      try {
        const response = await fetch(`/api/ladder?runId=${view.runId}`, {
          cache: "no-store", signal: AbortSignal.timeout(6000),
        });
        const body = (await response.json()) as { view?: LadderView };
        if (response.ok && body.view?.runId === view.runId) {
          onView(body.view);
          setMessage(body.view.avatarId === avatarId && body.view.avatarPalette === paletteId ? "saved" : "failed");
        } else setMessage("failed");
      } catch { setMessage("failed"); }
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <label className="ladder-name-input">Game name / Nama permainan
        <input value={name} minLength={2} maxLength={28} disabled={disabled || saving !== null}
          onChange={(e) => setName(e.target.value)} autoComplete="off" />
      </label>
      <button className="ladder-secondary" type="button" disabled={disabled || saving !== null}
        onClick={() => setName(anonymousAlias(crypto.randomUUID()))}>Random name / Nama acak ↻</button>
      <p className="ladder-avatar-credit">Use a nickname, 2–28 letters or numbers. Your name and character lock when you confirm.
        <br />Pakai nama panggilan, 2–28 huruf atau angka. Nama dan karakter terkunci setelah kamu konfirmasi.</p>
      <fieldset className="ladder-palette-picker" disabled={disabled || saving !== null}>
        <legend>Character colour / Warna karakter</legend>
        <div>{PALETTES.map((palette) => <button key={palette.id} type="button"
          aria-label={`Colour ${palette.en} / Warna ${palette.idLabel}`}
          aria-pressed={view.avatarPalette === palette.id}
          onClick={() => choose(view.avatarId, palette.id)}>
          <span aria-hidden="true" style={{ backgroundColor: palette.hex }} />
          {palette.en}{view.avatarPalette === palette.id ? " ✓" : ""}
        </button>)}</div>
      </fieldset>

      <AvatarPicker
        value={view.avatarId}
        onChange={(id) => choose(id)}
        paletteId={view.avatarPalette}
        disabled={disabled || saving !== null}
        animate={animate}
      />
      <button type="button" className="ladder-primary" disabled={disabled || saving !== null || !validGameAlias(name.trim())}
        onClick={() => choose(view.avatarId, view.avatarPalette, true)}>
        {saving ? "Saving / Menyimpan…" : view.pin ? "Ready — join the waiting room / Siap — masuk ruang tunggu" : "Begin listening / Mulai menyimak →"}
      </button>
      <p className="ladder-avatar-save-state" role="status" aria-live="polite">
        {saving
          ? "Saving your companion… / Menyimpan temanmu…"
          : message === "saved"
            ? "Companion saved. / Teman tersimpan."
            : message === "failed"
              ? "Selection could not be confirmed. You can try again. / Pilihan belum dapat dipastikan. Kamu bisa mencoba lagi."
              : ""}
      </p>
    </div>
  );
}
