"use client";
import { useEffect, useRef, type RefObject } from "react";
import { movementFrames } from "./movement-animation";
import type { BoardPlayer } from "./board-layout";
import type { RoutePoint } from "./chapter-layout";
export function useBoardMovement(players: BoardPlayer[], elements: RefObject<Map<string, HTMLLIElement>>,
  geometry: { width: number; height: number; coords: RoutePoint[] }, enabled: boolean) {
  const seen = useRef(new Map<string, { revision: number; position: number }>());
  const active = useRef(new Map<string, Animation>());
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    const animations = active.current;
    const cancel = () => { animations.forEach((animation) => animation.cancel()); animations.clear(); };
    if (!enabled || reduced.matches) cancel();
    reduced.addEventListener("change", cancel);
    return () => { cancel(); reduced.removeEventListener("change", cancel); };
  }, [enabled, geometry]);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    for (const player of players) {
      if (!player.id) continue;
      const id = player.id, event = player.lastTransition;
      const next = { revision: player.revision ?? event?.revision ?? 0, position: player.position, transition: event };
      const frames = enabled && !reduced.matches ? movementFrames(seen.current.get(id), next, geometry) : null;
      seen.current.set(id, { revision: next.revision, position: next.position });
      const element = elements.current.get(id);
      if (element && frames) {
        active.current.get(id)?.cancel();
        const animation = element.animate(frames.keyframes, { duration: frames.duration, easing: "linear" });
        active.current.set(id, animation);
        animation.onfinish = () => { if (active.current.get(id) === animation) active.current.delete(id); };
      }
    }
    for (const id of seen.current.keys()) if (!players.some((player) => player.id === id)) {
      seen.current.delete(id); active.current.get(id)?.cancel(); active.current.delete(id);
    }
  }, [players, elements, geometry, enabled]);
}
