"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GarageCard from "@/components/GarageCard";
import { VEHICLE_MAKES, getModelsForMake, getTrimsForModel, getYears, hasTrims } from "@/lib/vehicleData";
import { SERVICE_CATEGORIES, QUEBEC_CITIES } from "@/lib/services";

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [garages, setGarages] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filter state — init from URL params
  const [year, setYear] = useState(searchParams.get("year") ?? "");
  const [make, setMake] = useState(searchParams.get("make") ?? "");
  const [model, setModel] = useState(searchParams.get("model") ?? "");
  const [trim, setTrim] = useState(searchParams.get("trim") ?? "");
  const [service, setService] = useState(searchParams.get("service") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [walkInOnly, setWalkInOnly] = useState(false);
  const [minRating, setMinRating] = useState("");

  const years = getYears();
  const models = make ? getModelsForMake(make) : [];
  const trims = model ? getTrimsForModel(model) : [];
  const showTrim = model && hasTrims(model);

  const selectedService = SERVICE_CATEGORIES.find((s) => s.id === service);

  const fetchGarages = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (service) params.set("service", service);
    if (city) params.set("city", city);

    try {
      const res = await fetch(`/api/garages?${params.toString()}`);
      const data = await res.json();
      let results = data.garages ?? [];

      // Client-side filters
      if (walkInOnly) results = results.filter((g: any) => g.acceptsWalkIn);
      if (minRating) results = results.filter((g: any) => g.avgRating >= parseFloat(minRating));

      setGarages(results);
      setTotal(results.length);
    } catch {
      setGarages([]);
      setTotal(0);
    }
    setLoading(false);
  }, [make, service, city, walkInOnly, minRating]);

  useEffect(() => { fetchGarages(); }, [fetchGarages]);

  function applyFilters() {
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (trim) params.set("trim", trim);
    if (service) params.set("service", service);
    if (city) params.set("city", city);
    router.push(`/rechercher?${params.toString()}`);
    fetchGarages();
  }

  function clearAll() {
    setYear(""); setMake(""); setModel(""); setTrim("");
    setService(""); setCity(""); setWalkInOnly(false); setMinRating("");
    router.push("/rechercher");
  }

  const hasFilters = make || service || city || walkInOnly || minRating;

  const selectClass = "block w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium";

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>

      {/* Compact search bar at top */}
      <div style={{ backgroundColor: "#0b1f3a" }} className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 items-center">
            <select className="rounded-lg px-3 py-2 text-sm bg-white/10 text-white border border-white/20 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400" value={year} onChange={(e) => setYear(e.target.value)}>
              <option value="">Année</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>
            <select className="rounded-lg px-3 py-2 text-sm bg-white/10 text-white border border-white/20 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400" value={make} onChange={(e) => { setMake(e.target.value); setModel(""); setTrim(""); }}>
              <option value="">Marque</option>
              {VEHICLE_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select className="rounded-lg px-3 py-2 text-sm bg-white/10 text-white border border-white/20 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400" value={model} onChange={(e) => { setModel(e.target.value); setTrim(""); }} disabled={!make}>
              <option value="">Modèle</option>
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            {showTrim && (
              <select className="rounded-lg px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400" value={trim} onChange={(e) => setTrim(e.target.value)} style={{ backgroundColor: "rgba(249,115,22,0.15)", color: "#fb923c", border: "1px solid rgba(249,115,22,0.4)" }}>
                <option value="">Finition</option>
                {trims.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            )}
            <select className="rounded-lg px-3 py-2 text-sm bg-white/10 text-white border border-white/20 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400" value={service} onChange={(e) => setService(e.target.value)}>
              <option value="">Prestation</option>
              {SERVICE_CATEGORIES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
            <button
              onClick={applyFilters}
              className="px-5 py-2 rounded-lg text-sm font-black text-white transition-all hover:opacity-90"
              style={{ backgroundColor: "#f97316" }}
            >
              Rechercher
            </button>
            {(year || make || model || trim) && (
              <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(249,115,22,0.2)", color: "#fb923c" }}>
                <span>🚗</span>
                {year} {make} {model}{trim ? ` — ${trim}` : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-7">

          {/* ── Sidebar ─────────────────────────────── */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden sticky top-20" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: "#0b1f3a" }}>
                <span className="font-bold text-white text-sm">Filtres</span>
                {hasFilters && (
                  <button onClick={clearAll} className="text-xs text-orange-300 hover:text-orange-200 font-semibold">
                    Effacer tout
                  </button>
                )}
              </div>

              <div className="p-5 space-y-5">
                {/* Prestation */}
                <div>
                  <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wide">Prestation</label>
                  <select className={selectClass} value={service} onChange={(e) => setService(e.target.value)}>
                    <option value="">Toutes</option>
                    {SERVICE_CATEGORIES.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                </div>

                {/* Ville */}
                <div>
                  <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wide">Ville</label>
                  <select className={selectClass} value={city} onChange={(e) => setCity(e.target.value)}>
                    <option value="">Toutes les villes</option>
                    {QUEBEC_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Options */}
                <div>
                  <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wide">Options</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={walkInOnly}
                      onChange={(e) => setWalkInOnly(e.target.checked)}
                      className="w-4 h-4 rounded"
                      style={{ accentColor: "#f97316" }}
                    />
                    <span className="text-sm font-medium text-gray-700">Sans rendez-vous</span>
                  </label>
                </div>

                {/* Note minimale */}
                <div>
                  <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-wide">Note minimale</label>
                  <div className="flex gap-1.5">
                    {["", "3", "4", "4.5"].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMinRating(r)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all"
                        style={minRating === r
                          ? { backgroundColor: "#f97316", color: "white", borderColor: "#f97316" }
                          : { backgroundColor: "white", color: "#64748b", borderColor: "#e2e8f0" }
                        }
                      >
                        {r ? `${r}★+` : "Tous"}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={applyFilters}
                  className="w-full py-3 rounded-xl text-sm font-black text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "#0b1f3a" }}
                >
                  Appliquer les filtres
                </button>
              </div>
            </div>

            {/* Quick service links */}
            <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <p className="text-xs font-black text-gray-500 uppercase tracking-wide mb-3">Services populaires</p>
              <div className="space-y-1">
                {SERVICE_CATEGORIES.slice(0, 7).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setService(s.id)}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all hover:bg-orange-50 font-medium"
                    style={service === s.id ? { backgroundColor: "#fff7ed", color: "#c2410c" } : { color: "#475569" }}
                  >
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Results ──────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-black text-gray-900">
                  {selectedService ? `${selectedService.icon} ${selectedService.name}` : "Tous les garages"}
                  {city && <span className="text-gray-500 font-semibold"> — {city}</span>}
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  {loading ? "Recherche en cours..." : (
                    <>
                      <span className="font-bold text-gray-900">{total}</span> garage{total !== 1 ? "s" : ""} trouvé{total !== 1 ? "s" : ""}
                      {make && <span> • Compatible <strong>{make} {model}</strong>{trim ? ` ${trim}` : ""}</span>}
                    </>
                  )}
                </p>
              </div>

              {/* Active filters chips */}
              {hasFilters && (
                <div className="flex flex-wrap gap-2">
                  {make && <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ backgroundColor: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>🚗 {make}</span>}
                  {model && <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ backgroundColor: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>{model}{trim ? ` — ${trim}` : ""}</span>}
                  {selectedService && <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>{selectedService.icon} {selectedService.name}</span>}
                  {city && <span className="text-xs px-3 py-1.5 rounded-full font-semibold bg-gray-100 text-gray-700">📍 {city}</span>}
                </div>
              )}
            </div>

            {/* Grid */}
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-gray-200 h-64 animate-pulse" />
                ))}
              </div>
            ) : garages.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 text-center py-20 px-8">
                <div className="text-6xl mb-4">🔍</div>
                <h3 className="text-xl font-black text-gray-900 mb-2">Aucun garage trouvé</h3>
                <p className="text-gray-500 mb-6">Essayez de modifier vos filtres ou d'élargir votre zone de recherche.</p>
                <button onClick={clearAll} className="px-6 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: "#f97316" }}>
                  Voir tous les garages
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {garages.map((garage) => (
                  <GarageCard key={garage.id} garage={garage} highlightService={selectedService?.name} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function RechercherPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="text-4xl mb-3 animate-bounce">🔍</div>
          <p className="text-gray-500">Recherche en cours...</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
