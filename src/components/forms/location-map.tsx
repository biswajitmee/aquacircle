"use client";
import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { MapPin } from "lucide-react";
import type { Coordinates, GpsPosition } from "@/lib/service-location";

export default function LocationMap({ initial, recenter, gps, onMoveStart, onSelect, onReady }: {
  initial: Coordinates;
  recenter: Coordinates | null;
  gps: GpsPosition | null;
  onMoveStart: () => void;
  onSelect: (coordinates: Coordinates) => void;
  onReady: (ready: boolean) => void;
}) {
  const element = useRef<HTMLDivElement>(null);
  const instance = useRef<L.Map | null>(null);
  const circle = useRef<L.Circle | null>(null);
  const callbacks = useRef({ onMoveStart, onSelect, onReady });
  useEffect(() => { callbacks.current = { onMoveStart, onSelect, onReady }; });
  useEffect(() => {
    if (!element.current) return;
    const map = L.map(element.current, {
      center: [initial.latitude, initial.longitude], zoom: 18, minZoom: 3, maxZoom: 20,
      maxBounds: [[-85, -180], [85, 180]], maxBoundsViscosity: 1,
      zoomAnimation: false, fadeAnimation: false, markerZoomAnimation: false,
      // ResizeObserver handles both viewport and dialog changes. Avoid Leaflet's
      // delayed window-resize moveend event surviving a dialog unmount.
      trackResize: false,
      inertia: false, keyboardPanDelta: 40, zoomControl: false,
      scrollWheelZoom: "center", doubleClickZoom: "center", touchZoom: "center",
      attributionControl: false,
    });
    instance.current = map;
    L.control.zoom({ position: "topright", zoomInTitle: "Zoom in", zoomOutTitle: "Zoom out" }).addTo(map);
    L.control.scale({ imperial: false, position: "bottomleft" }).addTo(map);
    const tiles = L.tileLayer("/api/location/tiles/{z}/{x}/{y}", {
      maxZoom: 20, maxNativeZoom: 20, noWrap: true,
      updateWhenIdle: true, updateWhenZooming: false, keepBuffer: 1,
      detectRetina: false,
    }).addTo(map);
    let failed = false;
    tiles.on("loading", () => { failed = false; callbacks.current.onReady(false); });
    tiles.on("tileerror", () => { failed = true; callbacks.current.onReady(false); });
    tiles.on("load", () => callbacks.current.onReady(!failed));
    let resizing = false;
    map.on("movestart", () => callbacks.current.onMoveStart());
    map.on("moveend", () => {
      // A layout resize preserves the selected point and any manually edited
      // address; it is not a customer's request to choose a different pin.
      if (resizing) return;
      const center = map.getCenter();
      callbacks.current.onSelect({ latitude: center.lat, longitude: center.lng });
    });
    const resize = new ResizeObserver(() => {
      if (instance.current !== map) return;
      resizing = true;
      try { map.invalidateSize({ animate: false, pan: true }); }
      finally { resizing = false; }
    });
    resize.observe(element.current);
    return () => {
      resize.disconnect(); instance.current = null;
      map.remove(); map.off(); tiles.off(); circle.current = null;
    };
    // The map is constructed once per dialog; recentering has its own effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (!recenter || !instance.current) return;
    instance.current.setView([recenter.latitude, recenter.longitude], Math.max(18, instance.current.getZoom()), { animate: false });
  }, [recenter]);
  useEffect(() => {
    if (!instance.current) return;
    circle.current?.remove();
    circle.current = gps ? L.circle([gps.latitude, gps.longitude], {
      radius: gps.accuracy, color: "#0d7774", fillColor: "#35c6bc", fillOpacity: 0.12, weight: 1, interactive: false,
    }).addTo(instance.current) : null;
  }, [gps]);
  return <div className="location-map-wrap">
    <div ref={element} className="location-map" role="region" aria-label="Service location map"
      aria-describedby="location-map-instructions" tabIndex={0} />
    <span className="location-center-pin" aria-hidden="true"><MapPin size={44} fill="currentColor" /></span>
  </div>;
}
