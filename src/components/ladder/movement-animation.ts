import type { JourneyTransition } from "../../domain/ladder/journey-contract";
import { routePoints, type RoutePoint } from "./chapter-layout";
/** Animate only a newly observed consecutive saved event, never refresh/reconnect. */
export function movementFrames(previous: { revision: number; position: number } | undefined,
  next: { revision: number; position: number; transition?: JourneyTransition | null },
  geometry: { width: number; height: number; coords: RoutePoint[] }) {
  const event = next.transition;
  if (!previous || !event || event.revision !== next.revision || event.revision !== previous.revision + 1 || !event.steps.length) return null;
  let position = previous.position;
  const points: Array<RoutePoint & { time: number }> = [], durationFor = { walk: 320, snake: 650, ladder: 650 };
  let time = 0;
  for (const step of event.steps) {
    if (!Number.isInteger(step.from) || !Number.isInteger(step.to) || step.from !== position || !geometry.coords[step.from] || !geometry.coords[step.to]) return null;
    if (!["walk", "snake", "ladder"].includes(step.kind)) return null;
    const path = routePoints(step, geometry.coords);
    if (!path.length) return null;
    path.forEach((p, index) => points.push({ ...p, time: time + durationFor[step.kind] * index / Math.max(1, path.length - 1) }));
    time += durationFor[step.kind]; position = step.to;
  }
  if (position !== next.position || !time) return null;
  return { duration: time, keyframes: points.map((p) => ({ left: `${p.x / geometry.width * 100}%`, top: `${p.y / geometry.height * 100}%`, offset: p.time / time })) };
}
