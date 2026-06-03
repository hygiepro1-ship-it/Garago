"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import GarageCard from "@/components/GarageCard";
import { VEHICLE_MAKES, getModelsForMake, getYears } from "@/lib/vehicleData";
import { SERVICE_CATEGORIES, QUEBEC_CITIES } from "@/lib/services";
import { garageDistance, formatDistance } from "@/lib/geo";
import { useLang } from "@/contexts/LanguageContext";

type UserPos = { lat: number; lng: number };

function withDistances(garages: any[], pos: UserPos | null): any[] {
  if (!pos) return garages;
  return garages.map((g) => ({ ...g, distance_km: garageDistance(g, pos) }));
}

function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useLang();
  const s = t.search;

  const [garages, setGarages] = useState<any[]>([]);
  const [total,   setTotal]   = useState(0);
  const [loading, setLoading] = useState(true);

  const [year,      setYear]      = useState(searchParams.get("year")    ?? "");
  const [make,      setMake]      = useState(searchParams.get("make")    ?? "");
  const [model,     setModel]     = useState(searchParams.get("model")   ?? "");
  const [service,   setService]   = useState(searchParams.get("service") ?? "");
  const [city,      setCity]      = useState(searchParams.get("city")    ?? "");
  const [walkInOnly, setWalkInOnly] = useState(false);
  const [minRating,  setMinRating]  = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [userPos,    setUserPos]    = useState<UserPos | null>(null);
  const [geoStatus,  setGeoStatus]  = useState<"idle"|"loading"|"ok"|"denied"|"error">("idle");
  const [sortByDist, setSortByDist] = useState(false);

  const years  = getYears();
  const models = make ? getModelsForMake(make) : [];
  const selectedService = SERVICE_CATEGORIES.find((s) => s.id === service);

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
  useEffect(() => {
    if (userPos) setGarages((prev) => withDistances(prev, userPos));
  }, [userPos]);

  function requestLocation() {
    if (!navigator.geolocation) { setGeoStatus("error"); return; }
    setGeoStatus("loading");
    navigator.geolocation.getCurrentPosition(
      (pos) => { setUserPos({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setGeoStatus("ok"); setSortByDist(true); },
      (err) => { setGeoStatus(err.code === 1 ? "denied" : "error"); },
      { timeout: 8000, maximumAge: 60_000 }
    );
  }

  function clearLocation() {
    setUserPos(null); setGeoStatus("idle"); setSortByDist(false);
    setGarages((prev) => prev.map(({ distance_km: _, ...g }) => g));
  }

  const displayGarages = sortByDist && userPos
    ? [...garages].sort((a, b) => {
        if (a.distance_km == null && b.distance_km == null) return 0;
        if (a.distance_km == null) return 1;
        if (b.distance_km == null) return -1;
        return a.distance_km - b.distance_km;
      })
    : garages;

  function applyFilters() {
    const params = new URLSearchParams();
    if (year)    params.set("year",    year);
    if (make)    params.set("make",    make);
    if (model)   params.set("model",   model);
    if (service) params.set("service", service);
    if (city)    params.set("city",    city);
    router.push(`/rechercher?${params}`);
    fetchGarages();
    setSidebarOpen(false);
  }

  function clearAll() {
    setYear(""); setMake(""); setModel("");
    setService(""); setCity(""); setWalkInOnly(false); setMinRating("");
    router.push("/rechercher");
  }

  const hasFilters   = !!(make || service || city || walkInOnly || minRating);
  const activeCount  = [make, service, city, walkInOnly ? "x" : "", minRating].filter(Boolean).length;

  /* ── Render ─────────────────────────────────────────────────────────── */
  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh" }}>

      {/* ── SEARCH BAR ─────────────────────────────────────────────────── */}
      <div className="bg-white" style={{ borderBottom: "1px solid #E2E8F0", boxShadow: "0 1px 4px rgba(15,23,42,0.05)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-wrap gap-2 items-center">

            {/* Selects */}
            <select
              className="rounded-xl px-3 py-2 text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              style={{ borderColor: "#e2e8f0", color: "#0b1f3a", background: "#f8fafc" }}
              value={year} onChange={(e) => setYear(e.target.value)}
            >
              <option value="">{s.year}</option>
              {years.map((y) => <option key={y} value={y}>{y}</option>)}
            </select>

            <select
              className="rounded-xl px-3 py-2 text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              style={{ borderColor: "#e2e8f0", color: "#0b1f3a", background: "#f8fafc" }}
              value={make} onChange={(e) => { setMake(e.target.value); setModel(""); }}
            >
              <option value="">{s.make}</option>
              {VEHICLE_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              className="rounded-xl px-3 py-2 text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              style={{ borderColor: "#e2e8f0", color: "#0b1f3a", background: "#f8fafc" }}
              value={model} onChange={(e) => setModel(e.target.value)} disabled={!make}
            >
              <option value="">{s.model}</option>
              {models.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>

            <select
              className="rounded-xl px-3 py-2 text-sm font-semibold border focus:outline-none focus:ring-2 focus:ring-orange-400 transition"
              style={{ borderColor: "#e2e8f0", color: "#0b1f3a", background: "#f8fafc" }}
              value={service} onChange={(e) => setService(e.target.value)}
            >
              <option value="">{s.service}</option>
              {SERVICE_CATEGORIES.map((sc) => <option key={sc.id} value={sc.id}>{sc.icon} {sc.name}</option>)}
            </select>

            <button
              onClick={applyFilters}
              className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all"
              style={{ background: "#f97316", boxShadow: "0 2px 8px rgba(5,150,222,0.25)" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              {s.searchBtn}
            </button>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold border transition-colors"
              style={{ borderColor: "#e2e8f0", color: "#0b1f3a", background: activeCount ? "#fff4ed" : "white" }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z"/>
              </svg>
              {s.filters} {activeCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-white text-xs font-black" style={{ background: "#f97316" }}>{activeCount}</span>}
            </button>

            {/* Active vehicle chip */}
            {(year || make || model) && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold"
                style={{ background: "#fff4ed", color: "#f97316", border: "1px solid #fed7aa" }}>
                🚗 {[year, make, model].filter(Boolean).join(" ")}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">

          {/* ── SIDEBAR ──────────────────────────────────────────────────── */}
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 flex-shrink-0 space-y-4">

            {/* Location */}
            <div className="bg-white rounded-2xl overflow-hidden"
              style={{ border: `1px solid ${geoStatus === "ok" ? "#86EFAC" : "#e2e8f0"}`, boxShadow: "0 2px 8px rgba(31,62,106,0.06)" }}>
              <div className="px-4 py-3 flex items-center gap-2" style={{ borderBottom: "1px solid #e2e8f0" }}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#f97316" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <p className="text-xs font-black" style={{ color: "#0b1f3a" }}>{s.location}</p>
              </div>
              <div className="p-4">
                {geoStatus !== "ok" ? (
                  <>
                    <p className="text-xs mb-3 leading-relaxed" style={{ color: "#94a3b8" }}>
                      Affichez les garages les plus proches de vous en premier.
                    </p>
                    <button
                      onClick={requestLocation}
                      disabled={geoStatus === "loading"}
                      className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold text-white transition-all"
                      style={{ background: "#f97316" }}
                    >
                      {geoStatus === "loading"
                        ? <><svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg> {s.locating}</>
                        : <><svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/></svg> {s.locateMe}</>
                      }
                    </button>
                    {geoStatus === "denied" && <p className="text-xs text-red-500 mt-2">{s.locDenied}</p>}
                  </>
                ) : (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: "#DCFCE7", color: "#16A34A" }}>✓</span>
                      <span className="text-sm font-bold" style={{ color: "#16A34A" }}>{s.locationDetected}</span>
                    </div>
                    <label className="flex items-center gap-2 cursor-pointer mb-3">
                      <input type="checkbox" checked={sortByDist} onChange={(e) => setSortByDist(e.target.checked)}
                        className="w-4 h-4 rounded" style={{ accentColor: "#f97316" }} />
                      <span className="text-sm font-semibold" style={{ color: "#0b1f3a" }}>{s.sortByDist}</span>
                    </label>
                    <button onClick={clearLocation} className="text-xs underline" style={{ color: "#94a3b8" }}>
                      {s.disable}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl overflow-hidden"
              style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(31,62,106,0.06)" }}>
              <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: "1px solid #e2e8f0" }}>
                <p className="text-xs font-black" style={{ color: "#0b1f3a" }}>{s.filters}</p>
                {hasFilters && (
                  <button onClick={clearAll} className="text-xs font-bold" style={{ color: "#f97316" }}>
                    {s.clearAll}
                  </button>
                )}
              </div>
              <div className="p-4 space-y-5">
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: "#94a3b8" }}>{s.prestation}</label>
                  <select className="doc-input" value={service} onChange={(e) => setService(e.target.value)}>
                    <option value="">{s.allServices}</option>
                    {SERVICE_CATEGORIES.map((sc) => <option key={sc.id} value={sc.id}>{sc.icon} {sc.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: "#94a3b8" }}>{s.cityLabel}</label>
                  <select className="doc-input" value={city} onChange={(e) => setCity(e.target.value)}>
                    <option value="">{s.allCities}</option>
                    {QUEBEC_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: "#94a3b8" }}>{s.options}</label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={walkInOnly} onChange={(e) => setWalkInOnly(e.target.checked)}
                      className="w-4 h-4 rounded" style={{ accentColor: "#f97316" }} />
                    <span className="text-sm font-semibold" style={{ color: "#0b1f3a" }}>{s.walkIn}</span>
                  </label>
                </div>
                <div>
                  <label className="block text-xs font-bold mb-2" style={{ color: "#94a3b8" }}>{s.minRating}</label>
                  <div className="flex gap-1.5">
                    {["", "3", "4", "4.5"].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMinRating(r)}
                        className="flex-1 py-1.5 rounded-lg text-xs font-bold border transition-all"
                        style={minRating === r
                          ? { background: "#f97316", color: "white", borderColor: "#f97316" }
                          : { background: "white", color: "#475569", borderColor: "#e2e8f0" }
                        }
                      >
                        {r ? `${r}★` : s.all}
                      </button>
                    ))}
                  </div>
                </div>
                <button onClick={applyFilters} className="btn-primary w-full py-2.5">
                  {s.apply}
                </button>
              </div>
            </div>

            {/* Quick service links */}
            <div className="bg-white rounded-2xl overflow-hidden"
              style={{ border: "1px solid #e2e8f0", boxShadow: "0 2px 8px rgba(31,62,106,0.06)" }}>
              <div className="px-4 py-3" style={{ borderBottom: "1px solid #e2e8f0" }}>
                <p className="text-xs font-black" style={{ color: "#0b1f3a" }}>{s.popularServices}</p>
              </div>
              <div className="p-3 space-y-0.5">
                {SERVICE_CATEGORIES.slice(0, 8).map((s) => (
                  <button
                    key={s.id}
                    onClick={() => { setService(s.id); fetchGarages(); }}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors"
                    style={service === s.id
                      ? { background: "#fff4ed", color: "#f97316" }
                      : { color: "#475569" }
                    }
                  >
                    <span>{s.icon}</span>
                    <span>{s.name}</span>
                    {service === s.id && <span className="ml-auto text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* ── RESULTS ──────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">

            {/* Results header */}
            <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
              <div>
                <h1 className="text-xl font-black" style={{ color: "#0b1f3a" }}>
                  {selectedService ? `${selectedService.icon} ${selectedService.name}` : s.allGarages}
                  {city && <span style={{ color: "#94a3b8" }}> — {city}</span>}
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "#94a3b8" }}>
                  {loading ? s.searching : (
                    <>
                      <strong style={{ color: "#0b1f3a" }}>{total}</strong>{" "}
                      {total !== 1 ? s.garagesFound : s.garageFound}
                      {make && <span> · {s.compatible} <strong style={{ color: "#f97316" }}>{make} {model}</strong></span>}
                      {sortByDist && userPos && <span style={{ color: "#00A884" }}> · {s.sortedByDist}</span>}
                    </>
                  )}
                </p>
              </div>

              {/* Active filter chips */}
              {hasFilters && (
                <div className="flex flex-wrap gap-1.5">
                  {make && (
                    <span className="badge badge-blue">🚗 {make} {model}</span>
                  )}
                  {selectedService && (
                    <span className="badge badge-blue">{selectedService.icon} {selectedService.name}</span>
                  )}
                  {city && <span className="badge badge-gray">📍 {city}</span>}
                  {walkInOnly && <span className="badge badge-green">Sans RDV</span>}
                  {minRating && <span className="badge badge-blue">{minRating}★+</span>}
                </div>
              )}
            </div>

            {/* Cards — vertical list like Doctolib */}
            {loading ? (
              <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl h-40 animate-pulse" style={{ border: "1px solid #e2e8f0" }} />
                ))}
              </div>
            ) : displayGarages.length === 0 ? (
              <div className="bg-white rounded-2xl text-center py-20 px-8" style={{ border: "1px solid #e2e8f0" }}>
                <div className="text-5xl mb-4">🔍</div>
                <h3 className="text-xl font-black mb-2" style={{ color: "#0b1f3a" }}>{s.noGarageFound}</h3>
                <p className="text-sm mb-6" style={{ color: "#94a3b8" }}>
                  {s.noGarageFoundSub}
                </p>
                <button onClick={clearAll} className="btn-primary px-8 py-3">
                  {s.seeAll}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
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

      {/* ── MOBILE SIDEBAR DRAWER ─────────────────────────────────────── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSidebarOpen(false)} />
          <div className="absolute right-0 top-0 h-full w-80 bg-white shadow-2xl overflow-y-auto p-5">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-black" style={{ color: "#0b1f3a" }}>{s.filters}</h2>
              <button onClick={() => setSidebarOpen(false)} className="p-2 rounded-xl" style={{ background: "#f8fafc" }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: "#475569" }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: "#94a3b8" }}>{s.prestation}</label>
                <select className="doc-input" value={service} onChange={(e) => setService(e.target.value)}>
                  <option value="">{s.allServices}</option>
                  {SERVICE_CATEGORIES.map((sc) => <option key={sc.id} value={sc.id}>{sc.icon} {sc.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: "#94a3b8" }}>{s.cityLabel}</label>
                <select className="doc-input" value={city} onChange={(e) => setCity(e.target.value)}>
                  <option value="">{s.allCities}</option>
                  {QUEBEC_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={walkInOnly} onChange={(e) => setWalkInOnly(e.target.checked)} className="w-4 h-4" style={{ accentColor: "#f97316" }} />
                  <span className="text-sm font-semibold" style={{ color: "#0b1f3a" }}>{s.walkInOnly}</span>
                </label>
              </div>
              <div>
                <label className="block text-xs font-bold mb-2" style={{ color: "#94a3b8" }}>{s.minRating}</label>
                <div className="flex gap-2">
                  {["", "3", "4", "4.5"].map((r) => (
                    <button key={r} onClick={() => setMinRating(r)}
                      className="flex-1 py-2 rounded-xl text-xs font-bold border transition-all"
                      style={minRating === r ? { background: "#f97316", color: "white", borderColor: "#f97316" } : { color: "#475569", borderColor: "#e2e8f0" }}>
                      {r ? `${r}★` : s.all}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={clearAll} className="btn-outline flex-1 py-3">{s.clearAll}</button>
                <button onClick={applyFilters} className="btn-primary flex-1 py-3">{s.apply}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function RechercherPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <div className="flex items-center gap-3" style={{ color: "#94a3b8" }}>
          <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <p className="text-sm font-semibold">Chargement…</p>
        </div>
      </div>
    }>
      <SearchContent />
    </Suspense>
  );
}

