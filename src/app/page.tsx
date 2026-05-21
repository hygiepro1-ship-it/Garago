"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VEHICLE_MAKES, getModelsForMake, getYears } from "@/lib/vehicleData";
import { SERVICE_CATEGORIES, QUEBEC_CITIES } from "@/lib/services";

export default function HomePage() {
  const router = useRouter();
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [service, setService] = useState("");
  const [city, setCity] = useState("");
  const years = getYears();
  const models = make ? getModelsForMake(make) : [];

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (year) params.set("year", year);
    if (make) params.set("make", make);
    if (model) params.set("model", model);
    if (service) params.set("service", service);
    if (city) params.set("city", city);
    router.push(`/rechercher?${params.toString()}`);
  }

  const selectClass =
    "block w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm text-sm";

  return (
    <div>
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-72 h-72 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-20 w-96 h-96 bg-blue-300 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-blue-700/50 border border-blue-500/30 rounded-full px-4 py-1.5 text-sm mb-6">
              <span>🍁</span>
              <span>La plateforme de garages #1 au Québec</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight mb-6">
              Trouvez le parfait garage<br />
              <span className="text-blue-300">pour votre véhicule</span>
            </h1>
            <p className="text-blue-200 text-lg sm:text-xl max-w-2xl mx-auto">
              Entrez votre véhicule, choisissez votre service et trouvez un garage de confiance près de chez vous — avec avis vérifiés.
            </p>
          </div>

          {/* Search Card */}
          <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl p-6 lg:p-8">
            <h2 className="text-gray-900 font-bold text-lg mb-5 flex items-center gap-2">
              <span>🔍</span> Trouvez votre garage idéal
            </h2>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Année</label>
                  <select className={selectClass} value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="">Toutes les années</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Marque</label>
                  <select className={selectClass} value={make} onChange={(e) => { setMake(e.target.value); setModel(""); }}>
                    <option value="">Toutes les marques</option>
                    {VEHICLE_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Modèle</label>
                  <select className={selectClass} value={model} onChange={(e) => setModel(e.target.value)} disabled={!make}>
                    <option value="">Tous les modèles</option>
                    {models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1 uppercase tracking-wide">Service requis</label>
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
              </div>
              <button
                type="submit"
                className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-4 rounded-xl text-base transition-all shadow-md hover:shadow-lg"
              >
                🔍 Rechercher des garages
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            {[
              { value: "500+", label: "Garages partenaires" },
              { value: "8 000+", label: "Avis vérifiés" },
              { value: "37", label: "Villes couvertes" },
              { value: "4.7★", label: "Note moyenne" },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-extrabold text-blue-700">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold text-gray-900">Comment ça marche</h2>
          <p className="text-gray-500 mt-3 text-lg">Pour les conducteurs — gratuit et simple</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {[
            { icon: "🚗", step: "1", title: "Entrez votre véhicule", desc: "Année, marque et modèle pour une recherche ultra-personnalisée." },
            { icon: "🔧", step: "2", title: "Choisissez votre service", desc: "Vidange, pneus, freins, AC... 18 catégories de services disponibles." },
            { icon: "⭐", step: "3", title: "Comparez et lisez les avis", desc: "Avis vérifiés, prix, disponibilités et marques acceptées." },
            { icon: "📞", step: "4", title: "Contactez le garage", desc: "Appelez directement ou prenez rendez-vous en ligne." },
          ].map((step) => (
            <div key={step.step} className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mx-auto mb-4">{step.icon}</div>
              <div className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-1">Étape {step.step}</div>
              <h3 className="font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Services grid */}
      <section className="bg-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-extrabold text-gray-900">Services populaires</h2>
            <p className="text-gray-500 mt-3">Trouvez un garage spécialisé selon votre besoin</p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {SERVICE_CATEGORIES.slice(0, 12).map((s) => (
              <Link
                key={s.id}
                href={`/rechercher?service=${s.id}`}
                className="flex flex-col items-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-all group text-center"
              >
                <span className="text-3xl">{s.icon}</span>
                <span className="text-xs font-semibold text-gray-700 group-hover:text-blue-700 leading-tight">{s.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Garage */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-white/20 rounded-full px-4 py-1.5 text-sm mb-6">
                <span>🔧</span><span>Pour les propriétaires de garage</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold mb-6">
                Rejoignez les garages qui font confiance à GarageQC
              </h2>
              <ul className="space-y-3 mb-8">
                {[
                  "30 jours d'essai gratuit — sans carte de crédit",
                  "Profil complet : services, marques, prix et disponibilités",
                  "Avis clients vérifiés pour bâtir votre réputation",
                  "Visibilité auprès de milliers de conducteurs québécois",
                  "Tableau de bord pour gérer votre présence en ligne",
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2 text-blue-100">
                    <span className="text-blue-300 mt-0.5">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-4">
                <Link href="/inscription/garage" className="px-8 py-4 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-lg">
                  Inscrire mon garage gratuitement
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: "📊", title: "Tableau de bord complet", desc: "Gérez vos avis, services et disponibilités" },
                { icon: "🚗", title: "Marques acceptées", desc: "Indiquez exactement ce que vous réparez" },
                { icon: "💰", title: "Affichez vos prix", desc: "Transparence totale pour vos clients" },
                { icon: "⭐", title: "Avis vérifiés", desc: "Bâtissez votre réputation en ligne" },
              ].map((feat) => (
                <div key={feat.title} className="bg-white/10 border border-white/20 rounded-xl p-4">
                  <div className="text-2xl mb-2">{feat.icon}</div>
                  <div className="font-bold text-sm mb-1">{feat.title}</div>
                  <div className="text-xs text-blue-200">{feat.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
