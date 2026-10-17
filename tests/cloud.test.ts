import test from "node:test";
import assert from "node:assert/strict";
import { advance, createStore } from "../server/cloud-store";
import { initialState, wrap } from "../shared/engine";
import { handle } from "../server/cloud-handler";

function fakeRedis() {
  let value: string | null = null;
  return async (args: (string | number)[]) => {
    if (args[0] === "GET") return value;
    if (args[0] === "SET") {
      if (value === null) value = String(args[2]);
      return "OK";
    }
    if (args[0] === "EVAL") {
      if (value !== args[4]) return 0;
      value = String(args[5]);
      return 1;
    }
    throw Error("Unexpected command");
  };
}
test("cold-start reads retain data and concurrent bookings do not overwrite one another", async () => {
  const command = fakeRedis();
  const a = createStore(command),
    b = createStore(command);
  const book = (userId: string) => ({
    type: "book",
    busId: "BK01",
    userId,
    from: "cp",
    to: "fke",
    count: 1,
  });
  await Promise.all([a.act(book("amira")), b.act(book("danial"))]);
  const cold = createStore(command);
  assert.equal((await cold.read()).requests.length, 2);
  await assert.rejects(cold.act(book("amira")), /active journey/);
  assert.equal((await cold.read()).revision, 2);
});
test("concurrent duplicate requests create only one booking", async () => {
  const command = fakeRedis();
  const payload = {
    type: "book",
    busId: "BK01",
    userId: "mei",
    from: "cp",
    to: "fke",
    count: 1,
  };
  const results = await Promise.allSettled([
    createStore(command).act(payload),
    createStore(command).act(payload),
  ]);
  assert.equal(results.filter((r) => r.status === "fulfilled").length, 1);
  assert.equal((await createStore(command).read()).requests.length, 1);
});
test("elapsed-time simulation preserves paused buses and stale GPS", () => {
  const saved = initialState();
  saved.buses[1].paused = true;
  saved.buses[2].mode = "gps";
  const state = advance(saved, saved.serverTime + 60000);
  assert.equal(
    state.buses[0].progress,
    wrap(saved.buses[0].progress + (22 / 3.6) * 60),
  );
  assert.equal(state.buses[1].progress, saved.buses[1].progress);
  assert.equal(state.buses[2].updatedAt, saved.buses[2].updatedAt);
  assert.notEqual(state.buses[0].updatedAt, saved.buses[0].updatedAt);
});
test("API rejects malformed bodies and wrong methods without touching storage", async () => {
  assert.equal(
    (await handle(new Request("https://example.test/api/action"), true)).status,
    405,
  );
  assert.equal(
    (
      await handle(
        new Request("https://example.test/api/action", {
          method: "POST",
          body: "{",
        }),
        true,
      )
    ).status,
    400,
  );
  assert.equal(
    (
      await handle(
        new Request("https://example.test/api/action", {
          method: "POST",
          body: "x".repeat(17000),
        }),
        true,
      )
    ).status,
    413,
  );
});
