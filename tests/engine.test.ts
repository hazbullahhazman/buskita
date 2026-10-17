import test from "node:test";
import assert from "node:assert/strict";
import {
  ahead,
  atProgress,
  distance,
  eta,
  initialState,
  LENGTH,
  match,
  occupied,
  processStop,
  STOP_PROGRESS,
} from "../shared/engine";
import { STOPS, Request } from "../shared/model";
test("forward route distance wraps around the loop", () => {
  assert.equal(ahead(LENGTH - 100, 100), 200);
  assert.ok(ahead(150, 100) > LENGTH - 51);
});
test("route interpolation and projection agree", () => {
  for (let s = 0; s < LENGTH; s += 100) {
    const p = atProgress(s),
      m = match(p);
    assert.ok(distance(p, m.point) < 0.1);
    assert.ok(Math.abs(m.progress - s) < 0.1);
  }
});
test("proposed stop spacing is no more than 500 metres along route", () => {
  const values = STOPS.map((s) => STOP_PROGRESS[s.id]).sort((a, b) => a - b);
  for (let i = 0; i < values.length; i++)
    assert.ok(ahead(values[i], values[(i + 1) % values.length]) <= 500.1);
});
const request = (overrides: Partial<Request> = {}): Request => ({
  id: "r1",
  userId: "amira",
  busId: "BK01",
  from: "cp",
  to: "fke",
  count: 2,
  status: "waiting",
  createdAt: 1,
  ...overrides,
});
test("empty arrival does not invent passengers", () => {
  const s = processStop(initialState(), "BK01", "cp");
  assert.equal(occupied("BK01", s.requests), 0);
  assert.equal(s.requests.length, 0);
});
test("board/drop-off transitions count real people and are idempotent", () => {
  let s = initialState();
  s.requests = [request()];
  s = processStop(s, "BK01", "cp");
  assert.equal(occupied("BK01", s.requests), 2);
  s = processStop(s, "BK01", "cp");
  assert.equal(occupied("BK01", s.requests), 2);
  s = processStop(s, "BK01", "fke");
  assert.equal(occupied("BK01", s.requests), 0);
  assert.equal(s.requests[0].status, "completed");
  assert.ok(s.requests[0].boardedAt);
  assert.ok(s.requests[0].completedAt);
});
test("alighting frees seats first; overflow remains waiting", () => {
  let s = initialState();
  s.buses[0].capacity = 3;
  s.requests = [
    request({ id: "on", count: 2, from: "psz", to: "cp", status: "onboard" }),
    request({ id: "first", count: 2 }),
    request({ id: "second", userId: "danial", count: 2, createdAt: 2 }),
  ];
  s = processStop(s, "BK01", "cp");
  assert.equal(s.requests[0].status, "completed");
  assert.equal(s.requests[1].status, "onboard");
  assert.equal(s.requests[2].status, "waiting");
  assert.equal(occupied("BK01", s.requests), 2);
});
test("arrival on another bus does not process this bus requests", () => {
  let s = initialState();
  s.requests = [request()];
  s = processStop(s, "BK02", "cp");
  assert.equal(s.requests[0].status, "waiting");
});
test("ETA unavailable for off-route, stale, or paused buses", () => {
  const bus = initialState().buses[0];
  assert.equal(eta({ ...bus, offRoute: true }, "cp"), null);
  assert.equal(eta({ ...bus, paused: true }, "cp"), null);
  assert.equal(eta({ ...bus, updatedAt: Date.now() - 21000 }, "cp"), null);
  assert.ok(eta(bus, "cp")! > 0);
});
