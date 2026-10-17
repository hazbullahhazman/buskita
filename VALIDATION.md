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
