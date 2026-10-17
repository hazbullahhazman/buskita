import { BusStop, CampusLocation, LatLng } from '../types/bus';

// UTM Skudai campus center
export const UTM_CENTER: LatLng = {
  lat: 1.5585,
  lng: 103.6380,
};

export interface RouteWaypoint extends LatLng {
  junction: string;
  roadName: string;
}

export interface UTMRoad {
  id: string;
  name: string;
  category: 'primary' | 'secondary' | 'access';
  color: string;
  path: LatLng[];
  description: string;
}

// High-density waypoints strictly following the actual asphalt roadway of Lingkaran Ilmu (Lingkaran Budi) in UTM Skudai
export const LINGKARAN_BUDI_LOOP: RouteWaypoint[] = [
  // 1. Dataran UTM & DSI (Jalan Universiti / Lingkaran Ilmu)
  {
    lat: 1.55215,
    lng: 103.63820,
    junction: 'Dataran UTM & Dewan Sultan Iskandar (DSI)',
    roadName: 'Lingkaran Ilmu (Selatan)',
  },
  {
    lat: 1.55235,
    lng: 103.63950,
    junction: 'Jalan Susur Canseleri Sultan Ibrahim',
    roadName: 'Lingkaran Ilmu',
  },
  // 2. Near Lot 5 Barbershop & Susur Jalan Budi
  {
    lat: 1.55265,
    lng: 103.64095,
    junction: 'Simpang Lot 5 & Susur Jalan Budi (FKM)',
    roadName: 'Lingkaran Ilmu',
  },
  {
    lat: 1.55325,
    lng: 103.64210,
    junction: 'Lengkungan FKM & Makmal Automotif',
    roadName: 'Lingkaran Ilmu (Tenggara)',
  },
  // 3. Lengkok Kuasa & Jalan Kempas 1 (FKE)
  {
    lat: 1.55430,
    lng: 103.64315,
    junction: 'Simpang Lengkok Kuasa & Blok P FKE',
    roadName: 'Lingkaran Ilmu (Timur)',
  },
  {
    lat: 1.55580,
    lng: 103.64410,
    junction: 'Hadapan Makmal Voltan Tinggi FKE',
    roadName: 'Lingkaran Ilmu',
  },
  // 4. UTM Aerolab (Wind Tunnel) & Jalan Suria
  {
    lat: 1.55745,
    lng: 103.64455,
    junction: 'Berhadapan UTM Aerolab (Aeronautics Tunnel)',
    roadName: 'Lingkaran Ilmu (Timur)',
  },
  {
    lat: 1.55890,
    lng: 103.64415,
    junction: 'Susur Jalan Suria & Pusat Penyelidikan Komposit',
    roadName: 'Lingkaran Ilmu',
  },
  // 5. Faculty of Computing N28A & Language Academy
  {
    lat: 1.56040,
    lng: 103.64330,
    junction: 'Simpang Akademi Bahasa & Pejabat Dekan FC',
    roadName: 'Lingkaran Ilmu (Timur Laut)',
  },
  {
    lat: 1.56155,
    lng: 103.64230,
    junction: 'Hadapan Blok N28 Fakulti Komputeran',
    roadName: 'Lingkaran Ilmu',
  },
  // 6. Nasi Kandar Osman UTM N24 & Pusat Kesihatan (Zon Utara Lingkaran Ilmu)
  {
    lat: 1.56265,
    lng: 103.64100,
    junction: 'Berhadapan Nasi Kandar Osman UTM (N24)',
    roadName: 'Lingkaran Ilmu (Utara)',
  },
  {
    lat: 1.56230,
    lng: 103.63920,
    junction: 'Hadapan Pusat Kesihatan & Susur D07',
    roadName: 'Lingkaran Ilmu (Utara)',
  },
  // 7. Lingkaran Ilmu Selatan D04 / Hadapan D01
  {
    lat: 1.56170,
    lng: 103.63720,
    junction: 'Jalan Lingkaran Ilmu Hadapan Blok D04 & D07',
    roadName: 'Lingkaran Ilmu',
  },
  {
    lat: 1.56080,
    lng: 103.63510,
    junction: 'Simpang Jalan Amal & Blok D01',
    roadName: 'Lingkaran Ilmu (Barat Laut)',
  },
  {
    lat: 1.55980,
    lng: 103.63350,
    junction: 'Lengkungan Barat Laut Lingkaran Ilmu ke Arked Meranti',
    roadName: 'Lingkaran Ilmu',
  },
  // 8. Arked Meranti UTM (Pusat Komersial & Kafetaria Barat)
  {
    lat: 1.55850,
    lng: 103.63235,
    junction: 'Berhadapan Arked Meranti UTM (Pusat Komersial)',
    roadName: 'Lingkaran Ilmu (Barat)',
  },
  {
    lat: 1.55680,
    lng: 103.63225,
    junction: 'Hadapan Kolej Tuanku Canselor (KTC) & Susur KRP',
    roadName: 'Lingkaran Ilmu',
  },
  // 10. Faculty of Built Environment & Surveying (FABU / FKA)
  {
    lat: 1.55540,
    lng: 103.63265,
    junction: 'Hadapan Fakulti Alam Bina & Ukur (FABU)',
    roadName: 'Lingkaran Ilmu (Barat Daya)',
  },
  {
    lat: 1.55400,
    lng: 103.63375,
    junction: 'Susur Jalan Meranti & Blok B03',
    roadName: 'Lingkaran Ilmu',
  },
  // 11. Perpustakaan Sultanah Zanariah & Masjid Sultan Ismail
  {
    lat: 1.55310,
    lng: 103.63510,
    junction: 'Berhadapan Perpustakaan Sultanah Zanariah (PSZ)',
    roadName: 'Lingkaran Ilmu (Selatan-Barat)',
  },
  {
    lat: 1.55240,
    lng: 103.63675,
    junction: 'Laluan Canseleri & Pusat Islam UTM',
    roadName: 'Lingkaran Ilmu',
  },
  // 12. Kembali ke Dataran UTM (Tamat 1 Pusingan Penuh)
  {
    lat: 1.55215,
    lng: 103.63820,
    junction: 'Dataran UTM & Dewan Sultan Iskandar (DSI)',
    roadName: 'Lingkaran Ilmu (Selatan)',
  },
];

