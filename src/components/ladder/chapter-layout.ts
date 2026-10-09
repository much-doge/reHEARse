import { CHAPTER_JOURNEY_MAP, type JourneyMap, type JourneyStep } from "../../domain/ladder/journey-contract";
export type RoutePoint = { x: number; y: number };
export function chapterGeometry(wide: boolean) {
  const coords: RoutePoint[] = [{ x: wide ? 60 : 240, y: wide ? 540 : 1050 }];
  for (let chapter = 0; chapter < 4; chapter++) {
    const x = wide ? 180 + chapter * 210 : chapter % 2 ? 360 : 120;
    const entry = wide ? 480 : chapter < 2 ? 970 : 460;
    coords.push({ x, y: entry }, { x, y: entry - (wide ? 150 : 160) }, { x, y: entry - (wide ? 300 : 320) });
  }
  coords.push({ x: wide ? 970 : 240, y: wide ? 180 : 140 });
  return { width: wide ? 1040 : 480, height: wide ? 640 : 1120, coords };
}
/** Shared samples drive both the painted connector and actual token travel. */
export function routePoints(step: Pick<JourneyStep, "kind" | "from" | "to">, coords: RoutePoint[]): RoutePoint[] {
  const from = coords[step.from], to = coords[step.to];
  if (!from || !to) return [];
  if (step.kind === "walk") return [from, to];
  if (step.kind === "ladder") return [from, { x: from.x - 43, y: from.y - 20 }, { x: to.x - 43, y: to.y + 20 }, to];
  return Array.from({ length: 25 }, (_, index) => {
    const t = index / 24;
    return { x: from.x + (to.x - from.x) * t + Math.sin(t * Math.PI) * 65 + Math.sin(t * Math.PI * 6) * 10,
      y: from.y + (to.y - from.y) * t };
  });
}
export function routePath(points: RoutePoint[]) {
  return points.map((p, i) => `${i ? "L" : "M"}${p.x} ${p.y}`).join(" ");
}
export function registeredChapterMap(map?: JourneyMap): map is JourneyMap {
  return map?.version === "chapter-route.v1" && map.nodeCount === 14 &&
    map.connections.length === CHAPTER_JOURNEY_MAP.connections.length &&
    CHAPTER_JOURNEY_MAP.connections.every((expected) => map.connections.some((connection) => connection.id === expected.id && connection.kind === expected.kind && connection.from === expected.from && connection.to === expected.to && connection.chapter === expected.chapter));
}
export function chapterPlace(node: number) {
  if (node === 0) return "Start / Mulai";
  if (node === 13) return "Finish / Selesai";
  const chapter = Math.floor((node - 1) / 3) + 1;
  return (node - 1) % 3 === 2 ? `Camp ${chapter} / Pos ${chapter}` : `Listen ${chapter} / Simak ${chapter}`;
}
