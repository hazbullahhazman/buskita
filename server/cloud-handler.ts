import { createStore, ServiceError } from "./cloud-store.js";
const store = createStore();
export async function handle(
  request: Request,
  action: boolean,
): Promise<Response> {
  const headers = { "Cache-Control": "no-store" };
  if (request.method !== (action ? "POST" : "GET"))
    return Response.json(
      { error: "Method not allowed." },
      { status: 405, headers: { ...headers, Allow: action ? "POST" : "GET" } },
    );
  try {
    let payload: unknown;
    if (action) {
      const body = await request.text();
      if (new TextEncoder().encode(body).length > 16384)
        throw new ServiceError("Request is too large.", 413);
      try {
        payload = JSON.parse(body);
      } catch {
        throw new ServiceError("Invalid JSON request.", 400);
      }
    }
    return Response.json(
      action ? await store.act(payload) : await store.read(),
      { headers },
    );
  } catch (e) {
    return Response.json(
      {
        error:
          e instanceof ServiceError
            ? e.message
            : "Unable to load the demo. Please try again.",
      },
      { status: e instanceof ServiceError ? e.status : 503, headers },
    );
  }
}