export interface LingkaranSector {
  id: string;
  name: string;
  shortLabel: string;
  center: LatLng;
  zoom: number;
  landmarks: string[];
  stops: string[];
  description: string;
}

export const LINGKARAN_ILMU_INFO = {
  name: 'Lingkaran Ilmu',
  code: 'LALUAN-UTM-01',
  fullTitle: 'Jalan Lingkaran Ilmu (Primary Campus Loop Road)',
  totalLengthMeters: 4200,
  formattedLength: '4.2 km',
  speedLimitKmh: 40,
  carriageway: '2 Lorong Berturap Dua Hala (Dual Asphalt Carriageway)',
  totalStops: 7,
  estimatedLapMinutes: 14,
  center: UTM_CENTER,
  overviewZoom: 15.6,
};

export const LINGKARAN_ILMU_SECTORS: LingkaranSector[] = [
  {
    id: 'sektor-selatan',
    name: 'Sektor Selatan (Dataran UTM & DSI)',
    shortLabel: 'Selatan / DSI',
    center: { lat: 1.5522, lng: 103.6382 },
    zoom: 17,
    landmarks: ['Dewan Sultan Iskandar (DSI)', 'Dataran UTM', 'Canseleri Sultan Ibrahim', 'Pusat Islam UTM'],
    stops: ['Hentian DSI (Dataran UTM)'],
    description: 'Titik permulaan bulatan lingkar dan arteri masuk Jalan Universiti.',
  },
  {
    id: 'sektor-timur',
    name: 'Sektor Timur (FKM, FKE & Aerolab)',
    shortLabel: 'Timur / FKE',
    center: { lat: 1.5560, lng: 103.6440 },
    zoom: 17,
    landmarks: ['Fakulti Kejuruteraan Mekanikal (FKM)', 'Fakulti Kejuruteraan Elektrik (FKE)', 'UTM Aerolab Tunnel', 'Pusat Komposit'],
    stops: ['Hentian FKM / FKE'],
    description: 'Zon kejuruteraan dengan lengkungan jalan berturap mengelilingi makmal voltan tinggi.',
  },
  {
    id: 'sektor-utara',
    name: 'Sektor Utara (FC, N24 & KTR)',
    shortLabel: 'Utara / FC-KTR',
    center: { lat: 1.5625, lng: 103.6400 },
    zoom: 17,
    landmarks: ['Fakulti Komputeran (N28)', 'Nasi Kandar Osman (N24)', 'Pusat Kesihatan Universiti', 'Kolej Tun Razak (KTR)'],
    stops: ['Hentian Fakulti Komputeran (FC)', 'Hentian Kolej Tun Razak (KTR)'],
    description: 'Zon puncak utara kampus dengan tumpuan pelajar sains komputer dan kolej kediaman.',
  },
  {
    id: 'sektor-barat',
    name: 'Sektor Barat (KTDI, Arked Meranti & KTC)',
    shortLabel: 'Barat / Meranti',
    center: { lat: 1.5585, lng: 103.6325 },
    zoom: 17,
    landmarks: ['Kolej Tun Dr Ismail (KTDI)', 'Dewan Kuliah L50', 'Arked Meranti Commercial Hub', 'Kolej Tuanku Canselor (KTC)'],
    stops: ['Hentian KTC / Arked Meranti'],
    description: 'Hub komersial utama dengan kafetaria, lintasan pejalan kaki dan perhentian pelajar.',
  },
  {
    id: 'sektor-barat-daya',
    name: 'Sektor Barat Daya (FABU, FKA & PSZ)',
    shortLabel: 'Barat Daya / PSZ',
    center: { lat: 1.5535, lng: 103.6345 },
    zoom: 17,
    landmarks: ['Fakulti Alam Bina & Ukur (FABU)', 'Fakulti Kejuruteraan Awam (FKA)', 'Perpustakaan Sultanah Zanariah (PSZ)'],
    stops: ['Hentian FKA / FABU', 'Hentian Perpustakaan Sultanah Zanariah (PSZ)'],
    description: 'Laluan akademik selatan-barat menghubungkan perpustakaan kembali ke Dataran UTM.',
  },
];

