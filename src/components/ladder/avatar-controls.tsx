"use client";

import { useState } from "react";

import type { LadderView } from "@/domain/ladder/model";
import { isAvatarId } from "@/domain/ladder/avatars";
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
  const [saving, setSaving] = useState<string | null>(null);
  const [message, setMessage] = useState<"saved" | "failed" | null>(null);

  async function choose(avatarId: string) {
    if (!isAvatarId(avatarId) || saving || avatarId === view.avatarId) return;
    setSaving(avatarId);
    setMessage(null);
    try {
      const response = await fetch("/api/ladder/avatar", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ runId: view.runId, avatarId }),
      });
      const body = (await response.json()) as { view?: LadderView };
      if (!response.ok || !body.view) throw new Error("avatar_save_failed");
      onView(body.view);
      setMessage("saved");
    } catch {
      setMessage("failed");
    } finally {
      setSaving(null);
    }
  }

  return (
    <div>
      <AvatarPicker
        value={view.avatarId}
        onChange={choose}
        disabled={disabled || saving !== null}
        animate={animate}
      />
      <p className="ladder-avatar-save-state" role="status" aria-live="polite">
        {saving
          ? "Saving your companion… / Menyimpan temanmu…"
          : message === "saved"
            ? "Companion saved. / Teman tersimpan."
            : message === "failed"
              ? "Could not save. Your previous companion is unchanged—try again. / Belum dapat disimpan. Teman sebelumnya tidak berubah—coba lagi."
              : ""}
      </p>
    </div>
  );
}
