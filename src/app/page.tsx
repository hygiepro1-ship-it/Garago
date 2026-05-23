"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VEHICLE_MAKES, getModelsForMake, getTrimsForModel, getYears, hasTrims } from "@/lib/vehicleData";
import { SERVICE_CATEGORIES } from "@/lib/services";

const FEATURED_SERVICES = [
  { id: "oil", name: "Vidange d'huile", price: "à partir de 59 $", icon: "🛢️", color: "#fef3c7", border: "#fde68a" },
  { id: "tires-winter", name: "Pneus d'hiver", price: "à partir de 80 $", icon: "❄️", color: "#eff6ff", border: "#bfdbfe" },
  { id: "brakes", name: "Plaquettes de frein", price: "à partir de 200 $", icon: "🔴", color: "#fef2f2", border: "#fecaca" },
  { id: "engine", name: "Révision complète", price: "à partir de 99 $", icon: "🔧", color: "#f0fdf4", border: "#bbf7d0" },
  { id: "alignment", name: "Parallélisme", price: "à partir de 89 $", icon: "📐", color: "#faf5ff", border: "#e9d5ff" },
  { id: "ac", name: "Climatisation", price: "à partir de 59 $", icon: "💨", color: "#ecfeff", border: "#a5f3fc" },
  { id: "suspension", name: "Amortisseurs", price: "à partir de 229 $", icon: "🌀", color: "#fff7ed", border: "#fed7aa" },
  { id: "transmission", name: "Embrayage", price: "à partir de 559 $", icon: "⚙️", color: "#f0fdf4", border: "#bbf7d0" },
  { id: "electrical", name: "Diagnostic électro.", price: "à partir de 79 $", icon: "⚡", color: "#fefce8", border: "#fde047" },
];

