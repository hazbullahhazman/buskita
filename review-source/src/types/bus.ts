export interface LatLng {
  lat: number;
  lng: number;
}

export interface BusStop {
  id: string;
  name: string;
  shortName: string;
  code: string;
  coordinates: LatLng;
  landmarks: string[];
  routeIndex: number; // Position index along the Lingkaran Budi loop
  shelterType: string;
  description: string;
}

export interface BusVehicle {
  id: string;
  plateNumber: string;
  callSign: string;
  routeName: string;
  routeCode: string;
  direction: 'clockwise' | 'anticlockwise';
  currentCoordinates: LatLng;
  bearing: number; // 0 - 360 degrees
  speedKmh: number;
  capacity: number;
  occupiedSeats: number;
  status: 'active' | 'at_stop' | 'paused' | 'depot';
  currentStopId: string | null;
  nextStopId: string;
  distanceToNextStopMeters: number;
  etaNextStopSeconds: number;
  isSimulating: boolean;
  driverName: string;
  currentJunctionName: string; // e.g. "Simpang Fakulti Kejuruteraan Awam"
}

export interface PassengerRequest {
  id: string;
  passengerName: string;
  passengerRole: 'Pelajar UTM' | 'Staf UTM' | 'Pelawat';
  stopId: string;
  destinationStopId: string;
  passengerCount: number;
  requestedAt: number; // timestamp
  status: 'waiting' | 'picked_up' | 'completed' | 'cancelled';
  note?: string;
}

export interface CampusLocation {
  id: string;
  name: string;
  category: 'Fakulti' | 'Kolej Kediaman' | 'Pentadbiran & Khidmat' | 'Kemudahan';
  nearestStopId: string;
  coordinates: LatLng;
}
