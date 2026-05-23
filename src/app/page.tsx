"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { VEHICLE_MAKES, getModelsForMake, getYears } from "@/lib/vehicleData";
import { SERVICE_CATEGORIES } from "@/lib/services";

const SERVICES_ROW = [
  { id: "oil",         name: "Vidange d'huile",     price: "dès 59 $" },
  { id: "tires-winter",name: "Pneus d'hiver",        price: "dès 80 $" },
  { id: "brakes",      name: "Freins",               price: "dès 200 $" },
  { id: "engine",      name: "Mécanique générale",   price: "dès 99 $" },
  { id: "alignment",   name: "Alignement",           price: "dès 89 $" },
  { id: "ac",          name: "Climatisation",         price: "dès 59 $" },
  { id: "electrical",  name: "Diagnostic électro.",  price: "dès 79 $" },
  { id: "inspection",  name: "Inspection",           price: "dès 75 $" },
  { id: "suspension",  name: "Suspension",           price: "dès 229 $" },
  { id: "timing",      name: "Courroie",             price: "dès 349 $" },
  { id: "glass",       name: "Pare-brise",           price: "dès 199 $" },
  { id: "ev",          name: "Véhicule électrique",  price: "sur devis" },
];

export default function HomePage() {
  const router = useRouter();
  const [year, setYear]   = useState("");
  const [make, setMake]   = useState("");
  const [model, setModel] = useState("");
  const [service, setService] = useState("");

  const years  = getYears();
  const models = make ? getModelsForMake(make) : [];

  function handleMakeChange(m: string) { setMake(m); setModel(""); }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const p = new URLSearchParams();
    if (year)    p.set("year",    year);
    if (make)    p.set("make",    make);
    if (model)   p.set("model",   model);
    if (service) p.set("service", service);
    router.push(`/rechercher?${p.toString()}`);
  }

  const sel = "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-orange-400 transition";

  return (
    <div>

      {/* ── HERO ─────────────────────────────────────── */}
      <section style={{ background: "#0b1f3a" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">

            {/* Headline */}
            <div className="text-white">
              <p className="text-sm font-semibold text-orange-400 mb-4 uppercase tracking-widest">
                Québec · 500 garages partenaires
              </p>
              <h1 className="text-4xl lg:text-5xl font-bold leading-tight mb-5">
                Trouvez le bon garage<br />
                pour <span style={{ color: "#f97316" }}>votre voiture.</span>
              </h1>
              <p className="text-blue-200 text-base leading-relaxed max-w-md">
                Comparez les prix, lisez de vrais avis et réservez en quelques minutes.
                Cherchez par marque, modèle et type de service — sans surprise.
              </p>
              <div className="mt-8 flex flex-col gap-2 text-sm text-blue-300">
                <span>✓ Prix affichés à l'avance</span>
                <span>✓ Avis liés à de vrais comptes</span>
                <span>✓ Filtrage par marque et modèle</span>
              </div>
            </div>

            {/* Search widget */}
            <div className="bg-white rounded-xl p-6 shadow-xl">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Votre véhicule
              </p>
              <form onSubmit={handleSearch} className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <select className={sel} value={year} onChange={(e) => setYear(e.target.value)}>
                    <option value="">Année</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                  <select className={sel} value={make} onChange={(e) => handleMakeChange(e.target.value)}>
                    <option value="">Marque</option>
                    {VEHICLE_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                  <select className={sel} value={model} onChange={(e) => setModel(e.target.value)} disabled={!make}>
                    <option value="">{make ? "Modèle" : "—"}</option>
                    {models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">
                    Prestation
                  </p>
                  <select className={sel} value={service} onChange={(e) => setService(e.target.value)}>
                    <option value="">Toutes les prestations</option>
                    {SERVICE_CATEGORIES.map((s) => (
                      <option key={s.id} value={s.id}>{s.icon} {s.name}</option>
                    ))}
                  </select>
                </div>

                {make && model && (
                  <p className="text-xs text-gray-400">
                    Véhicule sélectionné :&nbsp;
                    <strong className="text-gray-700">{year} {make} {model}</strong>
                  </p>
                )}

                <button
                  type="submit"
                  className="w-full py-3 rounded-lg font-bold text-white text-sm transition hover:opacity-90"
                  style={{ backgroundColor: "#f97316" }}
                >
                  Rechercher un garage
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICES ROW ───────────────────────────── */}
      <section className="bg-white border-b border-gray-100 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5">
            Prestations disponibles
          </p>
          <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
            {SERVICES_ROW.map((s) => (
              <button
                key={s.id}
                onClick={() => {
                  const p = new URLSearchParams({ service: s.id });
                  if (make) p.set("make", make);
                  if (model) p.set("model", model);
                  router.push(`/rechercher?${p.toString()}`);
                }}
                className="flex-shrink-0 flex flex-col items-start gap-0.5 px-4 py-3 rounded-lg border border-gray-200 hover:border-orange-300 hover:bg-orange-50 transition-all group"
              >
                <span className="text-sm font-semibold text-gray-800 whitespace-nowrap group-hover:text-orange-700">
                  {s.name}
                </span>
                <span className="text-xs text-gray-400 group-hover:text-orange-500">{s.price}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ── AVIS ───────────────────────────────────── */}
      <section className="py-16" style={{ backgroundColor: "#f8fafc" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Ce que disent les conducteurs</h2>
            <p className="text-gray-500 text-sm mt-1">
              Les avis sont liés à de vrais comptes — aucun avis anonyme ou acheté.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {[
              {
                name: "Marie-Ève T.",
                city: "Montréal",
                rating: 5,
                text: "J'avais un problème de freins sur ma RAV4. J'ai trouvé un garage qui l'indiquait clairement dans ses services, avec le prix affiché. Aucune surprise à la caisse.",
                service: "Freins",
                date: "Il y a 3 semaines",
              },
              {
                name: "François L.",
                city: "Laval",
                rating: 5,
                text: "Cherchait un atelier qui fait les F-150. Avec le filtre par marque, j'ai eu exactement ce qu'il me fallait. Service rapide et prix honnête.",
                service: "Changement de pneus",
                date: "Il y a 1 mois",
              },
              {
                name: "Julie M.",
                city: "Sherbrooke",
                rating: 4,
                text: "Pratique de pouvoir comparer les prix avant de se déplacer. Le garage que j'ai choisi était moins cher que mon habituel et aussi bon.",
                service: "Vidange d'huile",
                date: "Il y a 2 mois",
              },
            ].map((r, i) => (
              <div key={i} className="bg-white rounded-xl p-5 border border-gray-200">
                <div className="flex items-center gap-0.5 mb-3">
                  {[...Array(5)].map((_, j) => (
                    <span key={j} className="text-base" style={{ color: j < r.rating ? "#f59e0b" : "#e5e7eb" }}>★</span>
                  ))}
                </div>
                <p className="text-gray-700 text-sm leading-relaxed mb-4">{r.text}</p>
                <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{r.name}</p>
                    <p className="text-xs text-gray-400">{r.city} · {r.date}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-md font-medium text-gray-500 bg-gray-100">
                    {r.service}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA GARAGE ─────────────────────────────── */}
      <section style={{ backgroundColor: "#0b1f3a" }} className="py-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="text-orange-400 text-sm font-semibold uppercase tracking-widest mb-4">
                Pour les garagistes
              </p>
              <h2 className="text-3xl font-bold text-white mb-4 leading-snug">
                Vos prochains clients cherchent un garage en ce moment.
              </h2>
              <p className="text-blue-200 text-sm leading-relaxed mb-8">
                Inscrivez votre garage, listez vos services et les marques que vous traitez.
                Votre profil est visible dès l'inscription — 30 jours gratuits, sans carte.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/inscription/garage"
                  className="px-6 py-3 rounded-lg font-bold text-white text-sm transition hover:opacity-90"
                  style={{ backgroundColor: "#f97316" }}
                >
                  Inscrire mon garage
                </Link>
                <Link
                  href="/tarifs"
                  className="px-6 py-3 rounded-lg font-semibold text-blue-200 border border-blue-700 hover:bg-white/10 transition text-sm"
                >
                  Voir les tarifs
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { title: "Marques configurables",    desc: "Indiquez ce que vous traitez — et ce que vous refusez." },
                { title: "Prix par service",          desc: "Affichez vos tarifs pour attirer des clients informés." },
                { title: "Avis vérifiés",            desc: "Votre réputation, construite avec de vrais clients." },
                { title: "Tableau de bord",           desc: "Gérez tout depuis un seul endroit." },
              ].map((f) => (
                <div
                  key={f.title}
                  className="rounded-xl p-4 border"
                  style={{ backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)" }}
                >
                  <p className="font-semibold text-white text-sm mb-1">{f.title}</p>
                  <p className="text-blue-300 text-xs leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
