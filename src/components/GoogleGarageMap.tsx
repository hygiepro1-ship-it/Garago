"use client";

import { useEffect, useRef, useState } from "react";
import type { MapGarage } from "./GarageMap";

interface Props {
  apiKey: string;
  garages: MapGarage[];
  userPos: { lat: number; lng: number } | null;
  radiusKm: number;
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
let loader: Promise<any> | null = null;
function loadGoogle(apiKey: string): Promise<any> {
  const w = window as any;
  if (w.google?.maps?.Map) return Promise.resolve(w.google);
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=fr&region=CA&loading=async`;
    s.async = true;
    s.onload = () => resolve(w.google);
    s.onerror = () => { loader = null; reject(new Error("google maps")); };
    document.head.appendChild(s);
  });
  return loader;
}

// Repère en goutte : vert = réservation en ligne, gris = à appeler, orange = sélectionné.
function pinIcon(g: any, color: string, scale: number) {
  return {
    path: "M12 0C5.4 0 0 5.4 0 12c0 9 12 22 12 22s12-13 12-22C24 5.4 18.6 0 12 0z",
    fillColor: color, fillOpacity: 1, strokeColor: "#ffffff", strokeWeight: 2,
    scale, anchor: new g.maps.Point(12, 34),
  };
}

export default function GoogleGarageMap({ apiKey, garages, userPos, radiusKm, selectedSlug, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const gRef = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const overlays = useRef<any[]>([]);
  const markers = useRef<Map<string, { marker: any; online: boolean }>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadGoogle(apiKey).then((g) => {
      if (cancelled || !el.current) return;
      gRef.current = g;
      mapRef.current = new g.maps.Map(el.current, {
        center: { lat: 45.5, lng: -73.6 }, zoom: 11,
        gestureHandling: "cooperative", mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
      });
      setReady(true);
    }).catch(() => setFailed(true));
    return () => { cancelled = true; };
  }, [apiKey]);

  useEffect(() => {
    const g = gRef.current, map = mapRef.current;
    if (!ready || !g || !map) return;
    overlays.current.forEach((o) => o.setMap(null));
    overlays.current = [];
    markers.current.clear();
    const bounds = new g.maps.LatLngBounds();

    for (const gr of garages) {
      const marker = new g.maps.Marker({
        position: { lat: gr.latitude, lng: gr.longitude }, map, title: gr.name,
        icon: pinIcon(g, gr.online ? "#15803d" : "#64748b", 1),
      });
      marker.addListener("click", () => onSelectRef.current(gr.slug));
      overlays.current.push(marker);
      markers.current.set(gr.slug, { marker, online: gr.online });
      bounds.extend(marker.getPosition());
    }

    if (userPos) {
      const center = { lat: userPos.lat, lng: userPos.lng };
      overlays.current.push(new g.maps.Marker({
        position: center, map, title: "Vous êtes ici", zIndex: 2000,
        icon: { path: g.maps.SymbolPath.CIRCLE, scale: 8, fillColor: "#2563eb", fillOpacity: 1, strokeColor: "#fff", strokeWeight: 3 },
      }));
      const circle = new g.maps.Circle({
        map, center, radius: radiusKm * 1000, strokeColor: "#2563eb", strokeWeight: 1.5,
        fillColor: "#2563eb", fillOpacity: 0.05, clickable: false,
      });
      overlays.current.push(circle);
      map.fitBounds(circle.getBounds(), 10);
    } else if (garages.length > 1) {
      map.fitBounds(bounds, 30);
    } else if (garages.length === 1) {
      map.setCenter(bounds.getCenter()); map.setZoom(14);
    }
  }, [ready, garages, userPos, radiusKm]);

  useEffect(() => {
    const g = gRef.current;
    if (!ready || !g) return;
    markers.current.forEach(({ marker, online }, slug) => {
      const sel = slug === selectedSlug;
      marker.setIcon(pinIcon(g, sel ? "#f97316" : online ? "#15803d" : "#64748b", sel ? 1.35 : 1));
      marker.setZIndex(sel ? 1000 : 0);
    });
    const m = selectedSlug ? markers.current.get(selectedSlug)?.marker : null;
    if (m) mapRef.current?.panTo(m.getPosition());
  }, [ready, selectedSlug]);

  if (failed) {
    return <div className="w-full h-full flex items-center justify-center text-sm p-4 text-center" style={{ color: "#64748b", minHeight: 300 }}>La carte n'a pas pu se charger. Utilisez la vue « Liste ».</div>;
  }
  return <div ref={el} role="region" aria-label="Carte des garages" style={{ width: "100%", height: "100%", minHeight: 300 }} />;
}