export default function HomePage() {
  const router = useRouter();

  // Vehicle state
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [trim, setTrim] = useState("");
  const [service, setService] = useState("");

  const years = getYears();
  const models = make ? getModelsForMake(make) : [];
  const trims = model ? getTrimsForModel(model) : [];
  const showTrim = model && hasTrims(model);

  function handleMakeChange(m: string) { setMake(m); setModel(""); setTrim(""); }
  function handleModelChange(m: string) { setModel(m); setTrim(""); }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (trim) params.set("trim", trim);
    if (service) params.set("service", service);
    router.push(`/rechercher?${params.toString()}`);
  }

  function searchService(serviceId: string) {
    const params = new URLSearchParams({ service: serviceId });
    if (make) params.set("make", make);
    if (year) params.set("year", year);
    if (model) params.set("model", model);
    router.push(`/rechercher?${params.toString()}`);
  }

  const selectClass = "block w-full rounded-xl px-4 py-3 text-gray-900 bg-white text-sm font-medium focus:outline-none focus:ring-2 focus:ring-orange-400 border-0 shadow-sm";

  return (
    <div>
      {/* ─── HERO ─────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #071428 0%, #0b1f3a 50%, #0d2a50 100%)",
          minHeight: "520px",
        }}
      >
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -right-32 top-0 w-[600px] h-[600px] opacity-5"
            style={{ background: "radial-gradient(circle, #f97316 0%, transparent 70%)" }} />
          <div className="absolute -left-20 bottom-0 w-[400px] h-[400px] opacity-5"
            style={{ background: "radial-gradient(circle, #60a5fa 0%, transparent 70%)" }} />
          {/* Car silhouette decoration */}
          <svg className="absolute right-0 bottom-0 opacity-5 w-[600px]" viewBox="0 0 800 300" fill="white">
            <path d="M50,200 Q100,150 200,140 L300,100 Q400,80 500,90 L650,85 Q720,90 750,130 L800,200 L800,250 L50,250 Z" />
            <circle cx="200" cy="230" r="50" />
            <circle cx="600" cy="230" r="50" />
          </svg>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 items-center">

            {/* Left — headline */}
            <div className="lg:col-span-2 text-white">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
                style={{ backgroundColor: "rgba(249,115,22,0.2)", border: "1px solid rgba(249,115,22,0.4)", color: "#fb923c" }}>
                <span>⭐</span> 4.7/5 — Plus de 8 000 avis vérifiés
              </div>
              <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-4">
                Comparez les garages,<br />
                <span style={{ color: "#f97316" }}>réservez au meilleur prix!</span>
              </h1>
              <p className="text-blue-200 text-lg leading-relaxed mb-6">
                Devis et RDV immédiats parmi <strong className="text-white">500+ garages</strong> au Québec. Trouvez le parfait garage pour <strong className="text-white">votre véhicule exact.</strong>
              </p>
              <div className="flex flex-wrap gap-4 text-sm text-blue-300">
                {["Sans engagement", "Avis vérifiés", "Prix transparents"].map((b) => (
                  <span key={b} className="flex items-center gap-1.5">
                    <span style={{ color: "#f97316" }}>✓</span> {b}
                  </span>
                ))}
              </div>
            </div>

            {/* Right — search widget */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                {/* Tabs */}
                <div className="flex border-b border-gray-100">
                  <button
                    className="flex-1 py-4 text-sm font-bold text-center transition-all flex items-center justify-center gap-2"
                    style={{ backgroundColor: "#0b1f3a", color: "white" }}
                  >
                    <span>🔧</span> Entretenir mon véhicule
                  </button>
                  <Link
                    href="/rechercher?service=tires-winter"
                    className="flex-1 py-4 text-sm font-semibold text-center transition-all flex items-center justify-center gap-2 text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                  >
                    <span>🔄</span> Changer mes pneus
                  </Link>
                </div>

                <form onSubmit={handleSearch} className="p-6 space-y-4">
                  {/* Vehicle row */}
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">Mon véhicule</label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <select className={selectClass} value={year} onChange={(e) => setYear(e.target.value)} style={{ border: "1.5px solid #e2e8f0" }}>
                        <option value="">Année</option>
                        {years.map((y) => <option key={y} value={y}>{y}</option>)}
                      </select>
                      <select className={selectClass} value={make} onChange={(e) => handleMakeChange(e.target.value)} style={{ border: "1.5px solid #e2e8f0" }}>
                        <option value="">Marque</option>
                        {VEHICLE_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <select className={selectClass} value={model} onChange={(e) => handleModelChange(e.target.value)} disabled={!make} style={{ border: "1.5px solid #e2e8f0" }}>
                        <option value="">{make ? "Modèle" : "—"}</option>
                        {models.map((m) => <option key={m} value={m}>{m}</option>)}
                      </select>
                      <select
                        className={selectClass}
                        value={trim}
                        onChange={(e) => setTrim(e.target.value)}
                        disabled={!showTrim}
                        style={{ border: `1.5px solid ${showTrim ? "#fed7aa" : "#e2e8f0"}`, backgroundColor: showTrim ? "#fff7ed" : "white" }}
                      >
                        <option value="">{showTrim ? "Finition" : "Finition"}</option>
                        {trims.map((t) => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>
                    {make && model && !showTrim && (
                      <p className="text-xs text-gray-400 mt-1">✓ Modèle sélectionné : {year} {make} {model}</p>
                    )}
                    {trim && (
                      <p className="text-xs mt-1 font-semibold" style={{ color: "#f97316" }}>
                        ✓ Votre véhicule exact : {year} {make} {model} — {trim}
                      </p>
                    )}
                  </div>

                  {/* Service */}
                  <div>
                    <label className="block text-xs font-black text-gray-500 mb-2 uppercase tracking-widest">Prestation souhaitée</label>
                    <select className={selectClass} value={service} onChange={(e) => setService(e.target.value)} style={{ border: "1.5px solid #e2e8f0" }}>
                      <option value="">Toutes les prestations</option>
                      {SERVICE_CATEGORIES.map((s) => (
                        <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 rounded-xl font-black text-white text-base transition-all hover:opacity-90 hover:shadow-lg"
                    style={{ backgroundColor: "#f97316" }}
                  >
                    🔍 Trouver mon garage
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── STATS BAR ─────────────────────────────────── */}
      <div style={{ backgroundColor: "#0b1f3a" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex flex-wrap justify-center md:justify-between items-center gap-6">
            {[
              { value: "500+", label: "Garages partenaires" },
              { value: "8 000+", label: "Avis vérifiés" },
              { value: "37", label: "Villes couvertes" },
              { value: "4.7/5", label: "Note moyenne" },
              { value: "30", label: "Jours d'essai gratuit" },
            ].map((s) => (
              <div key={s.label} className="flex items-center gap-3">
                <span className="text-xl font-black text-white">{s.value}</span>
                <span className="text-sm text-blue-300">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── SERVICE GRID ──────────────────────────────── */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-10">
            <h2 className="text-3xl font-black text-gray-900">Quelle prestation cherchez-vous ?</h2>
            <p className="text-gray-500 mt-2">Comparez les prix et trouvez le meilleur garage pour chaque service</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-9 gap-3">
            {FEATURED_SERVICES.map((s) => (
              <button
                key={s.id}
                onClick={() => searchService(s.id)}
                className="group flex flex-col items-center gap-2.5 p-4 rounded-2xl border-2 transition-all card-hover text-center"
                style={{ backgroundColor: s.color, borderColor: s.border }}
              >
                <span className="text-3xl">{s.icon}</span>
                <span className="text-xs font-bold text-gray-800 leading-tight">{s.name}</span>
                <span className="text-xs font-semibold" style={{ color: "#f97316" }}>{s.price}</span>
              </button>
            ))}
          </div>
          <div className="text-center mt-6">
            <Link href="/rechercher" className="inline-flex items-center gap-2 text-sm font-semibold hover:underline" style={{ color: "#0057b8" }}>
              Voir toutes les prestations →
            </Link>
          </div>
        </div>
      </section>

      {/* ─── 3 STEPS ───────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: "#f8fafc" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-black text-gray-900">Simple comme 1, 2, 3</h2>
            <p className="text-gray-500 mt-2">Trouvez et réservez votre garage en quelques minutes</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
            {/* Connector lines */}
            <div className="hidden md:block absolute top-12 left-1/3 right-1/3 h-0.5 bg-gradient-to-r from-orange-200 to-orange-200" style={{ transform: "scaleX(2.5) translateX(-50%)", left: "22%", right: "22%" }} />
            {[
              { num: "1", icon: "🚗", title: "Entrez votre véhicule", desc: "Année, marque, modèle et même la finition exacte pour des résultats 100% compatibles avec votre auto." },
              { num: "2", icon: "⭐", title: "Comparez les garages", desc: "Consultez les prix, les avis vérifiés, les marques acceptées et les disponibilités en temps réel." },
              { num: "3", icon: "📞", title: "Contactez et réservez", desc: "Appelez directement ou prenez rendez-vous en ligne. Profitez des meilleurs prix du marché." },
            ].map((step, i) => (
              <div key={step.num} className="relative flex flex-col items-center text-center">
                <div className="relative mb-5">
                  <div
                    className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl shadow-lg"
                    style={{ backgroundColor: "white", border: "3px solid #f97316" }}
                  >
                    {step.icon}
                  </div>
                  <div
                    className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white shadow"
                    style={{ backgroundColor: "#f97316" }}
                  >
                    {step.num}
                  </div>
                </div>
                <h3 className="text-lg font-black text-gray-900 mb-2">{step.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TRUSTED BY ────────────────────────────────── */}
      <section className="bg-white py-12 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-bold text-gray-400 uppercase tracking-widest mb-8">Nos garages partenaires traitent toutes ces marques</p>
          <div className="flex flex-wrap justify-center gap-6 text-sm font-semibold text-gray-500">
            {["Toyota", "Honda", "Ford", "Chevrolet", "Hyundai", "Kia", "Mazda", "Nissan", "Subaru", "BMW", "Audi", "Mercedes-Benz", "Volkswagen", "Jeep", "RAM"].map((b) => (
              <span key={b} className="px-4 py-2 rounded-lg bg-gray-50 border border-gray-200 hover:border-orange-300 hover:text-orange-600 transition-all cursor-pointer" onClick={() => router.push(`/rechercher?make=${b}`)}>
                {b}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ─── REVIEWS ───────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: "#f8fafc" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-end justify-between mb-10">
            <div>
              <h2 className="text-3xl font-black text-gray-900">Ce que disent nos clients</h2>
              <div className="flex items-center gap-3 mt-2">
                <div className="flex">
                  {"★★★★★".split("").map((s, i) => (
                    <span key={i} className="text-xl" style={{ color: "#f59e0b" }}>{s}</span>
                  ))}
                </div>
                <span className="font-black text-gray-900 text-lg">4.7/5</span>
                <span className="text-gray-500 text-sm">sur 8 000+ avis vérifiés</span>
              </div>
            </div>
            <Link href="/rechercher" className="hidden sm:flex items-center gap-2 text-sm font-semibold" style={{ color: "#0057b8" }}>
              Voir tous les garages →
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              { name: "Marie-Ève T.", city: "Montréal", rating: 5, text: "Incroyable! J'ai trouvé un garage pour ma Toyota RAV4 en 2 minutes. Prix affiché à l'avance, aucune mauvaise surprise. Je recommande à 100%.", service: "Vidange d'huile" },
              { name: "François L.", city: "Laval", rating: 5, text: "La fonction de recherche par modèle exact est géniale — j'ai cherché pour mon F-150 et tous les résultats étaient compatibles. Service impeccable.", service: "Changement de pneus" },
              { name: "Julie M.", city: "Québec", rating: 5, text: "Le garage que j'ai trouvé ici a battu tous les prix du quartier. Les avis vérifiés m'ont aidée à choisir en confiance. Merci GarageQC!", service: "Inspection mécanique" },
            ].map((r, i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 card-hover">
                <div className="flex items-center gap-1 mb-3">
                  {"★★★★★".split("").slice(0, r.rating).map((_, j) => (
                    <span key={j} style={{ color: "#f59e0b" }}>★</span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">"{r.text}"</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-black text-white" style={{ backgroundColor: "#0b1f3a" }}>
                      {r.name[0]}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900">{r.name}</p>
                      <p className="text-xs text-gray-400">{r.city}</p>
                    </div>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ backgroundColor: "#fff7ed", color: "#c2410c", border: "1px solid #fed7aa" }}>
                    {r.service}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA GARAGE ────────────────────────────────── */}
      <section className="py-20" style={{ background: "linear-gradient(135deg, #071428 0%, #0b1f3a 100%)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6" style={{ backgroundColor: "rgba(249,115,22,0.15)", border: "1px solid rgba(249,115,22,0.3)", color: "#fb923c" }}>
                <span>🔧</span> Pour les propriétaires de garage
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-white mb-6">
                Rejoignez le réseau<br />
                <span style={{ color: "#f97316" }}>GarageQC dès aujourd'hui</span>
              </h2>
              <ul className="space-y-3 mb-8">
                {[
                  "30 jours d'essai gratuit — sans carte de crédit",
                  "Indiquez les marques que vous traitez (et celles que vous refusez)",
                  "Affichez vos prix pour chaque type de service",
                  "Recevez des avis vérifiés de vrais clients",
                  "Gestion complète depuis votre tableau de bord",
                  "Visibilité auprès de milliers de conducteurs québécois",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2.5 text-blue-100 text-sm">
                    <span className="text-orange-400 mt-0.5 font-bold">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/inscription/garage"
                  className="px-8 py-4 rounded-xl font-black text-white transition-all hover:opacity-90"
                  style={{ backgroundColor: "#f97316" }}
                >
                  Inscrire mon garage gratuitement
                </Link>
                <Link href="/tarifs" className="px-8 py-4 rounded-xl font-semibold text-blue-200 border border-blue-700 hover:bg-white/10 transition-all text-sm">
                  Voir les tarifs →
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "📊", title: "Tableau de bord", desc: "Statistiques, avis, services — tout centralisé" },
                { icon: "🚗", title: "Marques gérées", desc: "Configurez précisément ce que vous réparez" },
                { icon: "💰", title: "Prix transparents", desc: "Affichez vos tarifs pour chaque prestation" },
                { icon: "⭐", title: "Avis vérifiés", desc: "Construisez votre réputation en ligne" },
              ].map((feat) => (
                <div key={feat.title} className="rounded-2xl p-5" style={{ backgroundColor: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div className="text-3xl mb-3">{feat.icon}</div>
                  <div className="font-bold text-white text-sm mb-1">{feat.title}</div>
                  <div className="text-xs text-blue-300">{feat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
