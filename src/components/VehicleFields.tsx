"use client";

import { useId, useRef, useState } from "react";
import { VEHICLE_MAKES, getModelsForMake, getYears } from "@/lib/vehicleData";

/** Texte sans accents ni majuscules ni espaces/traits superflus, pour comparer « mercedes » et « Mercedes-Benz ». */
const plain = (t: string) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[\s-]+/g, " ").trim();

/** Les choix qui commencent par le texte tapé d'abord, puis ceux dont un autre mot commence ainsi (« benz » → Mercedes-Benz). */
function filterOptions(options: string[], typed: string): string[] {
  const q = plain(typed);
  if (!q) return options;
  const starts = options.filter((o) => plain(o).startsWith(q));
  const words = options.filter((o) => !plain(o).startsWith(q) && plain(o).split(" ").some((w) => w.startsWith(q)));
  return [...starts, ...words];
}

/**
 * Champ avec liste déroulante filtrée au fil de la frappe. La liste propose, mais n'impose rien :
 * une marque ou un modèle absent de la liste s'écrit simplement jusqu'au bout.
 */
function Combo({ value, onChange, options, placeholder, label, className, disabledHint }: {
  value: string; onChange: (v: string) => void; options: string[]; placeholder: string; label: string; className: string; disabledHint?: string;
}) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const list = filterOptions(options, value).slice(0, 60);
  const exact = list.length === 1 && plain(list[0]) === plain(value);
  const show = open && list.length > 0 && !exact;

  function pick(v: string) {
    onChange(v);
    setOpen(false);
    setActive(-1);
  }

  return (
    <div className="relative">
      <input ref={inputRef} aria-label={label} placeholder={placeholder} autoComplete="off" className={`${className} pr-7`} value={value}
        role="combobox" aria-autocomplete="list" aria-expanded={show} aria-controls={`${id}-list`}
        aria-activedescendant={show && active >= 0 ? `${id}-${active}` : undefined}
        title={options.length === 0 && disabledHint ? disabledHint : undefined}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onChange={(e) => { onChange(e.target.value); setOpen(true); setActive(-1); }}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((i) => Math.min(list.length - 1, i + 1)); }
          else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); }
          else if (e.key === "Enter" && show && active >= 0) { e.preventDefault(); pick(list[active]); }
          else if (e.key === "Tab" && show && value.trim() && list.length > 0 && plain(list[0]).startsWith(plain(value))) {
            // Tab complète avec la première proposition, comme un correcteur de saisie.
            onChange(list[active >= 0 ? active : 0]);
            setOpen(false);
          }
          else if (e.key === "Escape" && show) { e.stopPropagation(); setOpen(false); }
        }} />
      {options.length > 0 && (
        <button type="button" tabIndex={-1} aria-label={`${label} : afficher la liste`}
          // mousedown : garder le focus dans le champ pour que la liste reste ouverte
          onMouseDown={(e) => { e.preventDefault(); inputRef.current?.focus(); setOpen((o) => !o); }}
          className="absolute right-0 top-0 h-full w-7 flex items-center justify-center text-gray-400 hover:text-gray-600">
          <svg viewBox="0 0 20 20" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M5.3 7.3a1 1 0 011.4 0L10 10.6l3.3-3.3a1 1 0 111.4 1.4l-4 4a1 1 0 01-1.4 0l-4-4a1 1 0 010-1.4z" /></svg>
        </button>
      )}
      {show && (
        <ul id={`${id}-list`} role="listbox" aria-label={label}
          className="absolute z-20 left-0 top-full mt-1 min-w-full w-max max-w-[16rem] max-h-56 overflow-y-auto bg-white rounded-lg border border-gray-200 shadow-lg py-1">
          {list.map((o, i) => (
            <li key={o} id={`${id}-${i}`} role="option" aria-selected={i === active}
              onMouseDown={(e) => { e.preventDefault(); pick(o); }} onMouseEnter={() => setActive(i)}
              className="px-2.5 py-1.5 text-sm cursor-pointer text-gray-800" style={{ background: i === active ? "#fff7ed" : undefined }}>
              {o}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Année, marque et modèle du véhicule : listes déroulantes, saisie libre acceptée pour la marque et le modèle. */
export default function VehicleFields({ year, make, model, onChange, inputClass, labels }: {
  year: string; make: string; model: string;
  onChange: (v: { vehicleYear: string; vehicleMake: string; vehicleModel: string }) => void;
  inputClass: string;
  labels: { year: string; make: string; model: string; pickMakeFirst: string };
}) {
  const years = getYears();
  // La marque tapée peut différer en accents ou majuscules : on retrouve celle de la liste pour proposer ses modèles.
  const knownMake = VEHICLE_MAKES.find((m) => plain(m) === plain(make));
  const models = knownMake ? getModelsForMake(knownMake) : [];
  const set = (patch: Partial<{ vehicleYear: string; vehicleMake: string; vehicleModel: string }>) =>
    onChange({ vehicleYear: year, vehicleMake: make, vehicleModel: model, ...patch });
  return (
    <div className="grid grid-cols-3 gap-1">
      <select aria-label={labels.year} className={inputClass} value={year} onChange={(e) => set({ vehicleYear: e.target.value })}>
        <option value="">{labels.year}</option>
        {/* Une année saisie autrefois hors de la liste reste affichée */}
        {year && !years.includes(Number(year)) && <option value={year}>{year}</option>}
        {years.map((y) => <option key={y} value={y}>{y}</option>)}
      </select>
      <Combo label={labels.make} placeholder={labels.make} className={inputClass} options={VEHICLE_MAKES} value={make}
        onChange={(v) => set({ vehicleMake: v, ...(plain(v) !== plain(make) && knownMake && VEHICLE_MAKES.find((m) => plain(m) === plain(v)) !== knownMake ? { vehicleModel: "" } : {}) })} />
      <Combo label={labels.model} placeholder={labels.model} className={inputClass} options={models} value={model}
        disabledHint={labels.pickMakeFirst} onChange={(v) => set({ vehicleModel: v })} />
    </div>
  );
}