// Key anchors along the real asphalt road of Lingkaran Ilmu for Google Maps Directions API road detection
export const LINGKARAN_ILMU_ANCHORS: LatLng[] = [
  { lat: 1.55215, lng: 103.63820 }, // 1. Dataran UTM / DSI (Selatan)
  { lat: 1.55265, lng: 103.64095 }, // 2. Jalan Budi / FKM Junction
  { lat: 1.55520, lng: 103.64390 }, // 3. FKE / Jalan Kempas 1 (Timur)
  { lat: 1.55950, lng: 103.64330 }, // 4. Language Academy / E03
  { lat: 1.56265, lng: 103.64100 }, // 5. Nasi Kandar Osman UTM N24 (Utara)
  { lat: 1.56170, lng: 103.63720 }, // 6. D04 / D07 (Jalan Lingkaran Ilmu inner curve)
  { lat: 1.55980, lng: 103.63350 }, // 7. Lengkungan ke Arked Meranti (Barat Laut)
  { lat: 1.55850, lng: 103.63235 }, // 8. Arked Meranti UTM (Barat)
  { lat: 1.55450, lng: 103.63270 }, // 9. FABU (Barat Daya)
  { lat: 1.55310, lng: 103.63510 }, // 10. PSZ / Perpustakaan
  { lat: 1.55215, lng: 103.63820 }, // 11. Dataran UTM (Kembali ke permulaan)
];


// Major roads across UTM Skudai Campus for visual highlighting and Snap-To-Roads matching
export const UTM_MAJOR_ROADS: UTMRoad[] = [
  {
    id: 'road-lingkaran-ilmu',
    name: 'Lingkaran Ilmu (Ring Road Utama UTM)',
    category: 'primary',
    color: '#2563eb', // Blue navigation highlight
    description: 'Jalan lingkaran sekeliling zon akademik utama UTM Skudai merangkumi kesemua 7 hentian bas.',
    path: LINGKARAN_BUDI_LOOP.map((w) => ({ lat: w.lat, lng: w.lng })),
  },
  {
    id: 'road-jalan-universiti',
    name: 'Jalan Universiti (Pintu Gerbang Utama ke Dataran)',
    category: 'primary',
    color: '#0ea5e9',
    description: 'Arteri utama menghubungkan Pintu Gerbang Skudai ke Bulatan Canseleri dan Dataran UTM.',
    path: [
      { lat: 1.54500, lng: 103.63850 },
      { lat: 1.54750, lng: 103.63840 },
      { lat: 1.55000, lng: 103.63830 },
      { lat: 1.55215, lng: 103.63820 },
    ],
  },
  {
    id: 'road-jalan-budi',
    name: 'Jalan Budi (Hubungan FKM & Pusat Sukan)',
    category: 'secondary',
    color: '#38bdf8',
    description: 'Menghubungkan Lingkaran Ilmu ke Kompleks Sukan UTM dan Stadium Azman Hashim.',
    path: [
      { lat: 1.55265, lng: 103.64095 },
      { lat: 1.55050, lng: 103.64400 },
      { lat: 1.54880, lng: 103.64750 },
    ],
  },
  {
    id: 'road-jalan-meranti',
    name: 'Jalan Meranti (Zon Kolej Kediaman Barat)',
    category: 'secondary',
    color: '#38bdf8',
    description: 'Laluan alternatif menghubungkan Kolej Tuanku Canselor, Arked Meranti ke Pusat Islam.',
    path: [
      { lat: 1.55875, lng: 103.63235 },
      { lat: 1.55600, lng: 103.63000 },
      { lat: 1.55350, lng: 103.63150 },
      { lat: 1.55310, lng: 103.63510 },
    ],
  },
  {
    id: 'road-jalan-resak',
    name: 'Jalan Resak (Akses Kolej KTR & KTDI)',
    category: 'secondary',
    color: '#38bdf8',
    description: 'Akses masuk ke blok kediaman Kolej Tun Razak dan kuarters kakitangan.',
    path: [
      { lat: 1.56320, lng: 103.63960 },
      { lat: 1.56600, lng: 103.63980 },
      { lat: 1.56800, lng: 103.63900 },
    ],
  },
];


