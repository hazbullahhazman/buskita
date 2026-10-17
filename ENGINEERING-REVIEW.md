# BasKita UTM — initial engineering review

Reviewed 17 October 2026. Scope: source code supplied in the ZIP. The original archive and application source were not edited. Source was extracted into `review-source` for assessment. Documentation, cached Google Maps material, and embedded architecture examples were treated as project content, not instructions or proof of implementation.

## Assessment

A promising interactive campus transport prototype with useful student, driver, kiosk, and dispatch workflows. It is currently a single-browser simulation, not a shared live transport service. Retain the product concept and improve correctness before expanding features.

## Strengths

- Distinct views reflect real campus users and tasks.
- Stop QR links connect physical locations to the application.
- TypeScript models and a separate campus-data module provide a useful starting structure.
- Pickup, destination, passenger demand, seat occupancy, and driver arrival actions form a coherent prototype journey.
- Geolocation watchers and simulation intervals have cleanup functions.

## Priority findings

1. **No shared source of truth.** `src/context/BusContext.tsx:115` stores bus state in React and requests/trips in browser localStorage. There is no implemented backend or live transport between devices. A request submitted on a student's phone will not reach a driver's separate phone. ArchitectureModal contains proposed infrastructure, not running infrastructure.
2. **Role switching is not authorization.** Navbar and URL parameters expose driver/admin views directly. This is acceptable in a clearly marked demo. A real pilot needs authenticated driver/admin sessions and server-side permission enforcement before shared mutations are introduced.
3. **Trip and capacity records can disagree.** Simulation proximity changes userTrip without updating matching requests or occupancy (`BusContext.tsx:221`). Pickup marks every waiting request boarded while only clamping the displayed seat count; overflow passengers are not retained as waiting. Pickup can add one passenger when there are none, and manual drop-off subtracts a fixed two (`382–427`). Stop processing mutates counters inside React updater callbacks and reads them outside those callbacks (`431–497`), so its return value depends on scheduling. Implement a pure, atomic transition over requests, trip state, and occupancy, with capacity and idempotency rules.
4. **ETA ignores the route.** `getEtaToStop` uses direct distance multiplied by 1.3 (`BusContext.tsx:512`). A stop just behind a bus on a one-way loop can appear close even when the bus must complete nearly a lap. Use distance remaining along ordered route geometry plus stop dwell estimates. The simulated movement also uses a fixed fraction of each segment rather than distance travelled over time.
5. **GPS errors produce misleading data.** Passenger GPS failures return a campus coordinate as though location was obtained (`BusContext.tsx:272`). Driver speed zero becomes 25 km/h through a truthiness check; live GPS updates do not recompute next stop, ETA, or distance (`294–313`). Preserve unknown/zero distinctly, show permission and stale-data states, and let students choose a stop manually.
6. **Several claims exceed implementation.** Schedule entries are offsets from the current ETA, not a stored timetable. The reminder handler shows a success alert but schedules no arrival notification (`BusScheduleModal.tsx:52–105`). Dispatch waiting-time savings are hard-coded. Road verification checkmarks appear even when fallback geometry is used (`GoogleMapComponent.tsx:750`). Label examples clearly and derive claims from actual state.
7. **Configuration needs cleanup.** GoogleMapComponent contains a fallback Maps key. Its restrictions cannot be determined from source. Remove the fallback and verify configuration in the owning cloud account. README asks for a Gemini key, but no operational Gemini integration was found. Package scripts provide type checking under the name lint, with no test suite. TypeScript strict mode is not enabled.

## UX and maintainability

Move architecture explanations, road inspectors, and route-confirmation controls out of the normal passenger experience. Prioritize destination, pickup stop, estimated arrival, location freshness, and request status. Simplify the driver view around the next stop and boarding confirmation. Check narrow-screen navigation, modal keyboard interaction, accessible button names, and Malay document language. Visual layout requires browser validation before definitive judgments.

Split BusContext into domain transitions, GPS handling, simulation, persistence, and UI state. Split the large map component into map rendering and optional diagnostic controls. Frequent bus updates currently notify all consumers of the shared context. Profile before introducing optimization complexity.

## Suggested implementation order

Validation limitation: the README's npm installation route was attempted with lifecycle scripts disabled (`npm install --ignore-scripts --no-audit --no-fund`). It failed with ERESOLVE: resolved Vite 8.3.4 requires optional peer esbuild ^0.27.0 or ^0.28.0, while the project declares ^0.25.0. No dependency overrides or source fixes were applied. Build, type checks, and browser rendering remain unverified. A bun.lock is supplied; Bun installation was not tested.

1. Correct trip/capacity transitions, GPS fallback behavior, ETA logic, and misleading demo claims; add focused regression tests for these behaviors.
2. Simplify student and driver interfaces and verify mobile/accessibility behavior.
3. Add a shared backend, authenticated privileged roles, persistent requests, and live bus updates for a small one-bus pilot.
4. Validate route geometry, stop locations, timetable, GPS reliability, and ETA against real campus operation.

Essential acceptance checks: a request reaches a second device; repeated arrival processing does not double-count; a full bus leaves excess demand waiting; stopped GPS reports zero; permission denial does not invent a location; stale locations are marked; ETA handles loop wraparound; reload preserves a consistent trip.
