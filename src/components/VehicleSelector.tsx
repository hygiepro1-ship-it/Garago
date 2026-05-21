"use client";

import { useState } from "react";
import { VEHICLE_MAKES, getModelsForMake, getYears } from "@/lib/vehicleData";

interface VehicleSelectorProps {
  onSelect: (vehicle: { year: number; make: string; model: string }) => void;
  initialYear?: number;
  initialMake?: string;
  initialModel?: string;
  inline?: boolean;
}

export default function VehicleSelector({
  onSelect,
  initialYear,
  initialMake,
  initialModel,
  inline = false,
}: VehicleSelectorProps) {
  const [year, setYear] = useState<number | "">(initialYear ?? "");
  const [make, setMake] = useState(initialMake ?? "");
  const [model, setModel] = useState(initialModel ?? "");
  const years = getYears();
  const models = make ? getModelsForMake(make) : [];

  function handleMakeChange(m: string) {
    setMake(m);
    setModel("");
  }

  function handleSubmit() {
    if (year && make && model) {
      onSelect({ year: Number(year), make, model });
    }
  }

  const selectClass =
    "block w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all";

  return (
    <div className={inline ? "flex flex-wrap gap-3 items-end" : "space-y-3"}>
      <div className={inline ? "flex-1 min-w-[120px]" : ""}>
        <label className="block text-sm font-medium text-gray-700 mb-1">Année</label>
        <select className={selectClass} value={year} onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : "")}>
          <option value="">Année</option>
          {years.map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className={inline ? "flex-1 min-w-[140px]" : ""}>
        <label className="block text-sm font-medium text-gray-700 mb-1">Marque</label>
        <select className={selectClass} value={make} onChange={(e) => handleMakeChange(e.target.value)}>
          <option value="">Marque</option>
          {VEHICLE_MAKES.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <div className={inline ? "flex-1 min-w-[140px]" : ""}>
        <label className="block text-sm font-medium text-gray-700 mb-1">Modèle</label>
        <select className={selectClass} value={model} onChange={(e) => setModel(e.target.value)} disabled={!make}>
          <option value="">Modèle</option>
          {models.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!year || !make || !model}
        className={`${inline ? "" : "w-full"} px-6 py-3 bg-blue-700 text-white rounded-xl font-semibold hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all`}
      >
        Rechercher
      </button>
    </div>
  );
}
