import React, { useState } from 'react';
import { useBus } from '../context/BusContext';
import { BusStop, LatLng } from '../types/bus';
import { GoogleMapComponent } from './GoogleMapComponent';
import {
  Compass,
  Crosshair,
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  Sparkles,
} from 'lucide-react';

interface CampusMapProps {
  selectedStopId?: string | null;
  onSelectStop?: (stop: BusStop) => void;
  className?: string;
  onPinLocation?: (coords: LatLng, type: 'origin' | 'destination') => void;
  isDriverMode?: boolean;
}

export const CampusMap: React.FC<CampusMapProps> = ({
  selectedStopId,
  onSelectStop,
  onPinLocation,
  isDriverMode = false,
  className = '',
}) => {
  return (
    <div className={`relative w-full h-full overflow-hidden bg-slate-900 ${className}`}>
      {/* Primary Google Maps Platform Engine with Snap-to-Road & Blue Route Polyline */}
      <GoogleMapComponent
        selectedStopId={selectedStopId}
        onSelectStop={onSelectStop}
        onPinLocation={onPinLocation}
        isDriverMode={isDriverMode}
      />
    </div>
  );
};
