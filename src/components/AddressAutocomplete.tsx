"use client";

import { useState, useRef, useEffect, useCallback } from "react";

export interface AddressResult {
  streetAddress: string; // "123 Rue Saint-Denis"
  city: string;          // "Montréal"
  province: string;      // "QC"
  postalCode: string;    // "H2X 1Y5"
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

/** Map French/English province names → 2-letter code */
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

function parseNominatim(r: any): AddressResult {
  const a = r.address ?? {};
  const num    = a.house_number ?? "";
  const road   = a.road ?? a.pedestrian ?? a.path ?? a.avenue ?? "";
  const street = [num, road].filter(Boolean).join(" ");
  const city   = a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb ?? a.county ?? "";
  const prov   = PROVINCE_CODES[a.state ?? ""] ?? a.state ?? "QC";
  return {
    streetAddress: street,
    city,
    province: prov,
    postalCode: (a.postcode ?? "").toUpperCase(),
    lat: parseFloat(r.lat),
    lng: parseFloat(r.lon),
    displayName: r.display_name,
  };
}

export default function AddressAutocomplete({
  onSelect,
  initialValue = "",
  placeholder = "Ex : 1234 Rue Saint-Denis, Montréal",
  inputClass = "",
}: Props) {
  const [query, setQuery]           = useState(initialValue);
  const [results, setResults]       = useState<any[]>([]);
  const [open, setOpen]             = useState(false);
  const [loading, setLoading]       = useState(false);
  const [selected, setSelected]     = useState(false);
  const containerRef                = useRef<HTMLDivElement>(null);
  const debounceRef                 = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Close on outside click
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
    if (q.trim().length < 4) { setResults([]); setOpen(false); return; }
    setLoading(true);
    try {
      const res  = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setResults(data);
      setOpen(data.length > 0);
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
    debounceRef.current = setTimeout(() => search(val), 400);
  }

  function handleSelect(raw: any) {
    const parsed = parseNominatim(raw);
    // Display the short street address in the input, not the full display_name
    const label = [parsed.streetAddress, parsed.city].filter(Boolean).join(", ");
    setQuery(label || parsed.displayName.split(",")[0]);
    setSelected(true);
    setOpen(false);
    setResults([]);
    onSelect(parsed);
  }

  // Shorten display_name for the dropdown (keep first 3 parts)
  function shortDisplay(displayName: string) {
    return displayName.split(",").slice(0, 3).join(",").trim();
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none">
          📍
        </span>
        <input
          type="text"
          value={query}
          onChange={handleChange}
          onFocus={() => { if (results.length > 0) setOpen(true); }}
          placeholder={placeholder}
          autoComplete="off"
          className={`${inputClass} pl-8`}
        />
        {loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs animate-pulse">
            ···
          </span>
        )}
        {selected && !loading && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500 text-sm">✓</span>
        )}
      </div>

      {open && results.length > 0 && (
        <ul
          className="absolute z-50 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden"
          style={{ maxHeight: "280px", overflowY: "auto" }}
        >
          {results.map((r) => {
            const parsed = parseNominatim(r);
            const mainLine   = parsed.streetAddress || parsed.displayName.split(",")[0];
            const secondLine = [parsed.city, parsed.province, parsed.postalCode].filter(Boolean).join(", ");
            return (
              <li key={r.place_id}>
                <button
                  type="button"
                  onMouseDown={(e) => { e.preventDefault(); handleSelect(r); }}
                  className="w-full text-left px-4 py-3 hover:bg-orange-50 transition-colors border-b border-gray-100 last:border-0"
                >
                  <p className="text-sm font-semibold text-gray-900 truncate">{mainLine}</p>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{secondLine}</p>
                </button>
              </li>
            );
          })}
          <li className="px-4 py-2 text-center border-t border-gray-100">
            <span className="text-xs text-gray-400">
              Données ©{" "}
              <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-600">
                OpenStreetMap
              </a>
            </span>
          </li>
        </ul>
      )}

      {query.length >= 4 && !loading && !open && !selected && results.length === 0 && (
        <p className="text-xs text-gray-400 mt-1 pl-1">Aucun résultat — vérifiez l'adresse</p>
      )}
    </div>
  );
}