export const BUS_STOPS: BusStop[] = [
  {
    id: 'stop-dsi',
    code: 'B01',
    name: 'Dataran UTM & Dewan Sultan Iskandar (DSI)',
    shortName: 'Dataran / DSI',
    coordinates: { lat: 1.5523, lng: 103.6382 },
    landmarks: ['Dewan Sultan Iskandar', 'Dataran UTM', 'Pejabat Pentadbiran Pusat', 'Bank Islam ATM'],
    routeIndex: 0,
    shelterType: 'Hentian Utama (Berbumbung Besar & Berbangku)',
    description: 'Pusat tumpuan majlis konvokesyen, dewan peperiksaan dan terminal sambungan bas.',
  },
  {
    id: 'stop-fkm-fke',
    code: 'B02',
    name: 'Fakulti Kejuruteraan Mekanikal & Elektrik (FKM/FKE)',
    shortName: 'FKM / FKE',
    coordinates: { lat: 1.5578, lng: 103.6445 },
    landmarks: ['Fakulti Kejuruteraan Mekanikal (FKM)', 'Fakulti Kejuruteraan Elektrik (FKE)', 'Makmal Robotik & CAD'],
    routeIndex: 4,
    shelterType: 'Perhentian Pelajar Berbumbung',
    description: 'Akses terus ke bengkel mekanikal, makmal kuasa, dan dewan kuliah kejuruteraan.',
  },
  {
    id: 'stop-fka-fabu',
    code: 'B03',
    name: 'Fakulti Kejuruteraan Awam & Alam Bina (FKA/FABU)',
    shortName: 'FKA / FABU',
    coordinates: { lat: 1.5615, lng: 103.6430 },
    landmarks: ['Fakulti Kejuruteraan Awam (FKA)', 'Fakulti Alam Bina dan Ukur (FABU)', 'Studio Senibina', 'Makmal Struktur Hidraulik'],
    routeIndex: 6,
    shelterType: 'Hentian Utama Berbumbung',
    description: 'Berhadapan dengan blok M47 FKA dan jambatan penghubung FABU.',
  },
  {
    id: 'stop-ktr',
    code: 'B04',
    name: 'Kolej Tun Razak (KTR)',
    shortName: 'Kolej KTR',
    coordinates: { lat: 1.5632, lng: 103.6385 },
    landmarks: ['Kolej Tun Razak', 'Kafeteria KTR', 'Pondok Pengawal KTR', 'Padang Bola KTR'],
    routeIndex: 8,
    shelterType: 'Perhentian Berbumbung Kolej Kediaman',
    description: 'Laluan utama keluar masuk mahasiswa Kolej Tun Razak dan blok asrama KTR 1-12.',
  },
  {
    id: 'stop-krp',
    code: 'B05',
    name: 'Kolej Rahman Putra (KRP)',
    shortName: 'Kolej KRP',
    coordinates: { lat: 1.5612, lng: 103.6335 },
    landmarks: ['Kolej Rahman Putra', 'Kafe Siswa KRP', 'Surau Al-Falah KRP', 'Gelanggang Futsal'],
    routeIndex: 10,
    shelterType: 'Perhentian Kolej Berbumbung',
    description: 'Hentian di hadapan pejabat pentadbiran Kolej Rahman Putra.',
  },
  {
    id: 'stop-ktc-meranti',
    code: 'B06',
    name: 'Kolej Tuanku Canselor & Arked Meranti',
    shortName: 'KTC / Meranti',
    coordinates: { lat: 1.5568, lng: 103.6322 },
    landmarks: ['Arked Meranti', 'Medan Selera Meranti', 'Kolej Tuanku Canselor (KTC)', 'Kedai Cetak & Buku'],
    routeIndex: 12,
    shelterType: 'Hentian Pusat Komersial Pelajar',
    description: 'Pusat makanan dan keperluan pelajar paling sibuk di waktu tengah hari & makan malam.',
  },
  {
    id: 'stop-psz',
    code: 'B07',
    name: 'Perpustakaan Sultanah Zanariah & Bangunan Canseleri',
    shortName: 'Perpustakaan PSZ',
    coordinates: { lat: 1.5532, lng: 103.6348 },
    landmarks: ['Perpustakaan Sultanah Zanariah (PSZ)', 'Bangunan Canseleri Sultan Ibrahim', 'Pusat Islam UTM', 'Pejabat Hal Ehwal Pelajar'],
    routeIndex: 14,
    shelterType: 'Hentian Utama Pusat Sumber',
    description: 'Hab kajian mahasiswa, perpustakaan utama 24 jam dan urusan pentadbiran universiti.',
  },
];

