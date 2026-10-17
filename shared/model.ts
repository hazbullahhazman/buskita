import { ROAD_POINTS } from "./road-data.js";
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
  stopRequestedAt?: number;
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
  geometryVersion?: number;
};
export const USERS = [
  { id: "amira", name: "Amira", initials: "AM" },
  { id: "danial", name: "Danial", initials: "DA" },
  { id: "mei", name: "Mei", initials: "ML" },
];
// Road geometry follows ten connected OSM Lingkaran Ilmu road ways.
export const PATH: Point[] = ROAD_POINTS;
export const STOPS: Stop[] = [
  {
    id: "cp",
    name: "Centre Point Bus Station",
    code: "01",
    point: { lat: 1.5597653, lng: 103.6347894 },
  },
  {
    id: "fke",
    name: "E01 Bus Stop",
    code: "02",
    point: { lat: 1.5597862, lng: 103.6402175 },
  },
  {
    id: "fka",
    name: "D01 Bus Stop",
    code: "03",
    point: { lat: 1.5612454, lng: 103.6365864 },
  },
  {
    id: "meranti",
    name: "Meranti access Â· proposed",
    code: "04",
    point: { lat: 1.5596302, lng: 103.6338512 },
    suggested: true,
  },
  {
    id: "psz",
    name: "PSZ / MSI access Â· proposed",
    code: "05",
    point: { lat: 1.5594424, lng: 103.6369004 },
    suggested: true,
  },
  {
    id: "d05",
    name: "D05 Bus Stop",
    code: "06",
    point: { lat: 1.5615835, lng: 103.6379239 },
  },
  {
    id: "d06",
    name: "D06 Bus Stop",
    code: "07",
    point: { lat: 1.5610613, lng: 103.6394096 },
  },
];
// Building centres and named nodes from the same OSM extract; not surveyed entrances.
export const PLACES = [
  {
    id: "cp",
    name: "Centre Point UTM",
    point: { lat: 1.5597653, lng: 103.6347894 },
  },
  {
    id: "msi",
    name: "Masjid Sultan Ismail (MSI)",
    point: { lat: 1.5592325, lng: 103.6376826 },
  },
  {
    id: "fke",
    name: "E01 Bus Stop",
    point: { lat: 1.5597862, lng: 103.6402175 },
  },
  {
    id: "fkm",
    name: "Faculty of Mechanical Engineering (FKM)",
    point: { lat: 1.5606735, lng: 103.6407014 },
  },
  {
    id: "fka",
    name: "Fakulti Alam Bina dan Ukur (FABU)",
    point: { lat: 1.5588654, lng: 103.6355478 },
  },
  {
    id: "meranti",
    name: "Arked Meranti",
    point: { lat: 1.5596302, lng: 103.6338512 },
  },
  {
    id: "psz",
    name: "Perpustakaan Sultanah Zanariah",
    point: { lat: 1.5594424, lng: 103.6369004 },
  },
];
// All three demo buses share this mapped road loop; official service routes remain unverified.
export const ROUTES: Route[] = [
  {
    id: "budi",
    name: "Lingkaran Budi",
    color: "#752f42",
    description: "All stops Ã‚Â· one-way",
    stopIds: ["cp", "fke", "fka", "meranti", "psz"],
  },
  {
    id: "ilmu",
    name: "Lingkaran Ilmu",
    color: "#387763",
    description: "Demo route Ã‚Â· one-way",
    stopIds: ["cp", "fke", "fka", "meranti", "psz"],
  },
  {
    id: "kampus",
    name: "Kampus Biru",
    color: "#427b9f",
    description: "Demo route Ã‚Â· one-way",
    stopIds: ["cp", "fke", "fka", "meranti", "psz"],
  },
];
export const stopById = (id: string) =>
  STOPS.find((s) => s.id === id) || {
    id,
    name: "Previous demo stop",
    code: "—",
    point: PATH[0],
    suggested: true,
  };
export const routeById = (id: string) => ROUTES.find((r) => r.id === id)!;
