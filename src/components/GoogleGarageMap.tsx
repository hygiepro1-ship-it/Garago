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
  /** appelé si Google refuse la carte (clé, quota, facturation) : la page bascule sur OpenStreetMap */
  onFail?: () => void;
}

/* eslint-disable @typescript-eslint/no-explicit-any */

// ID de carte Google (console Cloud > Maps Platform > Gestion des cartes). Il active le moteur
// vectoriel récent (zoom fluide, rotation) et les repères avancés. DEMO_MAP_ID convient au test ;
// en production, créer sa propre carte et renseigner NEXT_PUBLIC_GOOGLE_MAP_ID.
const MAP_ID = process.env.NEXT_PUBLIC_GOOGLE_MAP_ID || "DEMO_MAP_ID";

let loader: Promise<any> | null = null;
function loadGoogle(apiKey: string): Promise<any> {
  const w = window as any;
  if (w.google?.maps?.importLibrary) return Promise.resolve(w.google);
  if (loader) return loader;
  loader = new Promise((resolve, reject) => {
    // Avec loading=async, l'API n'est prête qu'à l'appel du rappel (pas au « load » du script)
    w.__garagoMapsReady = () => resolve(w.google);
    const s = document.createElement("script");
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&language=fr&region=CA&v=weekly&loading=async&callback=__garagoMapsReady`;
    s.async = true;
    s.onerror = () => { loader = null; reject(new Error("google maps")); };
    document.head.appendChild(s);
  });
  return loader;
}

// Vert = réservation en ligne, gris = à appeler, orange = sélectionné.
function pin(g: any, PinElement: any, color: string, scale: number) {
  return new PinElement({ background: color, borderColor: "#ffffff", glyphColor: "#ffffff", scale }).element;
}

export default function GoogleGarageMap({ apiKey, garages, userPos, radiusKm, selectedSlug, onSelect, onFail }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const gRef = useRef<any>(null);
  const libs = useRef<any>(null);
  const mapRef = useRef<any>(null);
  const overlays = useRef<any[]>([]);
  const markers = useRef<Map<string, { marker: any; online: boolean }>>(new Map());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;
  const onFailRef = useRef(onFail);
  onFailRef.current = onFail;
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;
    // Google appelle cette fonction quand la clé ou le quota est refusé : on laisse la page prendre le relais
    (window as any).gm_authFailure = () => { if (!cancelled) { setFailed(true); onFailRef.current?.(); } };
    (async () => {
      const g = await loadGoogle(apiKey);
      const [{ Map, Circle }, { AdvancedMarkerElement, PinElement }, { LatLngBounds }] = await Promise.all([
        g.maps.importLibrary("maps"), g.maps.importLibrary("marker"), g.maps.importLibrary("core"),
      ]);
      if (cancelled || !el.current) return;
      gRef.current = g;
      libs.current = { Circle, AdvancedMarkerElement, PinElement, LatLngBounds };
      mapRef.current = new Map(el.current, {
        mapId: MAP_ID, center: { lat: 45.5, lng: -73.6 }, zoom: 11,
        gestureHandling: "cooperative", mapTypeControl: false, streetViewControl: false, fullscreenControl: false,
        renderingType: "VECTOR", colorScheme: "LIGHT",
      });
      setReady(true);
    })().catch((e) => { console.error("[GoogleGarageMap]", e); setFailed(true); onFailRef.current?.(); });
    return () => { cancelled = true; };
  }, [apiKey]);

  useEffect(() => {
    const map = mapRef.current, L = libs.current;
    if (!ready || !map || !L) return;
    overlays.current.forEach((o) => { o.map = null; o.setMap?.(null); });
    overlays.current = [];
    markers.current.clear();
    const bounds = new L.LatLngBounds();

    for (const gr of garages) {
      const marker = new L.AdvancedMarkerElement({
        map, position: { lat: gr.latitude, lng: gr.longitude }, title: gr.name,
        content: pin(null, L.PinElement, gr.online ? "#15803d" : "#64748b", 1),
      });
      marker.addListener("gmp-click", () => onSelectRef.current(gr.slug));
      overlays.current.push(marker);
      markers.current.set(gr.slug, { marker, online: gr.online });
      bounds.extend({ lat: gr.latitude, lng: gr.longitude });
    }

    if (userPos) {
      const center = { lat: userPos.lat, lng: userPos.lng };
      const dot = document.createElement("div");
      dot.style.cssText = "width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 0 0 1px rgba(0,0,0,.25)";
      overlays.current.push(new L.AdvancedMarkerElement({ map, position: center, title: "Vous êtes ici", content: dot, zIndex: 2000 }));
      const circle = new L.Circle({
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
    const L = libs.current;
    if (!ready || !L) return;
    markers.current.forEach(({ marker, online }, slug) => {
      const sel = slug === selectedSlug;
      marker.content = pin(null, L.PinElement, sel ? "#f97316" : online ? "#15803d" : "#64748b", sel ? 1.4 : 1);
      marker.zIndex = sel ? 1000 : 0;
    });
    const m = selectedSlug ? markers.current.get(selectedSlug)?.marker : null;
    if (m) mapRef.current?.panTo(m.position);
  }, [ready, selectedSlug]);

  if (failed) {
    return <div className="w-full h-full flex items-center justify-center text-sm p-4 text-center" style={{ color: "#64748b", minHeight: 300 }}>La carte n'a pas pu se charger. Utilisez la vue « Liste ».</div>;
  }
  return <div ref={el} role="region" aria-label="Carte des garages" style={{ width: "100%", height: "100%", minHeight: 300 }} />;
}
