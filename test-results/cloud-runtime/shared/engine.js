import { PATH, STOPS, ROUTES, routeById, stopById, } from "./model.js";
export function distance(a, b) {
    const rad = Math.PI / 180;
    const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
    const h = Math.sin(dLat / 2) ** 2 +
        Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
    return 6371000 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}
export const SEGMENTS = PATH.slice(0, -1).map((p, i) => distance(p, PATH[i + 1]));
export const LENGTH = SEGMENTS.reduce((a, b) => a + b, 0);
export const wrap = (s) => ((s % LENGTH) + LENGTH) % LENGTH;
export const ahead = (from, to) => wrap(to - from);
export function atProgress(progress) {
    let remaining = wrap(progress);
    for (let i = 0; i < SEGMENTS.length; i++) {
        if (remaining <= SEGMENTS[i]) {
            const t = remaining / SEGMENTS[i];
            return {
                lat: PATH[i].lat + (PATH[i + 1].lat - PATH[i].lat) * t,
                lng: PATH[i].lng + (PATH[i + 1].lng - PATH[i].lng) * t,
            };
        }
        remaining -= SEGMENTS[i];
    }
    return PATH[0];
}
export function match(point, previous) {
    let cumulative = 0;
    let best = {
        progress: 0,
        point: PATH[0],
        distance: Infinity,
        score: Infinity,
    };
    for (let i = 0; i < SEGMENTS.length; i++) {
        const a = PATH[i], b = PATH[i + 1];
        const x = (b.lng - a.lng) * Math.cos((a.lat * Math.PI) / 180), y = b.lat - a.lat;
        const px = (point.lng - a.lng) * Math.cos((a.lat * Math.PI) / 180), py = point.lat - a.lat;
        const t = Math.max(0, Math.min(1, (px * x + py * y) / (x * x + y * y)));
        const p = {
            lat: a.lat + (b.lat - a.lat) * t,
            lng: a.lng + (b.lng - a.lng) * t,
        };
        const d = distance(point, p), progress = cumulative + t * SEGMENTS[i];
        const delta = previous === undefined
            ? 0
            : Math.min(ahead(previous, progress), ahead(progress, previous));
        const score = d + delta * 0.08;
        if (score < best.score)
            best = { progress, point: p, distance: d, score };
        cumulative += SEGMENTS[i];
    }
    return best;
}
// Fill large gaps with proposed demo stops. Actual roadside access must be surveyed.
const original = STOPS.map((s) => ({
    stop: s,
    progress: match(s.point).progress,
})).sort((a, b) => a.progress - b.progress);
let proposedIndex = 6;
for (let i = 0; i < original.length; i++) {
    const from = original[i].progress, to = original[(i + 1) % original.length].progress;
    const gap = ahead(from, to), parts = Math.ceil(gap / 500);
    for (let j = 1; j < parts; j++) {
        const code = String(proposedIndex++).padStart(2, "0");
        STOPS.push({
            id: `demo-${code}`,
            code,
            name: `Stop ${code}`,
            point: atProgress(from + (gap * j) / parts),
            suggested: true,
        });
    }
}
STOPS.sort((a, b) => match(a.point).progress - match(b.point).progress);
const startIndex = STOPS.findIndex((s) => s.id === "cp");
STOPS.push(...STOPS.splice(0, startIndex));
for (const route of ROUTES)
    route.stopIds = STOPS.map((s) => s.id);
export const STOP_PROGRESS = Object.fromEntries(STOPS.map((s) => [s.id, match(s.point).progress]));
export function nearestStop(point, ids = STOPS.map((s) => s.id)) {
    return STOPS.filter((s) => ids.includes(s.id)).reduce((best, s) => distance(point, s.point) < distance(point, best.point) ? s : best);
}
export const occupied = (busId, requests) => requests
    .filter((r) => r.busId === busId && r.status === "onboard")
    .reduce((a, r) => a + r.count, 0);
export function nextStop(bus) {
    return routeById(bus.routeId)
        .stopIds.map(stopById)
        .sort((a, b) => ahead(bus.progress, STOP_PROGRESS[a.id]) -
        ahead(bus.progress, STOP_PROGRESS[b.id]))[0];
}
export function eta(bus, stopId, now = Date.now()) {
    if (!routeById(bus.routeId).stopIds.includes(stopId) ||
        bus.offRoute ||
        bus.paused ||
        now - bus.updatedAt > 20000)
        return null;
    const d = ahead(bus.progress, STOP_PROGRESS[stopId]);
    if (d < 25)
        return 0;
    const intermediate = routeById(bus.routeId).stopIds.filter((id) => {
        const sd = ahead(bus.progress, STOP_PROGRESS[id]);
        return sd > 25 && sd < d;
    }).length;
    return Math.ceil(d / (Math.max(8, bus.speed) / 3.6) + intermediate * 25);
}
export function processStop(state, busId, stopId) {
    const bus = state.buses.find((b) => b.id === busId);
    if (!bus || !routeById(bus.routeId).stopIds.includes(stopId))
        throw Error("This bus does not serve that stop.");
    let requests = state.requests.map((r) => r.busId === busId && r.to === stopId && r.status === "onboard"
        ? { ...r, status: "completed", completedAt: Date.now() }
        : r);
    let seats = bus.capacity - occupied(busId, requests);
    const eligible = requests
        .filter((r) => r.busId === busId && r.from === stopId && r.status === "waiting")
        .sort((a, b) => a.createdAt - b.createdAt);
    for (const r of eligible) {
        if (r.count > seats)
            break;
        seats -= r.count;
        requests = requests.map((x) => x.id === r.id ? { ...x, status: "onboard", boardedAt: Date.now() } : x);
    }
    return { ...state, requests };
}
export function initialState() {
    return {
        buses: [
            ["BK01", "JTM 2026", "budi", "Razak", LENGTH - 900],
            ["BK02", "JTM 2027", "ilmu", "Hafiz", 1800],
            ["BK03", "JTM 2028", "kampus", "Farah", 3300],
        ].map(([id, plate, routeId, driver, progress]) => ({
            id: String(id),
            plate: String(plate),
            routeId: String(routeId),
            driver: String(driver),
            progress: Number(progress),
            point: atProgress(Number(progress)),
            capacity: 30,
            speed: 22,
            mode: "demo",
            paused: false,
            updatedAt: Date.now(),
            lastFixAt: 0,
            accuracy: null,
            offRoute: false,
        })),
        requests: [],
        reports: [],
        notice: "",
        revision: 0,
        serverTime: Date.now(),
    };
}
