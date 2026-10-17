import { applyAction } from "./actions.js";
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
import { State } from "../shared/model.js";
import {
  atProgress,
  initialState,
  upgradeGeometry,
  wrap,
} from "../shared/engine.js";

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
state = upgradeGeometry(state);
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
app.post("/api/action", (req, res) => {
  try {
    state = applyAction(state, req.body);
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
