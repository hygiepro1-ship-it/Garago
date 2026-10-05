"use client";

import { useEffect, useRef, useState } from "react";
import type * as LeafletNS from "leaflet";
import "leaflet/dist/leaflet.css";

export interface MapGarage {
  slug: string;
  name: string;
  latitude: number;
  longitude: number;
  /** true = réservation en ligne, false = à appeler */
  online: boolean;
}

interface Props {
  garages: MapGarage[];
  userPos: { lat: number; lng: number } | null;
  /** rayon de recherche autour de l'utilisateur (km) */
  radiusKm: number;
  selectedSlug: string | null;
  onSelect: (slug: string) => void;
}

// Repère en goutte : vert = réservation en ligne, gris = à appeler, orange = sélectionné.
function pinHtml(color: string, size: number) {
  return `<span style="display:block;width:${size}px;height:${size}px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${color};border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`;
}

export default function GarageMap({ garages, userPos, radiusKm, selectedSlug, onSelect }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletNS.Map | null>(null);
  const layerRef = useRef<LeafletNS.LayerGroup | null>(null);
  const markersRef = useRef<Map<string, { marker: LeafletNS.Marker; online: boolean }>>(new Map());
  const leafletRef = useRef<typeof LeafletNS | null>(null);
  const [ready, setReady] = useState(false);

  // Création de la carte (une seule fois)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !el.current || mapRef.current) return;
      leafletRef.current = L;
      const map = L.map(el.current, { scrollWheelZoom: false }).setView([45.5, -73.6], 11);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>',
      }).addTo(map);
      layerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      setReady(true);
    })();
    return () => {
      cancelled = true;
      mapRef.current?.remove();
      mapRef.current = null;
      layerRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // Repères : redessinés quand la liste de garages ou la position change
  useEffect(() => {
    const L = leafletRef.current, map = mapRef.current, layer = layerRef.current;
    if (!ready || !L || !map || !layer) return;
    layer.clearLayers();
    markersRef.current.clear();
    const points: [number, number][] = [];

    for (const g of garages) {
      const icon = L.divIcon({ className: "", html: pinHtml(g.online ? "#15803d" : "#64748b", 26), iconSize: [26, 26], iconAnchor: [13, 26] });
      const marker = L.marker([g.latitude, g.longitude], { icon, keyboard: true, title: g.name });
      // Info-bulle construite en DOM (textContent) : un nom de garage n'est jamais interprété comme du HTML
      const tip = document.createElement("span");
      tip.textContent = g.name;
      marker.bindTooltip(tip, { direction: "top", offset: [0, -24] });
      marker.on("click", () => onSelect(g.slug));
      marker.addTo(layer);
      markersRef.current.set(g.slug, { marker, online: g.online });
      points.push([g.latitude, g.longitude]);
    }

    if (userPos) {
      L.circleMarker([userPos.lat, userPos.lng], { radius: 8, color: "#fff", weight: 3, fillColor: "#2563eb", fillOpacity: 1 })
        .bindTooltip("Vous êtes ici").addTo(layer);
      points.push([userPos.lat, userPos.lng]);
      // Zoom direct sur la zone de l'utilisateur : le cercle du rayon remplit la carte
      const circle = L.circle([userPos.lat, userPos.lng], { radius: radiusKm * 1000, color: "#2563eb", weight: 1.5, fillColor: "#2563eb", fillOpacity: 0.05, interactive: false }).addTo(layer);
      map.fitBounds(circle.getBounds(), { padding: [10, 10] });
    } else if (points.length > 1) map.fitBounds(points, { padding: [30, 30], maxZoom: 15 });
    else if (points.length === 1) map.setView(points[0], 14);
    // onSelect volontairement hors dépendances : il ne doit pas redessiner la carte
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready, garages, userPos, radiusKm]);

  // Repère sélectionné : plus grand, orange
  useEffect(() => {
    const L = leafletRef.current;
    if (!ready || !L) return;
    markersRef.current.forEach(({ marker, online }, slug) => {
      const sel = slug === selectedSlug;
      marker.setIcon(L.divIcon({
        className: "",
        html: pinHtml(sel ? "#f97316" : online ? "#15803d" : "#64748b", sel ? 34 : 26),
        iconSize: sel ? [34, 34] : [26, 26],
        iconAnchor: sel ? [17, 34] : [13, 26],
      }));
      marker.setZIndexOffset(sel ? 1000 : 0);
    });
    if (selectedSlug) {
      const m = markersRef.current.get(selectedSlug)?.marker;
      if (m) mapRef.current?.panTo(m.getLatLng());
    }
  }, [ready, selectedSlug]);

  return <div ref={el} role="region" aria-label="Carte des garages" style={{ width: "100%", height: "100%", minHeight: 300, borderRadius: 6, zIndex: 0 }} />;
}
