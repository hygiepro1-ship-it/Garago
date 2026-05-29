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
}

const PROVINCE_CODES: Record<string, string> = {
  "Québec": "QC", "Quebec": "QC",
  "Ontario": "ON",
  "Alberta": "AB",
  "Colombie-Britannique": "BC", "British Columbia": "BC",
  "Manitoba": "MB",
  "Saskatchewan": "SK",
  "Nouvelle-Écosse": "NS", "Nova Scotia": "NS",
  "Nouveau-Brunswick": "NB", "New Brunswick": "NB",
  "Île-du-Prince-Édouard": "PE", "Prince Edward Island": "PE",
  "Terre-Neuve-et-Labrador": "NL", "Newfoundland and Labrador": "NL",
  "Yukon": "YT",
  "Territoires du Nord-Ouest": "NT", "Northwest Territories": "NT",
  "Nunavut": "NU",
};

function parsePhoton(feature: any): AddressResult {
  const p = feature.properties ?? {};
  const [lng, lat] = feature.geometry?.coordinates ?? [0, 0];

  const num    = p.housenumber ?? "";
  const street = p.street ?? p.name ?? "";
  const streetAddress = [num, street].filter(Boolean).join(" ");
  const city   = p.city ?? p.town ?? p.village ?? p.municipality ?? p.county ?? "";
  const prov   = PROVINCE_CODES[p.state ?? ""] ?? p.state ?? "QC";
  const postal = (p.postcode ?? "").toUpperCase();

  const displayName = [streetAddress, city, prov, postal].filter(Boolean).join(", ");

  return { streetAddress, city, province: prov, postalCode: postal, lat, lng, displayName };
}

export default function AddressAutocomplete({
  onSelect,
  initialValue = "",
  placeholder = "Ex : 1234 Rue Saint-Denis, Montréal",
  inputClass = "",
}: Props) {
  const [query, setQuery]       = useState(initialValue);
  const [results, setResults]   = useState<any[]>([]);
  const [open, setOpen]         = useState(false);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);
  const containerRef            = useRef<HTMLDivElement>(null);
  const debounceRef             = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const search = useCallback(async (q: string) => {
    if (q.trim().length < 3) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(Array.isArray(data) ? data : []);
      setOpen(Array.isArray(data) && data.length > 0);
      setActiveIdx(-1);
    } catch {
      setResults([]);
    }
    setLoading(false);
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value;
    setQuery(val);
    setSelected(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(val), 300);
  }

  function handleSelect(feature: any) {
    const parsed = parsePhoton(feature);
    const label  = [parsed.streetAddress, parsed.city].filter(Boolean).join(", ");
    setQuery(label || parsed.displayName);
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

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" style={{ fontSize: 15 }}>
          📍
        </span>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          className={`${inputClass} pl-8`}
          style={{ fontSize: 16 }}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">
            <span className="animate-pulse">●●●</span>
          </span>
        )}
        {selected && !loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 font-bold">✓</span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          className="absolute z-50 top-full mt-1 w-full bg-white rounded-xl shadow-xl overflow-hidden"
          style={{ border: "1px solid #e5e7eb", maxHeight: 300, overflowY: "auto" }}
        >
          {results.map((feature, idx) => {
            const p = parsePhoton(feature);
            const mainLine   = [p.streetAddress].filter(Boolean).join("") || feature.properties?.name || "";
            const subLine    = [p.city, p.province, p.postalCode].filter(Boolean).join(", ");
            const isActive   = idx === activeIdx;
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

      {query.length >= 3 && !loading && !open && !selected && results.length === 0 && (
        <p className="text-xs text-gray-400 mt-1.5 pl-1">Aucun résultat — vérifiez l'adresse ou essayez sans accent</p>
      )}
    </div>
  );
}
