import { randomUUID } from "node:crypto";
import { State, USERS, STOPS, routeById } from "../shared/model.js";
import {
  atProgress,
  distance,
  match,
  processStop,
  STOP_PROGRESS,
  wrap,
} from "../shared/engine.js";
const validString = (x: unknown, max = 200): x is string =>
  typeof x === "string" && x.trim().length > 0 && x.length <= max;
// Shared validation for the local server and hosted demo API.
export function applyAction(state: State, a: any): State {
  if (!a || typeof a !== "object") throw Error("Invalid request.");
  const bus = state.buses.find((b) => b.id === a.busId);
  switch (a.type) {
    case "book": {
      if (!USERS.some((u) => u.id === a.userId) || !bus)
        throw Error("Invalid passenger or bus.");
      if (
        state.requests.some(
          (r) =>
            r.userId === a.userId && ["waiting", "onboard"].includes(r.status),
        )
      )
        throw Error("You already have an active journey.");
      const route = routeById(bus.routeId);
      if (
        !route.stopIds.includes(a.from) ||
        !route.stopIds.includes(a.to) ||
        a.from === a.to
      )
        throw Error("Choose different pickup and destination stops.");
      if (!Number.isInteger(a.count) || a.count < 1 || a.count > 3)
        throw Error("Choose between 1 and 3 passengers.");
      if (bus.paused || bus.offRoute || Date.now() - bus.updatedAt > 20000)
        throw Error("This bus is unavailable. Please choose another bus.");
      state.requests.push({
        id: randomUUID(),
        userId: a.userId,
        busId: bus.id,
        from: a.from,
        to: a.to,
        count: a.count,
        status: "waiting",
        createdAt: Date.now(),
      });
      break;
    }
    case "request-stop": {
      const request = state.requests.find(
        (r) => r.id === a.requestId && r.userId === a.userId,
      );
      if (!request || request.status !== "onboard")
        throw Error("Only an onboard passenger can request a stop.");
      request.stopRequestedAt ||= Date.now();
      break;
    }
    case "cancel": {
      const r = state.requests.find(
        (r) => r.id === a.requestId && r.userId === a.userId,
      );
      if (!r || !["waiting", "onboard", "cancelled"].includes(r.status))
        throw Error("Only your active request or journey can be cancelled.");
      r.status = "cancelled";
      break;
    }
    case "arrive": {
      if (!bus || !STOPS.some((s) => s.id === a.stopId))
        throw Error("Invalid bus or stop.");
      if (
        bus.mode === "gps" &&
        (bus.offRoute ||
          Date.now() - bus.updatedAt > 20000 ||
          distance(bus.point, atProgress(STOP_PROGRESS[a.stopId])) > 90)
      )
        throw Error(
          "Confirm arrival only when GPS shows the bus near the stop.",
        );
      state = processStop(state, bus.id, a.stopId);
      if (bus.mode === "demo") {
        bus.progress = wrap(STOP_PROGRESS[a.stopId] + 2);
        bus.point = atProgress(bus.progress);
        bus.updatedAt = Date.now();
      }
      break;
    }
    case "pause":
      if (!bus || bus.mode !== "demo")
        throw Error("This control is only available in simulation mode.");
      bus.paused = !bus.paused;
      break;
    case "mode":
      if (!bus || !["demo", "gps"].includes(a.mode))
        throw Error("Invalid mode.");
      bus.mode = a.mode;
      bus.paused = false;
      bus.offRoute = false;
      bus.speed = bus.mode === "demo" ? 22 : 0;
      bus.updatedAt = bus.mode === "demo" ? Date.now() : 0;
      bus.lastFixAt = 0;
      if (bus.mode === "demo") bus.point = atProgress(bus.progress);
      break;
    case "gps": {
      if (!bus || bus.mode !== "gps")
        throw Error("Start GPS sharing for this bus first.");
      const { lat, lng, accuracy, timestamp } = a;
      if (
        ![lat, lng, accuracy, timestamp].every(Number.isFinite) ||
        Math.abs(lat) > 90 ||
        Math.abs(lng) > 180 ||
        accuracy < 0 ||
        accuracy > 80 ||
        timestamp > Date.now() + 10000 ||
        Date.now() - timestamp > 20000 ||
        timestamp <= bus.lastFixAt
      )
        throw Error(
          "GPS accuracy is low or the reading is outdated. Waiting for a new reading.",
        );
      const point = { lat, lng };
      if (
        bus.lastFixAt &&
        distance(point, bus.point) / ((timestamp - bus.lastFixAt) / 1000) > 35
      )
        throw Error("An unexpected GPS jump was rejected.");
      const matched = match(point, bus.lastFixAt ? bus.progress : undefined);
      bus.offRoute = matched.distance > Math.max(45, accuracy * 1.5);
      bus.point = bus.offRoute ? point : matched.point;
      if (!bus.offRoute) bus.progress = matched.progress;
      bus.speed =
        typeof a.speed === "number" && Number.isFinite(a.speed) && a.speed >= 0
          ? Math.min(100, a.speed * 3.6)
          : 0;
      bus.accuracy = accuracy;
      bus.updatedAt = timestamp;
      bus.lastFixAt = timestamp;
      break;
    }
    case "report":
      if (!bus || !validString(a.text, 500))
        throw Error("Enter a report of up to 500 characters.");
      state.reports.unshift({
        id: randomUUID(),
        busId: bus.id,
        text: a.text.trim(),
        createdAt: Date.now(),
      });
      state.reports = state.reports.slice(0, 100);
      break;
    case "notice":
      if (typeof a.text !== "string" || a.text.length > 250)
        throw Error("Notices must be 250 characters or fewer.");
      state.notice = a.text.trim();
      break;
    default:
      throw Error("Unknown action.");
  }

  return state;
}
