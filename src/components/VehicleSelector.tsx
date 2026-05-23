"use client";

import { useState } from "react";
import { VEHICLE_MAKES, getModelsForMake, getYears } from "@/lib/vehicleData";

interface Vehicle {
  year: number;
  make: string;
  model: string;
}

interface VehicleSelectorProps {
  onSelect: (vehicle: Vehicle) => void;
  initialYear?: number;
  initialMake?: string;
  initialModel?: string;
  inline?: boolean;
  compact?: boolean;
}

export default function VehicleSelector({
  onSelect,
  initialYear,
  initialMake = "",
  initialModel = "",
  inline = false,
  compact = false,
}: VehicleSelectorProps) {
  const [year, setYear]   = useState<number | "">(initialYear ?? "");
  const [make, setMake]   = useState(initialMake);
  const [model, setModel] = useState(initialModel);

  const years  = getYears();
  const models = make ? getModelsForMake(make) : [];

  function handleMakeChange(m: string) { setMake(m); setModel(""); }

  function handleSubmit() {
    if (year && make && model) {
      onSelect({ year: Number(year), make, model });
    }
  }

  const isReady = year && make && model;

  const sel = compact
    ? "block w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
    : "block w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition font-medium";

  if (inline) {
    return (
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[100px]">
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Année</label>
          <select className={sel} value={year} onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : "")}>
            <option value="">Année</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Marque</label>
          <select className={sel} value={make} onChange={(e) => handleMakeChange(e.target.value)}>
            <option value="">Marque</option>
            {VEHICLE_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Modèle</label>
          <select className={sel} value={model} onChange={(e) => setModel(e.target.value)} disabled={!make}>
            <option value="">Modèle</option>
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <button
          onClick={handleSubmit}
          disabled={!isReady}
          className="px-6 py-2.5 font-bold text-white rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
          style={{ backgroundColor: isReady ? "#f97316" : "#94a3b8" }}
        >
          Rechercher
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Année</label>
          <select className={sel} value={year} onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : "")}>
            <option value="">Choisir</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Marque</label>
          <select className={sel} value={make} onChange={(e) => handleMakeChange(e.target.value)}>
            <option value="">Choisir</option>
            {VEHICLE_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs font-bold text-gray-500 mb-1.5 uppercase tracking-wide">Modèle</label>
        <select className={sel} value={model} onChange={(e) => setModel(e.target.value)} disabled={!make}>
          <option value="">{make ? "Choisir le modèle" : "Sélectionnez d'abord la marque"}</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      <button
        onClick={handleSubmit}
        disabled={!isReady}
        className="w-full py-3 font-bold text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition text-sm"
        style={{ backgroundColor: isReady ? "#f97316" : "#94a3b8" }}
      >
        {isReady ? `Trouver un garage — ${make} ${model}` : "Sélectionnez votre véhicule"}
      </button>

      {isReady && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500">
          <span className="text-green-500">✓</span>
          <span className="font-semibold text-gray-700">{year} {make} {model}</span>
          <button
            onClick={() => { setYear(""); setMake(""); setModel(""); }}
            className="ml-auto text-orange-500 hover:text-orange-700 font-medium"
          >
            Modifier
          </button>
        </div>
      )}
    </div>
  );
}
