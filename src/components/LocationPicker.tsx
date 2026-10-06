"use client";

import { useEffect, useRef, useState } from "react";
import AddressAutocomplete, { type AddressResult } from "@/components/AddressAutocomplete";
import LocationGuide from "@/components/LocationGuide";

type GeoStatus = "idle" | "loading" | "ok" | "denied" | "error";

interface Props {
  geoStatus: GeoStatus;
  accuracy: number | null;
  /** adresse choisie à la main (sinon « Autour de moi ») */
  label: string | null;
  active: boolean;
  onLocate: () => void;
  onAddress: (r: AddressResult) => void;
  onDisable: () => void;
}

const PIN = (
  <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M12 21s7-6.2 7-11a7 7 0 10-14 0c0 4.8 7 11 7 11z" /><circle cx="12" cy="10" r="2.5" />
  </svg>
);

// Position de recherche : une seule pastille dans la barre ; les choix (me localiser, adresse, guide) s'ouvrent au clic.
export default function LocationPicker({ geoStatus, accuracy, label, active, onLocate, onAddress, onDisable }: Props) {
  const [open, setOpen] = useState(false);
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", away);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", away); document.removeEventListener("keydown", esc); };
  }, [open]);

  const approx = geoStatus === "ok" && !label && accuracy != null && accuracy > 150;
  const text =
    geoStatus === "loading" ? "Localisation en cours…"
    : active ? (label ?? (approx ? "Position approximative" : "Autour de moi"))
    : geoStatus === "denied" ? "Position refusée"
    : "Choisir ma position";
  const color = active && !approx ? "#15803d" : approx ? "#b45309" : "#47586f";

  return (
    <div ref={box} className="relative w-full sm:w-auto">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-haspopup="dialog"
        className="w-full sm:w-auto flex items-center gap-2 px-3 py-2 text-sm font-semibold bg-white"
        style={{ borderRadius: 6, border: "1px solid #cbd3df", color: "#0b1f3a" }}>
        <span style={{ color }}>{PIN}</span>
        <span className="truncate max-w-[220px]">{text}</span>
        <svg className="w-4 h-4 flex-shrink-0 ml-auto" viewBox="0 0 24 24" fill="none" stroke="#47586f" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg>
      </button>

      {open && (
        <div role="dialog" aria-label="Choisir ma position"
          className="absolute left-0 top-full mt-1.5 z-30 bg-white w-full sm:w-[340px]"
          style={{ borderRadius: 6, border: "1px solid #cbd3df", padding: 12 }}>
          <button type="button" onClick={() => { onLocate(); }}
            className="w-full flex items-center gap-2 py-2 text-sm font-semibold text-left" style={{ color: "#0b1f3a" }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="7" /></svg>
            Utiliser ma position
          </button>
          {geoStatus === "denied" && <p className="text-xs pb-2" style={{ color: "#b91c1c" }}>Autorisez la localisation dans votre navigateur, ou saisissez une adresse.</p>}
          {approx && <p className="text-xs pb-2" style={{ color: "#b45309" }}>Votre appareil ne donne qu&apos;une position approximative. Saisissez votre adresse pour plus de précision.</p>}

          <div className="pt-2" style={{ borderTop: "1px solid #e5e9f0" }}>
            <p className="text-xs font-bold pb-1.5" style={{ color: "#47586f" }}>Ou saisir une adresse ou un code postal</p>
            <AddressAutocomplete
              placeholder="Votre adresse"
              inputClass="w-full border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
              onSelect={(r) => { onAddress(r); setOpen(false); }}
            />
          </div>

          <div className="mt-2 pt-2 flex flex-wrap items-center justify-between gap-2 text-xs" style={{ borderTop: "1px solid #e5e9f0" }}>
            <LocationGuide className="text-xs" />
            {active && (
              <button type="button" onClick={() => { onDisable(); setOpen(false); }} className="underline" style={{ color: "#47586f" }}>
                Ne plus utiliser ma position
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