// Campus destinations in UTM for auto-matching to nearest bus stop
export const CAMPUS_LOCATIONS: CampusLocation[] = [
  {
    id: 'loc-fka',
    name: 'Fakulti Kejuruteraan Awam (FKA)',
    category: 'Fakulti',
    nearestStopId: 'stop-fka-fabu',
    coordinates: { lat: 1.5618, lng: 103.6428 },
  },
  {
    id: 'loc-fabu',
    name: 'Fakulti Alam Bina & Ukur (FABU)',
    category: 'Fakulti',
    nearestStopId: 'stop-fka-fabu',
    coordinates: { lat: 1.5610, lng: 103.6435 },
  },
  {
    id: 'loc-fkm',
    name: 'Fakulti Kejuruteraan Mekanikal (FKM)',
    category: 'Fakulti',
    nearestStopId: 'stop-fkm-fke',
    coordinates: { lat: 1.5575, lng: 103.6442 },
  },
  {
    id: 'loc-fke',
    name: 'Fakulti Kejuruteraan Elektrik (FKE)',
    category: 'Fakulti',
    nearestStopId: 'stop-fkm-fke',
    coordinates: { lat: 1.5582, lng: 103.6448 },
  },
  {
    id: 'loc-fc',
    name: 'Fakulti Komputeran (FC)',
    category: 'Fakulti',
    nearestStopId: 'stop-fkm-fke',
    coordinates: { lat: 1.5560, lng: 103.6432 },
  },
  {
    id: 'loc-ktr',
    name: 'Kolej Tun Razak (KTR)',
    category: 'Kolej Kediaman',
    nearestStopId: 'stop-ktr',
    coordinates: { lat: 1.5635, lng: 103.6388 },
  },
  {
    id: 'loc-krp',
    name: 'Kolej Rahman Putra (KRP)',
    category: 'Kolej Kediaman',
    nearestStopId: 'stop-krp',
    coordinates: { lat: 1.5615, lng: 103.6332 },
  },
  {
    id: 'loc-ktc',
    name: 'Kolej Tuanku Canselor (KTC)',
    category: 'Kolej Kediaman',
    nearestStopId: 'stop-ktc-meranti',
    coordinates: { lat: 1.5565, lng: 103.6318 },
  },
  {
    id: 'loc-meranti',
    name: 'Arked Meranti (Medan Selera & Servis)',
    category: 'Kemudahan',
    nearestStopId: 'stop-ktc-meranti',
    coordinates: { lat: 1.5570, lng: 103.6325 },
  },
  {
    id: 'loc-psz',
    name: 'Perpustakaan Sultanah Zanariah (PSZ)',
    category: 'Kemudahan',
    nearestStopId: 'stop-psz',
    coordinates: { lat: 1.5535, lng: 103.6345 },
  },
  {
    id: 'loc-dsi',
    name: 'Dewan Sultan Iskandar (DSI)',
    category: 'Pentadbiran & Khidmat',
    nearestStopId: 'stop-dsi',
    coordinates: { lat: 1.5524, lng: 103.6380 },
  },
  {
    id: 'loc-dataran',
    name: 'Dataran UTM & Pejabat Canseleri',
    category: 'Pentadbiran & Khidmat',
    nearestStopId: 'stop-dsi',
    coordinates: { lat: 1.5521, lng: 103.6385 },
  },
  {
    id: 'loc-centrepoint',
    name: 'UTM Centre Point / Substation',
    category: 'Pentadbiran & Khidmat',
    nearestStopId: 'stop-dsi',
    coordinates: { lat: 1.5528, lng: 103.6390 },
  },
];

