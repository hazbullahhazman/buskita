import { useEffect, useState } from "react";
import { State } from "../shared/model";
export function useDemo() {
  const [state, setState] = useState<State | null>(null),
    [connected, setConnected] = useState(false),
    [error, setError] = useState(""),
    [connectionError, setConnectionError] = useState(""),
    [busy, setBusy] = useState(false);
  function accept(next: State) {
    setState((previous) =>
      !previous ||
      next.revision > previous.revision ||
      (next.revision === previous.revision &&
        next.serverTime >= previous.serverTime)
        ? next
        : previous,
    );
  }
  async function readResponse(response: Response): Promise<State> {
    if (!response.headers.get("content-type")?.includes("application/json"))
      throw Error(
        "The bus API is missing. Upload the api folder and vercel.json, then redeploy.",
      );
    const data = await response.json();
    if (!response.ok)
      throw Error(data.error || "Unable to connect to the bus service.");
    if (!Array.isArray(data.buses) || !Number.isFinite(data.revision))
      throw Error("The bus service returned an invalid response.");
    return data;
  }
  useEffect(() => {
    let stopped = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function poll() {
      try {
        const response = await fetch("/api/state", {
          cache: "no-store",
          signal: AbortSignal.any([
            controller.signal,
            AbortSignal.timeout(12000),
          ]),
        });
        const next = await readResponse(response);
        if (!stopped) {
          accept(next);
          setConnected(true);
          setConnectionError("");
        }
      } catch (e) {
        if (!stopped) {
          setConnected(false);
          setConnectionError(
            e instanceof Error ? e.message : "Connection failed.",
          );
        }
      } finally {
        if (!stopped) timer = setTimeout(poll, 3000);
      }
    }
    void poll();
    return () => {
      stopped = true;
      clearTimeout(timer);
      controller.abort();
    };
  }, []);
  async function action(payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(15000),
      });
      accept(await readResponse(response));
      setConnected(true);
      setConnectionError("");
      return true;
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Connection failed. Please try again.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  return {
    state,
    connected,
    error: error || connectionError,
    setError,
    busy,
    action,
  };
}
