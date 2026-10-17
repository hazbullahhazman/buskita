export type Point = { lat: number; lng: number };
export type Stop = {
  id: string;
  name: string;
  code: string;
  point: Point;
  suggested?: boolean;
};
export type Route = {
  id: string;
  name: string;
  color: string;
  description: string;
  stopIds: string[];
};
export type Bus = {
  id: string;
  plate: string;
  routeId: string;
  driver: string;
  capacity: number;
  progress: number;
  point: Point;
  speed: number;
  mode: "demo" | "gps";
  paused: boolean;
  updatedAt: number;
  lastFixAt: number;
  accuracy: number | null;
  offRoute: boolean;
};
export type Request = {
  id: string;
  userId: string;
  busId: string;
  from: string;
  to: string;
  count: number;
  status: "waiting" | "onboard" | "completed" | "cancelled";
  createdAt: number;
  boardedAt?: number;
  completedAt?: number;
};
export type Report = {
  id: string;
  busId: string;
  text: string;
  createdAt: number;
};
export type State = {
  buses: Bus[];
  requests: Request[];
  reports: Report[];
  notice: string;
  revision: number;
  serverTime: number;
};
export const USERS = [
  { id: "amira", name: "Amira", initials: "AM" },
  { id: "danial", name: "Danial", initials: "DA" },
  { id: "mei", name: "Mei", initials: "ML" },
];
// Imported approximate coordinates from the supplied prototype. NOT a verified UTM route.
export const PATH: Point[] = [
  [1.55215, 103.6382],
  [1.55235, 103.6395],
  [1.55265, 103.64095],
  [1.55325, 103.6421],
  [1.5543, 103.64315],
  [1.5558, 103.6441],
  [1.55745, 103.64455],
  [1.5589, 103.64415],
  [1.5604, 103.6433],
  [1.56155, 103.6423],
  [1.56265, 103.641],
  [1.5623, 103.6392],
  [1.5617, 103.6372],
  [1.5608, 103.6351],
  [1.5598, 103.6335],
  [1.5585, 103.63235],
  [1.5568, 103.63225],
  [1.5554, 103.63265],
  [1.554, 103.63375],
  [1.5531, 103.6351],
  [1.5524, 103.63675],
  [1.55215, 103.6382],
].map(([lat, lng]) => ({ lat, lng }));
export const STOPS: Stop[] = [
  {
    id: "cp",
    name: "Centre Point / DSI",
    code: "01",
    point: { lat: 1.5523, lng: 103.6382 },
  },
  {
    id: "fke",
    name: "FKM / FKE",
    code: "02",
    point: { lat: 1.5578, lng: 103.6445 },
  },
  {
    id: "fka",
    name: "FKA / FABU",
    code: "03",
    point: { lat: 1.5615, lng: 103.643 },
  },
  {
    id: "meranti",
    name: "Arked Meranti",
    code: "04",
    point: { lat: 1.5568, lng: 103.6322 },
  },
  {
    id: "psz",
    name: "Perpustakaan PSZ",
    code: "05",
    point: { lat: 1.5532, lng: 103.6348 },
  },
];
export const PLACES = [
  { id: "cp", name: "Centre Point UTM", point: { lat: 1.5528, lng: 103.639 } },
  {
    id: "fke",
    name: "Fakulti Kejuruteraan Elektrik (FKE)",
    point: { lat: 1.5582, lng: 103.6448 },
  },
  {
    id: "fkm",
    name: "Fakulti Kejuruteraan Mekanikal (FKM)",
    point: { lat: 1.5575, lng: 103.6442 },
  },
  {
    id: "fka",
    name: "Fakulti Kejuruteraan Awam (FKA)",
    point: { lat: 1.5618, lng: 103.6428 },
  },
  {
    id: "meranti",
    name: "Arked Meranti",
    point: { lat: 1.557, lng: 103.6325 },
  },
  {
    id: "psz",
    name: "Perpustakaan Sultanah Zanariah",
    point: { lat: 1.5535, lng: 103.6345 },
  },
];
// Three colour-coded buses use the inherited demo loop until each real route is surveyed.
export const ROUTES: Route[] = [
  {
    id: "budi",
    name: "Lingkaran Budi",
    color: "#752f42",
    description: "All stops · one-way",
    stopIds: ["cp", "fke", "fka", "meranti", "psz"],
  },
  {
    id: "ilmu",
    name: "Lingkaran Ilmu",
    color: "#387763",
    description: "Demo route · one-way",
    stopIds: ["cp", "fke", "fka", "meranti", "psz"],
  },
  {
    id: "kampus",
    name: "Kampus Biru",
    color: "#427b9f",
    description: "Demo route · one-way",
    stopIds: ["cp", "fke", "fka", "meranti", "psz"],
  },
];
export const stopById = (id: string) => STOPS.find((s) => s.id === id)!;
export const routeById = (id: string) => ROUTES.find((r) => r.id === id)!;
