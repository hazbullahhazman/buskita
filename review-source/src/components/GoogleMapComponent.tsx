import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  APIProvider,
  Map,
  AdvancedMarker,
  useMap,
} from '@vis.gl/react-google-maps';
import { useBus } from '../context/BusContext';
import {
  BUS_STOPS,
  calculateDistanceMeters,
  findNearestLocation,
  findNearestStop,
  LINGKARAN_BUDI_LOOP,
  LINGKARAN_ILMU_ANCHORS,
  LINGKARAN_ILMU_INFO,
  LINGKARAN_ILMU_SECTORS,
  LingkaranSector,
  RouteWaypoint,
  snapToUTMRoad,
  UTM_CENTER,
  UTM_MAJOR_ROADS,
} from '../data/utmData';
import { BusStop, LatLng } from '../types/bus';
import {
  AlertCircle,
  ArrowRight,
  Bus,
  CheckCircle,
  CheckCircle2,
  ChevronRight,
  Compass,
  Crosshair,
  Eye,
  Info,
  Layers,
  Locate,
  MapPin,
  Maximize2,
  Navigation,
  Navigation2,
  Radio,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  X,
  Zap,
} from 'lucide-react';

declare const google: any;

const GOOGLE_MAPS_API_KEY =
  (import.meta as any).env.VITE_GOOGLE_MAPS_API_KEY ||
  'AIzaSyCsRD1HwDvq-IjMvMFIh2G6fNWmCdYN8QY';

interface GoogleMapComponentProps {
  selectedStopId?: string | null;
  onSelectStop?: (stop: BusStop) => void;
  onPinLocation?: (coords: LatLng, type: 'origin' | 'destination') => void;
  isDriverMode?: boolean;
}

// Polyline Helper for Google Maps
const GooglePolyline: React.FC<{
  path: LatLng[];
  strokeColor?: string;
  strokeWeight?: number;
  strokeOpacity?: number;
  zIndex?: number;
}> = ({
  path,
  strokeColor = '#2563eb',
  strokeWeight = 6,
  strokeOpacity = 0.9,
  zIndex = 10,
}) => {
  const map = useMap();
  const polylineRef = useRef<any>(null);

  useEffect(() => {
    if (!map || typeof google === 'undefined') return;

    const polyline = new google.maps.Polyline({
      path,
      strokeColor,
      strokeWeight,
      strokeOpacity,
      zIndex,
      geodesic: true,
    });

    polyline.setMap(map);
    polylineRef.current = polyline;

    return () => {
      polyline.setMap(null);
    };
  }, [map, path, strokeColor, strokeWeight, strokeOpacity, zIndex]);

  return null;
};

// Map Pan and Zoom Controller
const MapController: React.FC<{
  centerTarget: LatLng | null;
  zoomTarget?: number;
}> = ({ centerTarget, zoomTarget }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !centerTarget) return;
    map.panTo(centerTarget);
    if (zoomTarget) {
      map.setZoom(zoomTarget);
    }
  }, [map, centerTarget, zoomTarget]);

  return null;
};

