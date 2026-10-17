# BasKita UTM

A working, shared-state campus transport **demo** with a minimal maroon, warm-white and green interface. The original Gemini export remains in `review-source/`; the refined application lives at this repository's root.

## Start

Requires Node.js 22.12+ (tested with Node 24).

```sh
npm install
npm run dev
```

- Passenger: http://localhost:4317/?stop=cp
- Driver: http://localhost:4317/driver
- Office: http://localhost:4317/office

The three pages use the same Express backend, with API polling every three seconds for shared updates. Driver actions update passenger trips and office statistics. Requests, reports and bus state persist in `.demo-data/state.json` on this computer. This is a single-server demo, not a multi-instance production database.

If another application uses the default port, set the `PORT` environment variable. In PowerShell: `$env:PORT='4320'`, then `npm run dev`.

## Phone and QR demo

Open the computer's LAN address, e.g. `http://<computer-ip>:4317`, on devices using the same reachable Wi-Fi network. Open the QR dialog from that address; its generated passenger URL then uses the reachable address. A QR generated from `localhost` only points back to the device scanning it, so it is not suitable for another phone. Windows firewall or network client isolation can block LAN access.

For a shared HTTPS hosting address, set `VITE_PUBLIC_URL=https://your-demo-host` in `.env.local`, then restart development or rebuild production. Each QR includes a stop ID. Driver and office have separate paths on the same domain.

Public browser GPS requires HTTPS (localhost is the development exception). LAN HTTP works for simulated buses and bookings, but not reliable phone GPS access. For Vercel deployment, follow MANUAL-SETUP.md; shared Upstash Redis storage is required.

## Demonstration walkthrough

1. Open the passenger, driver and office pages in separate tabs, browser profiles or devices.
2. On the passenger page choose Amira, Danial or Mei. These are three fixed demo identities, not authenticated accounts. A URL can select an identity: `/?stop=cp&user=danial`.
<<<<<<< HEAD
3. Select BK01, open **Plan a trip**, choose Centre Point / DSI → FKE and a passenger count (1–3). Alternatively, pin a destination on the map. The nearest demo stop is proposed, with a clearly labelled straight-line walking distance.
4. Press **Request bus BK01**. The request appears on the corresponding driver page and in the office demand panel.
5. On the driver page choose CP and press **Demo: arrive & update passengers**. The demo bus jumps to that stop; alighting is processed first, then waiting groups board in queue order, subject to capacity. Repeating the action does not double-count.
6. Choose FKE and confirm arrival. The passenger trip completes and office counts change. The simulation moves the map marker, but **does not assume that a passenger boarded merely because the bus passed nearby**.
=======
3. Select BK01, open **Plan a trip**, choose Centre Point Bus Station → E01 Bus Stop and a passenger count (1–3). Alternatively, pin a destination on the map. The nearest demo stop is proposed, with a clearly labelled straight-line walking distance.
4. Press **Notify driver · BK01**. The request appears on the corresponding driver page and in the office demand panel.
5. On the driver page choose CP and press **Demo: arrive & update passengers**. The demo bus jumps to that stop; alighting is processed first, then waiting groups board in queue order, subject to capacity. Repeating the action does not double-count.
6. Choose E01 Bus Stop and confirm arrival. The passenger trip completes and office counts change. The simulation moves the map marker, but **does not assume that a passenger boarded merely because the bus passed nearby**.
>>>>>>> origin/master
7. Try reports, campus notices and the office CSV export. Switch between the three passenger identities to demonstrate simultaneous requests.

## Maps, routes and honest limitations

