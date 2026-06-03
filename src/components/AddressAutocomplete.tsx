"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface AddressResult {
  streetAddress: string;
  city: string;
  province: string;
  postalCode: string;
  lat: number;
  lng: number;
  displayName: string;
}

interface Props {
  onSelect: (r: AddressResult) => void;
  initialValue?: string;
  placeholder?: string;
  inputClass?: string;
  postalLabel?: string;
  addressLabel?: string;
}

const PROVINCE_CODES: Record<string, string> = {
  "Québec": "QC", "Quebec": "QC",
  "Ontario": "ON", "Alberta": "AB",
  "Colombie-Britannique": "BC", "British Columbia": "BC",
  "Manitoba": "MB", "Saskatchewan": "SK",
  "Nouvelle-Écosse": "NS", "Nova Scotia": "NS",
  "Nouveau-Brunswick": "NB", "New Brunswick": "NB",
  "Île-du-Prince-Édouard": "PE", "Prince Edward Island": "PE",
  "Terre-Neuve-et-Labrador": "NL", "Newfoundland and Labrador": "NL",
  "Yukon": "YT", "Territoires du Nord-Ouest": "NT",
  "Northwest Territories": "NT", "Nunavut": "NU",
};

function formatPostal(raw: string) {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 3) return clean;
  return clean.slice(0, 3) + " " + clean.slice(3, 6);
}

function isValidPostal(p: string) {
  return /^[A-Z]\d[A-Z] \d[A-Z]\d$/.test(p);
}

function parsePhoton(feature: any): AddressResult {
  const p = feature.properties ?? {};
  const [lng, lat] = feature.geometry?.coordinates ?? [0, 0];
  const num    = p.housenumber ?? "";
  const street = p.street ?? p.name ?? "";
  const streetAddress = [num, street].filter(Boolean).join(" ");
  const city   = p.city ?? p.town ?? p.village ?? p.municipality ?? p.county ?? "";
  const prov   = PROVINCE_CODES[p.state ?? ""] ?? p.state ?? "QC";
  const postal = (p.postcode ?? "").toUpperCase();
  return {
    streetAddress, city, province: prov, postalCode: postal, lat, lng,
    displayName: [streetAddress, city, prov, postal].filter(Boolean).join(", "),
  };
}

