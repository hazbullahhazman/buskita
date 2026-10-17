import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  BUS_STOPS,
  calculateDistanceMeters,
  findNearestLocation,
  findNearestStop,
  LINGKARAN_BUDI_LOOP,
} from '../data/utmData';
import { BusStop, BusVehicle, CampusLocation, LatLng, PassengerRequest } from '../types/bus';

export type UserRole = 'student' | 'driver' | 'kiosk' | 'admin';

export interface UserTrip {
  requestId: string;
  pickupStopId: string;
  destinationStopId: string;
  passengerCount: number;
  passengerName: string;
  status: 'waiting' | 'on_board' | 'arrived';
}

interface BusContextType {
  bus: BusVehicle;
  stops: BusStop[];
  requests: PassengerRequest[];
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  selectedKioskStopId: string;
  setSelectedKioskStopId: (id: string) => void;
  userTrip: UserTrip | null;
  // Pin & GPS Location
  userGpsLocation: LatLng | null;
  customOriginPin: LatLng | null;
  customDestinationPin: LatLng | null;
  pinSelectionMode: 'origin' | 'destination' | null;
  setPinSelectionMode: (mode: 'origin' | 'destination' | null) => void;
  setCustomOriginPin: (coords: LatLng | null) => void;
  setCustomDestinationPin: (coords: LatLng | null) => void;
  requestUserGpsLocation: () => Promise<LatLng | null>;
  // Bottom Sheet UX
  bottomSheetExpanded: boolean;
  setBottomSheetExpanded: React.Dispatch<React.SetStateAction<boolean>>;
  // Passenger actions
  hailBus: (pickupStopId: string, destStopId: string, count: number, name: string) => string;
  cancelUserTrip: () => void;
  // Driver actions
  toggleSimulation: () => void;
  setSimulationSpeed: (speed: number) => void;
  simSpeed: number;
  toggleDriverRealGps: () => void;
  isUsingRealGps: boolean;
  manualPickUpPassengers: (stopId: string) => void;
  manualDropOffPassengers: (stopId: string) => void;
  arriveAndProcessStop: (stopId: string) => { boardedCount: number; alightedCount: number };
  jumpBusToStop: (stopId: string) => void;
  // Calculations
  getEtaToStop: (targetStopId: string) => number; // seconds
  getPassengersWaitingAtStop: (stopId: string) => PassengerRequest[];
  audioAlertTriggered: boolean;
  clearAudioAlert: () => void;
  recentDriverNotification: string | null;
}

const BusContext = createContext<BusContextType | undefined>(undefined);

// Initial default bus
const INITIAL_BUS: BusVehicle = {
  id: 'bus-utm-01',
  plateNumber: 'JTM 2026',
  callSign: 'Bas UTM Lingkaran Budi (A)',
  routeName: 'Laluan 1: Lingkaran Budi (Pusingan Utama)',
  routeCode: 'LB-01',
  direction: 'clockwise',
  currentCoordinates: { lat: 1.5522, lng: 103.6382 },
  bearing: 45,
  speedKmh: 28,
  capacity: 38,
  occupiedSeats: 14,
  status: 'active',
  currentStopId: 'stop-dsi',
  nextStopId: 'stop-fkm-fke',
  distanceToNextStopMeters: 620,
  etaNextStopSeconds: 74,
  isSimulating: true,
  driverName: 'Pak Cik Razak (Kapten Bas UTM)',
  currentJunctionName: 'Simpang Dataran UTM & Dewan Sultan Iskandar (DSI)',
};

