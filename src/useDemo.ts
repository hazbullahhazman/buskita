import { useEffect, useState } from "react";
import { State } from "../shared/model";
export function useDemo() {
  const [state, setState] = useState<State | null>(null),
    [connected, setConnected] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  useEffect(() => {
    const events = new EventSource("/api/events");
    events.onopen = () => setConnected(true);
    events.onmessage = (e) => {
      setState(JSON.parse(e.data));
      setConnected(true);
    };
    events.onerror = () => setConnected(false);
    return () => events.close();
  }, []);
  async function action(payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      if (!response.ok) throw Error(data.error);
      setState(data);
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
  return { state, connected, error, setError, busy, action };
}
