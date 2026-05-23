"use client";

import { useState } from "react";
import { VEHICLE_MAKES, getModelsForMake, getTrimsForModel, getYears, hasTrims } from "@/lib/vehicleData";

interface Vehicle {
  year: number;
  make: string;
  model: string;
  trim?: string;
}

interface VehicleSelectorProps {
  onSelect: (vehicle: Vehicle) => void;
  initialYear?: number;
  initialMake?: string;
  initialModel?: string;
  initialTrim?: string;
  inline?: boolean;
  compact?: boolean;
}

export default function VehicleSelector({
  onSelect,
  initialYear,
  initialMake = "",
  initialModel = "",
  initialTrim = "",
  inline = false,
  compact = false,
}: VehicleSelectorProps) {
  const [year, setYear] = useState<number | "">(initialYear ?? "");
  const [make, setMake] = useState(initialMake);
  const [model, setModel] = useState(initialModel);
  const [trim, setTrim] = useState(initialTrim);

  const years = getYears();
  const models = make ? getModelsForMake(make) : [];
  const trims = model ? getTrimsForModel(model) : [];
  const showTrim = model && hasTrims(model);

  function handleMakeChange(m: string) {
    setMake(m);
    setModel("");
    setTrim("");
  }

  function handleModelChange(m: string) {
    setModel(m);
    setTrim("");
  }

  function handleSubmit() {
    if (year && make && model) {
      onSelect({ year: Number(year), make, model, trim: trim || undefined });
    }
  }

  const isReady = year && make && model;

  const selectClass = compact
    ? "block w-full border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all"
    : "block w-full border-2 border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-orange-400 transition-all font-medium";

  if (inline) {
    return (
      <div className="flex flex-wrap gap-2 items-end">
        <div className="flex-1 min-w-[100px]">
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Année</label>
          <select className={selectClass} value={year} onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : "")}>
            <option value="">Année</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Marque</label>
          <select className={selectClass} value={make} onChange={(e) => handleMakeChange(e.target.value)}>
            <option value="">Marque</option>
            {VEHICLE_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div className="flex-1 min-w-[120px]">
          <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Modèle</label>
          <select className={selectClass} value={model} onChange={(e) => handleModelChange(e.target.value)} disabled={!make}>
            <option value="">Modèle</option>
            {models.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        {showTrim && (
          <div className="flex-1 min-w-[130px]">
            <label className="block text-xs font-bold text-gray-500 mb-1 uppercase tracking-wide">Finition</label>
            <select className={selectClass} value={trim} onChange={(e) => setTrim(e.target.value)}>
              <option value="">Toutes finitions</option>
              {trims.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        )}
        <button
          onClick={handleSubmit}
          disabled={!isReady}
          className="px-6 py-3 font-bold text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all text-sm"
          style={{ backgroundColor: isReady ? "#f97316" : "#94a3b8" }}
        >
          Rechercher
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Year + Make */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Année</label>
          <select className={selectClass} value={year} onChange={(e) => setYear(e.target.value ? parseInt(e.target.value) : "")}>
            <option value="">Choisir l'année</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Marque</label>
          <select className={selectClass} value={make} onChange={(e) => handleMakeChange(e.target.value)}>
            <option value="">Choisir la marque</option>
            {VEHICLE_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Model */}
      <div>
        <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">Modèle</label>
        <select className={selectClass} value={model} onChange={(e) => handleModelChange(e.target.value)} disabled={!make}>
          <option value="">{make ? "Choisir le modèle" : "Sélectionnez d'abord la marque"}</option>
          {models.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </div>

      {/* Trim — only show when available */}
      {showTrim && (
        <div>
          <label className="block text-xs font-bold text-gray-600 mb-1.5 uppercase tracking-wide">
            Finition / Version
            <span className="ml-1 text-orange-500 normal-case font-normal">(optionnel)</span>
          </label>
          <select className={selectClass} value={trim} onChange={(e) => setTrim(e.target.value)}>
            <option value="">Toutes les finitions</option>
            {trims.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!isReady}
        className="w-full py-4 font-bold text-white rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all text-base"
        style={{ backgroundColor: isReady ? "#f97316" : "#94a3b8" }}
      >
        {isReady ? `🔍 Trouver un garage pour mon ${make} ${model}` : "Sélectionnez votre véhicule"}
      </button>

      {/* Breadcrumb display */}
      {isReady && (
        <div className="flex items-center gap-1.5 text-xs text-gray-500 pt-1">
          <span className="text-green-500">✓</span>
          <span className="font-semibold text-gray-700">{year} {make} {model}{trim ? ` — ${trim}` : ""}</span>
          <button onClick={() => { setYear(""); setMake(""); setModel(""); setTrim(""); }} className="ml-auto text-orange-500 hover:text-orange-700 font-medium">
            Modifier
          </button>
        </div>
      )}
    </div>
  );
}
