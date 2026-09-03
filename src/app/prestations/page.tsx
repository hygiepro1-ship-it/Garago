/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SERVICE_CATEGORIES } from "@/lib/services";

// ─── Data ─────────────────────────────────────────────────────────────────────

const FILTERS = [
  { id: "all",         label: "Tout",        iconPath: null,                           ids: null },
  { id: "entretien",   label: "Entretien",   iconPath: "/icons/filter-entretien.png",  ids: ["oil", "preventive", "battery", "cooling", "fuel", "inspection"] },
  { id: "pneus",       label: "Pneus",       iconPath: "/icons/tires-summer.png",      ids: ["tires-winter", "tires-summer", "alignment", "bearing"] },
  { id: "mecanique",   label: "Mécanique",   iconPath: "/icons/engine.png",            ids: ["brakes", "engine", "transmission", "suspension", "timing", "clutch", "exhaust"] },
  { id: "carrosserie", label: "Carrosserie", iconPath: "/icons/bodywork.png",          ids: ["bodywork", "glass", "rust", "detailing"] },
  { id: "systemes",    label: "Systèmes",    iconPath: "/icons/electrical.png",        ids: ["ac", "electrical", "ev"] },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtDuration(min: number): string {
  if (min < 60) return `~${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `~${h} h` : `~${h} h ${m} min`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

interface ServiceStat { avgDuration: number; garageCount: number }

function ServiceCard({ cat, stat }: { cat: typeof SERVICE_CATEGORIES[number]; stat: ServiceStat | undefined }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden flex flex-col"
      style={{ boxShadow: "0 2px 10px rgba(11,31,58,0.06)", border: "1px solid #e2e8f0" }}>
      <div className="relative flex-shrink-0 flex items-center justify-center"
        style={{ height: 110, background: "linear-gradient(135deg,#0f2744,#0b1f3a)" }}>
        <img src={cat.iconPath} alt={cat.name} width={64} height={64}
          style={{ filter: "brightness(0) invert(1)", opacity: 0.9 }} />
      </div>
      <div className="p-4 flex-1 flex flex-col gap-3">
        <p className="text-sm font-black" style={{ color: "#0b1f3a" }}>{cat.name}</p>
        <p className="text-xs leading-relaxed flex-1" style={{ color: "#64748b" }}>{cat.description}</p>
        <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl" style={{ background: "#f1f5f9" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base"
            style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
            ⏱
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>Durée estimée</p>
            <p className="text-sm font-black leading-tight" style={{ color: stat ? "#0b1f3a" : "#cbd5e1" }}>
              {stat ? fmtDuration(stat.avgDuration) : "Variable"}
            </p>
          </div>
          {stat && stat.garageCount > 1 && (
            <span className="text-xs flex-shrink-0" style={{ color: "#cbd5e1" }}>{stat.garageCount} garages</span>
          )}
        </div>
        <Link href={`/rechercher?service=${cat.id}`}
          className="block text-center py-2 rounded-xl text-xs font-black transition-all hover:opacity-90"
          style={{ background: "#0b1f3a", color: "white" }}>
          Trouver un garage →
        </Link>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function PrestationsPage() {
  const [stats, setStats]           = useState<Record<string, ServiceStat>>({});
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetch("/api/prestations/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const filter  = FILTERS.find((f) => f.id === activeFilter)!;
  const visible = filter.ids
    ? SERVICE_CATEGORIES.filter((c) => filter.ids!.includes(c.id))
    : SERVICE_CATEGORIES;

  return (
    <main>
      {/* ── Hero ── */}
      <section style={{ background: "#0b1f3a" }} className="py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Tous les services auto<br />
            <span style={{ color: "#f97316" }}>disponibles sur Garago</span>
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
            Durées basées sur les estimations réelles de nos garagistes partenaires.
          </p>
        </div>
      </section>

      {/* ── Filtres sticky ── */}
      <div className="sticky px-4 py-4 z-30"
        style={{ top: 64, background: "#0d2347", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((f) => {
            const active = activeFilter === f.id;
            return (
              <button key={f.id} onClick={() => setActiveFilter(f.id)}
                className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background:   active ? "#f97316" : "rgba(255,255,255,0.07)",
                  color:        active ? "#fff"     : "rgba(255,255,255,0.55)",
                  border:       `2px solid ${active ? "#f97316" : "rgba(255,255,255,0.1)"}`,
                  boxShadow:    active ? "0 4px 15px rgba(249,115,22,0.35)" : "none",
                  transform:    active ? "translateY(-1px)" : "none",
                }}>
                {f.iconPath && (
                  <img src={f.iconPath} alt="" width={16} height={16}
                    style={{ filter: "brightness(0) invert(1)", opacity: active ? 1 : 0.55 }} />
                )}
                {f.label}
                {f.ids && (
                  <span className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-black"
                    style={{ background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)" }}>
                    {f.ids.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Grille ── */}
      <section className="py-10 px-4" style={{ background: "#f8fafc" }}>
        <div className="max-w-6xl mx-auto">
          <p className="text-xs font-semibold mb-6" style={{ color: "#94a3b8" }}>
            {visible.length} prestation{visible.length > 1 ? "s" : ""}
            {filter.ids ? ` · ${filter.label}` : " au total"}
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((cat) => (
              <ServiceCard key={cat.id} cat={cat} stat={stats[cat.id]} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ── */}
      <section className="py-16 px-4" style={{ background: "#0b1f3a" }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#f97316" }}>
            Prêt à réserver ?
          </p>
          <h2 className="text-3xl font-black text-white mb-4">
            Comparez les garages,<br />réservez en ligne.
          </h2>
          <p className="mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
            Avis vérifiés · Prix transparents · Prise de rendez-vous instantanée
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/rechercher"
              className="px-8 py-3.5 rounded-xl text-base font-black text-white transition-all hover:opacity-90"
              style={{ background: "#f97316", boxShadow: "0 4px 20px rgba(249,115,22,0.4)" }}>
              Trouver un garage près de moi →
            </Link>
            <Link href="/inscription/garage"
              className="px-8 py-3.5 rounded-xl text-base font-black transition-all hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.6)", border: "2px solid rgba(255,255,255,0.15)" }}>
              🔧 Inscrire mon garage
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
