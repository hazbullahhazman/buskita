import { Bus, Point, Request, Stop, routeById } from "./model.js";
import { ahead, distance, eta, nearestStop, occupied, STOP_PROGRESS } from "./engine.js";

// Closest-stop rule first; then compare only buses serving those stops.
// Walking is a straight-line estimate at 1.2 m/s, not pedestrian routing.
export function planJourney(input: {
  origin: Point; destination: Point; from?: Stop; to?: Stop;
  buses: Bus[]; requests: Request[]; count: number; radius: number; now: number;
}) {
  const from = input.from || nearestStop(input.origin);
  const to = input.to || nearestStop(input.destination);
  const walkFrom = input.from ? 0 : distance(input.origin, from.point);
  const walkTo = input.to ? 0 : distance(input.destination, to.point);
  const walkingSeconds = Math.ceil(walkFrom / 1.2);
  const base = { from, to, walkFrom, walkTo, walkingSeconds };
  if (walkFrom > input.radius || walkTo > input.radius)
    return { ...base, options: [], reason: `No stop within ${input.radius} m of one of your locations. Move the pin or increase the search radius.` };
  if (from.id === to.id)
    return { ...base, options: [], reason: "Both locations use the same closest stop. A bus journey is not needed between these stops; check the walking access." };
  const rideDistance = ahead(STOP_PROGRESS[from.id], STOP_PROGRESS[to.id]);
  const options = input.buses.flatMap(bus => {
    const route = routeById(bus.routeId);
    if (!route.stopIds.includes(from.id) || !route.stopIds.includes(to.id)) return [];
    if (bus.capacity - occupied(bus.id, input.requests) < input.count) return [];
    const pickupSeconds = eta(bus, from.id, input.now);
    if (pickupSeconds === null || pickupSeconds < walkingSeconds) return [];
    const intermediate = route.stopIds.filter(id => {
      const d = ahead(STOP_PROGRESS[from.id], STOP_PROGRESS[id]);
      return d > 0 && d < rideDistance;
    }).length;
    const rideSeconds = Math.ceil(rideDistance / (Math.max(8, bus.speed) / 3.6) + 25 * intermediate);
    const finalWalkSeconds = Math.ceil(walkTo / 1.2);
    return [{ bus, pickupSeconds, waitSeconds: pickupSeconds - walkingSeconds, rideSeconds, finalWalkSeconds,
      totalSeconds: pickupSeconds + rideSeconds + finalWalkSeconds }];
  }).sort((a, b) => a.totalSeconds - b.totalSeconds || a.bus.id.localeCompare(b.bus.id));
  return { ...base, options, reason: options.length ? "" : "No suitable bus currently available. A bus may be full, offline, or arriving before you can walk to the stop." };
}
