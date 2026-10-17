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
