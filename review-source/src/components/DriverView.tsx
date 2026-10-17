import React, { useState } from 'react';
import { useBus } from '../context/BusContext';
import { checkDriverOnRoute } from '../data/utmData';
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  Bell,
  Bus,
  CheckCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Compass,
  Gauge,
  LogOut,
  MapPin,
  Navigation,
  Navigation2,
  Pause,
  Play,
  Route,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  Volume2,
} from 'lucide-react';

export const DriverView: React.FC = () => {
  const {
    bus,
    stops,
    requests,
    toggleSimulation,
    setSimulationSpeed,
    simSpeed,
    toggleDriverRealGps,
    isUsingRealGps,
    manualPickUpPassengers,
    manualDropOffPassengers,
    arriveAndProcessStop,
    jumpBusToStop,
    audioAlertTriggered,
    clearAudioAlert,
    recentDriverNotification,
  } = useBus();

  const [drawerExpanded, setDrawerExpanded] = useState<boolean>(true);
  const [lastActionSummary, setLastActionSummary] = useState<string | null>(null);

  // Active requests
  const activeRequests = requests.filter((r) => r.status === 'waiting');
  const onboardRequests = requests.filter((r) => r.status === 'picked_up');

  // Next stop
  const nextStopObj = stops.find((s) => s.id === bus.nextStopId) || stops[0];
  const currentStopObj = stops.find((s) => s.id === bus.currentStopId);

  // Passengers waiting at upcoming stop (Boarding)
  const waitingAtNext = activeRequests.filter((r) => r.stopId === bus.nextStopId);
  const totalWaitingNext = waitingAtNext.reduce((sum, r) => sum + r.passengerCount, 0);

  // Passengers who wish to alight at next stop (Alighting)
  const alightingAtNext = onboardRequests.filter((r) => r.destinationStopId === bus.nextStopId);
  const totalAlightingNext = alightingAtNext.reduce((sum, r) => sum + r.passengerCount, 0);

  // Projected occupancy after stop
  const predictedOccupancy = Math.min(
    bus.capacity,
    Math.max(0, bus.occupiedSeats - totalAlightingNext + totalWaitingNext)
  );

  // Occupancy percentage and status
  const occupancyPercent = Math.round((bus.occupiedSeats / bus.capacity) * 100);
  const occupancyStatus =
    occupancyPercent >= 90
      ? { label: 'Hampir Penuh', color: 'text-rose-400 bg-rose-500/20 border-rose-500/30' }
      : occupancyPercent >= 60
      ? { label: 'Sederhana', color: 'text-amber-400 bg-amber-500/20 border-amber-500/30' }
      : { label: 'Banyak Kerusi Selesa', color: 'text-emerald-400 bg-emerald-500/20 border-emerald-500/30' };

  // Route adherence check
  const routeAdherence = checkDriverOnRoute(bus.currentCoordinates);

  // Unified 1-Tap Handler: Arrive at Stop & Process Boarding + Alighting
  const handleArriveAtStop = (stopId: string) => {
    const result = arriveAndProcessStop(stopId);
    const stopName = stops.find((s) => s.id === stopId)?.shortName || stopId;
    
    setLastActionSummary(
      `✓ Telah Tiba di ${stopName}: ${result.alightedCount} pelajar turun, ${result.boardedCount} pelajar naik.`
    );
    setTimeout(() => setLastActionSummary(null), 6000);
  };

  return (
    <div className="w-full flex flex-col justify-between h-full pointer-events-none">
      {/* 1. TOP FLOATING NAVIGATION HUD (Grab Driver Style) */}
      <div className="w-full p-2 sm:p-4 pointer-events-auto">
        <div className="max-w-2xl mx-auto bg-slate-950/95 backdrop-blur-md text-white rounded-2xl border border-slate-700/80 shadow-2xl overflow-hidden">
          {/* Notification Toast if passenger hails */}
          {audioAlertTriggered && recentDriverNotification && (
            <div className="bg-amber-500 text-slate-950 p-3 flex items-center justify-between border-b border-amber-400 animate-pulse">
              <div className="flex items-center gap-2.5 min-w-0">
                <Bell className="w-5 h-5 text-slate-950 shrink-0" />
                <span className="text-xs font-bold truncate">{recentDriverNotification}</span>
              </div>
              <button
                onClick={clearAudioAlert}
                className="px-2.5 py-1 bg-slate-950 text-white text-[11px] font-bold rounded-md hover:bg-slate-800 transition-colors whitespace-nowrap ml-2"
              >
                Sahkan
              </button>
            </div>
          )}

          {/* Action Confirmation Banner after arriving */}
          {lastActionSummary && (
            <div className="bg-emerald-600 text-white px-4 py-2 text-xs font-bold flex items-center gap-2 border-b border-emerald-500 animate-in fade-in duration-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
              <span className="truncate">{lastActionSummary}</span>
            </div>
          )}

          {/* Grab Driver Turn-by-Turn Header Banner */}
          <div className="bg-gradient-to-r from-emerald-700 to-teal-800 p-3 sm:p-4 text-white flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 border border-white/30 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Navigation2 className="w-6 h-6 rotate-45 text-amber-300" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-200 block">
                  Navigasi Pemandu Bas UTM
                </span>
                <h2 className="text-sm sm:text-base font-black tracking-tight mt-0.5 truncate">
                  Teruskan di Lingkaran Ilmu ➔ {nextStopObj.shortName}
                </h2>
                <div className="text-[11px] text-emerald-100 mt-0.5 font-medium flex items-center gap-1.5">
                  <span>Jarak: <b className="font-mono text-white">{bus.distanceToNextStopMeters}m</b></span>
                  <span>·</span>
                  <span>ETA: <b className="font-mono text-white">~{Math.max(1, Math.round(bus.etaNextStopSeconds / 60))} min</b></span>
                </div>
              </div>
            </div>

            {/* Speedometer pill */}
            <div className="bg-slate-950/60 px-3 py-1.5 rounded-xl border border-white/20 text-center shrink-0">
              <span className="text-[9px] uppercase text-slate-300 block font-semibold">Kelajuan</span>
              <div className="text-lg sm:text-xl font-black font-mono text-white tabular-nums">
                {bus.speedKmh} <span className="text-[10px] font-normal text-slate-300">km/j</span>
              </div>
            </div>
          </div>

          {/* Current Address & Route Adherence Bar */}
          <div className="px-4 py-2 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <MapPin className="w-3.5 h-3.5 text-blue-400 shrink-0" />
              <div className="truncate">
                <span className="text-slate-400 text-[11px]">Alamat Semasa: </span>
                <span className="text-amber-300 font-bold">{bus.currentJunctionName}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {routeAdherence.isOnRoute ? (
                <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  <span>Di Laluan Rasmi Lingkaran Ilmu</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-amber-500/20 text-amber-400 border border-amber-500/30 text-[10px] font-bold rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span>Perhatian: Di Luar Laluan</span>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 2. BOTTOM GRAB DRIVER COCKPIT DRAWER */}
      <div className="w-full max-w-2xl mx-auto px-2 sm:px-4 pb-2 pointer-events-auto">
        <div className="bg-slate-950/95 backdrop-blur-md text-white rounded-t-3xl border-t border-x border-slate-700/80 shadow-2xl transition-all duration-300">
          {/* Drag handle */}
          <div
            onClick={() => setDrawerExpanded((prev) => !prev)}
            className="w-full pt-3 pb-2 cursor-pointer flex flex-col items-center select-none"
          >
            <div className="w-12 h-1.5 bg-slate-600 rounded-full mb-1"></div>
          </div>

          {/* Quick Action & Analysis Bar */}
          <div className="px-4 sm:px-5 pb-3 border-b border-slate-800 space-y-3">
            {/* Passenger Analysis Grid for Next Stop */}
            <div className="grid grid-cols-3 gap-2">
              {/* Akan Naik */}
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] text-emerald-400 font-bold uppercase flex items-center gap-1">
                  <ArrowUp className="w-3 h-3 text-emerald-400" />
                  <span>Akan Naik</span>
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
                    {totalWaitingNext}
                  </span>
                  <span className="text-[10px] text-slate-400">orang</span>
                </div>
                <span className="text-[9px] text-slate-400 truncate mt-0.5">di {nextStopObj.shortName}</span>
              </div>

              {/* Akan Turun */}
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] text-rose-400 font-bold uppercase flex items-center gap-1">
                  <ArrowDown className="w-3 h-3 text-rose-400" />
                  <span>Akan Turun</span>
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
                    {totalAlightingNext}
                  </span>
                  <span className="text-[10px] text-slate-400">orang</span>
                </div>
                <span className="text-[9px] text-slate-400 truncate mt-0.5">destinasi di sini</span>
              </div>

              {/* Muatan Penumpang Semasa */}
              <div className="bg-slate-900/90 p-2.5 rounded-xl border border-slate-800 flex flex-col justify-between">
                <span className="text-[10px] text-blue-400 font-bold uppercase flex items-center gap-1">
                  <Users className="w-3 h-3 text-blue-400" />
                  <span>Muatan Bas</span>
                </span>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-xl sm:text-2xl font-black font-mono text-white tabular-nums">
                    {bus.occupiedSeats}
                  </span>
                  <span className="text-[10px] text-slate-400 font-mono">/ {bus.capacity}</span>
                </div>
                <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded mt-0.5 truncate border ${occupancyStatus.color}`}>
                  {bus.capacity - bus.occupiedSeats} kerusi kosong
                </span>
              </div>
            </div>

            {/* UNIFIED 1-TAP ACTION BUTTON */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleArriveAtStop(nextStopObj.id)}
                className={`flex-1 py-3 px-4 rounded-xl font-black text-xs sm:text-sm shadow-xl transition-all flex items-center justify-center gap-2 ${
                  totalWaitingNext > 0 || totalAlightingNext > 0
                    ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 animate-pulse'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>
                  {totalWaitingNext > 0 || totalAlightingNext > 0
                    ? `Dah Sampai di ${nextStopObj.shortName}: Selesaikan Naik (${totalWaitingNext}) & Turun (${totalAlightingNext})`
                    : `Dah Sampai di ${nextStopObj.shortName} (Sahkan Hentian)`}
                </span>
              </button>

              <button
                onClick={() => setDrawerExpanded((prev) => !prev)}
                className="p-2.5 bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
                title={drawerExpanded ? 'Kecilkan Panel' : 'Buka Maklumat Lengkap'}
              >
                {drawerExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Expanded Cockpit Panel */}
          {drawerExpanded && (
            <div className="p-4 sm:p-5 space-y-4 max-h-[50vh] overflow-y-auto">
              {/* GPS & Simulation Controls */}
              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleDriverRealGps}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1.5 ${
                      isUsingRealGps
                        ? 'bg-emerald-600 text-white border-emerald-500'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{isUsingRealGps ? 'GPS Telefon Pintar Aktif' : 'Guna GPS Telefon'}</span>
                  </button>

                  <button
                    onClick={toggleSimulation}
                    disabled={isUsingRealGps}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl border transition-colors flex items-center gap-1.5 ${
                      bus.isSimulating && !isUsingRealGps
                        ? 'bg-blue-600 text-white border-blue-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    {bus.isSimulating ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{bus.isSimulating ? 'Jeda Pandu' : 'Mula Pandu'}</span>
                  </button>
                </div>

                {/* Speed Multipliers */}
                <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
                  <span className="text-[10px] text-slate-400 px-1 font-semibold">Kelajuan:</span>
                  {[1, 2, 4].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => setSimulationSpeed(spd)}
                      className={`px-2 py-0.5 text-xs font-bold rounded ${
                        simSpeed === spd ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                      }`}
                    >
                      {spd}x
                    </button>
                  ))}
                </div>
              </div>

              {/* Radar: Upcoming Stops on Lingkaran Ilmu */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2 flex items-center justify-between">
                  <span>Radar Hentian di Laluan Lingkaran Ilmu:</span>
                  <span className="text-amber-400 font-mono font-normal">
                    {activeRequests.length} menunggu · {onboardRequests.length} di dalam bas
                  </span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {stops.map((stop) => {
                    const waiting = activeRequests.filter((r) => r.stopId === stop.id);
                    const waitingSum = waiting.reduce((sum, r) => sum + r.passengerCount, 0);

                    const alighting = onboardRequests.filter((r) => r.destinationStopId === stop.id);
                    const alightingSum = alighting.reduce((sum, r) => sum + r.passengerCount, 0);

                    const isNext = stop.id === bus.nextStopId;
                    const isCurrent = stop.id === bus.currentStopId;

                    return (
                      <div
                        key={stop.id}
                        className={`p-2.5 rounded-xl border transition-all ${
                          isNext
                            ? 'bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/30'
                            : isCurrent
                            ? 'bg-blue-950/40 border-blue-500'
                            : 'bg-slate-900 border-slate-800'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-800 text-slate-300 rounded">
                                {stop.code}
                              </span>
                              <span className="text-xs font-bold text-white truncate">
                                {stop.shortName}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-400 block mt-0.5 truncate">
                              {isCurrent ? '🚩 Bas Di Sini' : isNext ? '👉 Hentian Seterusnya' : 'Laluan Lingkaran'}
                            </span>
                          </div>

                          {/* Headcount Badges */}
                          <div className="flex items-center gap-1 shrink-0">
                            {waitingSum > 0 && (
                              <span className="px-1.5 py-0.5 bg-emerald-600 text-white font-mono font-bold text-[10px] rounded flex items-center gap-0.5">
                                <ArrowUp className="w-2.5 h-2.5" />
                                <span>{waitingSum}</span>
                              </span>
                            )}
                            {alightingSum > 0 && (
                              <span className="px-1.5 py-0.5 bg-rose-600 text-white font-mono font-bold text-[10px] rounded flex items-center gap-0.5">
                                <ArrowDown className="w-2.5 h-2.5" />
                                <span>{alightingSum}</span>
                              </span>
                            )}
                            {waitingSum === 0 && alightingSum === 0 && (
                              <span className="text-[10px] text-slate-500 font-mono">0</span>
                            )}
                          </div>
                        </div>

                        {/* Stop Action Bar */}
                        <div className="mt-2 pt-1.5 border-t border-slate-800 flex items-center gap-1 text-[11px]">
                          <button
                            onClick={() => handleArriveAtStop(stop.id)}
                            className="flex-1 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/40 font-bold rounded-lg transition-colors flex items-center justify-center gap-1 text-[11px]"
                          >
                            <UserCheck className="w-3 h-3" />
                            <span>Tiba & Selesai</span>
                          </button>
                          <button
                            onClick={() => jumpBusToStop(stop.id)}
                            className="py-1 px-2.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded-lg text-[10px]"
                            title="Lompat ke stesen ini"
                          >
                            Lompat
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Waiting Students Queue Details */}
              {activeRequests.length > 0 && (
                <div className="pt-2 border-t border-slate-800">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2">
                    Senarai Pelajar Sedang Menunggu di Perhentian:
                  </span>
                  <div className="space-y-1.5">
                    {activeRequests.map((req) => {
                      const reqPickup = stops.find((s) => s.id === req.stopId);
                      const reqDest = stops.find((s) => s.id === req.destinationStopId);

                      return (
                        <div
                          key={req.id}
                          className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-bold flex items-center justify-center text-[11px]">
                              {req.passengerCount}
                            </span>
                            <div>
                              <div className="font-bold text-white">{req.passengerName}</div>
                              <div className="text-[11px] text-slate-400 flex items-center gap-1">
                                <span className="text-amber-400 font-semibold">{reqPickup?.shortName}</span>
                                <ArrowRight className="w-3 h-3 text-slate-600" />
                                <span className="text-emerald-400 font-semibold">{reqDest?.shortName}</span>
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => manualPickUpPassengers(req.stopId)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg text-xs"
                          >
                            Sahkan Naik
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
