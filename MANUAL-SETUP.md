# Upload and deploy the fixed BasKita demo

1. Extract the ZIP. Upload its contents to your GitHub repository, replacing the previous files. Include `api`, `server`, `src`, `shared`, `vercel.json`, and the other root files. Do not upload the ZIP itself as source.
2. In your Vercel project, open Storage / Marketplace and connect an **Upstash Redis** database to this project. Follow the provider's account and plan prompts.
3. In Vercel Project Settings > Environment Variables, verify `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present for Production. The app also accepts `KV_REST_API_URL` and `KV_REST_API_TOKEN`. If the integration uses different names, copy its REST URL and full-access REST token into the expected names. Never put the token in GitHub or a variable beginning with `VITE_`.
4. Use a separate database or a different `BASKITA_STATE_KEY` for Preview deployments to isolate their data.
5. Use Framework Preset **Vite**, Build Command **npm run build**, Output Directory **dist**, and Node.js 22 or 24. Root Directory must contain `package.json` and `vercel.json` (normally the repository root).
6. Leave `VITE_PUBLIC_URL` empty so QR links use the deployed domain. Remove any old localhost value. Google Maps is optional; the default map uses OpenStreetMap.
7. Redeploy after uploading the code and configuring the database variables.
8. Visit `/api/state` on your deployed domain. It should return JSON with a `buses` array. A 503 with a storage message means the database configuration needs attention.
9. Open `/`, `/driver`, and `/office` and refresh each page. Create a passenger request and check the driver and office pages. Updates appear in about three seconds plus network time; requests should survive page reloads.

## Why the old deployment failed

The old upload contained a local Express server. Vercel served the frontend without that backend, so it waited forever for bus data. It also lacked route rewrites for direct visits to the driver and office pages.

This version includes route rewrites and serverless API functions with shared Redis storage. The frontend polls instead of keeping a permanent SSE connection open. Simulated movement is calculated from elapsed time, and atomic database updates protect concurrent bookings.

## Local development

Install Node.js 22.12 or newer, then run:

```sh
npm ci
npm run dev
```

Open http://localhost:4317, http://localhost:4317/driver, and http://localhost:4317/office. Local development still uses the local Express server and `.demo-data`; Redis is only required by the cloud API.

## Verification and scope

The cloud API is tested locally using a Redis REST test double. An actual Vercel deployment and real Upstash connection still require verification after you redeploy. No credentials are included in this archive.

This remains an open demonstration with three shared identities and unauthenticated driver/office pages. The route and stop coordinates are approximate and need UTM field verification before operational use.