// Calculate distance between two lat/lng in meters (Haversine Formula)
export function calculateDistanceMeters(p1: LatLng, p2: LatLng): number {
  const R = 6371e3; // metres
  const phi1 = (p1.lat * Math.PI) / 180;
  const phi2 = (p2.lat * Math.PI) / 180;
  const deltaPhi = ((p2.lat - p1.lat) * Math.PI) / 180;
  const deltaLambda = ((p2.lng - p1.lng) * Math.PI) / 180;

  const a =
    Math.sin(deltaPhi / 2) * Math.sin(deltaPhi / 2) +
    Math.cos(phi1) * Math.cos(phi2) * Math.sin(deltaLambda / 2) * Math.sin(deltaLambda / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

// Find nearest bus stop for any arbitrary coordinate or campus destination
export function findNearestStop(coords: LatLng): BusStop {
  let nearest = BUS_STOPS[0];
  let minDistance = Infinity;

  for (const stop of BUS_STOPS) {
    const dist = calculateDistanceMeters(coords, stop.coordinates);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = stop;
    }
  }

  return nearest;
}

// Find nearest campus location or landmark for any clicked coordinate
export function findNearestLocation(coords: LatLng): CampusLocation {
  let nearest = CAMPUS_LOCATIONS[0];
  let minDistance = Infinity;

  for (const loc of CAMPUS_LOCATIONS) {
    const dist = calculateDistanceMeters(coords, loc.coordinates);
    if (dist < minDistance) {
      minDistance = dist;
      nearest = loc;
    }
  }

  return nearest;
}

// Verify if bus driver is currently maintaining the Lingkaran Ilmu route
export function checkDriverOnRoute(coords: LatLng): {
  isOnRoute: boolean;
  minDistanceMeters: number;
  nearestJunction: string;
} {
  let minDistance = Infinity;
  let nearestJunction = LINGKARAN_BUDI_LOOP[0].junction;

  for (const wp of LINGKARAN_BUDI_LOOP) {
    const dist = calculateDistanceMeters(coords, wp);
    if (dist < minDistance) {
      minDistance = dist;
      nearestJunction = wp.junction;
    }
  }

  return {
    isOnRoute: minDistance <= 65,
    minDistanceMeters: Math.round(minDistance),
    nearestJunction,
  };
}

export function snapToUTMRoad(rawCoord: LatLng): {
  snappedCoord: LatLng;
  roadName: string;
  distanceFromRoadMeters: number;
  isOnRoute: boolean;
} {
  let closestPoint: LatLng = LINGKARAN_BUDI_LOOP[0];
  let minDistance = Infinity;
  let detectedRoad = 'Lingkaran Ilmu';

  for (const road of UTM_MAJOR_ROADS) {
    for (let i = 0; i < road.path.length - 1; i++) {
      const p1 = road.path[i];
      const p2 = road.path[i + 1];

      const dx = p2.lng - p1.lng;
      const dy = p2.lat - p1.lat;
      const lenSq = dx * dx + dy * dy;

      let t = 0;
      if (lenSq > 0) {
        t = ((rawCoord.lng - p1.lng) * dx + (rawCoord.lat - p1.lat) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
      }

      const proj: LatLng = {
        lat: p1.lat + t * dy,
        lng: p1.lng + t * dx,
      };

      const dist = calculateDistanceMeters(rawCoord, proj);
      if (dist < minDistance) {
        minDistance = dist;
        closestPoint = proj;
        detectedRoad = road.name;
      }
    }
  }

  return {
    snappedCoord: closestPoint,
    roadName: detectedRoad,
    distanceFromRoadMeters: Math.round(minDistance),
    isOnRoute: minDistance <= 35,
  };
}
