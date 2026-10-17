import test from "node:test";
import assert from "node:assert/strict";
import { planJourney } from "../shared/planner";
import { initialState, atProgress, STOP_PROGRESS, nearestStop } from "../shared/engine";
import { STOPS, PLACES } from "../shared/model";
const setup = () => {
  const state = initialState();
  return { buses: state.buses, requests: state.requests, count: 1, radius: 500, now: state.serverTime,
    origin: STOPS[0].point, destination: PLACES.find(p => p.id === "msi")!.point };
};
test("free pins follow the closest-radius rule while explicitly chosen stops stay fixed", () => {
  const input = setup();
  const plan = planJourney(input);
  assert.equal(plan.from.id, nearestStop(input.origin).id);
  assert.equal(plan.to.id, nearestStop(input.destination).id);
  const explicit = planJourney({ ...input, from: STOPS[1], to: STOPS[3] });
  assert.equal(explicit.from.id, STOPS[1].id);
  assert.equal(explicit.to.id, STOPS[3].id);
  assert.equal(explicit.walkFrom, 0);
});
test("planner selects minimum total arrival time, not just nearest bus", () => {
  const input = setup(); const from = STOPS.find(s=>s.id==='cp')!, to = STOPS.find(s=>s.id==='fke')!;
  input.buses.forEach((b,i) => { b.progress=STOP_PROGRESS.cp - 300 - i*100; b.point=atProgress(b.progress); b.speed=10+i*15; });
  const plan = planJourney({ ...input, from, to });
  assert.equal(plan.options.length, 3);
  assert.equal(plan.options[0].totalSeconds, Math.min(...plan.options.map(o=>o.totalSeconds)));
  for (const o of plan.options) assert.equal(o.totalSeconds, plan.walkingSeconds+o.waitSeconds+o.rideSeconds+o.finalWalkSeconds);
});
test("out-of-radius, same-stop and unreachable departures produce no recommendation", () => {
  const input = setup();
  assert.equal(planJourney({...input, destination:{lat:1.6,lng:103.7}}).options.length,0);
  assert.match(planJourney({...input, from:STOPS[0],to:STOPS[0]}).reason,/same closest stop/);
  input.buses.forEach(b => {b.progress=STOP_PROGRESS.cp; b.point=atProgress(b.progress);});
  const cp=STOPS.find(s=>s.id==='cp')!;
  const result=planJourney({...input, origin:{lat:cp.point.lat+0.0001,lng:cp.point.lng},to:STOPS.find(s=>s.id==='fke')!});
  assert.equal(result.options.length,0);
});
test("unavailable and full buses are excluded", () => {
  const input=setup(); input.buses[0].paused=true; input.buses[1].offRoute=true; input.buses[2].capacity=0;
  assert.equal(planJourney({...input,from:STOPS[0],to:STOPS[2]}).options.length,0);
});
