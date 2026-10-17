import test from "node:test";
import assert from "node:assert/strict";
import { applyAction } from "../server/actions";
import { initialState, occupied, processStop } from "../shared/engine";

test("owner can cancel a waiting request or leave an onboard journey and rebook", () => {
  for (const onboard of [false, true]) {
    const booking = { type: "book", userId: "amira", busId: "BK01", from: "cp", to: "fke", count: 1 };
    let state = applyAction(initialState(), booking);
    const requestId = state.requests[0].id;
    if (onboard) state = processStop(state, "BK01", "cp");
    assert.throws(() => applyAction(state, { type: "cancel", requestId, userId: "mei" }));
    state = applyAction(state, { type: "cancel", requestId, userId: "amira" });
    state = applyAction(state, { type: "cancel", requestId, userId: "amira" });
    assert.equal(state.requests[0].status, "cancelled");
    assert.equal(state.requests[0].completedAt, undefined);
    assert.equal(occupied("BK01", state.requests), 0);
    assert.equal(applyAction(state, booking).requests.length, 2);
  }
});
test("completed journeys cannot be cancelled", () => {
  let state = applyAction(initialState(), { type: "book", userId: "amira", busId: "BK01", from: "cp", to: "fke", count: 1 });
  state = processStop(state, "BK01", "cp");
  state = processStop(state, "BK01", "fke");
  assert.throws(() => applyAction(state, { type: "cancel", requestId: state.requests[0].id, userId: "amira" }));
});
