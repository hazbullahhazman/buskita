import React, { useState } from 'react';
import { useBus } from '../context/BusContext';
import { BusStop } from '../types/bus';
import {
  AlertCircle,
  Bell,
  Bus,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Compass,
  MapPin,
  Sparkles,
  Sunrise,
  Sunset,
  Sun,
  Moon,
  X,
} from 'lucide-react';

interface BusScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultStopId?: string;
}

export const BusScheduleModal: React.FC<BusScheduleModalProps> = ({
  isOpen,
  onClose,
  defaultStopId,
}) => {
  const { stops, bus, getEtaToStop } = useBus();
  const [selectedStopId, setSelectedStopId] = useState<string>(
    defaultStopId || stops[0]?.id || 'stop-dsi'
  );
  const [reminderSet, setReminderSet] = useState<string | null>(null);

  if (!isOpen) return null;

  const activeStop = stops.find((s) => s.id === selectedStopId) || stops[0];
  const liveEtaSec = getEtaToStop(activeStop.id);
  const liveEtaMin = Math.max(1, Math.ceil(liveEtaSec / 60));

  // Current system clock
  const now = new Date();
  const formatTime = (minutesOffset: number) => {
    const d = new Date(now.getTime() + minutesOffset * 60000);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Next scheduled departures calculated dynamically
  const upcomingDepartures = [
    {
      tripId: 'trip-1',
      type: 'live',
      busPlate: bus.plateNumber,
      driverName: bus.driverName,
      timeString: `Sekarang (${formatTime(liveEtaMin)})`,
      etaMin: liveEtaMin,
      status: 'Sedang Beroperasi',
      seatsAvailable: bus.capacity - bus.occupiedSeats,
    },
    {
      tripId: 'trip-2',
      type: 'scheduled',
      busPlate: 'JTM 2024 (Bas B)',
      driverName: 'Abang Fairuz',
      timeString: formatTime(liveEtaMin + 15),
      etaMin: liveEtaMin + 15,
      status: 'Pelepasan Berjadual',
      seatsAvailable: 38,
    },
    {
      tripId: 'trip-3',
      type: 'scheduled',
      busPlate: 'JTM 2026 (Bas A - Pusingan 2)',
      driverName: bus.driverName,
      timeString: formatTime(liveEtaMin + 30),
      etaMin: liveEtaMin + 30,
      status: 'Pelepasan Berjadual',
      seatsAvailable: 38,
    },
    {
      tripId: 'trip-4',
      type: 'scheduled',
      busPlate: 'JTM 2024 (Bas B - Pusingan 2)',
      driverName: 'Abang Fairuz',
      timeString: formatTime(liveEtaMin + 45),
      etaMin: liveEtaMin + 45,
      status: 'Pelepasan Berjadual',
      seatsAvailable: 38,
    },
  ];

  const handleSetReminder = (tripId: string, time: string) => {
    setReminderSet(tripId);
    setTimeout(() => {
      alert(`Peringatan Berjaya Ditetapkan!\nAnda akan menerima notifikasi 5 minit sebelum bas pada jam ${time} tiba.`);
    }, 200);
  };

  return (
    <div className="fixed inset-0 z-500 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl text-white overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-black text-white tracking-tight">
                  Jadual Bas & Waktu Operasi Pintar
                </h3>
                <span className="px-2 py-0.5 bg-blue-600/30 border border-blue-500/40 text-blue-300 font-mono text-[10px] font-bold rounded">
                  Lingkaran Ilmu UTM
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Kekerapan dinamik mengikut waktu kuliah dan perhentian anda.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scroll Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Station Selector Bar */}
          <div>
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>Pilih Perhentian Anda Untuk Jadual Ketibaan:</span>
            </label>
            <div className="flex flex-wrap gap-1.5">
              {stops.map((stop) => (
                <button
                  key={stop.id}
                  onClick={() => setSelectedStopId(stop.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all ${
                    selectedStopId === stop.id
                      ? 'bg-blue-600 text-white border-blue-500 shadow-md scale-102'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800'
                  }`}
                >
                  <span className="font-mono text-[10px] opacity-75 mr-1">{stop.code}</span>
                  <span>{stop.shortName}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Upcoming Live Departures at Selected Stop */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span className="text-xs font-bold text-white uppercase tracking-wider">
                  Ketibaan Seterusnya di {activeStop.name}:
                </span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono font-bold">
                ● Masa Nyata & Dinamik
              </span>
            </div>

            <div className="space-y-2.5">
              {upcomingDepartures.map((trip, idx) => (
                <div
                  key={trip.tripId}
                  className={`p-3.5 rounded-xl border flex flex-wrap items-center justify-between gap-3 transition-all ${
                    trip.type === 'live'
                      ? 'bg-blue-950/50 border-blue-500/60 ring-1 ring-blue-500/30'
                      : 'bg-slate-900/80 border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        trip.type === 'live'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {trip.type === 'live' ? <Bus className="w-4 h-4 animate-pulse" /> : `${idx + 1}`}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{trip.timeString}</span>
                        {trip.type === 'live' && (
                          <span className="px-2 py-0.2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold rounded-full">
                            Bas Aktif
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2">
                        <span className="font-mono text-slate-300">{trip.busPlate}</span>
                        <span>·</span>
                        <span>{trip.seatsAvailable} tempat kosong</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-base font-black font-mono text-amber-400 tabular-nums">
                        ~{trip.etaMin} min
                      </span>
                      <span className="text-[10px] text-slate-400 block">anggaran</span>
                    </div>

                    <button
                      onClick={() => handleSetReminder(trip.tripId, trip.timeString)}
                      className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-colors flex items-center gap-1.5 ${
                        reminderSet === trip.tripId
                          ? 'bg-emerald-600 text-white border-emerald-500'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      {reminderSet === trip.tripId ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Ditetapkan</span>
                        </>
                      ) : (
                        <>
                          <Bell className="w-3.5 h-3.5" />
                          <span>Ingatkan</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Official UTM Operating Hours & Headway Matrix */}
          <div className="bg-slate-950/70 p-4 rounded-2xl border border-slate-800">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold text-white uppercase tracking-wider">
                Jadual Kekerapan Operasi Rasmi UTM (Lingkaran Ilmu):
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-amber-400 mb-1">
                  <Sunrise className="w-4 h-4" />
                  <span className="text-xs font-bold">Waktu Puncak Pagi Kuliah</span>
                </div>
                <div className="text-xs font-mono text-white font-bold">07:15 AM - 09:45 AM</div>
                <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                  Kekerapan: Setiap 10 Minit (Bas Berterusan)
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Akses pantas ke FKA, FABU, FKM & Dewan Kuliah.
                </span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-blue-400 mb-1">
                  <Sun className="w-4 h-4" />
                  <span className="text-xs font-bold">Waktu Biasa & Zohor</span>
                </div>
                <div className="text-xs font-mono text-white font-bold">10:00 AM - 03:45 PM</div>
                <span className="text-[11px] text-blue-300 font-semibold block mt-1">
                  Kekerapan: Setiap 15 Minit
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Laluan makan ke Arked Meranti & Masjid Sultan Ismail.
                </span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-orange-400 mb-1">
                  <Sunset className="w-4 h-4" />
                  <span className="text-xs font-bold">Waktu Puncak Pulang Petang</span>
                </div>
                <div className="text-xs font-mono text-white font-bold">04:00 PM - 06:30 PM</div>
                <span className="text-[11px] text-emerald-400 font-semibold block mt-1">
                  Kekerapan: Setiap 12 Minit
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Aliran pelajar balik dari fakulti ke Kolej KTR & KRP.
                </span>
              </div>

              <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 text-purple-400 mb-1">
                  <Moon className="w-4 h-4" />
                  <span className="text-xs font-bold">Sesi Malam & Perpustakaan</span>
                </div>
                <div className="text-xs font-mono text-white font-bold">07:00 PM - 10:30 PM</div>
                <span className="text-[11px] text-purple-300 font-semibold block mt-1">
                  Kekerapan: Setiap 25 Minit
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Perpustakaan PSZ, perbincangan malam & makan malam.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-blue-400 shrink-0" />
            <span>Masa tertakluk kepada aliran trafik kampus dan waktu solat Jumaat.</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl transition-colors shadow-md"
          >
            Tutup Jadual
          </button>
        </div>
      </div>
    </div>
  );
};
