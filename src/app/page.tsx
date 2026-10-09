/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BRANDS } from "@/lib/vehicleBrands";
import { getModelsForMake, getYears } from "@/lib/vehicleData";
import BrandLogo from "@/components/BrandLogo";
import { getBestPosition } from "@/lib/geolocate";
import { useLang } from "@/contexts/LanguageContext";
import HomeNearbyGarages from "@/components/HomeNearbyGarages";
import dynamic from "next/dynamic";

// Le calendrier d'exemple dépend de l'heure du visiteur (jours passés, plages
// libres) : rendu uniquement dans le navigateur, sinon la page préparée à
// l'avance ne correspondrait pas à ce que le navigateur calcule.
// Même raison pour le bloc de saison : son sujet change selon le mois en cours.
const HomeLocalSeason = dynamic(() => import("@/components/HomeLocalSeason"), { ssr: false });
const HomeAgendaDemo = dynamic(() => import("@/components/HomeAgendaDemo"), {
  ssr: false,
  loading: () => <div className="hidden sm:block" style={{ minHeight: 420 }} aria-hidden="true" />,
});

// ─── Data ─────────────────────────────────────────────────────────────────────

// Marques de grande série les plus répandues au Québec : affichées d'emblée sur
// l'accueil. Les autres restent accessibles derrière « Voir les autres marques ».
const COMMON_BRANDS = [
  "Toyota", "Honda", "Hyundai", "Kia", "Mazda", "Nissan", "Ford", "Chevrolet", "GMC", "RAM", "Dodge", "Jeep",
  "Subaru", "Volkswagen", "Mitsubishi", "Chrysler", "Buick", "Tesla", "BMW", "Mercedes-Benz", "Audi", "Lexus", "Acura", "Volvo",
];

// ─── Sub-components ───────────────────────────────────────────────────────────

interface LiveStats {
  garages:   string | null;
  reviews:   string | null;
  avgRating: string | null;
  cities:    string | null;
}