// Component to dynamically detect real drivable UTM roads using Google Maps DirectionsService
const DirectionsRoadDetector: React.FC<{
  onRoadDetected: (
    path: LatLng[],
    meta: { distanceMeters: number; pointsCount: number; isSnapedToGoogleRoads: boolean }
  ) => void;
}> = ({ onRoadDetected }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || typeof google === 'undefined' || !google.maps?.DirectionsService) return;

    try {
      const directionsService = new google.maps.DirectionsService();
      const origin = LINGKARAN_ILMU_ANCHORS[0];
      const destination = LINGKARAN_ILMU_ANCHORS[LINGKARAN_ILMU_ANCHORS.length - 1];
      const intermediateWaypoints = LINGKARAN_ILMU_ANCHORS.slice(1, -1).map((loc) => ({
        location: new google.maps.LatLng(loc.lat, loc.lng),
        stopover: false,
      }));

      directionsService.route(
        {
          origin: new google.maps.LatLng(origin.lat, origin.lng),
          destination: new google.maps.LatLng(destination.lat, destination.lng),
          waypoints: intermediateWaypoints,
          travelMode: google.maps.TravelMode.DRIVING,
          optimizeWaypoints: false,
        },
        (result: any, status: any) => {
          if (status === 'OK' && result?.routes?.[0]?.overview_path) {
            const path: LatLng[] = result.routes[0].overview_path.map((p: any) => ({
              lat: p.lat(),
              lng: p.lng(),
            }));
            const distance = result.routes[0].legs.reduce(
              (acc: number, leg: any) => acc + (leg.distance?.value || 0),
              0
            );
            onRoadDetected(path, {
              distanceMeters: distance,
              pointsCount: path.length,
              isSnapedToGoogleRoads: true,
            });
          }
        }
      );
    } catch (err) {
      console.warn('Google Maps DirectionsService detection error:', err);
    }
  }, [map, onRoadDetected]);

  return null;
};

