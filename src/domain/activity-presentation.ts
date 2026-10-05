/** Source labels are internal evidence. Public labels describe the listening task. */
export function publicPartLabel(internalLabel: string): string {
  if (/part\s*b/i.test(internalLabel)) return "Conversation / Percakapan";
  if (/part\s*c/i.test(internalLabel)) return "Talk / Paparan";
  if (/part\s*a/i.test(internalLabel))
    return "Short conversation / Percakapan singkat";
  return "Listening practice / Latihan menyimak";
}
export const classroomTitle = "Short conversations / Percakapan singkat";

export function publicActivityTitle(title: string): string {
  return /contefl|1163|\bpackage\b|\barchive\b/i.test(title)
    ? "Listening activity / Aktivitas menyimak"
    : title;
}

export function containsConfidentialSourceLabel(text: string): boolean {
  return /contefl|\b1163\b|\b(?:package|archive)\s*(?:id|code|number|no\.)?\s*[:#]?\s*[a-z0-9_-]+/i.test(
    text,
  );
}
