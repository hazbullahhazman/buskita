import { planJourney } from "../shared/planner";
import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import {
  ArrowDown,
  ArrowDownLeft,
  ArrowRight,
  ArrowUpRight,
  Bus as BusIcon,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clock,
  Download,
  Flag,
  Footprints,
  LayoutDashboard,
  Leaf,
  LocateFixed,
  MapPin,
  Navigation,
  Pause,
  Play,
  Plus,
  QrCode,
  Radio,
  Route as RouteIcon,
  Search,
  Send,
  ShieldCheck,
  Signal,
  Users,
  X,
} from "lucide-react";
import {
  Bus,
  PLACES,
  Point,
  Request,
  ROUTES,
  STOPS,
  USERS,
  routeById,
  stopById,
} from "../shared/model";
import {
  ahead,
  atProgress,
  distance,
  eta,
  LENGTH,
  nearestStop,
  nextStop,
  occupied,
  STOP_PROGRESS,
} from "../shared/engine";
import CampusMap from "./CampusMap";
import { useDemo } from "./useDemo";

import { roleLinks } from "./role-links";
type Tab = "info" | "plan";
const timeLabel = (seconds: number | null) =>
  seconds === null
    ? "—"
    : seconds < 30
      ? "Due"
      : String(Math.max(1, Math.ceil(seconds / 60)));
const clockTime = (t: number) =>
  new Date(t).toLocaleTimeString("en-MY", {
    timeZone: "Asia/Kuala_Lumpur",
    hour: "2-digit",
    minute: "2-digit",
  });
