import { gameContents } from "./content-games";
export { gameContents } from "./content-games";
import { ladderContent } from "./content";
import { oceanCurrentsOriginal, threePapersOriginal } from "./content-original";
import { validateLadderContent, type LadderContent } from "./content-schema";

export const legacyLadderContent = validateLadderContent({
  ...ladderContent,
  activityId: ladderContent.slug,
  title: { en: "Three papers, one thread", id: "Tiga makalah, satu benang merah" },
  questionFormat: "diagnostic-three",
  mechanicsVersion: "legacy-linear.v1",
  durationMs: 97115,
} satisfies LadderContent);

export const ladderContents = [legacyLadderContent, threePapersOriginal, oceanCurrentsOriginal, ...gameContents] as const;

const byVersion = new Map(ladderContents.map((content) => [content.version, content]));
const originalsByActivity = new Map(
  ladderContents.filter((content) => content.questionFormat === "original-four").map((content) => [content.activityId, content]),
);

export function resolveLadderContent(version: string): LadderContent | null {
  return byVersion.get(version) ?? null;
}

export function resolveOriginalActivity(activityId: string): LadderContent | null {
  return originalsByActivity.get(activityId) ?? null;
}

export function selectStartContent(
  mode: "legacy" | "original",
  activityId?: string,
): LadderContent | null {
  if (mode === "legacy")
    return !activityId || activityId === legacyLadderContent.activityId
      ? legacyLadderContent
      : null;
  return resolveOriginalActivity(activityId ?? "conversation-journey");
}
