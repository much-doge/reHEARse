import type { JourneyMap } from "@/domain/ladder/journey-contract";
import { routePath, routePoints, type RoutePoint } from "./chapter-layout";
/** Every connector is supplied by the versioned executable server map. */
export function JourneyConnections({ map, coords }: { map: JourneyMap; coords: RoutePoint[] }) {
  return <g className="ladder-journey-connections">
    {map.connections.map((connection) => {
      const points = routePoints(connection, coords), start = coords[connection.from], end = coords[connection.to];
      if (!start || !end || !points.length) return null;
      const head = points[8] ?? start;
      if (connection.kind === "snake") return <g key={connection.id} data-connector={connection.id}>
        <path d={routePath(points)} fill="none" stroke="#ce8066" strokeWidth="15" strokeLinecap="round" strokeLinejoin="round" />
        <path d={routePath(points)} fill="none" stroke="#f7c2a0" strokeWidth="3" strokeDasharray="2 14" strokeLinecap="round" />
        <circle cx={head.x} cy={head.y} r="10" fill="#ce8066" />
        <circle cx={head.x - 3} cy={head.y + 1} r="2" fill="#253f36" />
        <circle cx={head.x + 3} cy={head.y + 1} r="2" fill="#253f36" />
      </g>;
      const top = Math.min(start.y, end.y) + 20, bottom = Math.max(start.y, end.y) - 20;
      return <g key={connection.id} data-connector={connection.id} stroke="#b78b49" strokeWidth="5" strokeLinecap="round">
        <path d={routePath(points)} stroke="#d9b26a" strokeWidth="10" fill="none" />
        <path d={`M${start.x - 50} ${bottom}V${top} M${start.x - 36} ${bottom}V${top}`} fill="none" />
        {Array.from({ length: Math.max(1, Math.floor((bottom - top) / 22)) }, (_, i) => <path key={i} d={`M${start.x - 50} ${top + 12 + i * 22}H${start.x - 36}`} />)}
      </g>;
    })}
  </g>;
}
