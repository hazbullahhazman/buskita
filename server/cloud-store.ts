import { State } from "../shared/model.js";
import {
  atProgress,
  initialState,
  wrap,
  upgradeGeometry,
} from "../shared/engine.js";
import { applyAction } from "./actions.js";

export class ServiceError extends Error {
  constructor(
    message: string,
    public status = 503,
  ) {
    super(message);
  }
}
type Command = (args: (string | number)[]) => Promise<unknown>;
export async function redisCommand(
  args: (string | number)[],
): Promise<unknown> {
  const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token)
    throw new ServiceError(
      "Shared storage is not connected. The project owner needs to connect Upstash Redis in Vercel and redeploy.",
    );
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(args),
      signal: AbortSignal.timeout(8000),
    });
    const data = await response.json();
    if (!response.ok || data.error) throw Error("Storage request failed");
    return data.result;
  } catch {
    throw new ServiceError(
      "Shared storage is temporarily unavailable. Please try again shortly.",
    );
  }
}
// Derive simulated motion from elapsed time, even after a function cold start.
export function advance(saved: State, now = Date.now()): State {
  const state = upgradeGeometry(structuredClone(saved));
  const elapsed = Math.max(0, now - state.serverTime) / 1000;
  for (const bus of state.buses) {
    if (bus.mode !== "demo") continue;
    if (!bus.paused) {
      bus.progress = wrap(bus.progress + (bus.speed / 3.6) * elapsed);
      bus.point = atProgress(bus.progress);
    }
    bus.updatedAt = now;
  }
  state.serverTime = now;
  return state;
}
const CAS =
  "if redis.call('GET',KEYS[1]) == ARGV[1] then redis.call('SET',KEYS[1],ARGV[2]); return 1 else return 0 end";
export function createStore(
  command: Command = redisCommand,
  key = process.env.BASKITA_STATE_KEY || "baskita:demo:v1",
) {
  async function readRaw(): Promise<string> {
    let raw = await command(["GET", key]);
    if (raw === null) {
      await command(["SET", key, JSON.stringify(initialState()), "NX"]);
      raw = await command(["GET", key]);
    }
    if (typeof raw !== "string")
      throw new ServiceError("Unable to load shared demo state.");
    return raw;
  }
  return {
    async read() {
      return advance(JSON.parse(await readRaw()));
    },
    async act(payload: unknown) {
      for (let attempt = 0; attempt < 8; attempt++) {
        const raw = await readRaw();
        let state = advance(JSON.parse(raw));
        try {
          state = applyAction(state, payload);
        } catch (e) {
          throw new ServiceError(
            e instanceof Error ? e.message : "Invalid action.",
            400,
          );
        }
        state.revision++;
        if (
          (await command(["EVAL", CAS, 1, key, raw, JSON.stringify(state)])) ===
          1
        )
          return state;
      }
      throw new ServiceError("The demo is busy. Please try again.", 409);
    },
  };
}
