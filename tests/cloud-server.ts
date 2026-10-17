// Local integration harness: real cloud handlers with an in-memory Redis REST double.
// Never used by the deployed app. Each run starts with an empty isolated store.
import express from "express";
import path from "node:path";
import stateApi from "../api/state";
import actionApi from "../api/action";
const app = express();
const port = Number(process.env.PORT || 4323);
process.env.UPSTASH_REDIS_REST_URL = `http://127.0.0.1:${port}/redis-test`;
process.env.UPSTASH_REDIS_REST_TOKEN = "test-only";
let stored: string | null = null;
app.use(express.text({ type: "*/*" }));
app.post("/redis-test", (req, res) => {
  const a = JSON.parse(req.body);
  let result: unknown;
  if (a[0] === "GET") result = stored;
  else if (a[0] === "SET") {
    if (stored === null) stored = a[2];
    result = "OK";
  } else if (a[0] === "EVAL") {
    result = stored === a[4] ? 1 : 0;
    if (result) stored = a[5];
  } else return res.status(400).json({ error: "Unexpected command" });
  res.json({ result });
});
for (const [url, api] of [
  ["/api/state", stateApi],
  ["/api/action", actionApi],
] as const) {
  app.all(url, async (req, res) => {
    const request = new Request(`http://127.0.0.1:${port}${url}`, {
      method: req.method,
      ...(req.method === "POST" ? { body: req.body } : {}),
    });
    const response = await api.fetch(request);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.status(response.status).send(await response.text());
  });
}
app.use(express.static("dist"));
for (const route of ["/passenger", "/driver", "/office"])
  app.get(route, (_req, res) => res.sendFile(path.resolve("dist/index.html")));
app.listen(port, "127.0.0.1", () =>
  console.log(`Cloud integration harness: ${port}`),
);