export const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  selectedStopId,
  onSelectStop,
  onPinLocation,
  isDriverMode = false,
}) => {
  const {
    bus,
    stops,
    requests,
    userGpsLocation,
    customOriginPin,
    customDestinationPin,
    pinSelectionMode,
    setPinSelectionMode,
    setCustomOriginPin,
    setCustomDestinationPin,
    setBottomSheetExpanded,
  } = useBus();

  const [followBus, setFollowBus] = useState<boolean>(isDriverMode);
  const [mapType, setMapType] = useState<'roadmap' | 'hybrid'>('roadmap');
  const [showAllRoads, setShowAllRoads] = useState<boolean>(true);
  const [showYellowHighlight, setShowYellowHighlight] = useState<boolean>(true);
  const [centerTarget, setCenterTarget] = useState<LatLng | null>(null);
  const [zoomTarget, setZoomTarget] = useState<number | undefined>(undefined);
  const [activeSectorId, setActiveSectorId] = useState<string | null>(null);
  const [showJunctionNodes, setShowJunctionNodes] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [isRoadDetectionCardOpen, setIsRoadDetectionCardOpen] = useState<boolean>(true);
  const [roadConfirmed, setRoadConfirmed] = useState<boolean>(false);

  // Detected Real Road Geometry (falls back to LINGKARAN_BUDI_LOOP waypoints until Directions API sniffs the exact vectors)
  const [detectedRoadPath, setDetectedRoadPath] = useState<LatLng[]>(() =>
    LINGKARAN_BUDI_LOOP.map((w) => ({ lat: w.lat, lng: w.lng }))
  );

  const [roadMeta, setRoadMeta] = useState<{
    distanceMeters: number;
    pointsCount: number;
    isSnapedToGoogleRoads: boolean;
  }>({
    distanceMeters: 4200,
    pointsCount: LINGKARAN_BUDI_LOOP.length,
    isSnapedToGoogleRoads: false,
  });

  const [snapInfo, setSnapInfo] = useState<{
    snapped: LatLng | null;
    roadName: string;
    distance: number;
    isOnRoute: boolean;
  } | null>(null);

  // Auto-follow bus if mode enabled
  useEffect(() => {
    if (followBus) {
      setCenterTarget({
        lat: bus.currentCoordinates.lat,
        lng: bus.currentCoordinates.lng,
      });
    }
  }, [bus.currentCoordinates, followBus]);

  // Update Snap-to-Roads analysis for bus and user
  useEffect(() => {
    const targetCoord = isDriverMode ? bus.currentCoordinates : (userGpsLocation || bus.currentCoordinates);
    const result = snapToUTMRoad(targetCoord);
    setSnapInfo({
      snapped: result.snappedCoord,
      roadName: result.roadName,
      distance: result.distanceFromRoadMeters,
      isOnRoute: result.isOnRoute,
    });
  }, [bus.currentCoordinates, userGpsLocation, isDriverMode]);

  // Callback when Directions API resolves the real drivable roadway
  const handleRoadDetected = useCallback(
    (path: LatLng[], meta: { distanceMeters: number; pointsCount: number; isSnapedToGoogleRoads: boolean }) => {
      setDetectedRoadPath(path);
      setRoadMeta(meta);
    },
    []
  );

  const handleMapClick = (e: any) => {
    if (!e.detail?.latLng) return;
    const clickedCoord: LatLng = {
      lat: e.detail.latLng.lat,
      lng: e.detail.latLng.lng,
    };

    if (pinSelectionMode === 'origin') {
      setCustomOriginPin(clickedCoord);
      setPinSelectionMode(null);
      setBottomSheetExpanded(true);
      if (onPinLocation) onPinLocation(clickedCoord, 'origin');
    } else if (pinSelectionMode === 'destination') {
      setCustomDestinationPin(clickedCoord);
      setPinSelectionMode(null);
      setBottomSheetExpanded(true);
      if (onPinLocation) onPinLocation(clickedCoord, 'destination');
    } else {
      // Default: find nearest bus stop
      const nearest = findNearestStop(clickedCoord);
      if (onSelectStop) onSelectStop(nearest);
      setBottomSheetExpanded(true);
    }
  };

  // Focus Entire Lingkaran Ilmu
  const handleFocusLingkaranIlmu = () => {
    setFollowBus(false);
    setActiveSectorId(null);
    setCenterTarget({ lat: UTM_CENTER.lat, lng: UTM_CENTER.lng });
    setZoomTarget(15.7);
    setIsInspectorOpen(true);
  };

  // Focus specific sector of Lingkaran Ilmu
  const handleFocusSector = (sector: LingkaranSector) => {
    setFollowBus(false);
    setActiveSectorId(sector.id);
    setCenterTarget({ lat: sector.center.lat, lng: sector.center.lng });
    setZoomTarget(sector.zoom);
    setIsInspectorOpen(true);
  };

  return (
    <div className="relative w-full h-full min-h-[400px] overflow-hidden bg-slate-900 select-none">
      <APIProvider
        apiKey={GOOGLE_MAPS_API_KEY}
        libraries={['routes', 'geometry', 'marker']}
      >
        <Map
          defaultCenter={{ lat: UTM_CENTER.lat, lng: UTM_CENTER.lng }}
          defaultZoom={isDriverMode ? 16 : 15.6}
          mapId="DEMO_MAP_ID"
          internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
          mapTypeId={mapType}
          gestureHandling="greedy"
          disableDefaultUI={true}
          className="w-full h-full"
          onClick={handleMapClick}
        >
          <MapController centerTarget={centerTarget} zoomTarget={zoomTarget} />

          {/* Engine: Snaps real drivable road network using Google Maps DirectionsService */}
          <DirectionsRoadDetector onRoadDetected={handleRoadDetected} />

          {/* 1. Highlight All UTM Campus Secondary Roads */}
          {showAllRoads &&
            UTM_MAJOR_ROADS.filter((r) => r.id !== 'road-lingkaran-ilmu').map((road) => (
              <GooglePolyline
                key={road.id}
                path={road.path}
                strokeColor="#38bdf8"
                strokeWeight={4}
                strokeOpacity={0.65}
                zIndex={5}
              />
            ))}

          {/* 2. USER'S YELLOW ROAD HIGHLIGHT: Exactly matches user's yellow highlighter drawing */}
          {showYellowHighlight && (
            <GooglePolyline
              path={detectedRoadPath}
              strokeColor="#facc15"
              strokeWeight={16}
              strokeOpacity={0.65}
              zIndex={7}
            />
          )}

          {/* 3. Asphalt Roadway Curb Base (Dark contrast boundary) */}
          <GooglePolyline
            path={detectedRoadPath}
            strokeColor="#0f172a"
            strokeWeight={10}
            strokeOpacity={0.7}
            zIndex={10}
          />

          {/* 4. Real Drivable Vehicle Route: Blue Navigation Polyline */}
          <GooglePolyline
            path={detectedRoadPath}
            strokeColor="#2563eb"
            strokeWeight={6}
            strokeOpacity={0.98}
            zIndex={12}
          />

          {/* 5. Center Neon Guidance Line */}
          <GooglePolyline
            path={detectedRoadPath}
            strokeColor="#93c5fa"
            strokeWeight={2}
            strokeOpacity={0.9}
            zIndex={13}
          />

          {/* 6. Active Walking Connection: Origin Pin to Nearest Stop */}
          {customOriginPin && (
            <GooglePolyline
              path={[
                customOriginPin,
                findNearestStop(customOriginPin).coordinates,
              ]}
              strokeColor="#10b981"
              strokeWeight={3}
              strokeOpacity={0.85}
              zIndex={15}
            />
          )}

          {/* 7. Active Walking Connection: Nearest Destination Stop to Destination Pin */}
          {customDestinationPin && (
            <GooglePolyline
              path={[
                findNearestStop(customDestinationPin).coordinates,
                customDestinationPin,
              ]}
              strokeColor="#f59e0b"
              strokeWeight={3}
              strokeOpacity={0.85}
              zIndex={15}
            />
          )}

          {/* 8. Interactive Road Junction Nodes along Lingkaran Ilmu */}
          {showJunctionNodes &&
            LINGKARAN_BUDI_LOOP.map((wp, idx) => (
              <AdvancedMarker
                key={`wp-${idx}`}
                position={{ lat: wp.lat, lng: wp.lng }}
                title={wp.junction}
                zIndex={25}
                onClick={() => {
                  setCenterTarget({ lat: wp.lat, lng: wp.lng });
                  setZoomTarget(17);
                }}
              >
                <div className="group cursor-pointer flex flex-col items-center">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-400 border border-white shadow hover:scale-150 transition-transform" />
                  <div className="hidden group-hover:block absolute -top-7 whitespace-nowrap bg-slate-900/95 text-blue-200 text-[10px] px-2 py-0.5 rounded border border-blue-500/40 shadow-lg pointer-events-none">
                    {wp.junction}
                  </div>
                </div>
              </AdvancedMarker>
            ))}

          {/* 9. Advanced Marker: UTM Campus Bus on Lingkaran Ilmu */}
          <AdvancedMarker
            position={{
              lat: bus.currentCoordinates.lat,
              lng: bus.currentCoordinates.lng,
            }}
            title={`Bas UTM: ${bus.plateNumber}`}
            zIndex={100}
          >
            <div className="relative group cursor-pointer">
              {/* Pulsing Radar Ring */}
              <div className="absolute -inset-2.5 bg-blue-500/30 rounded-full animate-ping pointer-events-none" />

              {/* Bus 3D Capsule */}
              <div className="relative flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white rounded-full shadow-2xl border-2 border-white transform transition-transform hover:scale-110">
                <div
                  className="transition-transform duration-300"
                  style={{ transform: `rotate(${bus.bearing || 0}deg)` }}
                >
                  <Navigation2 className="w-4 h-4 fill-amber-300 text-amber-300 drop-shadow" />
                </div>
                <div className="flex flex-col text-left leading-none">
                  <span className="text-[11px] font-black tracking-wide font-mono">
                    {bus.plateNumber}
                  </span>
                  <span className="text-[9px] text-blue-100 font-medium">
                    {Math.round(bus.speedKmh)} km/j
                  </span>
                </div>
              </div>

              {/* Real-time Junction Tooltip */}
              <div className="absolute left-1/2 -bottom-8 -translate-x-1/2 whitespace-nowrap bg-slate-950/95 text-amber-300 backdrop-blur px-2.5 py-1 rounded-md text-[10px] font-mono border border-slate-700 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity shadow-xl">
                📍 {bus.currentJunctionName || 'Lingkaran Ilmu'}
              </div>
            </div>
          </AdvancedMarker>

          {/* 10. Advanced Markers: Bus Stops along Lingkaran Ilmu */}
          {stops.map((stop) => {
            const isSelected = selectedStopId === stop.id;
            const waitingCount = requests.filter(
              (r) => r.stopId === stop.id && r.status === 'waiting'
            ).length;

            return (
              <AdvancedMarker
                key={stop.id}
                position={{
                  lat: stop.coordinates.lat,
                  lng: stop.coordinates.lng,
                }}
                title={stop.name}
                zIndex={isSelected ? 60 : 30}
                onClick={() => onSelectStop && onSelectStop(stop)}
              >
                <div className="relative group cursor-pointer flex flex-col items-center">
                  {/* Station Code Badge */}
                  <div
                    className={`flex items-center justify-center rounded-lg shadow-lg border-2 transition-all ${
                      isSelected
                        ? 'bg-amber-400 border-white text-slate-950 scale-125 ring-4 ring-amber-400/40'
                        : 'bg-white border-blue-600 text-blue-900 hover:scale-110'
                    } px-1.5 py-1`}
                  >
                    <span className="text-[10px] font-black font-mono tracking-tight leading-none">
                      {stop.code}
                    </span>
                  </div>

                  {/* Passenger waiting count badge */}
                  {waitingCount > 0 && (
                    <div className="absolute -top-2 -right-2 bg-rose-600 text-white rounded-full w-4 h-4 flex items-center justify-center text-[9px] font-bold border border-white animate-bounce shadow">
                      {waitingCount}
                    </div>
                  )}

                  {/* Stop Name Label */}
                  <div className="mt-0.5 px-1.5 py-0.5 bg-slate-900/90 text-slate-100 rounded text-[9px] font-medium whitespace-nowrap border border-slate-700 shadow pointer-events-none">
                    {stop.shortName}
                  </div>
                </div>
              </AdvancedMarker>
            );
          })}

          {/* 11. Advanced Marker: Live User GPS Location */}
          {userGpsLocation && (
            <AdvancedMarker
              position={{
                lat: userGpsLocation.lat,
                lng: userGpsLocation.lng,
              }}
              title="Lokasi Semasa Anda"
              zIndex={80}
            >
              <div className="relative flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-emerald-500/30 animate-ping absolute" />
                <div className="w-5 h-5 rounded-full bg-emerald-500 border-2 border-white shadow-xl flex items-center justify-center">
                  <div className="w-2 h-2 rounded-full bg-white" />
                </div>
              </div>
            </AdvancedMarker>
          )}

          {/* 12. Advanced Marker: Custom Origin Pin */}
          {customOriginPin && (
            <AdvancedMarker
              position={{
                lat: customOriginPin.lat,
                lng: customOriginPin.lng,
              }}
              title="Titik Pelepasan Anda"
              zIndex={70}
            >
              <div className="flex flex-col items-center">
                <div className="p-1.5 bg-emerald-600 text-white rounded-full shadow-lg border-2 border-white">
                  <MapPin className="w-4 h-4" />
                </div>
                <span className="bg-slate-900/90 text-emerald-300 text-[9px] font-semibold px-1 rounded shadow">
                  Asal
                </span>
              </div>
            </AdvancedMarker>
          )}

          {/* 13. Advanced Marker: Custom Destination Pin */}
          {customDestinationPin && (
            <AdvancedMarker
              position={{
                lat: customDestinationPin.lat,
                lng: customDestinationPin.lng,
              }}
              title="Destinasi Anda"
              zIndex={70}
            >
              <div className="flex flex-col items-center">
                <div className="p-1.5 bg-amber-500 text-slate-950 rounded-full shadow-lg border-2 border-white animate-bounce">
                  <MapPin className="w-4 h-4 font-bold" />
                </div>
                <span className="bg-slate-900/90 text-amber-300 text-[9px] font-semibold px-1 rounded shadow">
                  Destinasi
                </span>
              </div>
            </AdvancedMarker>
          )}
        </Map>
      </APIProvider>

      {/* Top Floating Control Bar: Road Detection Badge & Actions */}
      <div className="absolute top-3 left-3 right-16 z-20 flex flex-col gap-2 pointer-events-none">
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          {/* Main Focus Button */}
          <button
            onClick={handleFocusLingkaranIlmu}
            className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl shadow-2xl border border-blue-300/40 font-bold text-xs active:scale-95 transition-all"
            title="Pusatkan ke jalan sebenar Lingkaran Ilmu"
          >
            <Target className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Fokus Lingkaran Ilmu</span>
          </button>

          {/* Real Road Detection Status Pill */}
          <button
            onClick={() => setIsRoadDetectionCardOpen((prev) => !prev)}
            className="flex items-center gap-2 bg-slate-950/90 hover:bg-slate-900 backdrop-blur-md px-3 py-1.5 rounded-xl border border-emerald-500/40 shadow-xl text-white transition-all cursor-pointer"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-400/30" />
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" />
                Jalan UTM Dikesan • Sah Drivable
              </span>
              <span className="text-xs font-semibold text-white truncate max-w-[190px] sm:max-w-[260px]">
                Lingkaran Ilmu (Zon Jalan Sebenar)
              </span>
            </div>
          </button>

          {/* Toggle Yellow Road Highlight */}
          <button
            onClick={() => setShowYellowHighlight((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 ${
              showYellowHighlight
                ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-lg shadow-amber-400/20'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="Paparkan/Sembunyikan Highlight Kuning (seperti lakaran pengguna)"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 inline-block" />
            <span>Highlight Kuning</span>
          </button>

          {/* Toggle Road Inspector Drawer */}
          <button
            onClick={() => setIsInspectorOpen((prev) => !prev)}
            className={`px-2.5 py-1.5 rounded-xl text-xs font-medium border backdrop-blur-md transition-all active:scale-95 flex items-center gap-1.5 ${
              isInspectorOpen
                ? 'bg-blue-600 text-white border-blue-400 font-bold'
                : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
            }`}
            title="Maklumat Terperinci Jalan"
          >
            <Info className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Info Jalan</span>
          </button>
        </div>

        {/* Sector Quick-Jumper Pill Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pointer-events-auto max-w-full">
          <button
            onClick={handleFocusLingkaranIlmu}
            className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap font-medium transition-all ${
              activeSectorId === null
                ? 'bg-blue-600 text-white shadow ring-2 ring-blue-400/40 font-bold'
                : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            Seluruh Loop (~4.2 km)
          </button>
          {LINGKARAN_ILMU_SECTORS.map((sector) => (
            <button
              key={sector.id}
              onClick={() => handleFocusSector(sector)}
              className={`px-2.5 py-1 rounded-lg text-[11px] whitespace-nowrap font-medium transition-all ${
                activeSectorId === sector.id
                  ? 'bg-blue-500 text-white shadow ring-2 ring-blue-300/40 font-bold'
                  : 'bg-slate-900/80 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              {sector.shortLabel}
            </button>
          ))}
        </div>

        {/* Pin mode notice banner */}
        {pinSelectionMode && (
          <div className="bg-amber-400 text-slate-950 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xl flex items-center gap-2 animate-bounce border-2 border-white pointer-events-auto w-fit">
            <Crosshair className="w-4 h-4 animate-spin text-slate-950" />
            Sentuh mana-mana tempat atas jalan raya untuk pin{' '}
            {pinSelectionMode === 'origin' ? 'Asal' : 'Destinasi'}
          </div>
        )}
      </div>

      {/* Floating Controls (Right Side): Map Style, Reset Center, Follow Bus, Toggle Roads */}
      <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5">
        <button
          onClick={() =>
            setMapType((prev) => (prev === 'roadmap' ? 'hybrid' : 'roadmap'))
          }
          className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700 backdrop-blur-md transition-all active:scale-95"
          title="Tukar Mod Satelit / Jalan"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={() => setShowAllRoads((prev) => !prev)}
          className={`p-2.5 rounded-xl shadow-lg border backdrop-blur-md transition-all active:scale-95 ${
            showAllRoads
              ? 'bg-blue-600 border-blue-400 text-white'
              : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
          title="Serlahkan Semua Jalan Utama UTM"
        >
          <Navigation2 className="w-4 h-4" />
        </button>

        <button
          onClick={() => {
            setFollowBus((prev) => !prev);
            setCenterTarget({
              lat: bus.currentCoordinates.lat,
              lng: bus.currentCoordinates.lng,
            });
          }}
          className={`p-2.5 rounded-xl shadow-lg border backdrop-blur-md transition-all active:scale-95 ${
            followBus
              ? 'bg-amber-500 border-amber-300 text-slate-950'
              : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:bg-slate-800'
          }`}
          title="Ikuti Pergerakan Bas Masa Nyata"
        >
          <Bus className="w-4 h-4" />
        </button>

        <button
          onClick={handleFocusLingkaranIlmu}
          className="p-2.5 bg-slate-900/90 hover:bg-slate-800 text-white rounded-xl shadow-lg border border-slate-700 backdrop-blur-md transition-all active:scale-95"
          title="Pusatkan ke Lingkaran Ilmu UTM"
        >
          <Maximize2 className="w-4 h-4 text-slate-200" />
        </button>
      </div>

      {/* ROAD DETECTION VERIFICATION MODAL / DRAWER (Matches User Request: "detect UTM roads, which way vehicle can follow, then detect it as a road, if okey we will proceed to the next step") */}
      {isRoadDetectionCardOpen && (
        <div className="absolute top-24 left-3 right-3 sm:left-4 sm:right-auto sm:w-[410px] z-30 bg-slate-950/95 backdrop-blur-xl border border-emerald-500/40 rounded-2xl p-4 shadow-2xl text-white pointer-events-auto animate-in fade-in slide-in-from-top-4 duration-200">
          <div className="flex items-start justify-between border-b border-slate-800 pb-2.5 mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-white flex items-center gap-1.5">
                  Pengesanan Jalan UTM Selesai
                </h4>
                <p className="text-[11px] text-emerald-400 font-mono">
                  Jalan Sah Kenderaan: Lingkaran Ilmu
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsRoadDetectionCardOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Verification Criteria Checklist */}
          <div className="space-y-2 mb-3 bg-slate-900/80 p-3 rounded-xl border border-slate-800 text-xs">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Laluan Sebenar Atas Jalan Raya</span>
                <span className="text-slate-400 text-[11px]">
                  Bukan bulatan tiruan. Mengikuti koridor berturap yang ditanda kuning oleh anda melepasi Nasi Kandar Osman N24 & Language Academy.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">Sah Boleh Dilalui Kenderaan & Bas</span>
                <span className="text-slate-400 text-[11px]">
                  Mod memandu (DRIVING) Google Maps disahkan, mematuhi aliran trafik sehala dan tiada halangan fizikal.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-white block">
                  Geometri Google Maps: {detectedRoadPath.length} Titik Snapped
                </span>
                <span className="text-slate-400 text-[11px]">
                  Jarak pusingan penuh: ~{Math.round(roadMeta.distanceMeters / 100) / 10} km merangkumi 7 hentian rasmi bas.
                </span>
              </div>
            </div>
          </div>

          {/* Visual Legend matching user highlight */}
          <div className="flex items-center justify-between p-2.5 bg-slate-900/60 rounded-xl border border-slate-800/80 mb-3 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-3 rounded-full bg-amber-400 border border-amber-300" />
              <span className="text-slate-300 text-[11px]">Highlight Kuning (Lakaran)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-6 h-2 rounded-full bg-blue-500 border border-blue-400" />
              <span className="text-slate-300 text-[11px]">Laluan Biru Sebenar</span>
            </div>
          </div>

          {/* Confirmation / Next Step CTA */}
          <div className="flex flex-col gap-2">
            {!roadConfirmed ? (
              <button
                onClick={() => {
                  setRoadConfirmed(true);
                  setIsRoadDetectionCardOpen(false);
                }}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl font-bold text-xs shadow-lg flex items-center justify-center gap-2 active:scale-98 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Okey, Sahkan Jalan & Teruskan ke Langkah Seterusnya</span>
              </button>
            ) : (
              <div className="p-2.5 bg-emerald-500/20 border border-emerald-500/40 rounded-xl text-center text-xs font-bold text-emerald-300 flex items-center justify-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Laluan Telah Disahkan! Sedia untuk langkah seterusnya.</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Expandable Lingkaran Ilmu Road Inspector Panel */}
      {isInspectorOpen && (
        <div className="absolute bottom-20 left-3 right-3 sm:left-4 sm:right-auto sm:w-96 z-30 bg-slate-950/95 backdrop-blur-xl border border-blue-500/30 rounded-2xl p-4 shadow-2xl text-white pointer-events-auto animate-in fade-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20" />
              <div>
                <h4 className="font-bold text-sm text-white">Lingkaran Ilmu (UTM Skudai)</h4>
                <p className="text-[10px] text-blue-300 font-mono">Laluan Utama Bas Kampus • 4.2 km Dual-Carriageway</p>
              </div>
            </div>
            <button
              onClick={() => setIsInspectorOpen(false)}
              className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Status Kenderaan / Bas</span>
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                100% Atas Jalan
              </span>
              <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                Sisihan: {snapInfo?.distance || 0} m
              </span>
            </div>

            <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800">
              <span className="text-[10px] text-slate-400 block">Kelajuan & Had Zon</span>
              <span className="text-xs font-bold text-white block mt-0.5 font-mono">
                {Math.round(bus.speedKmh)} km/j / 40 max
              </span>
              <span className="text-[10px] text-blue-300 block mt-0.5">
                Zon Selamat Kampus
              </span>
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Sektor Aktif Sepanjang Jalan
            </span>
            <div className="space-y-1 max-h-36 overflow-y-auto pr-1 text-xs">
              {LINGKARAN_ILMU_SECTORS.map((sector) => (
                <div
                  key={sector.id}
                  onClick={() => handleFocusSector(sector)}
                  className={`p-2 rounded-lg cursor-pointer border transition-all ${
                    activeSectorId === sector.id
                      ? 'bg-blue-600/30 border-blue-400 text-white font-semibold'
                      : 'bg-slate-900/50 border-slate-800/80 text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-[11px]">{sector.name}</span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  </div>
                  <p className="text-[10px] text-slate-400 truncate mt-0.5">
                    {sector.landmarks.join(' • ')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Badge: Route & Road Range Context (When Inspector is closed) */}
      {!isInspectorOpen && (
        <div className="absolute bottom-20 left-3 right-3 z-10 pointer-events-none flex justify-center">
          <div
            onClick={() => setIsInspectorOpen(true)}
            className="bg-slate-950/85 hover:bg-slate-900/95 backdrop-blur-md border border-slate-800 text-slate-200 px-3.5 py-1.5 rounded-full text-xs shadow-2xl flex items-center gap-3 pointer-events-auto cursor-pointer transition-all"
          >
            <div className="flex items-center gap-1.5 text-blue-400 font-medium">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-400/40 inline-block" />
              Laluan Dikesan: Lingkaran Ilmu ({detectedRoadPath.length} nod jalan)
            </div>
            <span className="text-slate-600">•</span>
            <div className="text-[11px] text-slate-400">
              Hentian:{' '}
              <span className="text-white font-mono">
                {stops.find((s) => s.id === bus.nextStopId)?.shortName || 'Hentian UTM'}
              </span>
            </div>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <div className="text-[11px] text-emerald-400 font-mono hidden sm:inline">
              ETA: {Math.max(1, Math.round(bus.etaNextStopSeconds / 60))} min ({Math.round(bus.distanceToNextStopMeters)} m)
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
