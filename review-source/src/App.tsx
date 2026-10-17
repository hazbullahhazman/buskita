import React, { useEffect, useState } from 'react';
import { BusProvider, useBus } from './context/BusContext';
import { Navbar } from './components/Navbar';
import { CampusMap } from './components/CampusMap';
import { StudentView } from './components/StudentView';
import { DriverView } from './components/DriverView';
import { StopKioskView } from './components/StopKioskView';
import { AdminDispatchView } from './components/AdminDispatchView';
import { ArchitectureModal } from './components/ArchitectureModal';
import { BusStop, LatLng } from './types/bus';

const AppContent: React.FC = () => {
  const { currentRole, setCurrentRole, setSelectedKioskStopId, stops } = useBus();
  const [selectedMapStop, setSelectedMapStop] = useState<BusStop | null>(null);
  const [isArchitectureOpen, setIsArchitectureOpen] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  // Mandatory Google Maps Platform Quota Defense listener (SKILL.md Section 8 Case A)
  useEffect(() => {
    const handleQuotaExceeded = () => {
      setQuotaExceeded(true);
    };
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => {
      window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    };
  }, []);

  // Check URL parameters for QR scan auto-redirection
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const stopParam = params.get('stop');
    const viewParam = params.get('view');

    if (stopParam) {
      const found = stops.find((s) => s.id === stopParam);
      if (found) {
        setSelectedKioskStopId(stopParam);
        setSelectedMapStop(found);
      }
    }

    if (viewParam === 'kiosk' || stopParam) {
      setCurrentRole('kiosk');
    } else if (viewParam === 'driver') {
      setCurrentRole('driver');
    } else if (viewParam === 'admin') {
      setCurrentRole('admin');
    }
  }, [stops, setCurrentRole, setSelectedKioskStopId]);

  return (
    <div className="h-screen w-screen bg-slate-950 flex flex-col font-sans text-slate-100 overflow-hidden">
      {/* Mandatory Google Maps Platform Quota Exceeded Notification Banner */}
      {quotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* Top Bar Navigation */}
      <Navbar onOpenArchitecture={() => setIsArchitectureOpen(true)} />

      {/* Georeferencing Architecture Specification Modal */}
      <ArchitectureModal
        isOpen={isArchitectureOpen}
        onClose={() => setIsArchitectureOpen(false)}
      />

      {/* Main Content Area */}
      <main className="flex-1 relative w-full h-[calc(100vh-4rem)] overflow-hidden">

        {currentRole === 'student' && (
          <div className="relative w-full h-full">
            {/* Grab-style Full-Bleed Map View */}
            <div className="absolute inset-0 z-0">
              <CampusMap
                selectedStopId={selectedMapStop?.id}
                onSelectStop={(stop) => setSelectedMapStop(stop)}
                className="w-full h-full"
              />
            </div>

            {/* Grab-style Bottom Panel (Floating & Expandable) */}
            <div className="absolute bottom-0 left-0 right-0 z-500 max-w-xl mx-auto px-2 sm:px-4 pointer-events-none">
              <div className="pointer-events-auto">
                <StudentView onFocusStop={(stop) => setSelectedMapStop(stop)} />
              </div>
            </div>
          </div>
        )}

        {currentRole === 'driver' && (
          <div className="relative w-full h-full">
            {/* Grab Driver Full-Bleed Navigation Map View */}
            <div className="absolute inset-0 z-0">
              <CampusMap
                selectedStopId={selectedMapStop?.id}
                onSelectStop={(stop) => setSelectedMapStop(stop)}
                isDriverMode={true}
                className="w-full h-full"
              />
            </div>

            {/* Grab Driver Floating Navigation HUD & Cockpit Drawer */}
            <div className="absolute inset-0 z-500 pointer-events-none">
              <DriverView />
            </div>
          </div>
        )}

        {currentRole === 'kiosk' && (
          <div className="w-full h-full grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
            <div className="lg:col-span-8 bg-slate-900 overflow-y-auto">
              <StopKioskView />
            </div>
            <div className="lg:col-span-4 relative min-h-[400px] border-l border-slate-800">
              <CampusMap className="h-full min-h-[400px]" />
            </div>
          </div>
        )}

        {currentRole === 'admin' && (
          <div className="w-full h-full bg-slate-900 overflow-y-auto py-4">
            <AdminDispatchView />
          </div>
        )}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <BusProvider>
      <AppContent />
    </BusProvider>
  );
}
