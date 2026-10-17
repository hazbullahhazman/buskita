import React, { useMemo, useState } from 'react';
import { useBus } from '../context/BusContext';
import { BusStop } from '../types/bus';
import {
  Bell,
  Bus,
  Calendar,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  QrCode,
  Radio,
  Share2,
  Sparkles,
  Users,
} from 'lucide-react';
import { BusScheduleModal } from './BusScheduleModal';

export const StopKioskView: React.FC = () => {
  const {
    bus,
    stops,
    selectedKioskStopId,
    setSelectedKioskStopId,
    getEtaToStop,
    getPassengersWaitingAtStop,
    hailBus,
  } = useBus();

  const [hasNotified, setHasNotified] = useState<boolean>(false);
  const [passengerHeadcount, setPassengerHeadcount] = useState<number>(1);
  const [isScheduleOpen, setIsScheduleOpen] = useState<boolean>(false);

  // Active kiosk stop
  const currentStop = useMemo(() => {
    return stops.find((s) => s.id === selectedKioskStopId) || stops[0];
  }, [stops, selectedKioskStopId]);

  // ETA to this stop
  const etaSeconds = getEtaToStop(currentStop.id);
  const etaMinutes = Math.max(1, Math.ceil(etaSeconds / 60));

  // Waiting passengers at this stop
  const waitingPassengers = getPassengersWaitingAtStop(currentStop.id);
  const totalWaiting = waitingPassengers.reduce((sum, r) => sum + r.passengerCount, 0);

  // Default destination to FKA or Meranti depending on stop
  const defaultDestStop = stops.find((s) => s.id !== currentStop.id) || stops[1];

  const handleQuickHail = () => {
    hailBus(
      currentStop.id,
      defaultDestStop.id,
      passengerHeadcount,
      `Penumpang di ${currentStop.shortName}`
    );
    setHasNotified(true);
    setTimeout(() => setHasNotified(false), 8000);
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-4xl mx-auto w-full">
      {/* Bus Stop Selector for Testing different stops */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">
              Simulasi Imbas QR Kod Perhentian Fizikal:
            </span>
            <p className="text-xs text-slate-600">
              Pilih perhentian di bawah seolah-olah anda sedang berdiri dan mengimbas pelekat QR di lokasi tersebut.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {stops.map((stop) => (
              <button
                key={stop.id}
                onClick={() => setSelectedKioskStopId(stop.id)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition-colors border ${
                  selectedKioskStopId === stop.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                {stop.code} {stop.shortName}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Kiosk Digital Signboard Screen */}
      <div className="bg-slate-950 text-white rounded-2xl p-6 md:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
        {/* Top Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-5 mb-6">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-blue-600/30 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold font-mono text-lg">
              {currentStop.code}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest text-blue-400">
                  Papan Informasi Digital Perhentian
                </span>
                <span className="text-slate-500">·</span>
                <span className="text-xs text-slate-400 font-mono">UTM Skudai</span>
              </div>
              <h1 className="text-xl md:text-2xl font-black text-white tracking-tight mt-0.5">
                {currentStop.name}
              </h1>
              <span className="text-xs text-slate-400 block mt-1">
                {currentStop.shelterType} · {currentStop.description}
              </span>
            </div>
          </div>

          {/* Action buttons (Jadual & QR) */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScheduleOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-xs font-bold transition-colors shadow-sm"
            >
              <Calendar className="w-4 h-4 text-amber-400" />
              <span>Jadual Bas & Waktu</span>
            </button>

            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-400">
              <QrCode className="w-4 h-4 text-amber-400" />
              <span>Paparan Pintar QR Kod</span>
            </div>
          </div>
        </div>

        {/* Live Arrival Countdown Giant Display */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Main ETA Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-slate-900 via-slate-900 to-blue-950/60 p-6 rounded-xl border border-blue-500/30 shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-blue-400">
                <Radio className="w-4 h-4 text-blue-400 animate-pulse" />
                <span>Bas Seterusnya Yang Sedang Tiba:</span>
              </span>
              <span className="font-mono text-slate-400">{bus.routeName}</span>
            </div>

            <div className="flex flex-wrap items-baseline justify-between gap-4 mt-3">
              <div>
                <span className="text-5xl md:text-6xl font-black font-mono text-amber-400 tracking-tight tabular-nums">
                  {etaMinutes}
                </span>
                <span className="text-xl font-bold text-slate-300 ml-2">Minit Lagi</span>
                <div className="text-xs text-slate-400 mt-2 flex items-center gap-2">
                  <span>No Plat: <b className="text-white font-mono">{bus.plateNumber}</b></span>
                  <span>·</span>
                  <span>Kelajuan: <b className="text-white font-mono">{bus.speedKmh} km/j</b></span>
                </div>
              </div>

              <div className="text-right">
                <div className="px-3 py-1.5 bg-slate-800/80 rounded-lg border border-slate-700/80 inline-block text-left">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">Kapasiti Tempat Duduk</span>
                  <div className="text-sm font-bold text-white mt-0.5 font-mono">
                    {bus.occupiedSeats} / {bus.capacity} Terisi
                  </div>
                  <span className="text-[10px] text-emerald-400 block mt-0.5">
                    {bus.capacity - bus.occupiedSeats} kerusi masih kosong
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Notice Driver at Stop */}
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-amber-400 mb-2">
                <Bell className="w-4 h-4" />
                <span className="text-xs font-bold uppercase tracking-wider">
                  Notis Pemandu Bas
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Adakah anda sedang menunggu di sini? Tekan butang di bawah untuk maklumkan pemandu bas agar tidak terlepas perhentian ini.
              </p>

              {/* Headcount selector */}
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xs text-slate-400">Bilangan orang:</span>
                <div className="flex gap-1">
                  {[1, 2, 3].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setPassengerHeadcount(num)}
                      className={`px-2.5 py-1 text-xs font-bold rounded ${
                        passengerHeadcount === num
                          ? 'bg-amber-500 text-slate-950'
                          : 'bg-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <button
                onClick={handleQuickHail}
                className={`w-full py-3 px-4 font-bold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                  hasNotified
                    ? 'bg-emerald-600 text-white'
                    : 'bg-amber-500 hover:bg-amber-400 text-slate-950 active:scale-[0.98]'
                }`}
              >
                {hasNotified ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Pemandu Telah Dimaklumkan!</span>
                  </>
                ) : (
                  <>
                    <Bell className="w-4 h-4" />
                    <span>Saya Sedang Menunggu di Sini ({passengerHeadcount} org)!</span>
                  </>
                )}
              </button>

              <span className="text-[10px] text-slate-500 text-center block mt-2">
                {totalWaiting > 0
                  ? `Kini terdapat ${totalWaiting} penumpang sedang menunggu di perhentian ini.`
                  : 'Belum ada penumpang menunggu berdaftar di sini.'}
              </span>
            </div>
          </div>
        </div>

        {/* Lingkaran Budi Loop Sequential Progress Bar */}
        <div className="pt-4 border-t border-slate-800">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-3">
            Turutan Perhentian Bas di Lingkaran Budi:
          </span>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
            {stops.map((s, idx) => {
              const isCurrent = s.id === currentStop.id;
              const isBusHere = s.id === bus.currentStopId;

              return (
                <div
                  key={s.id}
                  onClick={() => setSelectedKioskStopId(s.id)}
                  className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
                    isCurrent
                      ? 'bg-blue-600/30 border-blue-500 ring-2 ring-blue-500/40 text-white'
                      : isBusHere
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                      : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px] font-mono">
                    <span>{s.code}</span>
                    {isBusHere && <span className="font-bold text-amber-400">BUS 🚌</span>}
                    {isCurrent && <span className="text-blue-400 font-bold">ANDA 📍</span>}
                  </div>
                  <div className="text-xs font-bold mt-1 truncate">{s.shortName}</div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Smart Bus Timetable & Frequency Modal */}
      <BusScheduleModal
        isOpen={isScheduleOpen}
        onClose={() => setIsScheduleOpen(false)}
        defaultStopId={currentStop.id}
      />
    </div>
  );
};