function StatsBar({ stats, labels }: {
  stats: LiveStats;
  labels: { label: string; value?: string }[];
}) {
  const items: { value: string; label: string }[] = [];
  if (stats.reviews)   items.push({ value: stats.reviews,   label: labels[0].label });
  if (stats.avgRating) items.push({ value: stats.avgRating, label: labels[1].label });

  if (items.length === 0) return null;
  return (
    <section className="bg-white" style={{ borderBottom: "1px solid #e2e8f0" }}>
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-wrap justify-center gap-x-10 gap-y-4 text-center">
          {items.map((s) => (
            <div key={s.label}>
              <p className="text-2xl font-black" style={{ color: "#f97316" }}>{s.value}</p>
              <p className="text-xs font-semibold mt-0.5" style={{ color: "#94a3b8" }}>{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const { t, lang } = useLang();
  const h = t.home;
  const [showAllBrands, setShowAllBrands] = useState(false);
  const commonBrands = COMMON_BRANDS.map((name) => BRANDS.find((b) => b.name === name)).filter((b): b is (typeof BRANDS)[number] => !!b);
  const otherBrands = BRANDS.filter((b) => !COMMON_BRANDS.includes(b.name));

  const [make,     setMake]     = useState("");
  const [model,    setModel]    = useState("");
  const [year,     setYear]     = useState("");
  const [location, setLocation] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");
  // Position GPS détectée automatiquement + le nom de ville qu'on en a déduit
  // pour l'affichage. Tant que le champ garde ce nom, on cherche avec les
  // coordonnées (tri par distance) plutôt qu'avec la ville comme filtre texte,
  // qui exclurait les garages des arrondissements (Verdun, Anjou, Lachine…).
  const [autoPos, setAutoPos] = useState<{ lat: number; lng: number; city: string } | null>(null);

  const [nearPos, setNearPos] = useState<{ lat: number; lng: number } | null>(null);
  const [nearLocating, setNearLocating] = useState(false);
  const [nearError, setNearError] = useState("");
  const locateNear = useCallback(() => {
    setNearError("");
    setNearLocating(true);
    getBestPosition()
      .then((fix) => { setNearPos({ lat: fix.lat, lng: fix.lng }); })
      .catch(() => { setNearError("refused"); })
      .finally(() => { setNearLocating(false); });
  }, []);

  const [liveStats, setLiveStats] = useState<LiveStats | null>(null);
  useEffect(() => {
    fetch("/api/stats/homepage")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setLiveStats(d); })
      .catch(() => {});
  }, []);

  // Auto-géolocalisation à l'arrivée sur le site
  useEffect(() => {
    if (typeof window === "undefined" || !navigator.geolocation) return;
    getBestPosition()
      .then(async (fix) => {
        setNearPos({ lat: fix.lat, lng: fix.lng });
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${fix.lat}&lon=${fix.lng}&format=json`,
            { headers: { "Accept-Language": "fr" } }
          );
          const data = await res.json();
          const city = data.address?.city || data.address?.town || data.address?.village || data.address?.municipality;
          if (city) {
            setLocation(city);
            setAutoPos({ lat: fix.lat, lng: fix.lng, city });
          }
        } catch { /* silently fail */ }
      })
      .catch(() => {});
  }, []);

  const VEHICLE_MAKES = BRANDS.map(b => b.name);
  const years  = getYears();
  const models = make ? getModelsForMake(make) : [];

  function handleMakeChange(m: string) { setMake(m); setModel(""); }

  const handleLocate = useCallback(() => {
    setLocError("");
    setLocating(true);
    getBestPosition()
      .then((fix) => {
        setLocating(false);
        const p = new URLSearchParams();
        p.set("lat", String(fix.lat));
        p.set("lng", String(fix.lng));
        if (make)  p.set("make",  make);
        if (model) p.set("model", model);
        if (year)  p.set("year",  year);
        router.push(`/rechercher?${p.toString()}`);
      })
      .catch(() => { setLocating(false); setLocError("Localisation refusée."); });
  }, [make, model, year, router]);

  const [postalError, setPostalError] = useState("");
  const [searching, setSearching] = useState(false);

  // Saisie du code postal canadien : lettres/chiffres seulement, format « A1A 1A1 »
  function handlePostalInput(v: string) {
    const raw = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setLocation(raw.length > 3 ? `${raw.slice(0, 3)} ${raw.slice(3)}` : raw);
    setPostalError("");
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    const compact = location.replace(/\s/g, "");
    if (compact && !(autoPos && location === autoPos.city)) {
      if (!/^[ABCEGHJ-NPRSTVXY]\d[A-Z]\d[A-Z]\d$/.test(compact)) {
        setPostalError(h.postalError);
        return;
      }
      setSearching(true);
      try {
        const r = await fetch(`/api/geocode/postal?code=${compact}`);
        const d = r.ok ? await r.json() : null;
        if (!d || typeof d.lat !== "number") { setPostalError(h.postalUnknown); setSearching(false); return; }
        p.set("lat", String(d.lat));
        p.set("lng", String(d.lng));
        p.set("cp", `${compact.slice(0, 3)} ${compact.slice(3)}`);
      } catch { setPostalError(h.postalUnknown); setSearching(false); return; }
      setSearching(false);
      if (make)  p.set("make",  make);
      if (model) p.set("model", model);
      if (year)  p.set("year",  year);
      router.push(`/rechercher?${p.toString()}`);
      return;
    }
    if (make)     p.set("make",  make);
    if (model)    p.set("model", model);
    if (year)     p.set("year",  year);
    if (autoPos && location === autoPos.city) {
      p.set("lat", String(autoPos.lat));
      p.set("lng", String(autoPos.lng));
    }
    router.push(`/rechercher?${p.toString()}`);
  }

  const selBase = "w-full border-0 bg-transparent px-3 py-2 text-sm focus:outline-none text-gray-800";

  return (
    <div>
      {/* ── HERO ── */}
      <section className="relative overflow-hidden hero-lines" style={{ background: "#0b1f3a" }}>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-6 items-end">
        <div className="py-10 sm:py-14 lg:py-20 text-center lg:text-left">

          <h1 className="font-black tracking-tight mb-3"
            style={{ fontSize: "clamp(1.6rem, 4.2vw, 2.9rem)", lineHeight: 1.1 }}>
            <span style={{ color: "#f97316" }}>{h.heroLine2}</span>
          </h1>

          <p className="text-sm sm:text-base max-w-xl mx-auto lg:mx-0 leading-relaxed mb-5"
            style={{ color: "rgba(255,255,255,0.7)" }}>
            {h.heroSub}
          </p>

          {/* Search form */}
          <form onSubmit={handleSearch}
            className="bg-white rounded-2xl mx-auto lg:mx-0 max-w-3xl overflow-hidden text-left">

            {/* Vehicle row — toujours visible */}
            <div className="grid grid-cols-3" style={{ borderBottom: "1.5px solid #f1f5f9" }}>
              {[
                { label: h.yearLabel,  value: year,  setter: setYear,  opts: years.map(y => ({ v: String(y), l: String(y) })) },
                { label: h.makeLabel,  value: make,  setter: (v: string) => handleMakeChange(v), opts: VEHICLE_MAKES.map(m => ({ v: m, l: m })) },
                { label: h.modelLabel, value: model, setter: setModel, opts: models.map(m => ({ v: m, l: m })), disabled: !make },
              ].map((f, i) => (
                <div key={f.label} className={`flex flex-col px-2 py-1.5 sm:px-4 sm:py-3 ${i < 2 ? "border-r border-gray-100" : ""}`}>
                  <label className="font-black truncate" style={{ color: "#94a3b8", fontSize: "9px" }}>{f.label}</label>
                  <select
                    className="w-full border-0 bg-transparent py-0.5 sm:py-1 text-xs sm:text-sm focus:outline-none text-gray-800"
                    value={f.value}
                    onChange={(e) => (f.setter as (v: string) => void)(e.target.value)}
                    disabled={(f as any).disabled}>
                    <option value="">{(f as any).disabled ? "—" : ""}</option>
                    {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Location + search button — always horizontal */}
            <div className="flex items-center">
              <button type="button" onClick={handleLocate} disabled={locating}
                className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 ml-2 flex items-center justify-center rounded-lg transition-colors"
                style={{ background: "#fff4ed", color: "#f97316" }} title="Me localiser">
                {locating
                  ? <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                }
              </button>
              <div className="flex-1 px-2 py-2 sm:py-3">
                <input type="text" value={location} onChange={(e) => handlePostalInput(e.target.value)}
                  placeholder={h.cityPlaceholder} aria-label={h.cityLabel} autoComplete="postal-code"
                  inputMode="text" maxLength={7} aria-invalid={!!postalError}
                  className="block w-full text-sm focus:outline-none bg-transparent text-gray-800"
                  style={{ color: "#374151" }} />
              </div>
              <div className="pr-2 py-2">
                <button type="submit"
                  className="flex items-center justify-center gap-1.5 px-4 sm:px-6 py-2 sm:py-3 rounded-xl font-black text-white text-sm"
                  style={{ background: "#f97316" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  <span className="hidden sm:inline">{h.searchBtn}</span>
                </button>
              </div>
            </div>
            {(postalError || locError) && <p className="text-xs text-red-600 px-4 pb-2" role="alert">{postalError || locError}</p>}
          </form>
        </div>

        {/* Photo détourée, posée sur le bas du bloc. Décorative : masquée sous 1024 px. */}
        <div className="hidden lg:block self-end" aria-hidden="true">
          <img src="/accueil-garagiste-cliente.webp" width={1100} height={960} alt="" fetchPriority="high" decoding="async"
            style={{ display: "block", width: "100%", maxWidth: 500, height: "auto", margin: "0 auto" }} />
        </div>
        </div>
      </section>

      {/* ── STATS BAR ── */}
      {liveStats && <StatsBar stats={liveStats} labels={h.stats} />}

      {/* ── GARAGES PROCHES ── */}
      <HomeNearbyGarages pos={nearPos} onLocate={locateNear} locating={nearLocating} locError={nearError} lang={lang} />

      {/* ── MARQUES ── */}
      <section className="hidden sm:block bg-white py-10" style={{ borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-black" style={{ color: "#0b1f3a" }}>{BRANDS.length} {h.brandsTitle}</h2>
            <Link href="/rechercher" className="text-sm font-bold" style={{ color: "#f97316" }}>{h.allGarages}</Link>
          </div>
          <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-12 gap-2">
            {(showAllBrands ? [...commonBrands, ...otherBrands] : commonBrands).map((brand) => (
              <button key={brand.name} onClick={() => router.push(`/rechercher?make=${encodeURIComponent(brand.name)}`)}
                title={brand.name}
                className="flex flex-col items-center gap-1 p-2 rounded-xl border transition-all"
                style={{ borderColor: "transparent" }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = "#fed7aa"; el.style.background = "#fff4ed"; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = "transparent"; el.style.background = "transparent"; }}>
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-white"
                  style={{ border: "1px solid #e2e8f0", boxShadow: "0 1px 4px rgba(11,31,58,0.06)" }}>
                  <BrandLogo brand={brand.name} size={30} />
                </div>
                <span className="text-center" style={{ fontSize: 9, color: "#94a3b8", lineHeight: 1.2, maxWidth: 44 }}>
                  {brand.name}
                </span>
              </button>
            ))}
          </div>
          {otherBrands.length > 0 && (
            <div className="text-center mt-4">
              <button type="button" onClick={() => setShowAllBrands((v) => !v)} aria-expanded={showAllBrands}
                className="text-sm font-bold px-4 py-2 rounded-xl border" style={{ color: "#0b1f3a", borderColor: "#e2e8f0" }}>
                {showAllBrands
                  ? (lang === "fr" ? "Afficher moins de marques" : "Show fewer makes")
                  : (lang === "fr" ? `Voir les ${otherBrands.length} autres marques` : `Show ${otherBrands.length} more makes`)}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* ── SAISON ET QUARTIERS ── */}
      <HomeLocalSeason lang={lang} />

      {/* ── CTA GARAGE ── */}
      <section className="py-10 sm:py-16 relative overflow-hidden hero-lines"
        style={{ background: "#0b1f3a" }}>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-3 sm:mb-4">
                {h.ctaLine1}<br/>
                <span style={{ color: "#f97316" }}>{h.ctaLine2}</span>
              </h2>
              <p className="text-sm leading-relaxed mb-8 max-w-md" style={{ color: "rgba(255,255,255,0.45)" }}>
                {h.ctaSub1}<strong style={{ color: "rgba(255,255,255,0.75)" }}>{h.ctaSub2}</strong>
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/inscription/garage"
                  className="px-6 py-3.5 rounded-xl font-black text-white text-sm"
                  style={{ background: "#f97316" }}>
                  {h.ctaBtn}
                </Link>
                <Link href="/garagistes"
                  className="px-6 py-3.5 rounded-xl font-bold text-sm border"
                  style={{ color: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.15)" }}>
                  {h.ctaPricing}
                </Link>
              </div>
            </div>
            <HomeAgendaDemo lang={lang} />
          </div>
        </div>
      </section>
    </div>
  );
}