export default function AddressAutocomplete({ onSelect, initialValue = "", inputClass = "", postalLabel, addressLabel }: Props) {
  const [postal, setPostal]         = useState("");
  const [postalOk, setPostalOk]     = useState(false);
  const [postalErr, setPostalErr]   = useState("");
  const [postalCenter, setPostalCenter] = useState<{
    lat: number; lng: number;
    city: string; district: string; province: string;
    bbox: string; // "minLng,minLat,maxLng,maxLat"
  } | null>(null);

  const [street, setStreet]         = useState(initialValue);
  const [results, setResults]       = useState<any[]>([]);
  const [open, setOpen]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const [selected, setSelected]     = useState(false);
  const [activeIdx, setActiveIdx]   = useState(-1);

  const containerRef  = useRef<HTMLDivElement>(null);
  const debounceRef   = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Geocode the postal code to get a geo-center
  const geocodePostal = useCallback(async (p: string) => {
    try {
      const res  = await fetch(`/api/geocode?q=${encodeURIComponent(p + " Canada")}&type=postcode`);
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        const f    = data[0];
        const prop = f.properties ?? {};
        const [fLng, fLat] = f.geometry?.coordinates ?? [0, 0];
        const city     = prop.city ?? prop.town ?? prop.village ?? prop.municipality ?? "";
        const district = prop.district ?? prop.suburb ?? prop.neighbourhood ?? prop.quarter ?? "";
        const prov     = PROVINCE_CODES[prop.state ?? ""] ?? prop.state ?? "QC";

        // Use extent bounding box if available for precise filtering
        const ext  = prop.extent as number[] | undefined;
        let lat = fLat, lng = fLng, bbox = "";
        if (ext && ext.length === 4) {
          // extent: [minLng, maxLat, maxLng, minLat]
          const [minLng, maxLat, maxLng, minLat] = ext;
          lat  = (minLat + maxLat) / 2;
          lng  = (minLng + maxLng) / 2;
          bbox = `${minLng},${minLat},${maxLng},${maxLat}`;
        }

        setPostalCenter({ lat, lng, city, district, province: prov, bbox });
        setPostalErr("");
        return true;
      }
      setPostalErr("Code postal introuvable");
      return false;
    } catch {
      return false;
    }
  }, []);

  async function handlePostalChange(e: React.ChangeEvent<HTMLInputElement>) {
    const formatted = formatPostal(e.target.value);
    setPostal(formatted);
    setPostalOk(false);
    setPostalCenter(null);
    setPostalErr("");
    if (isValidPostal(formatted)) {
      const ok = await geocodePostal(formatted);
      setPostalOk(ok);
    }
  }

  // Search street address scoped to the entered postal code
  const search = useCallback(async (q: string, center: typeof postalCenter, postalCode: string) => {
    if (q.trim().length < 3) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      let url = `/api/geocode?q=${encodeURIComponent(q)}`;
      if (postalCode) url += `&postcode=${encodeURIComponent(postalCode)}`;
      if (center) url += `&lat=${center.lat}&lng=${center.lng}`;
      const res  = await fetch(url);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setOpen(Array.isArray(data) && data.length > 0);
      setActiveIdx(-1);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  function handleStreetChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setStreet(val);
    setSelected(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val, postalCenter, postal), 300);
  }

  function handleSelect(feature: any) {
    const parsed = parsePhoton(feature);
    // Use postal code from input if result doesn't have one
    if (!parsed.postalCode && postal) parsed.postalCode = postal;
    if (!parsed.city && postalCenter) parsed.city = postalCenter.city;
    if (!parsed.province && postalCenter) parsed.province = postalCenter.province;
    const label = [parsed.streetAddress, parsed.city].filter(Boolean).join(", ");
    setStreet(label || parsed.displayName);
    setSelected(true);
    setOpen(false);
    setResults([]);
    onSelect(parsed);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || results.length === 0) return;
    if (e.key === "ArrowDown") { e.preventDefault(); setActiveIdx((i) => Math.min(i + 1, results.length - 1)); }
    if (e.key === "ArrowUp")   { e.preventDefault(); setActiveIdx((i) => Math.max(i - 1, 0)); }
    if (e.key === "Enter" && activeIdx >= 0) { e.preventDefault(); handleSelect(results[activeIdx]); }
    if (e.key === "Escape") setOpen(false);
  }

  const inputBase = inputClass || "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 transition";

  return (
    <div ref={containerRef} className="space-y-3">

      {/* ── Case 1 : Code postal ── */}
      <div>
        {postalLabel && (
          <label className="block text-sm font-semibold text-gray-700 mb-1">{postalLabel}</label>
        )}
        <div className="relative">
          <input
            type="text"
            value={postal}
            onChange={handlePostalChange}
            placeholder="Ex : H2X 1Y5"
            maxLength={7}
            autoComplete="postal-code"
            className={`${inputBase} pr-8`}
            style={{ textTransform: "uppercase", letterSpacing: "0.05em" }}
          />
          {postalOk && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 font-bold text-sm">✓</span>
          )}
          {postalErr && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-red-400 text-sm">✗</span>
          )}
        </div>
        {postalCenter && (
          <p className="text-xs text-green-600 pl-1 mt-1">
            📍 {[postalCenter.district, postalCenter.city, postalCenter.province].filter(Boolean).join(", ")}
          </p>
        )}
        {postalErr && (
          <p className="text-xs text-red-500 pl-1 mt-1">{postalErr}</p>
        )}
      </div>

      {/* ── Case 2 : Numéro et rue ── */}
      <div>
        {addressLabel && (
          <label className="block text-sm font-semibold text-gray-700 mb-1">{addressLabel}</label>
        )}
        <div className="relative">
        <input
          type="text"
          value={street}
          onChange={handleStreetChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={postalOk ? "Numéro et nom de la rue" : "Entrez d'abord le code postal"}
          disabled={!postalOk}
          autoComplete="off"
          spellCheck={false}
          className={`${inputBase} pr-8 disabled:opacity-50 disabled:cursor-not-allowed`}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs animate-pulse">●●●</span>
        )}
        {selected && !loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 font-bold">✓</span>
        )}

        {open && results.length > 0 && (
          <ul
            className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl shadow-xl overflow-hidden"
            style={{ border: "1px solid #e5e7eb", maxHeight: 280, overflowY: "auto" }}
          >
            {results.map((feature, idx) => {
              const p = parsePhoton(feature);
              const mainLine = [p.streetAddress].filter(Boolean).join("") || feature.properties?.name || "";
              const subLine  = [p.city, p.province, p.postalCode].filter(Boolean).join(", ");
              const isActive = idx === activeIdx;
              return (
                <li key={feature.properties?.osm_id ?? idx}>
                  <button
                    type="button"
                    onMouseDown={(e) => { e.preventDefault(); handleSelect(feature); }}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className="w-full text-left px-4 py-3 transition-colors border-b border-gray-50 last:border-0"
                    style={{ backgroundColor: isActive ? "#fff7ed" : "#fff" }}
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 text-gray-300 flex-shrink-0" style={{ fontSize: 13 }}>📍</span>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{mainLine}</p>
                        {subLine && <p className="text-xs text-gray-500 mt-0.5 truncate">{subLine}</p>}
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        </div>
      </div>
    </div>
  );
}
