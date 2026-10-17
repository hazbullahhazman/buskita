import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PATH, PLACES, STOPS } from "../shared/model";
import { initialState, nearestStop, processStop, distance, match, upgradeGeometry } from "../shared/engine";
import { applyAction } from "../server/actions";

test("road geometry is a closed chain of source OSM ways, with no invented connectors", () => {
  const source = JSON.parse(readFileSync("data/lingkaran-ilmu-route.json", "utf8"));
  assert.deepEqual(PATH, source.points);
  assert.equal(PATH.length, 87);
  assert.deepEqual(PATH[0], PATH.at(-1));
  for (let i = 0; i < source.ways.length; i++) {
    const current = source.ways[i], next = source.ways[(i + 1) % source.ways.length];
    assert.equal(current.nodes.at(-1), next.nodes[0]);
    assert.notEqual(current.oneway, "-1");
  }
  assert.equal(source.ways.reduce((n: number, w: { nodes: string[] }) => n + w.nodes.length - 1, 0), PATH.length - 1);
});
test("MSI resolves to a nearby stop and proposed stops lie on the road", () => {
  const msi = PLACES.find(p => p.id === "msi")!;
  const closest = nearestStop(msi.point);
  for (const stop of STOPS) assert(distance(msi.point, closest.point) <= distance(msi.point, stop.point) + 0.01);
  assert(distance(msi.point, closest.point) < 800);
  for (const stop of STOPS.filter(s => s.suggested)) assert(match(stop.point).distance < 0.1);
});
test("stop request requires an onboard owner, is idempotent, and reaches shared driver state", () => {
  let state = applyAction(initialState(), { type: "book", userId: "amira", busId: "BK01", from: "cp", to: "fke", count: 1 });
  const requestId = state.requests[0].id;
  assert.throws(() => applyAction(state, { type: "request-stop", userId: "amira", requestId }), /onboard/);
  state = processStop(state, "BK01", "cp");
  assert.throws(() => applyAction(state, { type: "request-stop", userId: "mei", requestId }), /onboard/);
  state = applyAction(state, { type: "request-stop", userId: "amira", requestId });
  const sent = state.requests[0].stopRequestedAt;
  assert(sent);
  state = applyAction(state, { type: "request-stop", userId: "amira", requestId });
  assert.equal(state.requests[0].stopRequestedAt, sent);
});
test("road upgrade retains historical records and marks old GPS positions stale", () => {
  const state = initialState(); delete state.geometryVersion;
  state.buses[0].mode = "gps";
  const upgraded = upgradeGeometry(state);
  assert.equal(upgraded.buses[0].updatedAt, 0);
  assert.equal(upgraded.buses[0].offRoute, true);
  assert.equal(upgradeGeometry(upgraded), upgraded);
});
