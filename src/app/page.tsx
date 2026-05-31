"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getModelsForMake, getYears } from "@/lib/vehicleData";
import { BRANDS } from "@/lib/vehicleBrands";
import BrandLogo from "@/components/BrandLogo";

const SERVICES_ROW = [
  { icon: "🛢️", name: "Vidange d'huile",    id: "oil",          price: "dès 59 $" },
  { icon: "❄️", name: "Pneus d'hiver",       id: "tires-winter", price: "dès 80 $" },
  { icon: "🔴", name: "Freins",              id: "brakes",       price: "dès 200 $" },
  { icon: "⚙️", name: "Mécanique générale", id: "engine",       price: "dès 99 $" },
  { icon: "📐", name: "Alignement",          id: "alignment",    price: "dès 89 $" },
  { icon: "💨", name: "Climatisation",       id: "ac",           price: "dès 59 $" },
  { icon: "⚡", name: "Diagnostic élec.",    id: "electrical",   price: "dès 79 $" },
  { icon: "🔍", name: "Inspection",          id: "inspection",   price: "dès 75 $" },
  { icon: "🔧", name: "Suspension",          id: "suspension",   price: "dès 229 $" },
  { icon: "⏱️", name: "Courroie",            id: "timing",       price: "dès 349 $" },
  { icon: "🪟", name: "Pare-brise",          id: "glass",        price: "dès 199 $" },
  { icon: "🔋", name: "Véh. électrique",     id: "ev",           price: "sur devis" },
];

const TESTIMONIALS = [
  {
    name: "Marie-Ève T.", city: "Montréal", rating: 5, vehicle: "Toyota RAV4 2021",
    text: "J'avais un problème de freins. J'ai trouvé un garage qui indiquait clairement le prix à l'avance. Aucune surprise à la caisse.",
    service: "Freins",
  },
  {
    name: "François L.", city: "Laval", rating: 5, vehicle: "Ford F-150 2019",
    text: "Avec le filtre par marque, j'ai trouvé exactement ce qu'il fallait pour mon F-150. Service rapide, prix honnête, réservation facile.",
    service: "Pneus",
  },
  {
    name: "Julie M.", city: "Sherbrooke", rating: 4, vehicle: "Honda Civic 2020",
    text: "Comparer les prix avant de se déplacer, c'est génial. Le garage que j'ai choisi était moins cher que mon habituel et tout aussi bon.",
    service: "Vidange",
  },
];

