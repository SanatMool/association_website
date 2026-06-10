"use client";

import { useEffect, useRef } from "react";

interface Props {
  lat: number;
  lng: number;
  onPick: (lat: number, lng: number) => void;
}

export default function MapPicker({ lat, lng, onPick }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<unknown>(null);
  const markerRef = useRef<unknown>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    let cancelled = false;

    import("leaflet").then((L) => {
      if (cancelled || !containerRef.current || mapRef.current) return;

      // Fix default icon paths (webpack mangles them)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      const map = L.map(containerRef.current!).setView([lat, lng], 16);
      mapRef.current = map;

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const marker = L.marker([lat, lng], { draggable: true }).addTo(map);
      markerRef.current = marker;

      marker.bindPopup("Drag me to the exact venue location").openPopup();

      // Drag end → update coords
      marker.on("dragend", () => {
        const pos = (marker as import("leaflet").Marker).getLatLng();
        onPick(pos.lat, pos.lng);
      });

      // Click on map → move marker
      map.on("click", (e: import("leaflet").LeafletMouseEvent) => {
        (marker as import("leaflet").Marker).setLatLng(e.latlng);
        onPick(e.latlng.lat, e.latlng.lng);
      });
    });

    return () => {
      cancelled = true;
      if (mapRef.current) {
        (mapRef.current as import("leaflet").Map).remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep marker in sync when lat/lng changes from outside (e.g. geocode pick)
  useEffect(() => {
    if (!markerRef.current || !mapRef.current) return;
    const marker = markerRef.current as import("leaflet").Marker;
    const map = mapRef.current as import("leaflet").Map;
    marker.setLatLng([lat, lng]);
    map.setView([lat, lng], 16);
  }, [lat, lng]);

  return (
    <>
      {/* Leaflet CSS */}
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <div
        ref={containerRef}
        className="w-full rounded-xl overflow-hidden border border-slate-200"
        style={{ height: 280 }}
      />
      <p className="text-xs text-slate-500 mt-1">
        Click anywhere on the map or drag the pin to set the exact venue location.
      </p>
    </>
  );
}