- Without a Google Maps key, the UI uses OpenStreetMap tiles with attribution. This is visibly labelled.
- To use Google Maps, copy `.env.example` to `.env.local`, set `VITE_GOOGLE_MAPS_API_KEY` to a browser key enabled for Maps JavaScript API, configure website/API restrictions in its owning Google Cloud project, and restart/rebuild. No key is embedded in source. Google Maps with a real configured key has not been tested in this environment.
<<<<<<< HEAD
- BK01 is maroon, BK02 green, BK03 blue. Each bus has its own route identity. **All three currently use the same approximate inherited loop**, not three accurately reconstructed routes from the screenshot. No original official route file was supplied.
- The supplied prototype's five approximate stop locations are retained. Six proposed stops fill gaps so the distance **along the demo loop** between stops is at most 500 metres. Proposed stops are not claims that a shelter exists or that the roadside location is accessible.
- Locations, stop names and lane alignment must be checked against UTM's official routes or a recorded field GPS survey before a real pilot. A screenshot alone cannot establish precise coordinates, turn restrictions or direction.
=======
- BK01 is maroon, BK02 green, and BK03 blue. All three demo buses currently share **Lingkaran Ilmu's mapped road geometry**: 87 points from 10 connected OSM tertiary-road ways, joined by common node IDs. See `data/ROUTE-SOURCES.md` for provenance, licences and direction limitations. This is not three separate verified UTM service routes.
- Centre Point, E01, D01, D05 and D06 stop coordinates come from OSM. Meranti and PSZ/MSI access stops and any gap-filling stops are labelled proposed. Proposed points are on the road and fill gaps to at most 500 metres along the loop; they are not verified shelters or accessible boarding points.
- Building locations include MSI, PSZ, FKM, FABU and Meranti from OSM nodes/building centres. They are not validated pedestrian entrances. Pin destinations not present in the list; E01 is not asserted to be the FKE faculty building.
- The planner accepts stops, named places and map pins for origins/destinations. It recommends the nearest stop by straight-line distance, not a surveyed walking route. A driver notification sends the chosen boarding/alighting stops and passenger count. Onboard passengers can send one stop request, visible on the driver's page. Requests do not reroute buses or guarantee seats.
- Road access, bus direction, service routes and stops need UTM confirmation before a real pilot. Eight source road ways explicitly say one-way; two do not. The connected source-node order is used for this demonstration.
>>>>>>> origin/master
- ETA uses forward distance around the one-way loop, including wraparound, plus a 25-second allowance for intermediate stops. It is an estimate, not a timetable or calibrated prediction. Unknown/zero GPS speeds are not replaced by fabricated measured speeds; the ETA model uses a minimum planning speed, which needs field calibration. Off-route, paused and stale buses do not produce ETAs.
- GPS matching projects onto the assigned demo geometry and uses previous progress to reduce jumps. It rejects stale, low-quality and implausibly fast GPS fixes. Raw off-route locations remain off-route instead of being forced onto the line. It is a baseline matcher for this simple loop, not a validated solution for overlapping/branching campus routes.
- Student positions are not collected. A driver's GPS session is explicitly started/stopped. Closing the page stops that browser's watcher; existing coordinates become stale after 20 seconds. A foreground browser page does not guarantee tracking when a phone locks. An Android foreground-service implementation would be a separate step.

## Validation

```sh
npm test
npm run build
```

Unit tests cover forward loop distances, geometry projection, stop spacing, capacity, idempotent arrivals, bus separation and unavailable ETAs.

`tests/browser.cjs` is an optional Playwright regression test for three independent browser sessions. It uses Chrome, and expects a **fresh, isolated** demo server at `http://127.0.0.1:4318` (override with `TEST_URL`). Install Playwright locally for this optional suite or point `PLAYWRIGHT_MODULE` to an existing installation. In PowerShell, start the isolated server with `PORT=4318` and a unique `DEMO_DATA_DIR` environment variable before `npm run start` (build first), then run `node tests/browser.cjs` in another terminal. It exercises all three identities, booking, capacity-related transitions, cancellation, report delivery, notices, CSV, QR links, map pinning, mobile overflow and GPS denial/validation. It creates real test records in that isolated store.

## Production build

```sh
npm run build
npm start
```

Serve through HTTPS for real phone GPS. For local/Node hosting, the server must remain running. Vercel uses the included api functions and shared Redis storage; see MANUAL-SETUP.md.

**Access is intentionally open for demonstration.** Driver, office and passenger identities are not authenticated. Before public operational deployment, add server-enforced roles, account/session management, persistent database transactions, request throttling and an appropriate driver-location retention policy. Do not use this demo as an authenticated live dispatch service.
<<<<<<< HEAD

=======

>>>>>>> origin/master
