"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GarageCard from "@/components/GarageCard";
import { VEHICLE_MAKES, getModelsForMake, getYears } from "@/lib/vehicleData";
import { SERVICE_CATEGORIES, QUEBEC_CITIES } from "@/lib/services";
import { garageDistance, formatDistance } from "@/lib/geo";

type UserPos = { lat: number; lng: number };

/** Attach a distance_km field to each garage (exact coords or city centroid). */
function withDistances(garages: any[], pos: UserPos | null): any[] {
  if (!pos) return garages;
  return garages.map((g) => ({
    ...g,
    distance_km: garageDistance(g, pos),
  }));
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [garages, setGarages] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  // Filters
  const [year, setYear]       = useState(searchParams.get("year")    ?? "");
  const [make, setMake]       = useState(searchParams.get("make")    ?? "");
  const [model, setModel]     = useState(searchParams.get("model")   ?? "");
  const [service, setService] = useState(searchParams.get("service") ?? "");
  const [city, setCity]       = useState(searchParams.get("city")    ?? "");
  const [walkInOnly, setWalkInOnly] = useState(false);
  const [minRating, setMinRating]   = useState("");

  // Geolocation
  const [userPos, setUserPos]       = useState<UserPos | null>(null);
  const [geoStatus, setGeoStatus]   = useState<"idle" | "loading" | "ok" | "denied" | "error">("idle");
  const [sortByDist, setSortByDist] = useState(false);

  const years  = getYears();
  const models = make ? getModelsForMake(make) : [];
  const selectedService = SERVICE_CATEGORIES.find((s) => s.id === service);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchGarages = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (make)    params.set("make",    make);
    if (service) params.set("service", service);
    if (city)    params.set("city",    city);

    try {
      const res  = await fetch(`/api/garages?${params}`);
      const data = await res.json();
      let results: any[] = data.garages ?? [];

      if (walkInOnly) results = results.filter((g) => g.acceptsWalkIn);
      if (minRating)  results = results.filter((g) => g.avgRating >= parseFloat(minRating));

      // Attach distances whenever we have a position
      results = withDistances(results, userPos);

      setGarages(results);
      setTotal(results.length);
    } catch {
      setGarages([]);
      setTotal(0);
    }
    setLoading(false);
  }, [make, service, city, walkInOnly, minRating, userPos]);

  useEffect(() => { fetchGarages(); }, [fetchGarages]);

  // Re-attach distances when userPos changes without re-fetching
  useEffect(() => {
    if (userPos) {
      setGarages((prev) => withDistances(prev, userPos));
    }
  }, [userPos]);

  // ── Geolocation ────────────────────────────────────────────────────────────
  function requestLocation() {
    if (!navigator.geolocation) {
      setGeoStatus("error");
      return;
    }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setGeoStatus("ok");
        setSortByDist(true);
      },
      (err) => {
        setGeoStatus(err.code === 1 ? "denied" : "error");
      },
      { timeout: 8000, maximumAge: 60_000 },
    );
  }

  function clearLocation() {
    setUserPos(null);
    setGeoStatus("idle");
    setSortByDist(false);
    // Strip distance_km
    setGarages((prev) => prev.map(({ distance_km: _, ...g }) => g));
  }

  // ── Sorted display list ────────────────────────────────────────────────────
  const displayGarages = sortByDist && userPos
    ? [...garages].sort((a, b) => {
        if (a.distance_km == null && b.distance_km == null) return 0;
        if (a.distance_km == null) return 1;
        if (b.distance_km == null) return -1;
        return a.distance_km - b.distance_km;
      })
    : garages;

  // ── URL / helpers ──────────────────────────────────────────────────────────
  function applyFilters() {
    const params = new URLSearchParams();
    if (year)    params.set("year",    year);
    if (make)    params.set("make",    make);
    if (model)   params.set("model",   model);
    if (service) params.set("service", service);
    if (city)    params.set("city",    city);
    router.push(`/rechercher?${params}`);
    fetchGarages();
  }

  function clearAll() {
    setYear(""); setMake(""); setModel("");
    setService(""); setCity(""); setWalkInOnly(false); setMinRating("");
    router.push("/rechercher");
  }

  const hasFilters = make || service || city || walkInOnly || minRating;

  const sel = "block w-full border border-gray-200 rounded-xl px-3 py-2.5 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 font-medium";

  // ── Geo button label ───────────────────────────────────────────────────────
  const geoLabel = {
    idle:    "Près de moi",
    loading: "Localisation…",
    ok:      "Position active",
    denied:  "Accès refusé",
    error:   "Erreur GPS",
  }[geoStatus];

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>

      {/* ── Top search bar ──────────────────────────────────────────────────── */}
      <div style={{ backgroundColor: "#0b1f3a" }} className="py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap gap-2 items-center">
            <select
              className="rounded-lg px-3 py-2 text-sm bg-white/10 text-white border border-white/20 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={year} onChange={(e) => setYear(e.target.value)}
            >
              <option value="">Année</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>

            <select
              className="rounded-lg px-3 py-2 text-sm bg-white/10 text-white border border-white/20 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={make} onChange={(e) => { setMake(e.target.value); setModel(""); }}
            >
              <option value="">Marque</option>
              {VEHICLE_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              className="rounded-lg px-3 py-2 text-sm bg-white/10 text-white border border-white/20 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={model} onChange={(e) => setModel(e.target.value)} disabled={!make}
            >
              <option value="">Modèle</option>
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              className="rounded-lg px-3 py-2 text-sm bg-white/10 text-white border border-white/20 font-medium focus:outline-none focus:ring-2 focus:ring-orange-400"
              value={service} onChange={(e) => setService(e.target.value)}
            >
              <option value="">Prestation</option>
              {SERVICE_CATEGORIES.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>

            <button
              onClick={applyFilters}
              className="px-5 py-2 rounded-lg text-sm font-bold text-white transition hover:opacity-90"
              style={{ backgroundColor: "#f97316" }}
            >
              Rechercher
            </button>

            {(year || make || model) && (
              <span className="text-xs font-semibold px-3 py-2 rounded-lg" style={{ backgroundColor: "rgba(249,115,22,0.2)", color: "#fb923c" }}>
                🚗 {year} {make} {model}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-7">

          {/* ── Sidebar ───────────────────────────────────────────────────── */}
          <aside className="hidden lg:block w-64 flex-shrink-0">

            {/* Localisation card */}
            <div
              className="rounded-2xl border overflow-hidden mb-4"
              style={
                geoStatus === "ok"
                  ? { backgroundColor: "#f0fdf4", borderColor: "#86efac" }
                  : { backgroundColor: "white", borderColor: "#e2e8f0", boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }
              }
            >
              <div className="p-4">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Localisation</p>

                {geoStatus !== "ok" ? (
                  <>
                    <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                      Affichez les garages les plus proches de vous en premier.
                    </p>
                    <button
                      onClick={requestLocation}
                      disabled={geoStatus === "loading"}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold border transition-all disabled:opacity-60"
                      style={{ backgroundColor: "#0b1f3a", color: "white", borderColor: "#0b1f3a" }}
                    >
                      <span>{geoStatus === "loading" ? "⏳" : "📍"}</span>
                      {geoLabel}
                    </button>
                    {(geoStatus === "denied") && (
                      <p className="text-xs text-red-500 mt-2">
                        Accès à la position refusé. Autorisez la localisation dans les paramètres de votre navigateur.
                      </p>
                    )}
                    {geoStatus === "error" && (
                      <p className="text-xs text-red-500 mt-2">Impossible d'obtenir votre position.</p>
                    )}
                  </>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-green-500 font-bold">📍</span>
                      <span className="text-sm font-bold text-green-700">Position détectée</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <input
                        type="checkbox"
                        checked={sortByDist}
                        onChange={(e) => setSortByDist(e.target.checked)}
                        className="w-4 h-4 rounded"
                        style={{ accentColor: "#16a34a" }}
                      />
                      <span className="text-sm font-medium text-gray-700">Trier par distance</span>
                    </label>
                    <button
                      onClick={clearLocation}
                      className="text-xs text-gray-400 hover:text-gray-600 underline"
                    >
                      Désactiver la localisation
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Filters card */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between" style={{ backgroundColor: "#0b1f3a" }}>
                <span className="font-bold text-white text-sm">Filtres</span>
                {hasFilters && (
                  <button onClick={clearAll} className="text-xs text-orange-300 hover:text-orange-200 font-semibold">
                    Effacer tout
                  </button>
                )}
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Prestation</label>
                  <select className={sel} value={service} onChange={(e) => setService(e.target.value)}>
                    <option value="">Toutes</option>
                    {SERVICE_CATEGORIES.map((s) => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Ville</label>
                  <select className={sel} value={city} onChange={(e) => setCity(e.target.value)}>
                    <option value="">Toutes les villes</option>
                    {QUEBEC_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Options</label>
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

                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-2 uppercase tracking-wide">Note minimale</label>
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
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition hover:opacity-90"
                  style={{ backgroundColor: "#0b1f3a" }}
                >
                  Appliquer
                </button>
              </div>
            </div>

            {/* Quick service links */}
            <div className="mt-4 bg-white rounded-2xl border border-gray-200 p-4" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Services populaires</p>
              <div className="space-y-1">
                {SERVICE_CATEGORIES.slice(0, 7).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setService(s.id)}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition hover:bg-orange-50 font-medium"
                    style={service === s.id ? { backgroundColor: "#fff7ed", color: "#c2410c" } : { color: "#475569" }}
                  >
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── Results ───────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Header */}
            <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-bold text-gray-900">
                  {selectedService ? `${selectedService.icon} ${selectedService.name}` : "Tous les garages"}
                  {city && <span className="text-gray-500 font-semibold"> — {city}</span>}
                </h1>
                <p className="text-gray-500 text-sm mt-0.5">
                  {loading ? "Recherche en cours…" : (
                    <>
                      <span className="font-bold text-gray-900">{total}</span>{" "}
                      garage{total !== 1 ? "s" : ""} trouvé{total !== 1 ? "s" : ""}
                      {make && <span> · Compatible <strong>{make} {model}</strong></span>}
                      {sortByDist && userPos && <span> · <span className="text-green-600 font-semibold">triés par distance</span></span>}
                    </>
                  )}
                </p>
              </div>

              {/* Active chips */}
              {hasFilters && (
                <div className="flex flex-wrap gap-2">
                  {make && (
                    <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ backgroundColor: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
                      🚗 {make}
                    </span>
                  )}
                  {model && (
                    <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ backgroundColor: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
                      {model}
                    </span>
                  )}
                  {selectedService && (
                    <span className="text-xs px-3 py-1.5 rounded-full font-semibold" style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                      {selectedService.icon} {selectedService.name}
                    </span>
                  )}
                  {city && (
                    <span className="text-xs px-3 py-1.5 rounded-full font-semibold bg-gray-100 text-gray-700">
                      📍 {city}
                    </span>
                  )}
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
            ) : displayGarages.length === 0 ? (
              <div className="bg-white rounded-2xl border border-gray-200 text-center py-20 px-8">
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-bold text-gray-900 mb-2">Aucun garage trouvé</h3>
                <p className="text-gray-500 mb-6">Essayez de modifier vos filtres ou d'élargir votre zone de recherche.</p>
                <button onClick={clearAll} className="px-6 py-3 rounded-xl font-bold text-white" style={{ backgroundColor: "#f97316" }}>
                  Voir tous les garages
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                {displayGarages.map((garage) => (
                  <GarageCard
                    key={garage.id}
                    garage={garage}
                    highlightService={selectedService?.name}
                    distance={garage.distance_km != null ? formatDistance(garage.distance_km) : undefined}
                  />
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
        <p className="text-gray-400 text-sm">Chargement…</p>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}
