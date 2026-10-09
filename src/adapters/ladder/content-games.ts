import { threePapersOriginal, oceanCurrentsOriginal } from "./content-original";
import { housingTalk, temperatureTalk, workplaceTalk } from "./content-talks";
import { validateLadderContent, type LadderContent } from "./content-schema";
import { pair } from "./content";

function combine(activityId: string, title: LadderContent["title"], recordings: LadderContent[]): LadderContent {
  let fromItem = 0;
  const passages = recordings.map((content) => {
    const passage = { slug: content.slug, title: content.title, durationMs: content.durationMs, audioHash: content.audioHash,
      fromItem, toItem: fromItem + content.items.length };
    fromItem = passage.toItem;
    return passage;
  });
  return validateLadderContent({ activityId, slug: recordings[0].slug, title, version: `${activityId}.2026-10-09.v1`,
    questionFormat: "original-four", mechanicsVersion: "passage-route.v1",
    durationMs: recordings.reduce((sum, content) => sum + content.durationMs, 0),
    audioHash: recordings[0].audioHash, passages, items: recordings.flatMap((content) => content.items) });
}
export const conversationJourney = combine("conversation-journey", pair("Conversation journey", "Perjalanan percakapan"),
  [threePapersOriginal, oceanCurrentsOriginal]);
export const talkJourney = combine("talk-journey", pair("Talk journey", "Perjalanan paparan"),
  [housingTalk, temperatureTalk, workplaceTalk]);
export const gameContents = [conversationJourney, talkJourney];
