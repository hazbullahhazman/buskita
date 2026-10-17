import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useBus } from '../context/BusContext';
import { BusStop } from '../types/bus';
import {
  Activity,
  BarChart3,
  Bus,
  CheckCircle2,
  Clock,
  Download,
  ExternalLink,
  MapPin,
  Printer,
  QrCode,
  Radio,
  RefreshCw,
  TrendingUp,
  Users,
} from 'lucide-react';

export const AdminDispatchView: React.FC = () => {
  const { bus, stops, requests, setSelectedKioskStopId, setCurrentRole } = useBus();

  const [selectedPosterStopId, setSelectedPosterStopId] = useState<string>(stops[0].id);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const posterStop = stops.find((s) => s.id === selectedPosterStopId) || stops[0];

  // Generate real QR code for the selected bus stop
  useEffect(() => {
    const currentOrigin = window.location.origin;
    const stopUrl = `${currentOrigin}/?stop=${posterStop.id}&view=kiosk`;

    QRCode.toDataURL(
      stopUrl,
      {
        width: 320,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [posterStop.id]);

  const activeWaiting = requests.filter((r) => r.status === 'waiting');
  const totalWaitingCount = activeWaiting.reduce((sum, r) => sum + r.passengerCount, 0);

  const openStopInKiosk = (stopId: string) => {
    setSelectedKioskStopId(stopId);
    setCurrentRole('kiosk');
  };

  return (
    <div className="flex flex-col gap-6 p-4 max-w-6xl mx-auto w-full">
      {/* Top Admin Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Armada Bas Aktif</span>
            <Bus className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2 tabular-nums">
            1 / 1 Bas
          </div>
          <span className="text-[11px] text-emerald-600 mt-1 block">
            Laluan 1 Lingkaran Budi (Beroperasi)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Penumpang Sedang Menunggu</span>
            <Users className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black font-mono text-amber-600 mt-2 tabular-nums">
            {totalWaitingCount} Orang
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {activeWaiting.length} notis panggilan aktif
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Purata Masa Menunggu (Dijimat)</span>
            <Clock className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black font-mono text-emerald-600 mt-2 tabular-nums">
            ~5.4 Minit
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            Turun dari 24 minit (Sebelum sistem)
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Hentian Bertanda QR</span>
            <QrCode className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-black font-mono text-slate-900 mt-2 tabular-nums">
            7 / 7 Stesen
          </div>
          <span className="text-[11px] text-slate-500 mt-1 block">
            100% Liputan Lingkaran Budi
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: QR Code Poster Generator for Physical Bus Stops */}
        <div className="lg:col-span-5 bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <QrCode className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Penjana Poster QR Kod Perhentian UTM
                </h2>
              </div>
              <span className="text-[11px] text-slate-500">Sedia Cetak</span>
            </div>

            <p className="text-xs text-slate-600 mb-3">
              Cetak pelekat QR ini dan tampal di tiang perhentian bas fizikal. Pelajar mengimbas QR kod ini untuk melihat masa bas secara langsung dan memaklumkan pemandu bahawa mereka sedang menunggu.
            </p>

            <div className="mb-4">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Pilih Hentian Untuk Dijana:
              </label>
              <select
                value={selectedPosterStopId}
                onChange={(e) => setSelectedPosterStopId(e.target.value)}
                className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-900 font-medium focus:ring-2 focus:ring-blue-500"
              >
                {stops.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} - {s.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Printable Poster Mockup */}
            <div className="bg-slate-50 p-5 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center text-center">
              <div className="bg-blue-900 text-white px-3 py-1 rounded text-[11px] font-bold uppercase tracking-wider mb-2">
                BasKita UTM · Hentian Pintar
              </div>

              <h3 className="text-base font-black text-slate-900">{posterStop.name}</h3>
              <span className="text-xs text-slate-500 mb-3 font-mono">KOD STESEN: {posterStop.code}</span>

              {/* QR Image */}
              {qrDataUrl ? (
                <div className="p-2 bg-white rounded-lg shadow-md border border-slate-200 mb-3">
                  <img
                    src={qrDataUrl}
                    alt={`QR Code untuk ${posterStop.name}`}
                    className="w-48 h-48 object-contain"
                  />
                </div>
              ) : (
                <div className="w-48 h-48 bg-slate-200 animate-pulse rounded-lg flex items-center justify-center text-xs text-slate-500">
                  Menjana QR...
                </div>
              )}

              <p className="text-xs font-bold text-slate-800">
                Imbas QR Kod Menggunakan Telefon Pintar
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Lihat lokasi bas masa nyata & tekan 1 butang untuk panggil pemandu bas.
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
            <button
              onClick={() => openStopInKiosk(posterStop.id)}
              className="flex-1 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Buka Paparan Kiosk</span>
            </button>
            <button
              onClick={() => window.print()}
              className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 border border-slate-200"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Poster</span>
            </button>
          </div>
        </div>

        {/* Right Column: Fleet Live Status & Passenger Waiting Radar */}
        <div className="lg:col-span-7 flex flex-col gap-4">
          {/* Active Bus Fleet Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <Bus className="w-4 h-4 text-blue-600" />
                <h2 className="text-sm font-bold text-slate-900">
                  Status Armada Bas Kampus (Live Dispatch)
                </h2>
              </div>
              <span className="text-[11px] text-emerald-600 font-mono font-bold">● GPS Beroperasi</span>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  01
                </div>
                <div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <span>{bus.callSign}</span>
                    <span className="text-xs font-mono text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200">
                      {bus.plateNumber}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 block mt-0.5">
                    Kapten: {bus.driverName} · Had Muatan: {bus.capacity} Orang
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono">
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Kelajuan</span>
                  <span className="font-bold text-slate-800">{bus.speedKmh} km/j</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Tempat Duduk</span>
                  <span className="font-bold text-slate-800">
                    {bus.occupiedSeats} / {bus.capacity}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block uppercase">Status</span>
                  <span className="font-bold text-emerald-600">
                    {bus.status === 'at_stop' ? 'Di Hentian' : 'Sedang Bergerak'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Bus Stop Demand Table */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex-1">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
              <h2 className="text-sm font-bold text-slate-900">
                Data Menunggu Mengikut Hentian (Lingkaran Budi)
              </h2>
              <span className="text-xs text-slate-500">Masa Nyata</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 font-medium">
                    <th className="py-2.5 px-3">Kod & Nama Hentian</th>
                    <th className="py-2.5 px-3">Kategori</th>
                    <th className="py-2.5 px-3 text-center">Menunggu</th>
                    <th className="py-2.5 px-3 text-right">Tindakan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stops.map((stop) => {
                    const waitingCount = requests
                      .filter((r) => r.stopId === stop.id && r.status === 'waiting')
                      .reduce((sum, r) => sum + r.passengerCount, 0);

                    return (
                      <tr key={stop.id} className="hover:bg-slate-50 transition-colors">
                        <td className="py-2.5 px-3">
                          <div className="font-bold text-slate-800">{stop.name}</div>
                          <div className="text-[11px] text-slate-400">{stop.shortName}</div>
                        </td>
                        <td className="py-2.5 px-3 text-slate-600">{stop.shelterType}</td>
                        <td className="py-2.5 px-3 text-center">
                          {waitingCount > 0 ? (
                            <span className="px-2 py-0.5 bg-red-100 text-red-700 font-bold font-mono rounded">
                              {waitingCount} org
                            </span>
                          ) : (
                            <span className="text-slate-400 font-mono">0</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <button
                            onClick={() => openStopInKiosk(stop.id)}
                            className="text-xs text-blue-600 hover:text-blue-800 font-semibold"
                          >
                            Paparan Kiosk
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
