import React, { useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  Layers,
  MapPin,
  Navigation,
  Shield,
  Smartphone,
  X,
  Zap,
} from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<
    'arch' | 'gps' | 'routing' | 'roads' | 'setup' | 'bestpractices'
  >('arch');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 text-blue-400 rounded-xl border border-blue-500/30">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Pelan Seni Bina Sistem Georujukan & Google Maps Platform
                <span className="text-[10px] bg-blue-500/20 text-blue-300 font-mono px-2 py-0.5 rounded-full border border-blue-500/40">
                  Senior Staff Blueprint
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Spesifikasi penuh penjejakan GPS masa nyata, laluan polyline biru & Snap-to-Roads.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 pt-3 border-b border-slate-800 bg-slate-950/30 overflow-x-auto">
          {[
            { id: 'arch', label: '1. Seni Bina Sistem', icon: Layers },
            { id: 'gps', label: '2. GPS Tracking', icon: Smartphone },
            { id: 'routing', label: '3. Garisan Biru (Routes API)', icon: Navigation },
            { id: 'roads', label: '4. Snap-to-Road (Roads API)', icon: MapPin },
            { id: 'setup', label: '5. Setup GCP & API Key', icon: Shield },
            { id: 'bestpractices', label: '6. Kuota & Bateri', icon: Zap },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2.5 text-xs font-semibold rounded-t-lg transition-colors border-b-2 whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-400 bg-slate-800/60'
                    : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/30'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Modal Body */}
        <div className="flex-1 p-6 overflow-y-auto text-sm space-y-6">
          {/* TAB 1: SENI BINA SISTEM */}
          {activeTab === 'arch' && (
            <div className="space-y-4">
              <div className="bg-blue-950/40 border border-blue-800/50 rounded-xl p-4">
                <h3 className="font-bold text-blue-300 text-sm mb-1 flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-blue-400" />
                  Gambaran Keseluruhan Reka Bentuk 3-Lapisan (3-Tier Architecture)
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Sistem dibina berasaskan standard perusahaan untuk memastikan latensi rendah, keselamatan API Key, dan kecekapan penggunaan kuota Google Maps Platform.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <div className="text-emerald-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Smartphone className="w-4 h-4" /> Lapisan Frontend (Client)
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li><strong>React 19 + TypeScript + Vite</strong></li>
                    <li><strong>SDK Rasmi:</strong> <code className="text-amber-300 font-mono">@vis.gl/react-google-maps</code></li>
                    <li><strong>AdvancedMarkerElement</strong> dengan animasi koordinat interpolated</li>
                    <li><strong>Polyline Rendering</strong> menggunakan Maps JavaScript API</li>
                    <li><strong>HTML5 Geolocation API</strong> (<code className="text-amber-300 font-mono">watchPosition</code>)</li>
                  </ul>
                </div>

                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <div className="text-blue-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Database className="w-4 h-4" /> Lapisan Backend / Gateway
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li><strong>Node.js + Express</strong> (atau Cloud Run Serverless)</li>
                    <li><strong>Reverse Proxy & Rate Limiting:</strong> Membendung penyalahgunaan kuota API</li>
                    <li><strong>Redis In-Memory Cache:</strong> Caching laluan polyline (TTL 30 hari mengikut ToS Google)</li>
                    <li><strong>WebSocket / SSE:</strong> Siaran koordinat bas masa nyata ke semua peranti penumpang</li>
                  </ul>
                </div>

                <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-4">
                  <div className="text-amber-400 font-bold text-xs uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Navigation className="w-4 h-4" /> Google Maps Platform APIs
                  </div>
                  <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside">
                    <li><strong>Maps JavaScript API:</strong> Rendering peta 2D & 3D tiles</li>
                    <li><strong>Routes API:</strong> Pengiraan laluan pintar (<code className="text-amber-300 font-mono">Route.computeRoutes</code>)</li>
                    <li><strong>Roads API:</strong> Snap-to-Roads & pengesanan jalan terdekat</li>
                    <li><strong>Places API (New):</strong> Carian mercu tanda kampus UTM Skudai</li>
                  </ul>
                </div>
              </div>

              {/* Data Flow Diagram Box */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 overflow-x-auto">
                <div className="text-slate-400 font-bold mb-2 text-[11px] uppercase tracking-wider">
                  Aliran Data Masa Nyata (Real-time Flow Sequence):
                </div>
                <pre className="text-blue-300 leading-snug">
{`[Pemandu Bas (GPS)] ──> watchPosition() ──> Filter Jitter (Kalman/Threshold)
       │
       ▼
[Roads API Snap-to-Roads] ──> Snapped LatLng on Lingkaran Ilmu
       │
       ▼
[Backend WebSockets] ──> Broadcast kepada Semua Pelajar Menunggu
       │
       ▼
[Frontend Pelajar] ──> Update AdvancedMarker Bas + Kira ETA + Render Garisan Biru`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 2: GPS TRACKING */}
          {activeTab === 'gps' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base">
                A. Penjejakan Lokasi Pengguna & Pemandu (Real-time GPS Tracking)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Untuk aplikasi web (PWA) dan mobile, kita menggunakan <code className="text-amber-300 font-mono">navigator.geolocation.watchPosition</code> dengan konfigurasi berkecekapan tinggi serta penapis titik lonjakan (jitter filter).
              </p>

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                  <span>Custom React Hook: useRealtimeTracker.ts</span>
                  <span className="text-emerald-400">Clean Production Code</span>
                </div>
                <pre className="text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
{`import { useEffect, useRef, useState } from 'react';

export function useRealtimeTracker() {
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    if (!('geolocation' in navigator)) {
      setError('Geolocation tidak disokong pada pelayar ini.');
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const now = Date.now();
        // Pendikit (throttle): elak render berlebihan setiap 1.5 saat
        if (now - lastUpdateRef.current < 1500) return;
        lastUpdateRef.current = now;

        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setAccuracy(position.coords.accuracy);
        setHeading(position.coords.heading ?? null);
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true, // Guna cip GPS perkakasan
        maximumAge: 2000,         // Guna cache maks 2 saat
        timeout: 10000,           // Had masa tindak balas 10s
      }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  return { coords, accuracy, heading, error };
}`}
                </pre>
              </div>

              <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 text-xs space-y-2">
                <h4 className="font-bold text-amber-300">Cara Mengaktifkan Penjejakan Latar Belakang (Background Updates):</h4>
                <ul className="list-disc list-inside space-y-1 text-slate-300">
                  <li><strong>Pada Pelayar Web / PWA:</strong> Pasang Web App Manifest dengan <code className="text-amber-200 font-mono">display: standalone</code> dan aktifkan Web Audio / Wakelock API (<code className="text-amber-200 font-mono">navigator.wakeLock.request('screen')</code>) supaya skrin pemandu tidak tidur semasa memandu.</li>
                  <li><strong>Pada Android (Native / Flutter / React Native):</strong> Wajib menggunakan <em>Foreground Service</em> dengan pemberitahuan notifikasi kekal (Persistent Notification) jenis <code className="text-amber-200 font-mono">android:foregroundServiceType="location"</code> dan kebenaran <code className="text-amber-200 font-mono">ACCESS_BACKGROUND_LOCATION</code>.</li>
                  <li><strong>Pada iOS:</strong> Aktifkan <em>Background Modes</em> dengan pilihan <code className="text-amber-200 font-mono">Location updates</code> dan tetapkan <code className="text-amber-200 font-mono">allowsBackgroundLocationUpdates = true</code>.</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: ROUTES API / BLUE POLYLINE */}
          {activeTab === 'routing' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base">
                B. Panduan Garisan Biru (Directions & Route Navigation dengan Routes API)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Penting: Google Maps telah menamatkan perkhidmatan legasi <code className="text-rose-400 font-mono">DirectionsService</code> untuk projek baharu. Kita wajib menggunakan <strong>Routes API</strong> (<code className="text-blue-300 font-mono">Route.computeRoutes</code>) melalui SDK rasmi Maps JavaScript atau <code className="text-blue-300 font-mono">useMapsLibrary('routes')</code> untuk mengelakkan ralat CORS.
              </p>

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                  <span>Komponen React: RoutePolylineRenderer.tsx</span>
                  <span className="text-blue-400">Routes API Modern Standard</span>
                </div>
                <pre className="text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
{`import React, { useEffect, useRef } from 'react';
import { useMap, useMapsLibrary } from '@vis.gl/react-google-maps';

interface RoutePolylineProps {
  origin: google.maps.LatLngLiteral;
  destination: google.maps.LatLngLiteral;
}

export const RoutePolylineRenderer: React.FC<RoutePolylineProps> = ({
  origin,
  destination,
}) => {
  const map = useMap();
  const routesLib = useMapsLibrary('routes');
  const polylineRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    if (!routesLib || !map) return;

    // Bersihkan garisan lama sebelum melukis garisan baharu
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
    }

    const routeService = new (routesLib as any).Route();

    const request = {
      origin,
      destination,
      travelMode: google.maps.TravelMode.DRIVING,
      fields: ['polyline', 'distanceMeters', 'durationMillis', 'viewport'],
    };

    routeService.computeRoutes(request).then((response: any) => {
      if (response.routes && response.routes.length > 0) {
        const primaryRoute = response.routes[0];

        // Lukis Garisan Biru Terang (Vibrant Electric Blue Navigation Polyline)
        const polyline = new google.maps.Polyline({
          path: primaryRoute.polyline.decodedPath,
          strokeColor: '#2563eb', // Biru Navigation Google Maps (#2563eb)
          strokeWeight: 6,
          strokeOpacity: 0.95,
          map,
        });

        polylineRef.current = polyline;

        // Gerakkan kamera untuk memuatkan keseluruhan laluan (Fit Bounds)
        if (primaryRoute.viewport) {
          map.fitBounds(primaryRoute.viewport);
        }
      }
    }).catch((err: any) => {
      console.warn('Routes API call fallback to local waypoints:', err);
    });

    return () => {
      if (polylineRef.current) polylineRef.current.setMap(null);
    };
  }, [map, routesLib, origin, destination]);

  return null;
};`}
                </pre>
              </div>
            </div>
          )}

          {/* TAB 4: ROADS API / SNAP-TO-ROAD */}
          {activeTab === 'roads' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base">
                C. Fungsi Snap-to-Road (Google Roads API)
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Apabila bas bergerak di celah-celah bangunan fakulti (seperti Blok M47 FKA atau Dewan Kuliah L50 UTM), isyarat GPS telefon pemandu boleh tersasar beberapa meter (GPS jitter). <strong>Roads API: Snap to Roads</strong> menjajarkan koordinat mentah kepada garisan jalan raya sebenar dengan interpolasi lengkung jalan yang licin.
              </p>

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-400 mb-2 font-mono">
                  <span>Backend Proxy (Node.js/Express) untuk Roads API</span>
                  <span className="text-amber-400">Snap-to-Roads Service</span>
                </div>
                <pre className="text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
{`// Server-side route handler (/api/snap-to-roads)
import express from 'express';
const router = express.Router();

router.post('/snap-to-roads', async (req, res) => {
  try {
    const { path } = req.body; // Array of { lat, lng }
    if (!path || path.length === 0) {
      return res.status(400).json({ error: 'Path coordinates required' });
    }

    // Format: "lat,lng|lat,lng|..."
    const pathQuery = path.map((p: any) => \`\${p.lat},\${p.lng}\`).join('|');
    const apiKey = process.env.GOOGLE_MAPS_SERVER_KEY;

    // Panggilan ke Google Roads API endpoint
    const url = \`https://roads.googleapis.com/v1/snapToRoads?path=\${encodeURIComponent(pathQuery)}&interpolate=true&key=\${apiKey}\`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.snappedPoints) {
      return res.json({ snappedPoints: path }); // Fallback jika luar liputan
    }

    // Format kemas untuk frontend
    const snappedCoordinates = data.snappedPoints.map((pt: any) => ({
      lat: pt.location.latitude,
      lng: pt.location.longitude,
      placeId: pt.placeId,
      originalIndex: pt.originalIndex,
    }));

    res.json({ success: true, coordinates: snappedCoordinates });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});`}
                </pre>
              </div>

              <div className="bg-emerald-950/40 border border-emerald-800/40 rounded-xl p-4 text-xs text-emerald-200">
                <div className="font-bold flex items-center gap-1.5 mb-1">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Kelebihan Mengaktifkan interpolate=true:
                </div>
                Roads API akan menjana titik perantaraan (waypoints) tambahan secara automatik mengikut selekoh jalan raya sebenar, memastikan ikon bas bergerak lancar tanpa melompat melangkaui selekoh tajam di Lingkaran Ilmu!
              </div>
            </div>
          )}

          {/* TAB 5: SETUP GCP & API KEY */}
          {activeTab === 'setup' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base">
                Langkah Demi Langkah: Persediaan Google Cloud Console & API Key
              </h3>

              <div className="space-y-3 text-xs text-slate-300">
                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
                  <span className="font-bold text-blue-400 block mb-1">
                    Langkah 1: Cipta Projek di Google Cloud Console
                  </span>
                  Layari <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="text-amber-300 underline font-mono">console.cloud.google.com</a>, daftar masuk dan cipta projek baharu dinamakan <strong>UTM-BasKita-Fleet</strong>. Sambungkan akaun pengebilan (Billing Account).
                </div>

                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
                  <span className="font-bold text-blue-400 block mb-1">
                    Langkah 2: Aktifkan 4 API Penting (APIs & Services)
                  </span>
                  Di menu <em>Enabled APIs & Services</em>, cari dan klik <strong>ENABLE</strong> untuk:
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-200 font-mono">
                    <li>1. Maps JavaScript API (Paparan peta interaktif pada pelayar)</li>
                    <li>2. Routes API (Pengiraan laluan masa nyata & jarak)</li>
                    <li>3. Roads API (Fungsi Snap to Roads & Speed Limits)</li>
                    <li>4. Geocoding API (Pertukaran alamat kepada koordinat)</li>
                  </ul>
                </div>

                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
                  <span className="font-bold text-blue-400 block mb-1">
                    Langkah 3: Cipta & Sekat Kunci API (API Key Restrictions - MANDATORY)
                  </span>
                  Jangan sekali-kali biarkan API key tanpa sekatan! Di halaman <em>Credentials</em>:
                  <ul className="list-disc list-inside mt-1 space-y-0.5 text-slate-200">
                    <li><strong>Application Restrictions:</strong> Pilih <em>Web sites (HTTP referrers)</em> dan masukkan domain rasmi anda (contoh: <code className="font-mono text-amber-300">*.run.app/*</code>, <code className="font-mono text-amber-300">https://baskita.utm.my/*</code>).</li>
                    <li><strong>API Restrictions:</strong> Pilih <em>Restrict key</em> dan tandakan hanya 4 API yang diaktifkan di atas.</li>
                  </ul>
                </div>

                <div className="bg-slate-800/60 p-3.5 rounded-xl border border-slate-700">
                  <span className="font-bold text-blue-400 block mb-1">
                    Langkah 4: Masukkan Kunci ke Fail Konfigurasi (.env)
                  </span>
                  Simpan kunci ke dalam fail persekitaran frontend:
                  <pre className="mt-1 p-2 bg-slate-950 rounded text-emerald-400 font-mono">
                    VITE_GOOGLE_MAPS_API_KEY="AIzaSy..."
                  </pre>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: BEST PRACTICES */}
          {activeTab === 'bestpractices' && (
            <div className="space-y-4">
              <h3 className="font-bold text-white text-base">
                Amalan Terbaik: Penjimatan Kuota API & Ketahanan Bateri
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                {/* Quota optimization */}
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2">
                  <h4 className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
                    <Shield className="w-4 h-4 text-amber-400" />
                    Penjimatan Kuota & Kos Google Maps API:
                  </h4>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                    <li>
                      <strong>Route Caching (30 Hari):</strong> Laluan tetap seperti <em>Lingkaran Ilmu UTM</em> tidak berubah setiap saat. Simpan polyline yang telah dikira ke dalam cache pangkalan data/browser (dibenarkan sehingga 30 hari mengikut ToS Google).
                    </li>
                    <li>
                      <strong>Distance Threshold Filtering:</strong> Jangan panggil Routes API setiap detik. Hanya panggil semula jika bas atau penumpang tersasar lebih 50 meter dari laluan asal.
                    </li>
                    <li>
                      <strong>Field Masking yang Tepat:</strong> Jangan minta kesemua medan data. Hanya minta medan yang dipaparkan (contoh: <code className="text-amber-200 font-mono">fields: ['polyline', 'duration']</code>). Ini menjimatkan kos SKU Routes API.
                    </li>
                    <li>
                      <strong>Penggunaan Session Token untuk Carian Tempat:</strong> Guna <code className="text-amber-200 font-mono">AutocompleteSessionToken</code> untuk mengikat sesi taipan carian sehingga pemilihan hentian bas.
                    </li>
                  </ul>
                </div>

                {/* Battery optimization */}
                <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700 space-y-2">
                  <h4 className="font-bold text-emerald-300 flex items-center gap-1.5 text-sm">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    Menjaga Jangka Hayat Bateri Peranti Pemandu & Pelajar:
                  </h4>
                  <ul className="space-y-1.5 text-slate-300 list-disc list-inside">
                    <li>
                      <strong>Dynamic GPS Polling Frequency:</strong> Semasa bas bergerak laju (&gt;20 km/j), aktifkan selang masa 2-3 saat. Semasa bas berhenti menurunkan pelajar di hentian, kurangkan selang masa kepada 10 saat atau gunakan sensor pecutan (accelerometer).
                    </li>
                    <li>
                      <strong>Gunakan requestAnimationFrame & WebGL:</strong> Rendering peta menggunakan WebGL perkakasan (melalui <code className="text-emerald-200 font-mono">@vis.gl/react-google-maps</code>) memindahkan beban grafik ke GPU berkuasa rendah berbanding manipulasi DOM biasa yang memanaskan CPU telefon.
                    </li>
                    <li>
                      <strong>Hentikan Penjejakan Latar Belakang Apabila Selesai Perjalanan:</strong> Segera panggil <code className="text-emerald-200 font-mono">clearWatch()</code> sebaik sahaja pelajar tiba di destinasi atau pemandu mematikan enjin bas (Shift Tamat).
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/80 flex items-center justify-between">
          <div className="text-xs text-slate-400 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            Integrasi Aktif: Lingkaran Ilmu UTM Skudai (7 Hentian Rasmi)
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold transition-colors"
          >
            Tutup Spesifikasi
          </button>
        </div>
      </div>
    </div>
  );
};
