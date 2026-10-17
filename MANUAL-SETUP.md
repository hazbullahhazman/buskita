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

## Fix for ERR_MODULE_NOT_FOUND (cloud-handler)

Use the Runtime-Fix ZIP to replace the previous repository files. This corrects the relative imports throughout api, server, and shared to use explicit .js extensions for compiled Node ESM. Keep the .ts filenames as provided: TypeScript resolves the .js imports to those source files and emits matching JavaScript.

Upload all updated files, including tsconfig.cloud.json and tests/cloud-runtime.mjs. The build now runs a plain-Node compiled API smoke test so this import failure is caught before deployment. Commit the update, then redeploy that new commit in Vercel. If redeploying manually, turn off reuse of the existing build cache for this deployment.

After deployment, open /api/state. A JSON storage setup message means the module-loading crash is fixed and Redis still needs connecting; a JSON buses array means the backend is ready. The website reconnects automatically. Do not change or share your database tokens to fix this import error.

## Phone layout and presentation links

The passenger panel opens with upcoming arrivals for all three demo buses, sorted by estimated arrival at the scanned stop. It keeps bus information above the trip planner, including during an active request. These are modelled arrival estimates, not an official timetable.

On a phone, drag the top handle down to reveal the map or up to expand the panel. Tap the handle to collapse/reopen it. Scroll inside the panel for details; the Bus info and Plan a trip buttons jump to their sections. The panel sits above the bottom navigation and respects phone safe-area insets.

Use one domain with these paths for the presentation:
- `/passenger` (QR codes include this path and the stop ID)
- `/driver`
- `/office`

The root `/` remains a passenger alias for existing links. No new domain or DNS setup is needed. Upload the changed source files and vercel.json, then redeploy to update the hosted site.

## Corrected role navigation

Passenger bottom navigation contains exactly Bus info and Plan a trip. Each opens its own panel content; they are no longer stacked together. Driver navigation contains only Driver, and office navigation only Office. Role-switch links were removed from navigation. Open each role using its dedicated /passenger, /driver, or /office URL. The passenger QR dialog is available from the page heading.

## Corrected road and destination planning

The latest road is imported from connected OpenStreetMap Lingkaran Ilmu ways, not the old prototype circle. Include shared/road-data.ts and the other changed source files when deploying. Source/licence details are in data/ROUTE-SOURCES.md. Official service direction, route assignments and stop accessibility still require UTM verification.

Plan a trip: choose a starting stop/place or pin the starting point; choose a destination place, an exact stop, or pin a destination. The app proposes the closest stop by straight-line distance. Notify driver sends the pickup, destination stop and passenger count. Once boarded, the passenger can request their destination stop; the driver's onboard list shows Stop requested.

The road upgrade preserves stored records, repositions simulated buses, invalidates old GPS fixes, and cancels only active requests referencing removed demo-stop IDs. A local pre-upgrade backup is kept in .demo-data/state-before-road-update.json. The historic stop IDs fke/fka now label E01/D01 rather than the incorrectly placed prototype stops. This remains a demo migration, not an operational transport-data migration.

## Closest-stop and fastest-bus rule

Plan a trip now applies the nearest-stop rule to each free pin/place, within a selectable 300/500/800 m radius (500 m default). An explicitly selected stop remains fixed. Among buses serving those two stops, it recommends the lowest estimated total time: walk to pickup + remaining wait + forward-route ride with intermediate-stop allowances + walk to destination. The recommendation is the bus used by Notify driver. Unavailable/full buses and departures arriving before the estimated walk to pickup are excluded; no unverified next-lap departure is invented.

These are estimates using straight-line walking at 1.2 m/s and the existing route-speed/dwell model. All three demo buses still share one loop, so no claim is made of comparing different official UTM routes. A same-stop or out-of-radius selection gets an explanation instead of a misleading booking recommendation. Proposed stops remain labelled; real boarding access needs field validation.
