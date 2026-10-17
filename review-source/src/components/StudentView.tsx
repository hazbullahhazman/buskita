import React, { useEffect, useMemo, useState } from 'react';
import { useBus } from '../context/BusContext';
import {
  CAMPUS_LOCATIONS,
  calculateDistanceMeters,
  findNearestLocation,
  findNearestStop,
} from '../data/utmData';
import { BusStop, CampusLocation, LatLng } from '../types/bus';
import {
  ArrowRight,
  Bell,
  Bus,
  Calendar,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Crosshair,
  Footprints,
  Locate,
  MapPin,
  Navigation,
  Sparkles,
  Users,
  XCircle,
} from 'lucide-react';
import { BusScheduleModal } from './BusScheduleModal';

interface StudentViewProps {
  onFocusStop?: (stop: BusStop) => void;
}

export const StudentView: React.FC<StudentViewProps> = ({ onFocusStop }) => {
  const {
    bus,
    stops,
    hailBus,
    userTrip,
    cancelUserTrip,
    getEtaToStop,
    getPassengersWaitingAtStop,
    userGpsLocation,
    customOriginPin,
    customDestinationPin,
    pinSelectionMode,
    setPinSelectionMode,
    requestUserGpsLocation,
    bottomSheetExpanded,
    setBottomSheetExpanded,
  } = useBus();

  const [originLocationId, setOriginLocationId] = useState<string>('loc-centrepoint');
  const [destLocationId, setDestLocationId] = useState<string>('loc-fka');
  const [passengerCount, setPassengerCount] = useState<number>(1);
  const [passengerName, setPassengerName] = useState<string>('Pelajar UTM');
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [isHailing, setIsHailing] = useState<boolean>(false);
  const [isScheduleOpen, setIsScheduleOpen] = useState<boolean>(false);

  // If user dropped custom origin pin on map or got GPS
  useEffect(() => {
    if (customOriginPin) {
      const nearestLoc = findNearestLocation(customOriginPin);
      if (nearestLoc) {
        setOriginLocationId(nearestLoc.id);
      }
    }
  }, [customOriginPin]);

  // If user dropped custom destination pin on map
  useEffect(() => {
    if (customDestinationPin) {
      const nearestLoc = findNearestLocation(customDestinationPin);
      if (nearestLoc) {
        setDestLocationId(nearestLoc.id);
      }
    }
  }, [customDestinationPin]);

  // Request GPS handler
  const handleDetectGps = async () => {
    setIsLocating(true);
    const coords = await requestUserGpsLocation();
    setIsLocating(false);
    if (coords) {
      const nearestLoc = findNearestLocation(coords);
      if (nearestLoc) {
        setOriginLocationId(nearestLoc.id);
      }
      const nearestStation = findNearestStop(coords);
      if (onFocusStop) onFocusStop(nearestStation);
    }
  };

  // Resolve origin location & nearest bus stop
  const originLocation = useMemo(() => {
    return CAMPUS_LOCATIONS.find((l) => l.id === originLocationId) || CAMPUS_LOCATIONS[0];
  }, [originLocationId]);

  const pickupStop = useMemo(() => {
    return stops.find((s) => s.id === originLocation.nearestStopId) || stops[0];
  }, [stops, originLocation]);

  // Resolve destination location & nearest bus stop
  const destLocation = useMemo(() => {
    return CAMPUS_LOCATIONS.find((l) => l.id === destLocationId) || CAMPUS_LOCATIONS[1];
  }, [destLocationId]);

  const dropoffStop = useMemo(() => {
    return stops.find((s) => s.id === destLocation.nearestStopId) || stops[1];
  }, [stops, destLocation]);

  // Walking distance estimations
  const walkDistanceToPickup = Math.round(
    calculateDistanceMeters(originLocation.coordinates, pickupStop.coordinates)
  );
  const walkDistanceToDest = Math.round(
    calculateDistanceMeters(destLocation.coordinates, dropoffStop.coordinates)
  );

  // Live ETA to pickup stop
  const pickupEtaSeconds = getEtaToStop(pickupStop.id);
  const pickupEtaMinutes = Math.max(1, Math.ceil(pickupEtaSeconds / 60));

  const handleHail = () => {
    setIsHailing(true);
    hailBus(pickupStop.id, dropoffStop.id, passengerCount, passengerName);
    if (onFocusStop) {
      onFocusStop(pickupStop);
    }
    setTimeout(() => setIsHailing(false), 500);
  };

  // ACTIVE RIDE (Grab-style live tracking HUD)
  if (userTrip) {
    const userPickup = stops.find((s) => s.id === userTrip.pickupStopId);
    const userDest = stops.find((s) => s.id === userTrip.destinationStopId);

    return (
      <div className="w-full bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-2xl rounded-t-3xl transition-all duration-300">
        {/* Grab-style Drawer Drag Handle */}
        <div
          onClick={() => setBottomSheetExpanded((prev) => !prev)}
          className="w-full pt-3 pb-2 cursor-pointer flex flex-col items-center select-none"
        >
          <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mb-1"></div>
        </div>

        {/* Peek Summary Bar */}
        <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
              <Bus className="w-6 h-6 text-amber-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase tracking-wider font-extrabold text-blue-600 dark:text-blue-400">
                  {userTrip.status === 'waiting'
                    ? 'Pemandu Sedang Menuju Ke Anda'
                    : userTrip.status === 'on_board'
                    ? 'Anda Di Dalam Bas'
                    : 'Tiba Di Destinasi!'}
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              </div>
              <div className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>{userPickup?.shortName}</span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="text-emerald-600 dark:text-emerald-400">{userDest?.shortName}</span>
              </div>
            </div>
          </div>

          <div className="text-right flex items-center gap-3">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Anggaran Tiba</span>
              <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400 tabular-nums">
                ~{userTrip.status === 'waiting' ? pickupEtaMinutes : 0} min
              </span>
            </div>
            <button
              onClick={() => setBottomSheetExpanded((prev) => !prev)}
              className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300"
            >
              {bottomSheetExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Expanded Ride Details */}
        {bottomSheetExpanded && (
          <div className="p-5 max-w-2xl mx-auto space-y-4 max-h-[60vh] overflow-y-auto">
            {/* Grab-style Driver Info Card */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold text-lg">
                  👨‍✈️
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{bus.driverName}</h4>
                  <div className="text-xs text-slate-500 flex items-center gap-2 mt-0.5">
                    <span className="px-1.5 py-0.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded font-mono font-bold text-slate-800 dark:text-slate-200">
                      {bus.plateNumber}
                    </span>
                    <span>·</span>
                    <span>{bus.callSign}</span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="text-xs text-slate-400 block">Kapasiti Bas</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200">
                  {bus.occupiedSeats} / {bus.capacity} kerusi
                </span>
              </div>
            </div>

            {/* Simpang & Road Junction Live Ticker */}
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse shrink-0"></div>
              <div className="text-xs text-amber-950 dark:text-amber-200">
                <span className="font-bold">Lokasi Bas Semasa: </span>
                <span>{bus.currentJunctionName}</span>
                <span className="font-mono text-slate-500 dark:text-slate-400 ml-1">
                  ({Math.round(bus.distanceToNextStopMeters)}m lagi)
                </span>
              </div>
            </div>

            {/* Live Progress Stepper */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center gap-3 text-xs">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold">
                  ✓
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">
                    Notis Dihantar Kepada Pemandu ({userTrip.passengerCount} orang)
                  </span>
                  <span className="text-slate-500 block">Pemandu menerima isyarat untuk berhenti di {userPickup?.shortName}.</span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                    userTrip.status === 'on_board'
                      ? 'bg-blue-600 text-white animate-pulse'
                      : userTrip.status === 'arrived'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  2
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Menaiki Bas (On-Board)</span>
                  <span className="text-slate-500 block">
                    {userTrip.status === 'on_board'
                      ? 'Anda sedang dalam bas menuju destinasi.'
                      : 'Bas sedang menuju ke perhentian anda.'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3 text-xs">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                    userTrip.status === 'arrived'
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-200 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  3
                </div>
                <div>
                  <span className="font-bold text-slate-900 dark:text-white">Tiba di {userDest?.shortName}</span>
                  <span className="text-slate-500 block">Perjalanan selesai.</span>
                </div>
              </div>
            </div>

            {/* Cancel or Done Buttons */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <button
                onClick={cancelUserTrip}
                className="px-4 py-2 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-colors flex items-center gap-1.5"
              >
                <XCircle className="w-4 h-4" />
                <span>Batal Panggilan</span>
              </button>

              {userTrip.status === 'arrived' && (
                <button
                  onClick={cancelUserTrip}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md"
                >
                  Selesai & Rancang Baharu
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  // STANDARD GRAB-STYLE BOTTOM SHEET
  return (
    <div className="w-full bg-white dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800 shadow-2xl rounded-t-3xl transition-all duration-300">
      {/* Grab Drag Handle */}
      <div
        onClick={() => setBottomSheetExpanded((prev) => !prev)}
        className="w-full pt-3 pb-2 cursor-pointer flex flex-col items-center select-none"
      >
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mb-1"></div>
      </div>

      {/* Peek Bar (Always visible) */}
      <div className="px-5 pb-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-bold shadow-md">
            <Bus className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                Bas UTM Lingkaran Budi
              </span>
              <span className="px-1.5 py-0.2 bg-blue-50 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 font-mono text-[10px] font-bold rounded">
                {bus.plateNumber}
              </span>
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-[200px] sm:max-w-sm mt-0.5">
              {bus.currentJunctionName}
            </div>
          </div>
        </div>

        <div className="text-right flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => setIsScheduleOpen(true)}
            className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 border border-amber-500/30 rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0"
            title="Lihat Jadual Waktu Pelepasan & Kekerapan Bas"
          >
            <Calendar className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Jadual</span>
          </button>

          <div>
            <span className="text-[10px] text-slate-400 uppercase font-bold block">ETA Ketibaan</span>
            <span className="text-xl font-black font-mono text-blue-600 dark:text-blue-400 tabular-nums">
              ~{pickupEtaMinutes} Minit
            </span>
          </div>

          <button
            onClick={() => setBottomSheetExpanded((prev) => !prev)}
            className="p-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
            title={bottomSheetExpanded ? 'Kecilkan Panel' : 'Buka Maklumat Penuh'}
          >
            {bottomSheetExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Expanded Content (Inputs, Location Detection, Map Pinning, Grab Breakdown) */}
      {bottomSheetExpanded && (
        <div className="p-5 max-w-3xl mx-auto space-y-4 max-h-[65vh] overflow-y-auto">
          {/* Quick Action Strip: Auto GPS, Pin On Map & Jadual Bas */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={handleDetectGps}
              disabled={isLocating}
              className="py-2.5 px-2 bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Locate className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
              <span className="truncate">{isLocating ? 'Mengesan...' : 'Kesan GPS'}</span>
            </button>

            <button
              onClick={() => {
                setPinSelectionMode('destination');
                // Automatically minimize panel so the map is immediately visible without manual action
                setBottomSheetExpanded(false);
              }}
              className={`py-2.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 border ${
                pinSelectionMode === 'destination'
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md animate-pulse'
                  : 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200 dark:border-slate-700'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="truncate">{pinSelectionMode === 'destination' ? 'Sentuh Peta' : 'Pin Peta'}</span>
            </button>

            <button
              onClick={() => setIsScheduleOpen(true)}
              className="py-2.5 px-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/50 dark:hover:bg-amber-900/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              <Calendar className="w-3.5 h-3.5 text-amber-500" />
              <span className="truncate">Jadual Bas</span>
            </button>
          </div>

          {/* Grab-style Journey Route Cards */}
          <div className="space-y-3 bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
            {/* Origin (Point A) */}
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Lokasi Anda Semasa (Point A)</span>
                </span>
                <span className="text-[11px] text-slate-400 font-normal">
                  Auto-snap ke hentian berdekatan
                </span>
              </div>

              <select
                value={originLocationId}
                onChange={(e) => setOriginLocationId(e.target.value)}
                className="w-full text-xs font-medium bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.category})
                  </option>
                ))}
              </select>

              {/* Station Snap Details */}
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <Footprints className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                <span>
                  Jalan kaki <b>~{walkDistanceToPickup}m</b> ke{' '}
                  <b className="text-slate-900 dark:text-white font-semibold">{pickupStop.shortName}</b> ({pickupStop.code})
                </span>
              </div>
            </div>

            {/* Destination (Point B) */}
            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Destinasi Anda (Point B)</span>
                </span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-normal">
                  Pilih tempat atau pin pada peta
                </span>
              </div>

              <select
                value={destLocationId}
                onChange={(e) => setDestLocationId(e.target.value)}
                className="w-full text-xs font-medium bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              >
                {CAMPUS_LOCATIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name} ({loc.category})
                  </option>
                ))}
              </select>

              {/* Station Snap Details */}
              <div className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                <Footprints className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  Turun di <b className="text-slate-900 dark:text-white">{dropoffStop.shortName}</b> ({dropoffStop.code}) ➔ Jalan kaki <b>~{walkDistanceToDest}m</b> ke {destLocation.name}
                </span>
              </div>
            </div>
          </div>

          {/* Passenger Count & Identity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Nama / ID Mahasiswa:
              </label>
              <input
                type="text"
                value={passengerName}
                onChange={(e) => setPassengerName(e.target.value)}
                placeholder="Nama anda"
                className="w-full text-xs bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2.5 text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 dark:text-slate-300 block mb-1">
                Bilangan Penumpang:
              </label>
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((cnt) => (
                  <button
                    key={cnt}
                    type="button"
                    onClick={() => setPassengerCount(cnt)}
                    className={`flex-1 py-2 text-xs font-black rounded-xl transition-all border ${
                      passengerCount === cnt
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {cnt}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Grab-style Big Primary Call To Action */}
          <div className="pt-2">
            <button
              onClick={handleHail}
              disabled={isHailing || pickupStop.id === dropoffStop.id}
              className={`w-full py-3.5 px-5 rounded-2xl font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2.5 ${
                pickupStop.id === dropoffStop.id
                  ? 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 active:scale-[0.99] text-white'
              }`}
            >
              <Bell className="w-5 h-5 text-amber-300 animate-pulse" />
              <span>
                {pickupStop.id === dropoffStop.id
                  ? 'Sila Pilih Hentian Turun Berbeza'
                  : `Notis Pemandu Bas: Saya Menunggu di ${pickupStop.shortName}!`}
              </span>
            </button>
            <p className="text-[11px] text-center text-slate-400 mt-2">
              Pemandu bas akan melihat amaran di kokpit bas bahawa {passengerCount} orang sedang menunggu di {pickupStop.shortName} untuk ke {dropoffStop.shortName}.
            </p>
          </div>
        </div>
      )}

      {/* Smart Bus Timetable & Frequency Modal */}
      <BusScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        defaultStopId={pickupStop.id}
      />
    </div>
  );
};