export default function HomePage() {
  const router = useRouter();
  const [year,     setYear]     = useState("");
  const [make,     setMake]     = useState("");
  const [model,    setModel]    = useState("");
  const [location, setLocation] = useState("");
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  const years  = getYears();
  const models = make ? getModelsForMake(make) : [];
  const VEHICLE_MAKES = BRANDS.map(b => b.name);

  function handleMakeChange(m: string) { setMake(m); setModel(""); }

  const handleLocate = useCallback(() => {
    setLocError("");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const p = new URLSearchParams();
        p.set("lat", String(pos.coords.latitude));
        p.set("lng", String(pos.coords.longitude));
        if (year)  p.set("year",  year);
        if (make)  p.set("make",  make);
        if (model) p.set("model", model);
        router.push(`/rechercher?${p.toString()}`);
      },
      () => { setLocating(false); setLocError("Localisation refusée."); },
      { timeout: 8000 }
    );
  }, [year, make, model, router]);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (year)     p.set("year",  year);
    if (make)     p.set("make",  make);
    if (model)    p.set("model", model);
    if (location) p.set("q",     location);
    router.push(`/rechercher?${p.toString()}`);
  }

  const selBase = "w-full border-0 bg-transparent px-3 py-2 text-sm focus:outline-none text-gray-800";

  return (
    <div>

      {/* ════════════════════════════════════════════════════════
          HERO — Navy Garago + orange
      ════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden hero-lines"
        style={{ background: "linear-gradient(140deg, #071428 0%, #0b1f3a 55%, #112847 100%)", minHeight: 500 }}>

        {/* Lueur orange en haut à gauche */}
        <div className="absolute -top-24 -left-24 w-80 h-80 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.13) 0%, transparent 70%)" }} />
        <div className="absolute bottom-0 right-0 w-96 h-64 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.06) 0%, transparent 70%)" }} />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20 text-center">

          {/* Eyebrow */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold"
            style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.25)", color: "#fb923c" }}>
            🇨🇦 &nbsp;500+ garages partenaires au Québec
          </div>

          {/* Titre */}
          <h1 className="text-white font-black tracking-tight mb-4"
            style={{ fontSize: "clamp(2.2rem, 5vw, 3.5rem)", lineHeight: 1.1 }}>
            Votre voiture mérite<br />
            <span style={{
              background: "linear-gradient(90deg, #f97316 0%, #fb923c 50%, #fbbf24 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}>le bon garage.</span>
          </h1>

          {/* Sous-titre */}
          <p className="text-base sm:text-lg max-w-2xl mx-auto leading-relaxed mb-3"
            style={{ color: "rgba(255,255,255,0.5)" }}>
            Cherchez par <strong style={{ color: "rgba(255,255,255,0.8)" }}>marque et modèle</strong>, comparez
            les prix et les avis vérifiés — puis réservez en ligne.{" "}
            <span style={{ color: "#f97316" }}>Sans mauvaises surprises.</span>
          </p>

          {/* Trust pills */}
          <div className="flex flex-wrap justify-center gap-4 mb-9">
            {[
              { icon: "✓", text: "Prix affichés à l'avance" },
              { icon: "✓", text: "Avis de vrais conducteurs" },
              { icon: "✓", text: "Réservation en 2 minutes" },
            ].map((p) => (
              <span key={p.text} className="text-xs font-semibold flex items-center gap-1.5"
                style={{ color: "rgba(255,255,255,0.45)" }}>
                <span style={{ color: "#10b981" }}>{p.icon}</span>{p.text}
              </span>
            ))}
          </div>

          {/* ── Barre de recherche ─── */}
          <form onSubmit={handleSearch}
            className="bg-white rounded-2xl mx-auto max-w-3xl overflow-hidden"
            style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.04)" }}>

            {/* Ligne 1 : véhicule */}
            <div className="grid grid-cols-3" style={{ borderBottom: "1.5px solid #f1f5f9" }}>
              {[
                { label: "ANNÉE",  value: year,  setter: setYear,  opts: years.map(y => ({ v: y, l: y })) },
                { label: "MARQUE", value: make,  setter: (v: string) => handleMakeChange(v), opts: VEHICLE_MAKES.map(m => ({ v: m, l: m })) },
                { label: "MODÈLE", value: model, setter: setModel, opts: models.map(m => ({ v: m, l: m })), disabled: !make },
              ].map((f, i) => (
                <div key={f.label} className={`flex flex-col px-4 py-3 ${i < 2 ? "border-r border-gray-100" : ""}`}>
                  <label className="text-xs font-black mb-1" style={{ color: "#94a3b8" }}>{f.label}</label>
                  <select className={selBase} value={f.value}
                    onChange={(e) => (f.setter as (v: string) => void)(e.target.value)}
                    disabled={(f as any).disabled}>
                    <option value="">{(f as any).disabled ? "—" : "Tous"}</option>
                    {f.opts.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
                  </select>
                </div>
              ))}
            </div>

            {/* Ligne 2 : localisation + bouton */}
            <div className="flex items-center">
              <button type="button" onClick={handleLocate} disabled={locating}
                className="flex-shrink-0 ml-3 w-8 h-8 flex items-center justify-center rounded-lg transition-colors"
                style={{ background: "#fff4ed", color: "#f97316" }} title="Me localiser">
                {locating
                  ? <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                  : <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
                }
              </button>
              <div className="flex-1 px-3 py-3">
                <label className="text-xs font-black" style={{ color: "#94a3b8" }}>VILLE OU CODE POSTAL</label>
                <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                  placeholder="ex. Montréal, Laval, H2X…"
                  className="block w-full text-sm focus:outline-none bg-transparent mt-0.5 text-gray-800" />
              </div>
              <div className="pr-3">
                <button type="submit"
                  className="flex items-center gap-2 px-7 py-3.5 rounded-xl font-black text-white text-sm"
                  style={{ background: "linear-gradient(135deg, #f97316 0%, #ea6c0a 100%)", boxShadow: "0 4px 16px rgba(249,115,22,0.4)" }}>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                  Rechercher
                </button>
              </div>
            </div>
            {locError && <p className="text-xs text-red-500 px-4 pb-3">{locError}</p>}
          </form>

          {/* Raccourcis */}
          <div className="flex flex-wrap justify-center gap-2 mt-5">
            <span className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>Populaires :</span>
            {["Vidange d'huile", "Pneus d'hiver", "Freins", "Diagnostic"].map((s) => (
              <button key={s} onClick={() => router.push(`/rechercher?q=${encodeURIComponent(s)}`)}
                className="text-xs font-semibold px-3 py-1.5 rounded-full transition-colors"
                style={{ background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.6)", border: "1px solid rgba(255,255,255,0.1)" }}>
                {s}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="bg-white" style={{ borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "500+",    label: "garages partenaires" },
              { value: "8 000+", label: "avis vérifiés" },
              { value: "4.7 / 5",label: "note moyenne" },
              { value: "< 2 min",label: "pour réserver" },
            ].map((s) => (
              <div key={s.label}>
                <p className="text-2xl font-black" style={{ color: "#f97316" }}>{s.value}</p>
                <p className="text-xs font-semibold mt-0.5" style={{ color: "#94a3b8" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services */}
      <section className="bg-white py-10" style={{ borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-black" style={{ color: "#0b1f3a" }}>Services les plus demandés</h2>
            <Link href="/rechercher" className="text-sm font-bold" style={{ color: "#f97316" }}>Voir tous →</Link>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {SERVICES_ROW.map((s) => (
              <button key={s.id}
                onClick={() => router.push(`/rechercher?service=${s.id}${make ? `&make=${make}` : ""}`)}
                className="flex-shrink-0 flex flex-col items-start gap-1 px-4 py-3 rounded-xl border transition-all"
                style={{ borderColor: "#e2e8f0", background: "white", minWidth: 128 }}
                onMouseEnter={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = "#f97316"; el.style.background = "#fff4ed"; }}
                onMouseLeave={(e) => { const el = e.currentTarget as HTMLButtonElement; el.style.borderColor = "#e2e8f0"; el.style.background = "white"; }}>
                <span className="text-xl">{s.icon}</span>
                <span className="text-sm font-bold whitespace-nowrap" style={{ color: "#0b1f3a" }}>{s.name}</span>
                <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>{s.price}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Marques */}
      <section className="bg-white py-10" style={{ borderBottom: "1px solid #e2e8f0" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-base font-black" style={{ color: "#0b1f3a" }}>{BRANDS.length} marques couvertes</h2>
            <Link href="/rechercher" className="text-sm font-bold" style={{ color: "#f97316" }}>Tous les garages →</Link>
          </div>
          <div className="grid grid-cols-8 sm:grid-cols-10 md:grid-cols-12 gap-2">
            {BRANDS.map((brand) => (
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
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16" style={{ background: "#f8fafc" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-black mb-3" style={{ color: "#0b1f3a" }}>
              Du problème à la solution — en 3 étapes
            </h2>
            <p className="text-sm" style={{ color: "#94a3b8" }}>Pas besoin d'appeler 10 garages. On fait le travail pour vous.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { num: "1", icon: "🔍", title: "Entrez votre véhicule", desc: "Marque, modèle et service souhaité. On filtre les garages compatibles — plus besoin de chercher qui fait quoi." },
              { num: "2", icon: "⚖️", title: "Comparez en toute clarté", desc: "Prix affichés, avis de vrais clients, distance et disponibilité — tout pour choisir en confiance." },
              { num: "3", icon: "📅", title: "Réservez en ligne", desc: "Choisissez votre créneau, recevez une confirmation par courriel et ajoutez le RDV à votre calendrier." },
            ].map((s) => (
              <div key={s.num} className="flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-2xl"
                    style={{ background: "#fff4ed", border: "2px solid #fed7aa" }}>{s.icon}</div>
                  <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-white"
                    style={{ background: "#f97316" }}>{s.num}</div>
                </div>
                <h3 className="text-base font-black mb-2" style={{ color: "#0b1f3a" }}>{s.title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: "#64748b" }}>{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link href="/rechercher"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-black text-white text-sm"
              style={{ background: "linear-gradient(135deg, #f97316, #ea6c0a)", boxShadow: "0 4px 16px rgba(249,115,22,0.35)" }}>
              Trouver mon garage →
            </Link>
          </div>
        </div>
      </section>

      {/* Témoignages */}
      <section className="py-16 bg-white" style={{ borderTop: "1px solid #e2e8f0" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-black" style={{ color: "#0b1f3a" }}>Ils ont trouvé leur garage sur Garago</h2>
              <p className="text-sm mt-1" style={{ color: "#94a3b8" }}>Avis liés à de vraies réservations — aucun avis anonyme.</p>
            </div>
            <div className="flex items-center gap-1">
              {[1,2,3,4,5].map(i => <span key={i} style={{ color: "#f59e0b", fontSize: 16 }}>★</span>)}
              <span className="font-black text-sm ml-1.5" style={{ color: "#0b1f3a" }}>4.7 / 5</span>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TESTIMONIALS.map((r, i) => (
              <div key={i} className="garago-card p-5">
                <div className="flex items-center gap-0.5 mb-1">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} style={{ color: j < r.rating ? "#f59e0b" : "#e2e8f0", fontSize: 14 }}>★</span>
                  ))}
                </div>
                <p className="text-xs font-semibold mb-3" style={{ color: "#94a3b8" }}>{r.vehicle}</p>
                <p className="text-sm leading-relaxed mb-4" style={{ color: "#374151" }}>&ldquo;{r.text}&rdquo;</p>
                <div className="flex items-center justify-between pt-3" style={{ borderTop: "1px solid #f1f5f9" }}>
                  <div>
                    <p className="text-sm font-bold" style={{ color: "#0b1f3a" }}>{r.name}</p>
                    <p className="text-xs" style={{ color: "#94a3b8" }}>{r.city}</p>
                  </div>
                  <span className="badge badge-orange">{r.service}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA garage */}
      <section className="py-16 relative overflow-hidden hero-lines"
        style={{ background: "linear-gradient(135deg, #071428 0%, #0b1f3a 100%)" }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(249,115,22,0.07) 0%, transparent 70%)" }} />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
                style={{ background: "rgba(249,115,22,0.12)", border: "1px solid rgba(249,115,22,0.2)", color: "#fb923c" }}>
                🔧 Pour les garagistes
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white leading-tight mb-4">
                Vos prochains clients<br/>
                <span style={{ color: "#f97316" }}>cherchent en ce moment.</span>
              </h2>
              <p className="text-sm leading-relaxed mb-8 max-w-md" style={{ color: "rgba(255,255,255,0.45)" }}>
                Inscrivez votre garage, configurez vos services et les marques que vous traitez.
                Profil visible dès l'inscription —{" "}
                <strong style={{ color: "rgba(255,255,255,0.75)" }}>30 jours gratuits, sans carte.</strong>
              </p>
              <div className="flex flex-wrap gap-3">
                <Link href="/inscription/garage"
                  className="px-6 py-3.5 rounded-xl font-black text-white text-sm"
                  style={{ background: "linear-gradient(135deg, #f97316, #ea6c0a)", boxShadow: "0 4px 16px rgba(249,115,22,0.4)" }}>
                  Inscrire mon garage gratuitement
                </Link>
                <Link href="/tarifs"
                  className="px-6 py-3.5 rounded-xl font-bold text-sm border"
                  style={{ color: "rgba(255,255,255,0.55)", borderColor: "rgba(255,255,255,0.15)" }}>
                  Voir les tarifs
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { icon: "🚗", title: "Marques configurables",  desc: "Indiquez exactement ce que vous traitez." },
                { icon: "💰", title: "Prix affichés",           desc: "Attirez des clients informés avec vos tarifs." },
                { icon: "⭐", title: "Avis vérifiés",          desc: "Construisez votre réputation client." },
                { icon: "📊", title: "Tableau de bord",         desc: "Agenda, services et stats au même endroit." },
              ].map((f) => (
                <div key={f.title} className="rounded-xl p-4"
                  style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <div className="text-xl mb-2">{f.icon}</div>
                  <p className="font-bold text-white text-sm mb-1">{f.title}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.38)" }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
