# Validation — 17 October 2026

- `npm run build`: passed (strict TypeScript check and Vite production build).
- `npm test`: 8 domain tests passed.
- `tests/browser.cjs`: passed against an isolated **production build** server with fresh demo storage. Used headless Chrome and three independent browser contexts.
- Verified passenger booking reaches driver and office; three demo identities; duplicate booking rejection; boarding and alighting; repeated arrival does not double-count; cancellation; driver reports; campus notices; CSV download; stop QR links; map destination pinning; no horizontal overflow at 390px on passenger, driver and office pages.
- Verified denied GPS does not invent a location. Server rejects poor/stale GPS; zero speed remains zero.
- No application page errors during the production browser regression suite.
- Inspected desktop and mobile screenshots. Screenshots are in ignored `test-results/` and include test-only records, not measured campus operation.

Not verified: Google Maps with an actual owner-provided API key, real-world GPS accuracy on a UTM bus, phone background tracking, external-device firewall/Wi-Fi reachability, the real geometry of the three coloured routes, or physical suitability of proposed stops.

All route coordinates remain explicitly approximate. Eleven demo stops (five inherited and six proposed) have gaps no greater than 500 metres measured along the inherited loop. This does not certify official stops, walking paths or lane accuracy.

English UI update: translated passenger, driver and office copy, accessibility labels, GPS/API errors, QR help, CSV headings and time formatting. Production build and the existing browser regression suite passed; inspected English mobile layout. UTM place and route names are retained.

## Vercel compatibility fix

- Added direct-route rewrites for driver and office, cloud API entry points, shared Upstash REST storage, atomic compare-and-set updates, and request-time simulation.
- Changed client updates to polling with explicit connection errors and stale-response protection.
- All 12 automated tests passed, including concurrent bookings, duplicate rejection, cold-start persistence via a shared Redis test double, simulation timing, and API validation.
- The full three-context browser regression passed against the cloud API handlers using a local Redis REST double. Direct visits and reloads of passenger, driver, and office pages passed; missing-storage error display passed.
- Production build passed. Actual Vercel routing and real Upstash storage remain unverified until the updated source is deployed with database credentials.

## Production ESM import regression

Vercel runtime logs identified ERR_MODULE_NOT_FOUND for server/cloud-handler: extensionless imports passed the tsx tests but failed under native Node ESM. All relative imports in the cloud dependency chain now include .js extensions. The build also compiles the API with NodeNext resolution and imports both emitted entry points using plain Node, checking missing-storage and invalid-request JSON responses. This verifies the runtime import chain without tsx or Vite. Actual hosted deployment must still be checked after uploading the updated files.

## Mobile passenger panel and presentation paths

Added a touch handle with collapsed/half/full states, scrollable stacked bus information and trip planning, all-bus arrival estimates, and a dedicated /passenger route used by QR and navigation links. Verified at 390x844 and 360x640: direct load and refresh, QR stop selection, all three arrival rows, collapse/expand, actual Chrome touch drag events, planner jump, and no horizontal overflow. The three-session browser regression and all 13 unit tests passed. No official schedule data was supplied; estimates remain explicitly labelled.

## Road-aligned planner and driver stop requests

Replaced the prototype loop with 87 coordinates across ten connected OSM Lingkaran Ilmu tertiary-road ways. Tests check source-node continuity, closed geometry, no added connector edges, stop spacing, proposed stops on the road, MSI nearest-stop recommendation, and owner/status/idempotency rules for stop requests. All 17 unit tests passed. The production build and native Node API import check passed.

The isolated phone/driver browser test (tests/trip-planner.cjs) passed named-origin recommendation, direct destination stop selection, map pins for origin/destination, pickup notification delivered to the driver, boarding, and an onboard stop request appearing on the driver page. The mapped route was also visually inspected on the phone map. Walking distances are straight-line estimates; no pedestrian routing, official bus route approval, field GPS accuracy or real-world direction verification is claimed.

Local server restarted on port 4317 after backing up its state. Existing geometry is upgraded; trips referring to removed proposed stops are retained but cancelled if active. See data/ROUTE-SOURCES.md for exact source IDs and geographic-data licence.

## Closest-stop/fastest-bus planner verification

All 21 unit tests passed, including fixed explicit stops, nearest free-pin stops, radius rejection, same-stop handling, departure catchability, full/unavailable exclusions and minimum total-time ordering. Build/native Node API checks passed. The local mobile browser check verified recommendation display, walking/wait/ride breakdown, radius selection and same-stop explanation using intercepted read-only demo data (no passenger records changed).

## Compact requested-bus summary

The passenger panel keeps a short bus/stop/ETA summary visible when collapsed. Active requests use their actual bus ID and pickup stop; onboard journeys use the destination stop. No active request falls back to the selected bus. Disconnected or unavailable GPS yields no ETA. The requested bus is highlighted with a gold outline and YOUR BUS label; its route is selected on the map. Cancellation clears the highlight. Local phone tests covered waiting, onboard and cancelled fixtures without changing live records. Leaflet visuals were inspected; Google Maps marker parity is implemented but not verified with a live API key.

## Passenger GPS, map focus and bottom-tab toggles

After ordering, the requested bus remains selected/highlighted and other map markers fade to 25% opacity with their labels suppressed. Compact map chips show only the requested bus. Cancellation restores normal map visibility.

My location explicitly starts a browser GPS watch: a blue You marker and an accuracy-radius circle display fresh readings. Stop my location clears the watch and marker; readings older than 30 seconds are hidden. Permission errors are shown without substituting a position. Passenger coordinates stay in browser state and are not posted to the backend. A location fix centres the map once; it does not automatically change a planned pickup.

Bottom Bus info and Plan a trip controls open their section; tapping the same open tab lowers the panel. Local mobile browser tests passed both toggle sequences, requested-bus emphasis, permitted GPS with accuracy, stop/cleanup, absence of location POSTs, and denied permission. Tests used browser-emulated GPS; real phone GPS accuracy and the Google Maps provider remain unverified.
