"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import GarageCard from "@/components/GarageCard";
import { VEHICLE_MAKES, getModelsForMake, getYears } from "@/lib/vehicleData";
import { SERVICE_CATEGORIES, QUEBEC_CITIES } from "@/lib/services";

function SearchResults() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [garages, setGarages] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [year, setYear] = useState(searchParams.get("year") ?? "");
  const [make, setMake] = useState(searchParams.get("make") ?? "");
  const [model, setModel] = useState(searchParams.get("model") ?? "");
  const [service, setService] = useState(searchParams.get("service") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const years = getYears();
  const models = make ? getModelsForMake(make) : [];

  const fetchGarages = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (make) params.set("make", make);
    if (service) params.set("service", service);
    if (city) params.set("city", city);

    const res = await fetch(`/api/garages?${params.toString()}`);
    const data = await res.json();
    setGarages(data.garages ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [make, service, city]);

  useEffect(() => { fetchGarages(); }, [fetchGarages]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (service) params.set("service", service);
    if (city) params.set("city", city);
    router.push(`/rechercher?${params.toString()}`);
    fetchGarages();
  }

  const selectClass = "block w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  const selectedService = SERVICE_CATEGORIES.find((s) => s.id === service);
  const hasFilters = make || service || city;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Vehicle banner if vehicle selected */}
      {(year || make || model) && (
        <div className="bg-blue-700 text-white rounded-2xl px-6 py-4 mb-6 flex items-center gap-4">
          <span className="text-2xl">🚗</span>
          <div>
            <p className="font-bold text-lg">
              Résultats pour : {year} {make} {model}
            </p>
            <p className="text-blue-200 text-sm">Garages compatibles avec votre véhicule</p>
          </div>
          <button
            onClick={() => { setYear(""); setMake(""); setModel(""); }}
            className="ml-auto text-blue-200 hover:text-white text-sm underline"
          >
            Effacer
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        {/* Filters sidebar */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sticky top-20">
            <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>🔍</span> Filtres
            </h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Votre véhicule</label>
                <div className="space-y-2">
                  <select className={selectClass} value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="">Année</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select className={selectClass} value={make} onChange={(e) => { setMake(e.target.value); setModel(""); }}>
                    <option value="">Marque</option>
                    {VEHICLE_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select className={selectClass} value={model} onChange={(e) => setModel(e.target.value)} disabled={!make}>
                    <option value="">Modèle</option>
                    {models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Service</label>
                <select className={selectClass} value={service} onChange={(e) => setService(e.target.value)}>
                  <option value="">Tous les services</option>
                  {SERVICE_CATEGORIES.map((s) => (
                    <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Ville</label>
                <select className={selectClass} value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">Toutes les villes</option>
                  {QUEBEC_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              <button type="submit" className="w-full bg-blue-700 text-white font-semibold py-2.5 rounded-xl hover:bg-blue-800 transition-colors">
                Appliquer
              </button>

              {hasFilters && (
                <button
                  type="button"
                  onClick={() => { setMake(""); setModel(""); setYear(""); setService(""); setCity(""); }}
                  className="w-full text-gray-500 text-sm py-1.5 hover:text-gray-700"
                >
                  Effacer les filtres
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Results */}
        <div className="lg:col-span-3">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h1 className="text-xl font-bold text-gray-900">
                {selectedService ? `${selectedService.icon} ${selectedService.name}` : "Tous les garages"}
                {city && ` — ${city}`}
              </h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {loading ? "Chargement..." : `${total} garage${total !== 1 ? "s" : ""} trouvé${total !== 1 ? "s" : ""}`}
              </p>
            </div>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 h-64 animate-pulse" />
              ))}
            </div>
          ) : garages.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Aucun garage trouvé</h3>
              <p className="text-gray-500">Essayez d'élargir vos critères de recherche.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {garages.map((garage) => (
                <GarageCard key={garage.id} garage={garage} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function RechercherPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center py-20 text-gray-500">Chargement...</div>}>
      <SearchResults />
    </Suspense>
  );
}
