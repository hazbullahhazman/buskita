import React from 'react';
import { useBus, UserRole } from '../context/BusContext';
import { Bus, Bell, Navigation, QrCode } from 'lucide-react';

interface NavbarProps {
  onOpenArchitecture?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenArchitecture }) => {
  const { currentRole, setCurrentRole, bus, requests } = useBus();

  const waitingCount = requests
    .filter((r) => r.status === 'waiting')
    .reduce((sum, r) => sum + r.passengerCount, 0);

  return (
    <header className="bg-slate-950 border-b border-slate-800 text-white sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4 sm:gap-8">
        {/* Zone 1: Brand title, single line text element */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/30">
            <Bus className="w-4 h-4" />
          </div>
          <a
            href="/"
            onClick={(e) => {
              e.preventDefault();
              setCurrentRole('student');
            }}
            className="text-lg font-extrabold tracking-tight text-white hover:text-blue-400 transition-colors"
          >
            BasKita UTM
          </a>
          <span className="text-slate-500 text-xs hidden md:inline">·</span>
          <span className="text-xs text-slate-400 hidden md:inline font-mono">Lingkaran Ilmu UTM</span>
        </div>

        {/* Zone 2: 4 nav links, single-line labels */}
        <nav className="flex items-center gap-1 sm:gap-2">
          <button
            onClick={() => setCurrentRole('student')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentRole === 'student'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            Pelajar
          </button>

          <button
            onClick={() => setCurrentRole('driver')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 ${
              currentRole === 'driver'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <span>Pemandu</span>
            {waitingCount > 0 && (
              <span className="px-1.5 py-0.2 bg-red-600 text-white text-[10px] font-bold rounded-full font-mono">
                {waitingCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setCurrentRole('kiosk')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentRole === 'kiosk'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            Kiosk QR
          </button>

          <button
            onClick={() => setCurrentRole('admin')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
              currentRole === 'admin'
                ? 'bg-blue-600 text-white'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            Dispatch
          </button>
        </nav>

        {/* Zone 3: 1 primary action & Spec sheet */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {onOpenArchitecture && (
            <button
              onClick={onOpenArchitecture}
              className="px-2.5 py-1.5 text-xs font-medium text-blue-300 hover:text-white bg-blue-950/70 hover:bg-blue-900/80 border border-blue-700/50 rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5"
              title="Buka Pelan Seni Bina Georujukan & Kod Lengkap"
            >
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">Pelan Georujukan</span>
            </button>
          )}

          <button
            onClick={() => setCurrentRole('student')}
            className="px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 shadow-md shadow-amber-400/20"
          >
            <Bell className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Panggil Bas</span>
          </button>
        </div>
      </div>
    </header>
  );
};

