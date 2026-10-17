import express from "express";
import { createServer as createViteServer } from "vite";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  renameSync,
} from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { State, USERS, STOPS, routeById } from "../shared/model";
import {
  ahead,
  atProgress,
  distance,
  initialState,
  match,
  processStop,
  STOP_PROGRESS,
  wrap,
} from "../shared/engine";

const app = express();
app.disable("x-powered-by");
app.use(express.json({ limit: "16kb" }));
const dataDir = path.resolve(process.env.DEMO_DATA_DIR || ".demo-data");
mkdirSync(dataDir, { recursive: true });
const dataFile = path.join(dataDir, "state.json");
let state: State = initialState();
if (existsSync(dataFile)) {
  try {
    const saved = JSON.parse(readFileSync(dataFile, "utf8"));
    if (
      Array.isArray(saved.requests) &&
      Array.isArray(saved.buses) &&
      saved.schema === 2
    ) {
      state = { ...saved, serverTime: Date.now() };
      state.buses = state.buses.map((b) => ({
        ...b,
        updatedAt: b.mode === "demo" ? Date.now() : b.updatedAt,
      }));
    }
  } catch {
    console.warn("Demo storage unreadable; starting a new demo.");
  }
}
const clients = new Set<express.Response>();
let dirty = false;
function publish() {
  state.revision++;
  state.serverTime = Date.now();
  dirty = true;
  const data = `data: ${JSON.stringify(state)}\n\n`;
  for (const client of clients) client.write(data);
}
setInterval(() => {
  if (!dirty) return;
  try {
    writeFileSync(dataFile + ".tmp", JSON.stringify({ ...state, schema: 2 }));
    renameSync(dataFile + ".tmp", dataFile);
    dirty = false;
  } catch (e) {
    console.error("Unable to save demo state", e);
  }
}, 2000);
app.get("/api/state", (_req, res) =>
  res.json({ ...state, serverTime: Date.now() }),
);
app.get("/api/events", (req, res) => {
  res.set({
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
  res.flushHeaders();
  clients.add(res);
  res.write(
    `data: ${JSON.stringify({ ...state, serverTime: Date.now() })}\n\n`,
  );
  const heartbeat = setInterval(() => res.write(": heartbeat\n\n"), 15000);
  req.on("close", () => {
    clients.delete(res);
    clearInterval(heartbeat);
  });
});
const validString = (x: unknown, max = 200): x is string =>
  typeof x === "string" && x.trim().length > 0 && x.length <= max;
app.post("/api/action", (req, res) => {
  // Explicitly an open, local demo. Production must authenticate all identities and roles.
  try {
    const a = req.body;
    if (!a || typeof a !== "object") throw Error("Invalid request.");
    const bus = state.buses.find((b) => b.id === a.busId);
    switch (a.type) {
      case "book": {
        if (!USERS.some((u) => u.id === a.userId) || !bus)
          throw Error("Invalid passenger or bus.");
        if (
          state.requests.some(
            (r) =>
              r.userId === a.userId &&
              ["waiting", "onboard"].includes(r.status),
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
      case "cancel": {
        const r = state.requests.find(
          (r) => r.id === a.requestId && r.userId === a.userId,
        );
        if (!r || r.status !== "waiting")
          throw Error("Only requests that are still waiting can be cancelled.");
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
          throw Error("GPS accuracy is low or the reading is outdated. Waiting for a new reading.");
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
          typeof a.speed === "number" &&
          Number.isFinite(a.speed) &&
          a.speed >= 0
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
    publish();
    res.json(state);
  } catch (e) {
    res
      .status(400)
      .json({ error: e instanceof Error ? e.message : "Action failed." });
  }
});
let lastTick = Date.now();
setInterval(() => {
  const now = Date.now(),
    elapsed = Math.min(3, (now - lastTick) / 1000);
  lastTick = now;
  for (const bus of state.buses) {
    if (bus.mode !== "demo") continue;
    bus.updatedAt = now;
    if (!bus.paused) {
      bus.progress = wrap(bus.progress + (bus.speed / 3.6) * elapsed);
      bus.point = atProgress(bus.progress);
    }
  }
  publish();
}, 1000);
const production = process.argv.includes("--production");
if (production) {
  app.use(express.static("dist"));
  app.get("*", (_req, res) => res.sendFile(path.resolve("dist/index.html")));
} else {
  const vite = await createViteServer({
    server: {
      middlewareMode: true,
      hmr: { port: (Number(process.env.PORT) || 4317) + 100 },
    },
    appType: "spa",
  });
  app.use(vite.middlewares);
}
const port = Number(process.env.PORT) || 4317;
app.listen(port, "0.0.0.0", () =>
  console.log(`BasKita demo: http://localhost:${port} · /driver · /office`),
);