// Seed initial passenger requests so the map and driver HUD immediately feel alive
const INITIAL_REQUESTS: PassengerRequest[] = [
  {
    id: 'req-init-1',
    passengerName: 'Afiqah (FK)',
    passengerRole: 'Pelajar UTM',
    stopId: 'stop-fka-fabu',
    destinationStopId: 'stop-ktc-meranti',
    passengerCount: 2,
    requestedAt: Date.now() - 120000,
    status: 'waiting',
    note: 'Tunggu di hadapan lobi FKA',
  },
  {
    id: 'req-init-2',
    passengerName: 'Zulhelmi (KTR)',
    passengerRole: 'Pelajar UTM',
    stopId: 'stop-ktr',
    destinationStopId: 'stop-psz',
    passengerCount: 1,
    requestedAt: Date.now() - 45000,
    status: 'waiting',
    note: 'Ada kelas di PSZ jam 10 pagi',
  },
];

export const BusProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bus, setBus] = useState<BusVehicle>(INITIAL_BUS);
  const [stops] = useState<BusStop[]>(BUS_STOPS);
  const [requests, setRequests] = useState<PassengerRequest[]>(() => {
    const saved = localStorage.getItem('baskita_requests');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return INITIAL_REQUESTS;
  });
  const [currentRole, setCurrentRole] = useState<UserRole>('student');
  const [selectedKioskStopId, setSelectedKioskStopId] = useState<string>('stop-psz');
  const [userTrip, setUserTrip] = useState<UserTrip | null>(() => {
    const saved = localStorage.getItem('baskita_user_trip');
    if (saved) {
      try { return JSON.parse(saved); } catch { /* ignore */ }
    }
    return null;
  });

  // GPS & Pin On Map State
  const [userGpsLocation, setUserGpsLocation] = useState<LatLng | null>(null);
  const [customOriginPin, setCustomOriginPin] = useState<LatLng | null>(null);
  const [customDestinationPin, setCustomDestinationPin] = useState<LatLng | null>(null);
  const [pinSelectionMode, setPinSelectionMode] = useState<'origin' | 'destination' | null>(null);

  // Grab-style Bottom Sheet state (collapsed peek by default on desktop & mobile, can expand)
  const [bottomSheetExpanded, setBottomSheetExpanded] = useState<boolean>(true);

  const [simSpeed, setSimSpeed] = useState<number>(1);
  const [isUsingRealGps, setIsUsingRealGps] = useState<boolean>(false);
  const [audioAlertTriggered, setAudioAlertTriggered] = useState<boolean>(false);
  const [recentDriverNotification, setRecentDriverNotification] = useState<string | null>(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('baskita_requests', JSON.stringify(requests));
  }, [requests]);

  useEffect(() => {
    if (userTrip) {
      localStorage.setItem('baskita_user_trip', JSON.stringify(userTrip));
    } else {
      localStorage.removeItem('baskita_user_trip');
    }
  }, [userTrip]);

  // Simulation position reference along waypoint loop
  const currentWaypointIndexRef = useRef<number>(0);
  const progressRatioRef = useRef<number>(0);

  // Main bus movement simulation loop
  useEffect(() => {
    if (!bus.isSimulating || isUsingRealGps) return;

    const interval = setInterval(() => {
      setBus((prevBus) => {
        const waypoints = LINGKARAN_BUDI_LOOP;
        const totalWaypoints = waypoints.length;
        
        const baseStep = 0.022 * simSpeed;
        let newRatio = progressRatioRef.current + baseStep;
        let currentWp = currentWaypointIndexRef.current;

        if (newRatio >= 1) {
          newRatio = 0;
          currentWp = (currentWp + 1) % (totalWaypoints - 1);
          currentWaypointIndexRef.current = currentWp;
        }
        progressRatioRef.current = newRatio;

        const p1 = waypoints[currentWp];
        const p2 = waypoints[(currentWp + 1) % totalWaypoints];

        // Linear interpolation
        const currentLat = p1.lat + (p2.lat - p1.lat) * newRatio;
        const currentLng = p1.lng + (p2.lng - p1.lng) * newRatio;
        const currentCoord: LatLng = { lat: currentLat, lng: currentLng };

        // Calculate bearing for directional arrow
        const dLat = p2.lat - p1.lat;
        const dLng = p2.lng - p1.lng;
        let bearingDeg = (Math.atan2(dLng, dLat) * 180) / Math.PI;
        if (bearingDeg < 0) bearingDeg += 360;

        // Check nearest bus stop and next stop
        let minStopDist = Infinity;
        let closestStop = BUS_STOPS[0];
        for (const s of BUS_STOPS) {
          const d = calculateDistanceMeters(currentCoord, s.coordinates);
          if (d < minStopDist) {
            minStopDist = d;
            closestStop = s;
          }
        }

        // Identify next stop in sequence
        const currentStopIdx = BUS_STOPS.findIndex((s) => s.id === closestStop.id);
        const nextStopIdx = (currentStopIdx + 1) % BUS_STOPS.length;
        const nextStop = minStopDist < 50 ? BUS_STOPS[nextStopIdx] : closestStop;
        const distToNext = calculateDistanceMeters(currentCoord, nextStop.coordinates);

        // Realistic campus bus speed variation (between 24 and 34 km/h)
        const currentSpeedKmh = minStopDist < 40 ? 10 : 28 + Math.sin(Date.now() / 3000) * 4;
        const etaSeconds = Math.max(10, Math.round((distToNext / Math.max(1, (currentSpeedKmh * 1000) / 3600))));

        // Check if bus reached user pickup stop while user is waiting
        if (minStopDist < 45 && closestStop.id) {
          setUserTrip((currTrip) => {
            if (!currTrip) return null;
            if (currTrip.status === 'waiting' && currTrip.pickupStopId === closestStop.id) {
              return { ...currTrip, status: 'on_board' };
            }
            if (currTrip.status === 'on_board' && currTrip.destinationStopId === closestStop.id) {
              return { ...currTrip, status: 'arrived' };
            }
            return currTrip;
          });
        }

        return {
          ...prevBus,
          currentCoordinates: currentCoord,
          currentJunctionName: p1.junction,
          bearing: Math.round(bearingDeg),
          speedKmh: Math.round(currentSpeedKmh),
          currentStopId: minStopDist < 60 ? closestStop.id : null,
          nextStopId: nextStop.id,
          distanceToNextStopMeters: Math.round(distToNext),
          etaNextStopSeconds: etaSeconds,
          status: minStopDist < 40 ? 'at_stop' : 'active',
        };
      });
    }, 400);

    return () => clearInterval(interval);
  }, [bus.isSimulating, isUsingRealGps, simSpeed]);

  // Request user current location using browser geolocation
  const requestUserGpsLocation = (): Promise<LatLng | null> => {
    return new Promise((resolve) => {
      if (!('geolocation' in navigator)) {
        alert('Pelayar anda tidak menyokong fungsi pengesanan lokasi Geolocation.');
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords: LatLng = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          };
          setUserGpsLocation(coords);
          setCustomOriginPin(coords);
          resolve(coords);
        },
        (err) => {
          console.warn('Geolocation denied or unavailable, using UTM Centre Point as default location:', err.message);
          // If in iframe or denied, simulate user at UTM Centre Point (1.5528, 103.6390)
          const fallbackCoords: LatLng = { lat: 1.5528, lng: 103.6390 };
          setUserGpsLocation(fallbackCoords);
          setCustomOriginPin(fallbackCoords);
          resolve(fallbackCoords);
        },
        { enableHighAccuracy: true, timeout: 6000 }
      );
    });
  };

  // Real GPS tracking for driver
  useEffect(() => {
    if (!isUsingRealGps) return;
    if (!('geolocation' in navigator)) {
      alert('Pelayar tidak menyokong fungsi Geolocation.');
      setIsUsingRealGps(false);
      return;
    }

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const realCoords: LatLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        const speed = pos.coords.speed ? Math.round(pos.coords.speed * 3.6) : 25;
        const heading = pos.coords.heading || 0;

        setBus((prev) => {
          const nearest = findNearestStop(realCoords);
          const distToNearest = calculateDistanceMeters(realCoords, nearest.coordinates);
          return {
            ...prev,
            currentCoordinates: realCoords,
            speedKmh: speed,
            bearing: Math.round(heading),
            currentStopId: distToNearest < 50 ? nearest.id : null,
          };
        });
      },
      (err) => {
        console.warn('Driver geolocation error:', err.message);
      },
      { enableHighAccuracy: true }
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [isUsingRealGps]);

  // Function to hail bus by student
  const hailBus = (pickupStopId: string, destStopId: string, count: number, name: string) => {
    const pickupStop = BUS_STOPS.find((s) => s.id === pickupStopId);
    const destStop = BUS_STOPS.find((s) => s.id === destStopId);

    const newRequest: PassengerRequest = {
      id: `req-${Date.now()}`,
      passengerName: name || 'Pelajar UTM',
      passengerRole: 'Pelajar UTM',
      stopId: pickupStopId,
      destinationStopId: destStopId,
      passengerCount: count,
      requestedAt: Date.now(),
      status: 'waiting',
      note: `Menunggu di ${pickupStop?.shortName || pickupStopId} ke ${destStop?.shortName || destStopId}`,
    };

    setRequests((prev) => [newRequest, ...prev]);

    const trip: UserTrip = {
      requestId: newRequest.id,
      pickupStopId,
      destinationStopId: destStopId,
      passengerCount: count,
      passengerName: newRequest.passengerName,
      status: 'waiting',
    };
    setUserTrip(trip);

    setAudioAlertTriggered(true);
    setRecentDriverNotification(
      `Notis Penumpang: ${name} (${count} org) menunggu di ${pickupStop?.shortName} ke ${destStop?.shortName}!`
    );

    return newRequest.id;
  };

  const cancelUserTrip = () => {
    if (userTrip) {
      setRequests((prev) =>
        prev.map((r) => (r.id === userTrip.requestId ? { ...r, status: 'cancelled' } : r))
      );
    }
    setUserTrip(null);
  };

  const toggleSimulation = () => {
    setBus((prev) => ({ ...prev, isSimulating: !prev.isSimulating }));
  };

  const setSimulationSpeed = (speed: number) => {
    setSimSpeed(speed);
  };

  const toggleDriverRealGps = () => {
    setIsUsingRealGps((prev) => !prev);
  };

  const manualPickUpPassengers = (stopId: string) => {
    let pickedCount = 0;
    setRequests((prev) =>
      prev.map((r) => {
        if (r.stopId === stopId && r.status === 'waiting') {
          pickedCount += r.passengerCount;
          return { ...r, status: 'picked_up' };
        }
        return r;
      })
    );

    setUserTrip((prev) => {
      if (prev && prev.pickupStopId === stopId && prev.status === 'waiting') {
        return { ...prev, status: 'on_board' };
      }
      return prev;
    });

    setBus((prev) => ({
      ...prev,
      occupiedSeats: Math.min(prev.capacity, prev.occupiedSeats + (pickedCount || 1)),
    }));
  };

  const manualDropOffPassengers = (stopId: string) => {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.destinationStopId === stopId && r.status === 'picked_up') {
          return { ...r, status: 'completed' };
        }
        return r;
      })
    );

    setUserTrip((prev) => {
      if (prev && prev.destinationStopId === stopId && prev.status === 'on_board') {
        return { ...prev, status: 'arrived' };
      }
      return prev;
    });

    setBus((prev) => ({
      ...prev,
      occupiedSeats: Math.max(0, prev.occupiedSeats - 2),
    }));
  };

  // Unified 1-Tap Action: Arrive at stop, process all alighting + boarding passengers automatically
  const arriveAndProcessStop = (stopId: string) => {
    const targetStop = BUS_STOPS.find((s) => s.id === stopId);
    let boardedCount = 0;
    let alightedCount = 0;

    // 1. Process passengers alighting here
    setRequests((prev) =>
      prev.map((r) => {
        if (r.destinationStopId === stopId && r.status === 'picked_up') {
          alightedCount += r.passengerCount;
          return { ...r, status: 'completed' };
        }
        return r;
      })
    );

    // If active user is on board with this destination, complete their trip
    setUserTrip((prev) => {
      if (prev && prev.destinationStopId === stopId && prev.status === 'on_board') {
        return { ...prev, status: 'arrived' };
      }
      return prev;
    });

    // 2. Process passengers boarding here
    setRequests((prev) =>
      prev.map((r) => {
        if (r.stopId === stopId && r.status === 'waiting') {
          boardedCount += r.passengerCount;
          return { ...r, status: 'picked_up' };
        }
        return r;
      })
    );

    // If active user is waiting here, mark them on_board
    setUserTrip((prev) => {
      if (prev && prev.pickupStopId === stopId && prev.status === 'waiting') {
        return { ...prev, status: 'on_board' };
      }
      return prev;
    });

    // 3. Update bus position and seat occupancy
    setBus((prev) => {
      const newOccupancy = Math.min(
        prev.capacity,
        Math.max(0, prev.occupiedSeats - alightedCount + (boardedCount || (alightedCount === 0 ? 1 : 0)))
      );

      const currIdx = BUS_STOPS.findIndex((s) => s.id === stopId);
      const nextIdx = (currIdx + 1) % BUS_STOPS.length;
      const nextStop = BUS_STOPS[nextIdx];

      return {
        ...prev,
        currentCoordinates: targetStop ? targetStop.coordinates : prev.currentCoordinates,
        currentStopId: stopId,
        nextStopId: nextStop.id,
        occupiedSeats: newOccupancy,
        status: 'at_stop',
        distanceToNextStopMeters: 550,
        etaNextStopSeconds: 60,
      };
    });

    return { boardedCount, alightedCount };
  };

  const jumpBusToStop = (stopId: string) => {
    const targetStop = BUS_STOPS.find((s) => s.id === stopId);
    if (!targetStop) return;

    setBus((prev) => ({
      ...prev,
      currentCoordinates: targetStop.coordinates,
      currentStopId: targetStop.id,
      status: 'at_stop',
    }));
  };

  const getEtaToStop = (targetStopId: string): number => {
    const targetStop = BUS_STOPS.find((s) => s.id === targetStopId);
    if (!targetStop) return 0;

    const currentCoords = bus.currentCoordinates;
    const directDistance = calculateDistanceMeters(currentCoords, targetStop.coordinates);
    const speedMps = Math.max(5, (bus.speedKmh * 1000) / 3600);
    const directTimeSec = directDistance / speedMps;

    return Math.max(30, Math.round(directTimeSec * 1.3));
  };

  const getPassengersWaitingAtStop = (stopId: string): PassengerRequest[] => {
    return requests.filter((r) => r.stopId === stopId && r.status === 'waiting');
  };

  const clearAudioAlert = () => {
    setAudioAlertTriggered(false);
  };

  return (
    <BusContext.Provider
      value={{
        bus,
        stops,
        requests,
        currentRole,
        setCurrentRole,
        selectedKioskStopId,
        setSelectedKioskStopId,
        userTrip,
        userGpsLocation,
        customOriginPin,
        customDestinationPin,
        pinSelectionMode,
        setPinSelectionMode,
        setCustomOriginPin,
        setCustomDestinationPin,
        requestUserGpsLocation,
        bottomSheetExpanded,
        setBottomSheetExpanded,
        hailBus,
        cancelUserTrip,
        toggleSimulation,
        setSimulationSpeed,
        simSpeed,
        toggleDriverRealGps,
        isUsingRealGps,
        manualPickUpPassengers,
        manualDropOffPassengers,
        arriveAndProcessStop,
        jumpBusToStop,
        getEtaToStop,
        getPassengersWaitingAtStop,
        audioAlertTriggered,
        clearAudioAlert,
        recentDriverNotification,
      }}
    >
      {children}
    </BusContext.Provider>
  );
};

export const useBus = (): BusContextType => {
  const context = useContext(BusContext);
  if (!context) {
    throw new Error('useBus must be used within a BusProvider');
  }
  return context;
};