const getInitialStop = () => {
  const raw = new URLSearchParams(location.search).get("stop") || "cp";
  return STOPS.some((s) => s.id === raw) ? raw : "cp";
};
const iconSize = 18;
export default function App() {
  const demo = useDemo(),
    { state, connected, error, setError, busy, action } = demo;
  const links = roleLinks(location.href, import.meta.env.VITE_PUBLIC_URL);
  const role = links.role;
  const [userId, setUserId] = useState(() => {
    const raw = new URLSearchParams(location.search).get("user");
    return USERS.some((u) => u.id === raw) ? raw! : "amira";
  });
  const [selectedBus, setSelectedBus] = useState("BK01"),
    [pickup, setPickup] = useState(getInitialStop),
    [tab, setTab] = useState<Tab>("info"),
    [sheet, setSheet] = useState<"collapsed" | "half" | "full">("half"),
    [placeId, setPlaceId] = useState("msi"),
    [directStop, setDirectStop] = useState<string | null>(null),
    [searchRadius, setSearchRadius] = useState(500),
    [originChoice, setOriginChoice] = useState(""),
    [originPin, setOriginPin] = useState<Point | null>(null),
    [pinTarget, setPinTarget] = useState<"origin" | "destination">(
      "destination",
    ),
    [pin, setPin] = useState<Point | null>(null),
    [picking, setPicking] = useState(false),
    [focus, setFocus] = useState<Point | null>(null),
    [count, setCount] = useState(1),
    [qrOpen, setQrOpen] = useState(false),
    [qr, setQr] = useState(""),
    [qrStop, setQrStop] = useState(getInitialStop),
    [toast, setToast] = useState(""),
    [follow, setFollow] = useState(false),
    [report, setReport] = useState(""),
    [notice, setNotice] = useState(""),
    [gpsRunning, setGpsRunning] = useState(false),
    [now, setNow] = useState(Date.now());
  const [passengerFix, setPassengerFix] = useState<(Point & { accuracy: number; timestamp: number }) | null>(null);
  const [passengerLocating, setPassengerLocating] = useState(false);
  const passengerWatch = useRef<number | null>(null);
  useEffect(() => () => { if (passengerWatch.current !== null) navigator.geolocation.clearWatch(passengerWatch.current); }, []);
  function togglePassengerLocation() {
    if (passengerWatch.current !== null) {
      navigator.geolocation.clearWatch(passengerWatch.current); passengerWatch.current = null;
      setPassengerLocating(false); setPassengerFix(null); return;
    }
    if (!window.isSecureContext || !navigator.geolocation) { setError("Your location requires HTTPS or localhost and browser location support."); return; }
    setPassengerLocating(true); setError("");
    let first = true;
    passengerWatch.current = navigator.geolocation.watchPosition(position => {
      const { latitude: lat, longitude: lng, accuracy } = position.coords;
      if (![lat, lng, accuracy].every(Number.isFinite)) return;
      setPassengerFix({ lat, lng, accuracy, timestamp: position.timestamp });
      if (first) { setFocus({ lat, lng }); first = false; }
    }, error => {
      setError(error.code === 1 ? "Location permission denied. Allow location in your browser to show your position." : "Unable to get your location. Check GPS reception and try again.");
      if (passengerWatch.current !== null) navigator.geolocation.clearWatch(passengerWatch.current);
      passengerWatch.current = null; setPassengerLocating(false); setPassengerFix(null);
    }, { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
  }
  const gpsWatch = useRef<number | null>(null),
    gpsBusy = useRef(false),
    lastGpsSent = useRef(0),
    actionRef = useRef(action);
  actionRef.current = action;
  const user = USERS.find((u) => u.id === userId)!,
    destination = pin || PLACES.find((p) => p.id === placeId)!.point,
    destStop = directStop ? stopById(directStop) : nearestStop(destination),
    walk = directStop ? 0 : Math.round(distance(destStop.point, destination));
  const originPoint =
    originPin || PLACES.find((p) => p.id === originChoice)?.point;
  const originWalk = originPoint
    ? Math.round(distance(originPoint, stopById(pickup).point))
    : 0;
  function acceptPin(point: Point) {
    if (pinTarget === "origin") {
      setOriginPin(point);
      setOriginChoice("pin");
      setPickup(nearestStop(point).id);
    } else {
      setPin(point);
      setDirectStop(null);
    }
    setFocus(point);
    setPicking(false);
    showSection("plan");
  }
  const journey = planJourney({
    origin: originPoint || stopById(pickup).point,
    destination: directStop ? stopById(directStop).point : destination,
    from: originPoint ? undefined : stopById(pickup),
    to: directStop ? stopById(directStop) : undefined,
    buses: connected ? state?.buses || [] : [],
    requests: state?.requests || [],
    count,
    radius: searchRadius,
    now,
  });
  const bestJourney = journey.options[0];
  const trip = state?.requests.find(
    (r) => r.userId === userId && ["waiting", "onboard"].includes(r.status),
  );
  const bus =
    (role === "passenger" && trip ? state?.buses.find(b => b.id === trip.busId) : undefined) ||
    (role === "passenger" && tab === "plan" ? bestJourney?.bus : undefined) ||
    state?.buses.find((b) => b.id === selectedBus) ||
    state?.buses[0];

  const route = bus ? routeById(bus.routeId) : ROUTES[0];
  const requestedBus = trip ? state?.buses.find(b => b.id === trip.busId) : undefined;
  const summaryBus = requestedBus || bus;
  const summaryStop = trip ? (trip.status === "onboard" ? trip.to : trip.from) : pickup;
  const summaryEta = summaryBus && connected ? eta(summaryBus, summaryStop, now) : null;
  const lastTrip = state?.requests
    .filter((r) => r.userId === userId && r.status === "completed")
    .at(-1);
  const origin = new URL(links.passenger).origin;
  const qrUrl = `${links.passenger}?stop=${qrStop}`;
  const sheetScroll = useRef<HTMLDivElement>(null);
  const dragStart = useRef<number | null>(null);
  function toggleSection(section: Tab) {
    if (tab === section && sheet !== "collapsed") { setSheet("collapsed"); setPicking(false); }
    else showSection(section);
  }
  function showSection(section: Tab) {
    setTab(section);
    setSheet("full");
    setPicking(false);
    requestAnimationFrame(() => {
      const scroller = sheetScroll.current;
      const target = scroller?.querySelector<HTMLElement>(
        section === "info" ? "#bus-overview" : "#trip-planner",
      );
      if (scroller && target)
        scroller.scrollTo({ top: target.offsetTop, behavior: "smooth" });
    });
  }
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 4000);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!qrOpen) return;
    let live = true;
    QRCode.toDataURL(qrUrl, {
      width: 280,
      margin: 2,
      color: { dark: "#632738", light: "#ffffff" },
    }).then((url) => {
      if (live) setQr(url);
    });
    return () => {
      live = false;
    };
  }, [qrOpen, qrUrl]);
  useEffect(
    () => () => {
      if (gpsWatch.current !== null)
        navigator.geolocation.clearWatch(gpsWatch.current);
    },
    [],
  );
  useEffect(() => {
    if (gpsRunning && bus?.mode !== "gps") {
      if (gpsWatch.current !== null)
        navigator.geolocation.clearWatch(gpsWatch.current);
      gpsWatch.current = null;
      setGpsRunning(false);
    }
  }, [bus?.mode, gpsRunning]);
  async function doAction(payload: Record<string, unknown>, success?: string) {
    const ok = await action(payload);
    if (ok && success) setToast(success);
    return ok;
  }
  async function toggleGps() {
    if (!bus) return;
    if (gpsRunning) {
      if (gpsWatch.current !== null)
        navigator.geolocation.clearWatch(gpsWatch.current);
      gpsWatch.current = null;
      setGpsRunning(false);
      setToast(
        "GPS sharing stopped. The last location will be marked as outdated.",
      );
      return;
    }
    if (!window.isSecureContext) {
      setError(
        "Phone GPS requires HTTPS. Use simulation mode for this HTTP demo.",
      );
      return;
    }
    if (!navigator.geolocation) {
      setError("This device does not support GPS.");
      return;
    }
    if (!(await action({ type: "mode", busId: bus.id, mode: "gps" }))) return;
    setGpsRunning(true);
    lastGpsSent.current = 0;
    gpsWatch.current = navigator.geolocation.watchPosition(
      (pos) => {
        if (gpsBusy.current || Date.now() - lastGpsSent.current < 4000) return;
        gpsBusy.current = true;
        lastGpsSent.current = Date.now();
        void actionRef
          .current({
            type: "gps",
            busId: bus.id,
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
            speed: pos.coords.speed,
            timestamp: pos.timestamp,
          })
          .finally(() => {
            gpsBusy.current = false;
          });
      },
      (e) => {
        setError(
          e.code === 1
            ? "Location permission denied. No substitute location has been used."
            : "GPS is unavailable. Try again in an open area.",
        );
        if (e.code === 1) {
          if (gpsWatch.current !== null)
            navigator.geolocation.clearWatch(gpsWatch.current);
          gpsWatch.current = null;
          setGpsRunning(false);
        }
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 },
    );
  }
  function chooseBus(id: string) {
    if (gpsRunning) {
      setError("Stop sharing GPS before switching buses.");
      return;
    }
    setSelectedBus(id);
  }
  const selectStop = (id: string) => {
    if (picking) {
      if (pinTarget === "origin") {
        setOriginPin(null);
        setOriginChoice("");
        setPickup(id);
      } else {
        setPin(null);
        setDirectStop(id);
      }
      setFocus(stopById(id).point);
      setPicking(false);
      showSection("plan");
    } else {
      setOriginChoice("");
      setOriginPin(null);
      setPickup(id);
      setFocus(atProgress(STOP_PROGRESS[id]));
    }
  };
  const exportCsv = () => {
    if (!state) return;
    const cell = (v: unknown) =>
      '"' +
      String(v)
        .replace(/^[=+@-]/, "'")
        .replaceAll('"', '""') +
      '"';
    const rows = [
      [
        "ID",
        "Passenger",
        "Bus",
        "Pickup",
        "Destination",
        "Count",
        "Status",
        "Time",
      ],
      ...state.requests.map((r) => [
        r.id,
        r.userId,
        r.busId,
        stopById(r.from).name,
        stopById(r.to).name,
        r.count,
        r.status,
        new Date(r.createdAt).toISOString(),
      ]),
    ];
    const blob = new Blob(
      ["\uFEFF" + rows.map((r) => r.map(cell).join(",")).join("\r\n")],
      { type: "text/csv;charset=utf-8;" },
    );
    const url = URL.createObjectURL(blob),
      a = document.createElement("a");
    a.href = url;
    a.download = "baskita-journeys.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const passengerMain = () => {
    if (!state || !bus) return null;
    const estimate = eta(bus, pickup, now);
    return (
      <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">CAMPUS TRAVEL, MADE SIMPLE</div>
            <h1>
              Where to today<span>?</span>
            </h1>
            <p>Less waiting. More time for you.</p>
          </div>
          <button
            className="outline-button heading-qr"
            onClick={() => setQrOpen(true)}
          >
            <QrCode size={17} /> Stop QR <ArrowUpRight size={15} />
          </button>
        </div>
        <div className="passenger-workspace">
          <section className="map-shell">
            <CampusMap
              buses={state.buses}
              selectedBus={requestedBus?.id || bus.id}
              requestedBusId={trip?.busId}
              userLocation={passengerFix && now - passengerFix.timestamp < 30000 ? passengerFix : null}
              locating={passengerLocating}
              onLocate={togglePassengerLocation}
              focus={focus}
              pin={pinTarget === "origin" ? originPin : pin}
              picking={picking}
              pinLabel={
                pinTarget === "origin" ? "starting point" : "destination"
              }
              onPin={acceptPin}
              onBus={chooseBus}
              onStop={selectStop}
            />
            <div className="map-key">
              <span style={{ background: route.color }} />
              {bus.id} · {route.name}
              <span className="one-way">
                <Navigation size={12} /> One-way
              </span>
            </div>
            <div className="mobile-bus-picker">
              {state.buses.filter(b => !trip || b.id === trip.busId).map((b) => (
                <button
                  key={b.id}
                  aria-pressed={bus.id === b.id}
                  onClick={() => chooseBus(b.id)}
                >
                  <span style={{ background: routeById(b.routeId).color }} />
                  {b.id}
                  <small>{timeLabel(eta(b, pickup, now))} min</small>
                </button>
              ))}
            </div>
            <div
              className={`journey-dock sheet-${sheet} ${picking ? "dock-picking" : ""}`}
            >
              <div className="sheet-toolbar">
                <button
                  className="sheet-grip"
                  aria-label={
                    sheet === "collapsed"
                      ? "Expand bus panel"
                      : "Collapse bus panel"
                  }
                  aria-expanded={sheet !== "collapsed"}
                  aria-controls="journey-sections"
                  onPointerDown={(e) => {
                    dragStart.current = e.clientY;
                    e.currentTarget.setPointerCapture(e.pointerId);
                  }}
                  onPointerUp={(e) => {
                    if (dragStart.current === null) return;
                    const delta = e.clientY - dragStart.current;
                    if (Math.abs(delta) > 25)
                      setSheet(delta > 0 ? "collapsed" : "full");
                    else
                      setSheet((current) =>
                        current === "collapsed" ? "half" : "collapsed",
                      );
                    dragStart.current = null;
                  }}
                  onPointerCancel={() => {
                    dragStart.current = null;
                  }}
                  onClick={(event) => {
                    if (event.detail === 0)
                      setSheet((current) =>
                        current === "collapsed" ? "half" : "collapsed",
                      );
                  }}
                >
                  <span className="grip-line" />
                  <span>
                    {sheet === "collapsed" ? "Show bus info" : "Drag to resize"}
                  </span>
                </button>
                <button
                  className="sheet-map-toggle"
                  onClick={() =>
                    setSheet((current) =>
                      current === "collapsed" ? "half" : "collapsed",
                    )
                  }
                >
                  {sheet === "collapsed" ? "Show buses" : "Show map"}{" "}
                  <ChevronDown size={16} />
                </button>
              </div>
              <div className="compact-bus-summary" aria-label="Bus journey summary">
                <span className="summary-bus-icon" style={{ background: routeById(summaryBus!.routeId).color }}><BusIcon size={23} /></span>
                <div className="summary-bus-copy">
                  <strong>{summaryBus!.id} · {trip ? "Your requested bus" : "Selected bus"}</strong>
                  <span>{trip?.status === "onboard" ? "On board · to " : "Pickup · "}{stopById(summaryStop).name}</span>
                  <small>{!connected ? "Reconnecting" : summaryBus!.mode === "demo" ? "Simulation estimate" : "GPS estimate"}</small>
                </div>
                <div className="summary-bus-eta"><strong>{summaryEta === null ? "—" : summaryEta < 30 ? "Due" : `${Math.ceil(summaryEta / 60)} min`}</strong><small>{summaryEta === null ? "ETA unavailable" : trip?.status === "onboard" ? "to destination" : "to pickup"}</small></div>
              </div>
              <div
                className="sheet-scroll"
                id="journey-sections"
                ref={sheetScroll}
              >
                <section
                  id="bus-overview"
                  hidden={tab !== "info"}
                  className="bus-overview"
                  aria-label="Bus arrivals"
                >
                  <div className="section-label">
                    <BusIcon size={15} /> BUS INFO
                  </div>
                  <h2>Next buses at {stopById(pickup).name}</h2>
                  <p>
                    Estimated arrivals ·{" "}
                    {state.buses.some((b) => b.mode === "demo")
                      ? "Includes simulated buses"
                      : "Live GPS updates"}
                  </p>
                  <div className="arrival-list">
                    {[...state.buses]
                      .sort(
                        (a, b) =>
                          (eta(a, pickup, now) ?? Infinity) -
                          (eta(b, pickup, now) ?? Infinity),
                      )
                      .map((b, i) => {
                        const arrival = connected ? eta(b, pickup, now) : null;
                        return (
                          <button
                            key={b.id}
                            aria-pressed={b.id === bus.id}
                            onClick={() => chooseBus(b.id)}
                          >
                            <span
                              className="arrival-route-dot"
                              style={{ background: routeById(b.routeId).color }}
                            />
                            <span>
                              <strong>
                                {b.id} · {routeById(b.routeId).name}
                              </strong>
                              <small>
                                {i === 0 && arrival !== null
                                  ? "Next arrival · "
                                  : ""}
                                {b.capacity - occupied(b.id, state.requests)}{" "}
                                seats · towards {nextStop(b).name}
                              </small>
                            </span>
                            <strong>
                              {arrival === null
                                ? "Unavailable"
                                : arrival < 30
                                  ? "Due"
                                  : `${Math.ceil(arrival / 60)} min`}
                            </strong>
                          </button>
                        );
                      })}
                  </div>
                  <p className="microcopy">
                    All demo buses shown. These are arrival estimates, not a
                    published UTM timetable.
                  </p>
                </section>

                <section
                  className="dock-content"
                  aria-label="Selected bus information"
                  hidden={tab !== "info"}
                >
                  <div className="section-label">
                    <MapPin size={14} /> YOUR PICKUP STOP
                  </div>
                  <div className="stop-select">
                    <select
                      aria-label="Pickup stop"
                      value={pickup}
                      onChange={(e) => {
                        setOriginChoice("");
                        setOriginPin(null);
                        setPickup(e.target.value);
                        setFocus(atProgress(STOP_PROGRESS[e.target.value]));
                      }}
                    >
                      {STOPS.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                          {s.suggested ? " · proposed" : ""}
                        </option>
                      ))}
                    </select>
                    <ChevronDown size={17} />
                  </div>
                  <div className="arrival-block">
                    <div>
                      <span className="section-label">
                        SELECTED BUS · {bus.id}
                      </span>
                      <div className="arrival-time">
                        {timeLabel(estimate)}
                        {estimate !== null && estimate >= 30 && (
                          <span>min</span>
                        )}
                      </div>
                      <p>
                        {estimate === null
                          ? "Arrival estimate unavailable"
                          : `Towards ${nextStop(bus).name}`}
                      </p>
                    </div>
                    <div className="bus-illustration">
                      <BusIcon size={45} strokeWidth={1.3} />
                      <span>{bus.id}</span>
                    </div>
                  </div>
                  <div className="dock-meta">
                    <span>
                      <Users size={15} />
                      {bus.capacity - occupied(bus.id, state.requests)} seats
                      available
                    </span>
                    <span className="green">
                      <span className="live-dot" />
                      {bus.mode === "demo" ? "Simulation" : "Phone GPS"}
                    </span>
                  </div>
                  <button
                    className="primary-button"
                    onClick={() => showSection("plan")}
                  >
                    Plan your journey <ArrowRight size={17} />
                  </button>
                  {lastTrip && (
                    <div className="completed-note">
                      <CheckCircle2 size={14} /> Your last trip is complete.
                      Thank you!
                    </div>
                  )}
                </section>
                <section
                  id="trip-planner"
                  aria-label="Plan a trip"
                  hidden={tab !== "plan"}
                >
                  <h2 className="planner-title">
                    <RouteIcon size={19} /> Plan a trip
                  </h2>
                  {trip && (
                    <details className="dock-content active-trip current-journey">
                      <summary>
                        Current journey ·{" "}
                        {trip.status === "onboard" ? "On board" : "Waiting"} ·
                        View details
                      </summary>
                      <div className="section-label">
                        <span className="live-dot" />
                        {trip.status === "waiting"
                          ? "REQUEST RECEIVED"
                          : "YOU ARE ON BOARD"}
                      </div>
                      <h2>
                        {trip.status === "waiting"
                          ? "Your bus is on its way."
                          : "Enjoy your journey."}
                      </h2>
                      <p>
                        {stopById(trip.from).name} <ArrowRight size={13} />{" "}
                        {stopById(trip.to).name}
                      </p>
                      <div className="trip-summary">
                        <span>
                          <BusIcon size={18} />
                          {trip.busId}
                        </span>
                        <span>
                          <Users size={17} />
                          {trip.count} passengers
                        </span>
                        <strong>
                          {timeLabel(
                            eta(
                              state.buses.find((b) => b.id === trip.busId)!,
                              trip.status === "waiting" ? trip.from : trip.to,
                              now,
                            ),
                          )}{" "}
                          <small>min estimated</small>
                        </strong>
                      </div>
                      <p className="microcopy">
                        {trip.status === "waiting"
                          ? "Board once the driver confirms arrival. Seats are subject to availability."
                          : "Your driver will confirm arrival at your destination."}
                      </p>
                      {trip.status === "onboard" && (
                        <button
                          className="primary-button"
                          disabled={
                            busy || !connected || !!trip.stopRequestedAt
                          }
                          onClick={() =>
                            doAction(
                              {
                                type: "request-stop",
                                requestId: trip.id,
                                userId,
                              },
                              "Stop request sent to the driver.",
                            )
                          }
                        >
                          {trip.stopRequestedAt
                            ? "Driver notified — stop requested"
                            : `Notify driver: stop at ${stopById(trip.to).name}`}
                        </button>
                      )}
                    </details>
                  )}
                  <div className="dock-content plan-content">
                    {trip && (
                      <div className="planning-hint">
                        <p>You have an active journey. Cancel it before sending a new request.</p>
                        <button className="outline-button full" disabled={busy || !connected}
                          onClick={() => doAction({ type: "cancel", requestId: trip.id, userId }, trip.status === "onboard" ? "Journey cancelled. You can make a new request." : "Request cancelled. You can make a new request.")}>
                          <X size={16} /> {busy ? "Cancelling…" : trip.status === "onboard" ? "Leave journey" : "Cancel request"}
                        </button>
                        {trip.status === "onboard" && <small>Leaving removes you from the demo bus passenger count. It does not confirm arrival at your destination.</small>}
                      </div>
                    )}
                    <div className="journey-inputs">
                      <div className="journey-field">
                        <span className="origin-dot" />
                        <label htmlFor="pickup">From</label>
                        <select
                          id="pickup"
                          value={
                            originChoice ? `place:${originChoice}` : pickup
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setOriginPin(null);
                            if (value.startsWith("place:")) {
                              const id = value.slice(6);
                              const point = PLACES.find(
                                (p) => p.id === id,
                              )!.point;
                              setOriginChoice(id);
                              setPickup(nearestStop(point).id);
                              setFocus(point);
                            } else {
                              setOriginChoice("");
                              setPickup(value);
                              setFocus(stopById(value).point);
                            }
                          }}
                        >
                          {originPin && (
                            <option value="place:pin">
                              Your pinned starting point
                            </option>
                          )}
                          <optgroup label="Campus places">
                            {PLACES.map((p) => (
                              <option key={p.id} value={`place:${p.id}`}>
                                {p.name}
                              </option>
                            ))}
                          </optgroup>
                          {STOPS.map((s) => (
                            <option value={s.id} key={s.id}>
                              {s.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="journey-field">
                        <MapPin size={17} />
                        <label htmlFor="destination">To</label>
                        <select
                          id="destination"
                          value={
                            directStop
                              ? `stop:${directStop}`
                              : pin
                                ? "pin"
                                : placeId
                          }
                          onChange={(e) => {
                            if (e.target.value.startsWith("stop:")) {
                              const id = e.target.value.slice(5);
                              setDirectStop(id);
                              setPin(null);
                              setFocus(stopById(id).point);
                              return;
                            }
                            setDirectStop(null);
                            setPlaceId(e.target.value);
                            setPin(null);
                            setFocus(
                              PLACES.find((p) => p.id === e.target.value)!
                                .point,
                            );
                          }}
                        >
                          {pin && (
                            <option value="pin">Your pinned destination</option>
                          )}
                          <optgroup label="Choose a bus stop">
                            {STOPS.map((s) => (
                              <option key={s.id} value={`stop:${s.id}`}>
                                {s.name}
                              </option>
                            ))}
                          </optgroup>
                          {PLACES.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <button
                      className="pin-button"
                      onClick={() => {
                        setPinTarget("origin");
                        setPicking(true);
                        setSheet("collapsed");
                      }}
                    >
                      <MapPin size={15} /> Pin your starting point on the map
                    </button>
                    <div className="walking-note">
                      <Footprints size={19} />
                      <div>
                        Board at <strong>{stopById(pickup).name}</strong>
                        <small>
                          {originWalk} m from starting point · straight-line
                          estimate
                        </small>
                      </div>
                    </div>
                    <button
                      className={`pin-button ${picking ? "selected" : ""}`}
                      onClick={() => {
                        setPinTarget("destination");
                        setPicking(!picking);
                        setSheet(picking ? "full" : "collapsed");
                      }}
                    >
                      <MapPin size={15} />
                      {picking
                        ? "Cancel pin selection"
                        : "Or pin your destination on the map"}
                      <ArrowUpRight size={14} />
                    </button>
                    <div className="walking-note">
                      <Footprints size={19} />
                      <div>
                        Get off at <strong>{destStop.name}</strong>
                        <small>
                          ±{walk} m to destination · straight-line distance
                        </small>
                      </div>
                    </div>
                    <label className="field-label" htmlFor="stop-radius">
                      Nearest-stop search radius
                    </label>
                    <select
                      id="stop-radius"
                      className="standalone-select"
                      value={searchRadius}
                      onChange={(e) => setSearchRadius(Number(e.target.value))}
                    >
                      <option value={300}>300 metres</option>
                      <option value={500}>500 metres</option>
                      <option value={800}>800 metres</option>
                    </select>
                    <section
                      className="journey-recommendation"
                      aria-label="Recommended journey"
                    >
                      <h3>Fastest estimated journey</h3>
                      {bestJourney ? (
                        <>
                          <strong>
                            {bestJourney.bus.id} · about{" "}
                            {Math.ceil(bestJourney.totalSeconds / 60)} min total
                          </strong>
                          <p>
                            {journey.from.name} → {journey.to.name}
                          </p>
                          <p>
                            Walk {Math.ceil(journey.walkingSeconds / 60)} min ·
                            wait {Math.ceil(bestJourney.waitSeconds / 60)} min ·
                            ride {Math.ceil(bestJourney.rideSeconds / 60)} min ·
                            walk {Math.ceil(bestJourney.finalWalkSeconds / 60)}{" "}
                            min
                          </p>
                          <small>
                            Compared {journey.options.length} available buses
                            serving your closest stops. The driver notification
                            uses {bestJourney.bus.id}.
                          </small>
                        </>
                      ) : (
                        <p role="status">{journey.reason}</p>
                      )}
                      <p className="microcopy">
                        Closest stop first, then lowest estimated total time.
                        Walking uses straight-line distance at 1.2 m/s; check
                        gates and pedestrian access. All demo buses currently
                        share one mapped road loop.
                      </p>
                    </section>
                    <div className="booking-options">
                      <div>
                        <span className="section-label">PASSENGERS</span>
                        <div className="stepper">
                          {[1, 2, 3].map((n) => (
                            <button
                              key={n}
                              aria-label={`${n} passengers`}
                              aria-pressed={count === n}
                              onClick={() => setCount(n)}
                            >
                              {n}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="booking-estimate">
                        <span className="section-label">ESTIMATED PICKUP</span>
                        <strong>
                          {timeLabel(estimate)} <small>min</small>
                        </strong>
                      </div>
                    </div>
                    <button
                      className="primary-button"
                      disabled={
                        busy ||
                        !connected ||
                        pickup === destStop.id ||
                        !!trip ||
                        !bestJourney ||
                        estimate === null
                      }
                      onClick={() =>
                        doAction(
                          {
                            type: "book",
                            busId: bestJourney?.bus.id,
                            userId,
                            from: journey.from.id,
                            to: journey.to.id,
                            count,
                          },
                          "Driver notified of your pickup and destination stop.",
                        )
                      }
                    >
                      <span>
                        {trip
                          ? "Finish current journey to notify driver"
                          : pickup === destStop.id
                            ? "Choose a different destination stop"
                            : !bestJourney
                              ? "No suitable journey available"
                              : busy
                                ? "Sending…"
                                : `Notify driver · ${bestJourney.bus.id}`}
                      </span>
                      <ArrowRight size={17} />
                    </button>
                    <div className="microcopy center">
                      Sends your pickup, drop-off and passenger count to the
                      driver. It does not change the bus route.
                    </div>
                  </div>
                </section>
              </div>
            </div>
          </section>
          <aside className="route-sidebar">
            <div className="aside-title">
              <h2>Buses near you</h2>
              <span className="count-pill">3 buses</span>
            </div>
            <p className="muted small">
              Select a bus to see its route and arrival time.
            </p>
            <div className="bus-list">
              {state.buses.map((b) => (
                <BusCard
                  key={b.id}
                  bus={b}
                  active={b.id === bus.id}
                  etaValue={eta(b, pickup, now)}
                  seats={b.capacity - occupied(b.id, state.requests)}
                  onClick={() => chooseBus(b.id)}
                />
              ))}
            </div>
            <div className="route-heading">
              <div>
                <div className="section-label">SELECTED ROUTE</div>
                <h3>{route.name}</h3>
              </div>
              <span className="route-arrow" style={{ color: route.color }}>
                <Navigation size={21} />
              </span>
            </div>
            <div className="route-spec">
              <span>{STOPS.length} stops</span>
              <span>±{(LENGTH / 1000).toFixed(1)} km</span>
              <span>One-way</span>
            </div>
            <div className="stop-timeline">
              {route.stopIds.map((id, i) => {
                const s = stopById(id);
                return (
                  <button
                    key={id}
                    className={pickup === id ? "current" : ""}
                    onClick={() => selectStop(id)}
                  >
                    <span className="timeline-point">{s.code}</span>
                    <span>
                      {s.name}
                      <small>
                        {pickup === id
                          ? "Your stop"
                          : s.suggested
                            ? "Proposed · spacing ≤500 m"
                            : "OSM mapped stop"}
                      </small>
                    </span>
                    {pickup === id && <MapPin size={14} />}
                  </button>
                );
              })}
            </div>
            <div className="route-footnote">
              <ShieldCheck size={17} />
              <p>
                Demo routes and stops.
                <br />
                Three bus colours share one temporary route. Not yet
                field-verified.
              </p>
            </div>
          </aside>
        </div>
      </>
    );
  };
  const driverMain = () => {
    if (!state || !bus) return null;
    const upcoming = nextStop(bus),
      waiting = state.requests.filter(
        (r) => r.busId === bus.id && r.status === "waiting",
      ),
      onboard = state.requests.filter(
        (r) => r.busId === bus.id && r.status === "onboard",
      );
    return (
      <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">DRIVER WORKSPACE</div>
            <h1>
              A smoother journey<span>.</span>
            </h1>
            <p>
              Welcome, {bus.driver}. Keep your focus on the road, with trip
              details at a glance.
            </p>
          </div>
          <label className="bus-switch">
            Assigned bus
            <select
              aria-label="Assigned bus"
              value={selectedBus}
              disabled={gpsRunning}
              onChange={(e) => chooseBus(e.target.value)}
            >
              {state.buses.map((b) => (
                <option key={b.id}>{b.id}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="driver-workspace">
          <section className="map-shell driver-map">
            <CampusMap
              buses={state.buses}
              selectedBus={bus.id}
              pin={null}
              focus={focus}
              picking={false}
              onPin={() => {}}
              onBus={chooseBus}
              onStop={(id) => setFocus(atProgress(STOP_PROGRESS[id]))}
              follow={follow}
            />
            <div className="driver-map-card">
              <div>
                <span className="section-label">NEXT STOP</span>
                <h2>{upcoming.name}</h2>
                <p>
                  <Navigation size={14} />
                  {Math.round(
                    ahead(bus.progress, STOP_PROGRESS[upcoming.id]),
                  )}{" "}
                  m along the route
                </p>
              </div>
              <strong>
                {timeLabel(eta(bus, upcoming.id, now))}
                <small>min</small>
              </strong>
            </div>
            <button
              className={`follow-button ${follow ? "selected" : ""}`}
              onClick={() => setFollow(!follow)}
            >
              <LocateFixed size={16} />
              {follow ? "Following bus" : "Follow bus"}
            </button>
          </section>
          <aside className="driver-panel">
            <div className="driver-id">
              <span
                className="large-bus-icon"
                style={{ background: route.color }}
              >
                <BusIcon size={26} />
              </span>
              <div>
                <h2>
                  {bus.id} <span>{bus.plate}</span>
                </h2>
                <p>
                  {route.name} · {bus.driver}
                </p>
              </div>
              <span className="live-dot" />
            </div>
            <div className="driver-stats">
              <div>
                <strong>
                  {occupied(bus.id, state.requests)}
                  <small>/{bus.capacity}</small>
                </strong>
                <span>On board</span>
              </div>
              <div>
                <strong>{waiting.reduce((s, r) => s + r.count, 0)}</strong>
                <span>Waiting</span>
              </div>
              <div>
                <strong>{Math.round(bus.speed)}</strong>
                <span>km/h {bus.mode === "demo" ? "demo" : ""}</span>
              </div>
            </div>
            <div className="gps-box">
              <div>
                <Radio size={17} />
                <strong>
                  {gpsRunning
                    ? "Phone GPS active"
                    : bus.mode === "gps"
                      ? "Waiting for GPS"
                      : "Simulation mode"}
                </strong>
                <span className="count-pill">
                  {bus.offRoute
                    ? "Off route"
                    : now - bus.updatedAt > 20000
                      ? "Outdated"
                      : bus.mode === "demo"
                        ? "DEMO"
                        : `±${Math.round(bus.accuracy || 0)} m`}
                </span>
              </div>
              <p>
                {gpsRunning
                  ? "Keep this page open. Stop sharing when your shift ends."
                  : "Use GPS for a live trial or simulation for a demonstration."}
              </p>
              <button
                className="outline-button full"
                disabled={busy || !connected}
                onClick={toggleGps}
              >
                <LocateFixed size={16} />
                {gpsRunning ? "Stop GPS sharing" : "Share phone GPS"}
              </button>
              {bus.mode === "gps" && !gpsRunning && (
                <button
                  className="text-button"
                  onClick={() =>
                    doAction({ type: "mode", busId: bus.id, mode: "demo" })
                  }
                >
                  Return to simulation
                </button>
              )}
            </div>
            <div className="section-top">
              <h3>Passenger requests</h3>
              <span className="count-pill">{waiting.length}</span>
            </div>
            <div className="driver-requests">
              {waiting.length ? (
                waiting.map((r) => (
                  <div className="request-row" key={r.id}>
                    <span className="avatar small-avatar">
                      {USERS.find((u) => u.id === r.userId)?.initials}
                    </span>
                    <div>
                      <strong>
                        {USERS.find((u) => u.id === r.userId)?.name}{" "}
                        <small>· {r.count} passengers</small>
                      </strong>
                      <p>
                        {stopById(r.from).name} → {stopById(r.to).name}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <Users size={23} />
                  <strong>No passengers waiting</strong>
                  <p>New requests will appear here.</p>
                </div>
              )}
            </div>
            <label className="field-label" htmlFor="arrival-stop">
              Confirm arrival stop
            </label>
            <select
              id="arrival-stop"
              className="standalone-select"
              value={pickup}
              onChange={(e) => setPickup(e.target.value)}
            >
              {route.stopIds.map((id) => (
                <option key={id} value={id}>
                  {stopById(id).name}
                </option>
              ))}
            </select>
            <button
              className="primary-button"
              disabled={busy || !connected}
              onClick={() =>
                doAction(
                  { type: "arrive", busId: bus.id, stopId: pickup },
                  "Arrival confirmed. Passenger records updated.",
                )
              }
            >
              <CheckCircle2 size={17} />
              {bus.mode === "demo"
                ? "Demo: arrive & update passengers"
                : "Arrive & update passengers"}
            </button>
            <p className="microcopy">
              {bus.mode === "demo"
                ? "In demo mode, the bus moves to the selected stop."
                : "GPS must show the bus near the stop."}{" "}
              Passengers get off first, then board as space allows.
            </p>
            {onboard.length > 0 && (
              <div className="onboard-list">
                {onboard.map((r) => (
                  <p key={r.id}>
                    <ArrowDownLeft size={15} />
                    {r.count} passengers get off at{" "}
                    <strong>
                      {stopById(r.to).name}
                      {r.stopRequestedAt && (
                        <small className="stop-request-badge">
                          Stop requested
                        </small>
                      )}
                    </strong>
                  </p>
                ))}
              </div>
            )}
            {bus.mode === "demo" && (
              <button
                className="outline-button full"
                onClick={() => doAction({ type: "pause", busId: bus.id })}
              >
                {bus.paused ? <Play size={16} /> : <Pause size={16} />}{" "}
                {bus.paused ? "Resume simulation" : "Pause simulation"}
              </button>
            )}
            <details className="report-details">
              <summary>
                <Flag size={15} /> Send a report to the office{" "}
                <Plus size={14} />
              </summary>
              <textarea
                aria-label="Driver report"
                placeholder="Example: Traffic congestion near FKE…"
                maxLength={500}
                value={report}
                onChange={(e) => setReport(e.target.value)}
              />
              <button
                className="outline-button full"
                disabled={busy || !report.trim()}
                onClick={async () => {
                  if (
                    await doAction(
                      { type: "report", busId: bus.id, text: report },
                      "Report sent.",
                    )
                  )
                    setReport("");
                }}
              >
                <Send size={15} /> Send report
              </button>
            </details>
          </aside>
        </div>
      </>
    );
  };
  const officeMain = () => {
    if (!state) return null;
    const waiting = state.requests.filter((r) => r.status === "waiting"),
      boarded = state.requests.filter((r) => r.boardedAt),
      completed = state.requests.filter((r) => r.status === "completed");
    const total = (rs: Request[]) => rs.reduce((s, r) => s + r.count, 0);
    const demand = STOPS.map((s) => ({
      ...s,
      count: total(waiting.filter((r) => r.from === s.id)),
    }));
    const max = Math.max(3, ...demand.map((d) => d.count));
    return (
      <>
        <div className="page-heading">
          <div>
            <div className="eyebrow">CAMPUS OPERATIONS</div>
            <h1>
              The bigger picture<span>.</span>
            </h1>
            <p>Monitor demand, buses and journeys in one place.</p>
          </div>
          <button className="outline-button" onClick={exportCsv}>
            <Download size={16} /> Export CSV
          </button>
        </div>
        <div className="metric-grid">
          {[
            {
              label: "Available buses",
              value: state.buses.filter(
                (b) => !b.paused && now - b.updatedAt < 20000,
              ).length,
              icon: BusIcon,
              detail: "Out of 3 demo buses",
            },
            {
              label: "Passengers waiting",
              value: total(waiting),
              icon: Clock,
              detail: `${waiting.length} active requests`,
            },
            {
              label: "Total passengers boarded",
              value: total(boarded),
              icon: Users,
              detail: "Since the demo started",
            },
            {
              label: "Completed journeys",
              value: total(completed),
              icon: CheckCircle2,
              detail: "Passengers who reached their destination",
            },
          ].map((m) => (
            <div className="metric-card" key={m.label}>
              <div>
                <span>{m.label}</span>
                <m.icon size={19} />
              </div>
              <strong>{m.value.toString().padStart(2, "0")}</strong>
              <small>{m.detail}</small>
            </div>
          ))}
        </div>
        <div className="office-grid">
          <section className="white-panel fleet-panel">
            <div className="section-top">
              <div>
                <h2>Fleet status</h2>
                <p className="muted small">
                  Live data shared with the driver view.
                </p>
              </div>
              <span className="soft-badge">
                <span className="live-dot" /> Live
              </span>
            </div>
            <div className="fleet-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>BUS / ROUTE</th>
                    <th>DRIVER</th>
                    <th>PASSENGERS</th>
                    <th>STATUS</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {state.buses.map((b) => (
                    <tr key={b.id}>
                      <td>
                        <div className="table-bus">
                          <span
                            style={{ background: routeById(b.routeId).color }}
                          >
                            <BusIcon size={19} />
                          </span>
                          <div>
                            <strong>{b.id}</strong>
                            <small>{routeById(b.routeId).name}</small>
                          </div>
                        </div>
                      </td>
                      <td>{b.driver}</td>
                      <td>
                        <strong>{occupied(b.id, state.requests)}</strong>
                        <span className="muted"> / {b.capacity}</span>
                      </td>
                      <td>
                        <span
                          className={`status-badge ${b.offRoute || now - b.updatedAt > 20000 ? "warning" : ""}`}
                        >
                          {b.paused
                            ? "Paused"
                            : now - b.updatedAt > 20000
                              ? "GPS outdated"
                              : b.offRoute
                                ? "Off route"
                                : b.mode === "demo"
                                  ? "Simulation"
                                  : "GPS active"}
                        </span>
                      </td>
                      <td>
                        <a
                          href={`/driver?bus=${b.id}`}
                          aria-label={`Open driver view for ${b.id}`}
                        >
                          <ArrowUpRight size={17} />
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
          <section className="white-panel demand-panel">
            <div className="section-top">
              <h2>Demand by stop</h2>
              <span className="count-pill">Waiting</span>
            </div>
            <div className="demand-bars">
              {demand
                .filter((d) => !d.suggested || d.count)
                .map((d) => (
                  <div className="demand-item" key={d.id}>
                    <div>
                      <span>{d.name}</span>
                      <strong>{d.count}</strong>
                    </div>
                    <div className="bar-track">
                      <span style={{ width: `${(d.count / max) * 100}%` }} />
                    </div>
                  </div>
                ))}
            </div>
            <p className="microcopy">
              Actual passenger counts from demo requests.
            </p>
          </section>
          <section className="white-panel requests-panel">
            <div className="section-top">
              <h2>Journey activity</h2>
              <span className="count-pill">
                {state.requests.length} records
              </span>
            </div>
            {state.requests.length ? (
              <div className="activity-list">
                {[...state.requests]
                  .reverse()
                  .slice(0, 12)
                  .map((r) => (
                    <div className="activity-row" key={r.id}>
                      <span className="avatar small-avatar">
                        {USERS.find((u) => u.id === r.userId)?.initials}
                      </span>
                      <div>
                        <strong>
                          {USERS.find((u) => u.id === r.userId)?.name}{" "}
                          <span>
                            · {r.busId} · {r.count} passengers
                          </span>
                        </strong>
                        <p>
                          {stopById(r.from).name} → {stopById(r.to).name}
                        </p>
                      </div>
                      <div>
                        <span
                          className={`status-badge ${r.status === "cancelled" ? "neutral" : ""}`}
                        >
                          {
                            {
                              waiting: "Waiting",
                              onboard: "On board",
                              completed: "Completed",
                              cancelled: "Cancelled",
                            }[r.status]
                          }
                        </span>
                        <small>{clockTime(r.createdAt)}</small>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="empty-state spacious">
                <RouteIcon size={30} />
                <strong>Every journey starts with a request.</strong>
                <p>Open the passenger link or scan a QR code to try it.</p>
                <button
                  className="outline-button"
                  onClick={() => setQrOpen(true)}
                >
                  <QrCode size={16} /> Open demo QR
                </button>
              </div>
            )}
          </section>
          <section className="white-panel">
            <div className="section-top">
              <h2>Service updates</h2>
              <Send size={17} />
            </div>
            <p className="muted small">
              Send an update to passengers and drivers.
            </p>
            <textarea
              aria-label="Office notice"
              value={notice}
              maxLength={250}
              onChange={(e) => setNotice(e.target.value)}
              placeholder="Example: Services are running slowly near FKE."
            />
            <button
              className="primary-button"
              disabled={busy || !notice.trim()}
              onClick={async () => {
                if (
                  await doAction(
                    { type: "notice", text: notice },
                    "Notice published.",
                  )
                )
                  setNotice("");
              }}
            >
              Publish notice <ArrowRight size={16} />
            </button>
            {state.notice && (
              <button
                className="text-button"
                onClick={() =>
                  doAction({ type: "notice", text: "" }, "Notice removed.")
                }
              >
                Remove current notice
              </button>
            )}
            <div className="reports-heading">
              <Flag size={15} />
              <h3>Driver report</h3>
            </div>
            {state.reports.length ? (
              state.reports.slice(0, 5).map((r) => (
                <div className="office-report" key={r.id}>
                  <strong>
                    {r.busId}
                    <small>{clockTime(r.createdAt)}</small>
                  </strong>
                  <p>{r.text}</p>
                </div>
              ))
            ) : (
              <p className="muted small">No reports yet.</p>
            )}
          </section>
        </div>
      </>
    );
  };
  useEffect(() => {
    const id = new URLSearchParams(location.search).get("bus");
    if (["BK01", "BK02", "BK03"].includes(id || "")) setSelectedBus(id!);
  }, []);
  return (
    <div className="app-shell">
      <aside className="app-rail">
        <a className="brand-mark" href={links[role]} aria-label="BasKita home">
          <BusIcon size={25} strokeWidth={1.7} />
        </a>
        <nav
          aria-label={
            role === "passenger" ? "Passenger navigation" : `${role} navigation`
          }
        >
          {role === "passenger" ? (
            <>
              <button
                className={tab === "info" ? "active" : ""}
                aria-pressed={tab === "info"}
                onClick={() => toggleSection("info")}
              >
                <BusIcon size={21} />
                <span>Bus info</span>
              </button>
              <button
                className={tab === "plan" ? "active" : ""}
                aria-pressed={tab === "plan"}
                onClick={() => toggleSection("plan")}
              >
                <RouteIcon size={21} />
                <span>Plan a trip</span>
              </button>
            </>
          ) : role === "driver" ? (
            <a className="active" href={links.driver} aria-current="page">
              <Navigation size={21} />
              <span>Driver</span>
            </a>
          ) : (
            <a className="active" href={links.office} aria-current="page">
              <LayoutDashboard size={21} />
              <span>Office</span>
            </a>
          )}
        </nav>
        <div className="rail-bottom">
          <Leaf size={19} />
          <span>
            GO
            <br />
            TOGETHER
          </span>
        </div>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <a className="wordmark" href={links[role]}>
            bas<span>kita</span>
            <small>UTM</small>
          </a>
          <div className="topbar-center">
            <span className="topbar-divider" /> Campus, connected.
          </div>
          <div className="topbar-right">
            <span className={`connection ${connected ? "" : "offline"}`}>
              <span className="live-dot" />
              {connected ? "Demo connected" : "Reconnecting"}
            </span>
            {role === "passenger" ? (
              <label className="user-picker">
                <span className="avatar">{user.initials}</span>
                <select
                  aria-label="Demo passenger profile"
                  value={userId}
                  onChange={(e) => {
                    setUserId(e.target.value);
                    const url = new URL(location.href);
                    url.searchParams.set("user", e.target.value);
                    history.replaceState(null, "", url);
                  }}
                >
                  {USERS.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} · Demo
                    </option>
                  ))}
                </select>
                <ChevronDown size={13} />
              </label>
            ) : (
              <span className="role-badge">
                {role === "driver" ? "Driver" : "Office"} · Demo
              </span>
            )}
          </div>
        </header>
        <main className={`main-content ${role}`}>
          {state?.notice && (
            <div className="notice-banner">
              <Radio size={17} />
              <strong>Campus notice</strong>
              <span>{state.notice}</span>
            </div>
          )}
          {error && (
            <div className="error-banner" role="alert">
              {error}
              <button aria-label="Dismiss error" onClick={() => setError("")}>
                <X size={16} />
              </button>
            </div>
          )}
          {!state ? (
            <div className="loading-state">
              <span className="loading-ring" />
              <h2>Connecting to campus…</h2>
              <p>Loading buses, stops and your journey.</p>
              {!connected && (
                <p className="microcopy">
                  We will retry automatically. If this continues, check the
                  connection message above.
                </p>
              )}
            </div>
          ) : role === "passenger" ? (
            passengerMain()
          ) : role === "driver" ? (
            driverMain()
          ) : (
            officeMain()
          )}
          <footer className="page-footer">
            <span>
              <Leaf size={13} /> Travel together. A greener campus.
            </span>
            <span>
              Open demo · routes not yet verified{" "}
              <span className="footer-dot">·</span> BasKita © 2026
            </span>
          </footer>
        </main>
      </div>
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={18} />
          {toast}
        </div>
      )}
      {qrOpen && (
        <QrDialog onClose={() => setQrOpen(false)}>
          <div className="section-label">ONE SCAN. ONE JOURNEY.</div>
          <h2>Your campus, at your fingertips.</h2>
          <p>Scan to track buses and request a ride from this stop.</p>
          <label className="field-label" htmlFor="qr-stop">
            QR stop
          </label>
          <select
            id="qr-stop"
            className="standalone-select"
            value={qrStop}
            onChange={(e) => setQrStop(e.target.value)}
          >
            {STOPS.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <div className="qr-image">
            {qr && (
              <img
                src={qr}
                alt={`QR ${stopById(qrStop).name}`}
                width={230}
                height={230}
              />
            )}
          </div>
          <div className="qr-caption">
            <MapPin size={15} />
            {stopById(qrStop).name}
          </div>
          <div className="demo-links">
            <a href={qrUrl} target="_blank" rel="noreferrer">
              <span>
                <MapPin size={16} /> Passenger
              </span>
              <ArrowUpRight size={16} />
            </a>
          </div>
          <p className="microcopy">
            {["localhost", "127.0.0.1"].includes(new URL(origin).hostname)
              ? "This localhost QR only works on this computer. Use the computer’s network address to generate a QR for another phone."
              : "Your phone must be able to reach this demo address."}{" "}
            Three demo passenger profiles are available in the passenger view.
          </p>
        </QrDialog>
      )}
    </div>
  );
}
function BusCard({
  bus,
  active,
  etaValue,
  seats,
  onClick,
}: {
  bus: Bus;
  active: boolean;
  etaValue: number | null;
  seats: number;
  onClick: () => void;
}) {
  const route = routeById(bus.routeId);
  return (
    <button
      className={`bus-card ${active ? "active" : ""}`}
      onClick={onClick}
      aria-pressed={active}
    >
      <span
        className="bus-card-icon"
        style={{ color: route.color, background: route.color + "12" }}
      >
        <BusIcon size={23} />
      </span>
      <div>
        <strong>
          {bus.id} <span>{route.name}</span>
        </strong>
        <small>
          <span className="tiny-dot" style={{ background: route.color }} />
          {seats} seats · {bus.mode === "demo" ? "simulation" : "GPS"}
        </small>
      </div>
      <div className="bus-card-eta">
        <strong>{timeLabel(etaValue)}</strong>
        <small>{etaValue !== null && etaValue >= 30 ? "min" : " "}</small>
      </div>
    </button>
  );
}
function QrDialog({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => previous?.focus();
  }, []);
  return (
    <dialog
      ref={dialog}
      className="qr-dialog"
      onCancel={(e) => {
        e.preventDefault();
        onClose();
      }}
      onClick={(e) => {
        if (e.target === dialog.current) onClose();
      }}
    >
      <button
        className="modal-close"
        aria-label="Close QR dialog"
        onClick={onClose}
      >
        <X size={21} />
      </button>
      {children}
    </dialog>
  );
}
