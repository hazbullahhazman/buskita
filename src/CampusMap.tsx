import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Bus, PATH, Point, STOPS, routeById } from "../shared/model";
import { atProgress, LENGTH, STOP_PROGRESS } from "../shared/engine";
import { Crosshair, MapPin, Minus, Plus } from "lucide-react";
declare global {
  interface Window {
    google: any;
    initBasKita?: () => void;
  }
}
const busSvg = (color: string) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44"><rect x="2" y="2" width="40" height="40" rx="14" fill="${color}" stroke="white" stroke-width="3"/><g fill="none" stroke="white" stroke-width="1.8"><rect x="14" y="11" width="16" height="21" rx="4"/><path d="M14 23h16M18 11v12M26 11v12M16 32v3M28 32v3"/><path d="M17 28h2m6 0h2"/></g></svg>`;
let googlePromise: Promise<any> | null = null;
function loadGoogle(key: string) {
  if (window.google?.maps) return Promise.resolve(window.google.maps);
  if (!googlePromise)
    googlePromise = new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(Error("Map timeout")), 12000);
      window.initBasKita = () => {
        clearTimeout(timeout);
        resolve(window.google.maps);
      };
      const script = document.createElement("script");
      script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&callback=initBasKita&loading=async`;
      script.onerror = () => {
        clearTimeout(timeout);
        reject(Error("Map unavailable"));
      };
      document.head.appendChild(script);
    });
  return googlePromise;
}
type Props = {
  buses: Bus[];
  selectedBus: string;
  focus: Point | null;
  pin: Point | null;
  picking: boolean;
  onPin: (p: Point) => void;
  onBus: (id: string) => void;
  onStop: (id: string) => void;
  follow?: boolean;
};
export default function CampusMap(props: Props) {
  const element = useRef<HTMLDivElement>(null),
    current = useRef(props),
    leaflet = useRef<L.Map | null>(null),
    gm = useRef<any>(null),
    busMarkers = useRef<Record<string, any>>({}),
    routeLayer = useRef<any>(null),
    pinMarker = useRef<any>(null);
  const [provider, setProvider] = useState("Loading map…"),
    [ready, setReady] = useState(0);
  current.current = props;
  useEffect(() => {
    let active = true;
    let stopMarkers: any[] = [];
    async function init() {
      const key = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
      if (key) {
        try {
          const maps = await loadGoogle(key);
          if (!active || !element.current) return;
          gm.current = new maps.Map(element.current, {
            center: { lat: 1.5574, lng: 103.6384 },
            zoom: 15,
            disableDefaultUI: true,
            clickableIcons: false,
            gestureHandling: "greedy",
            styles: [
              {
                featureType: "poi",
                elementType: "labels",
                stylers: [{ visibility: "off" }],
              },
              { featureType: "landscape", stylers: [{ color: "#edf0e6" }] },
              { featureType: "water", stylers: [{ color: "#c6d9df" }] },
            ],
          });
          routeLayer.current = new maps.Polyline({
            map: gm.current,
            path: PATH,
            strokeColor: "#752f42",
            strokeWeight: 5,
            strokeOpacity: 0.8,
            icons: [
              {
                icon: {
                  path: maps.SymbolPath.FORWARD_CLOSED_ARROW,
                  scale: 2.4,
                },
                repeat: "95px",
              },
            ],
          });
          for (const stop of STOPS) {
            const m = new maps.Marker({
              map: gm.current,
              position: atProgress(STOP_PROGRESS[stop.id]),
              label: {
                text: stop.code,
                color: "#384b43",
                fontSize: "10px",
                fontWeight: "700",
              },
              icon: {
                path: maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "white",
                fillOpacity: 1,
                strokeColor: "#7c8e80",
                strokeWeight: 2,
              },
              title: stop.name,
            });
            m.addListener("click", () => current.current.onStop(stop.id));
            stopMarkers.push(m);
          }
          gm.current.addListener("click", (e: any) => {
            if (current.current.picking && e.latLng)
              current.current.onPin({
                lat: e.latLng.lat(),
                lng: e.latLng.lng(),
              });
          });
          setProvider("Google Maps");
          setReady(1);
          return;
        } catch {
          /* Basemap fallback, visibly identified below. */
        }
      }
      if (!active || !element.current) return;
      const map = L.map(element.current, {
        zoomControl: false,
        attributionControl: true,
        scrollWheelZoom: true,
      }).setView([1.5574, 103.6384], 15);
      leaflet.current = map;
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);
      routeLayer.current = L.polyline(
        PATH.map((p) => [p.lat, p.lng] as [number, number]),
        { color: "#752f42", weight: 5, opacity: 0.8, lineCap: "round" },
      ).addTo(map);
      for (let s = 200; s < LENGTH; s += 480) {
        const p = atProgress(s),
          q = atProgress(s + 12),
          angle = (Math.atan2(q.lng - p.lng, q.lat - p.lat) * 180) / Math.PI;
        L.marker([p.lat, p.lng], {
          interactive: false,
          icon: L.divIcon({
            className: "direction-marker",
            html: `<span style="transform:rotate(${angle}deg)">↑</span>`,
            iconSize: [20, 20],
            iconAnchor: [10, 10],
          }),
        }).addTo(map);
      }
      for (const stop of STOPS) {
        const p = atProgress(STOP_PROGRESS[stop.id]);
        L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            className: "stop-marker",
            html: `<span>${stop.code}</span>`,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
          }),
          title: stop.name,
          keyboard: true,
        })
          .addTo(map)
          .on("click", () => current.current.onStop(stop.id))
          .bindTooltip(stop.name, { direction: "top", offset: [0, -10] });
      }
      map.on("click", (e) => {
        if (current.current.picking)
          current.current.onPin({ lat: e.latlng.lat, lng: e.latlng.lng });
      });
      setProvider(
        key ? "OpenStreetMap · Google unavailable" : "OpenStreetMap",
      );
      setReady(1);
    }
    void init();
    const resize = new ResizeObserver(() => leaflet.current?.invalidateSize());
    if (element.current) resize.observe(element.current);
    return () => {
      active = false;
      resize.disconnect();
      leaflet.current?.remove();
      leaflet.current = null;
      stopMarkers.forEach((m) => m.setMap(null));
      gm.current = null;
      busMarkers.current = {};
    };
  }, []);
  useEffect(() => {
    if (!ready) return;
    const selected = props.buses.find((b) => b.id === props.selectedBus);
    if (selected) {
      const color = routeById(selected.routeId).color;
      if (leaflet.current) routeLayer.current?.setStyle({ color });
      else routeLayer.current?.setOptions({ strokeColor: color });
    }
    for (const bus of props.buses) {
      const color = routeById(bus.routeId).color;
      let marker = busMarkers.current[bus.id];
      if (leaflet.current) {
        if (!marker) {
          marker = L.marker([bus.point.lat, bus.point.lng], {
            icon: L.divIcon({
              className: "bus-marker",
              html: `${busSvg(color)}<b>${bus.id}</b>`,
              iconSize: [44, 58],
              iconAnchor: [22, 22],
            }),
            zIndexOffset: 1000,
            title: `Bus ${bus.id}`,
            keyboard: true,
          })
            .addTo(leaflet.current)
            .on("click", () => current.current.onBus(bus.id));
          busMarkers.current[bus.id] = marker;
        }
        marker.setLatLng([bus.point.lat, bus.point.lng]);
      } else if (gm.current) {
        if (!marker) {
          marker = new window.google.maps.Marker({
            map: gm.current,
            position: bus.point,
            title: bus.id,
            icon: {
              url:
                "data:image/svg+xml;charset=UTF-8," +
                encodeURIComponent(busSvg(color)),
              scaledSize: new window.google.maps.Size(44, 44),
              anchor: new window.google.maps.Point(22, 22),
            },
          });
          marker.addListener("click", () => current.current.onBus(bus.id));
          busMarkers.current[bus.id] = marker;
        }
        marker.setPosition(bus.point);
      }
    }
    if (props.follow && selected) {
      leaflet.current?.panTo([selected.point.lat, selected.point.lng], {
        animate: true,
        duration: 0.8,
      });
      gm.current?.panTo(selected.point);
    }
  }, [props.buses, props.selectedBus, props.follow, ready]);
  useEffect(() => {
    if (!props.focus || !ready) return;
    leaflet.current?.flyTo([props.focus.lat, props.focus.lng], 16, {
      duration: 1,
    });
    gm.current?.panTo(props.focus);
  }, [props.focus, ready]);
  useEffect(() => {
    if (!ready) return;
    const p = props.pin;
    if (leaflet.current) {
      if (pinMarker.current) leaflet.current.removeLayer(pinMarker.current);
      if (p)
        pinMarker.current = L.marker([p.lat, p.lng], {
          icon: L.divIcon({
            className: "destination-marker",
            html: "<span>◎</span>",
            iconSize: [34, 34],
            iconAnchor: [17, 17],
          }),
        }).addTo(leaflet.current);
    } else if (gm.current) {
      pinMarker.current?.setMap(null);
      if (p)
        pinMarker.current = new window.google.maps.Marker({
          map: gm.current,
          position: p,
          title: "Your destination",
        });
    }
  }, [props.pin, ready]);
  const recenter = () => {
    leaflet.current?.flyTo([1.5574, 103.6384], 15, { duration: 0.8 });
    gm.current?.setZoom(15);
    gm.current?.panTo({ lat: 1.5574, lng: 103.6384 });
  };
  return (
    <div className={`campus-map ${props.picking ? "picking" : ""}`}>
      <div ref={element} className="map-canvas" />
      <div className="map-location">
        <span className="live-dot" />
        <span>UTM Johor Bahru</span>
        <span className="map-location-detail">1.5585° N, 103.6380° E</span>
      </div>
      <div className="map-tools">
        <button aria-label="Centre on campus" onClick={recenter}>
          <Crosshair size={19} />
        </button>
        <div />
        <button
          aria-label="Zoom in"
          onClick={() => {
            leaflet.current?.zoomIn();
            if (gm.current) gm.current.setZoom(gm.current.getZoom() + 1);
          }}
        >
          <Plus size={19} />
        </button>
        <button
          aria-label="Zoom out"
          onClick={() => {
            leaflet.current?.zoomOut();
            if (gm.current) gm.current.setZoom(gm.current.getZoom() - 1);
          }}
        >
          <Minus size={19} />
        </button>
      </div>
      {props.picking && (
        <div className="pin-prompt">
          <MapPin size={17} /> Tap the map to pin your destination
        </div>
      )}
      <div className="map-provider">
        {provider} <span>· Demo route geometry</span>
      </div>
    </div>
  );
}
