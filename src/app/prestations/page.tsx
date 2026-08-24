"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SERVICE_CATEGORIES } from "@/lib/services";

const SERVICE_IMAGES: Record<string, string> = {
  "oil":          "V37iTrYZz2E",
  "tires-winter": "lJ5_wZ2nkeI",
  "tires-summer": "yqsgL2wKEHA",
  "brakes":       "ii4XEyJEm_I",
  "ac":           "UZUzvJEvKnI",
  "engine":       "eyPlv3Mxk8g",
  "inspection":   "4eHREaM5_CA",
  "battery":      "cpkUK_YD_zs",
  "transmission": "pbH2moaClEs",
  "bodywork":     "pqGgKSaKTyc",
  "alignment":    "PNjW3W8Zfa8",
  "suspension":   "OOY5kdikxF8",
  "electrical":   "dPt-X-KVAjA",
  "exhaust":      "I74mkR_3OP0",
  "cooling":      "sk6fOQYIO1o",
  "detailing":    "JyycY7jyJr0",
  "ev":           "EfbAELIole8",
  "glass":        "r_ioI9YsrEc",
  "timing":       "6bTHShbYDhY",
  "clutch":       "pbH2moaClEs",
  "preventive":   "GIPmXkRNsro",
  "bearing":      "al01Ad0f_KI",
  "fuel":         "qy27JnsH9sU",
  "rust":         "f_ztFPZM50c",
};

// Groupes de filtres
const FILTERS = [
  { id: "all",       label: "Tout",           ids: null },
  { id: "entretien", label: "🔧 Entretien",    ids: ["oil", "preventive", "battery", "cooling", "fuel", "inspection"] },
  { id: "pneus",     label: "🔄 Pneus",        ids: ["tires-winter", "tires-summer", "alignment", "bearing"] },
  { id: "mecanique", label: "⚙️ Mécanique",   ids: ["brakes", "engine", "transmission", "suspension", "timing", "clutch", "exhaust"] },
  { id: "carrosserie",label: "🚗 Carrosserie", ids: ["bodywork", "glass", "rust", "detailing"] },
  { id: "systemes",  label: "⚡ Systèmes",     ids: ["ac", "electrical", "ev"] },
];

function fmtDuration(min: number): string {
  if (min < 60) return `~${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `~${h} h` : `~${h} h ${m} min`;
}

export default function PrestationsPage() {
  const [stats, setStats] = useState<Record<string, { avgDuration: number; garageCount: number }>>({});
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    fetch("/api/prestations/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  const filter = FILTERS.find((f) => f.id === activeFilter)!;
  const visible = filter.ids
    ? SERVICE_CATEGORIES.filter((c) => filter.ids!.includes(c.id))
    : SERVICE_CATEGORIES;

  return (
    <main>
      {/* ── Hero ── */}
      <section style={{ background: "#0b1f3a" }} className="py-14 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <span
            className="inline-block text-xs font-black uppercase tracking-widest px-3 py-1 rounded-full mb-5"
            style={{ background: "rgba(249,115,22,0.15)", color: "#f97316" }}
          >
            🔧 Catalogue de prestations
          </span>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 leading-tight">
            Tous les services auto
            <br />
            <span style={{ color: "#f97316" }}>disponibles sur Garago</span>
          </h1>
          <p className="text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.55)" }}>
            Durées basées sur les estimations réelles de nos garagistes partenaires.
          </p>
        </div>
      </section>

      {/* ── Filtres sticky ── */}
      <div
        className="sticky px-4 py-4 z-30"
        style={{ top: 64, background: "#0d2347", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="max-w-6xl mx-auto flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {FILTERS.map((f) => {
            const active = activeFilter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setActiveFilter(f.id)}
                className="flex-shrink-0 px-4 py-2 rounded-xl text-sm font-bold transition-all"
                style={{
                  background: active ? "#f97316" : "rgba(255,255,255,0.07)",
                  color: active ? "#fff" : "rgba(255,255,255,0.55)",
                  border: `2px solid ${active ? "#f97316" : "rgba(255,255,255,0.1)"}`,
                  boxShadow: active ? "0 4px 15px rgba(249,115,22,0.35)" : "none",
                  transform: active ? "translateY(-1px)" : "none",
                }}
              >
                {f.label}
                {f.ids && (
                  <span
                    className="ml-1.5 text-xs px-1.5 py-0.5 rounded-full font-black"
                    style={{ background: active ? "rgba(255,255,255,0.2)" : "rgba(255,255,255,0.1)" }}
                  >
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
            {filter.ids ? ` · ${filter.label.replace(/^[^\s]+\s/, "")}` : " au total"}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {visible.map((cat) => {
              const s = stats[cat.id];
              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl overflow-hidden flex flex-col"
                  style={{ boxShadow: "0 2px 10px rgba(11,31,58,0.06)", border: "1px solid #e2e8f0" }}
                >
                  {/* Photo compacte */}
                  <div
                    className="relative flex-shrink-0"
                    style={{ height: 120, background: "linear-gradient(135deg,#1e3a5f,#0b1f3a)" }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-5xl" style={{ opacity: 0.15 }}>
                      {cat.icon}
                    </div>
                    {SERVICE_IMAGES[cat.id] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://source.unsplash.com/${SERVICE_IMAGES[cat.id]}/600x300`}
                        alt={cat.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full"
                        style={{ objectFit: "cover", opacity: 0, transition: "opacity 0.4s" }}
                        onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.75"; }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <div
                      className="absolute inset-x-0 bottom-0"
                      style={{ height: 50, background: "linear-gradient(to top,rgba(0,0,0,0.5),transparent)" }}
                    />
                    <div
                      className="absolute bottom-2.5 left-3 flex items-center gap-1.5 text-xs font-black"
                      style={{ color: "#fff", textShadow: "0 1px 3px rgba(0,0,0,0.5)" }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>
                  </div>

                  {/* Description + durée + CTA */}
                  <div className="p-4 flex-1 flex flex-col gap-3">
                    <p className="text-xs leading-relaxed flex-1" style={{ color: "#64748b" }}>
                      {cat.description}
                    </p>

                    {/* Durée */}
                    <div className="flex items-center gap-3 py-2.5 px-3 rounded-xl" style={{ background: "#f1f5f9" }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 text-base" style={{ background: "#fff", border: "1px solid #e2e8f0" }}>
                        ⏱
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold" style={{ color: "#94a3b8" }}>Durée estimée</p>
                        <p className="text-sm font-black leading-tight" style={{ color: s ? "#0b1f3a" : "#cbd5e1" }}>
                          {s ? fmtDuration(s.avgDuration) : "Variable"}
                        </p>
                      </div>
                      {s && s.garageCount > 1 && (
                        <span className="text-xs flex-shrink-0" style={{ color: "#cbd5e1" }}>
                          {s.garageCount} garages
                        </span>
                      )}
                    </div>

                    <Link
                      href={`/rechercher?service=${cat.id}`}
                      className="block text-center py-2 rounded-xl text-xs font-black transition-all hover:opacity-90"
                      style={{ background: "#0b1f3a", color: "white" }}
                    >
                      Trouver un garage →
                    </Link>
                  </div>
                </div>
              );
            })}
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
            <Link
              href="/rechercher"
              className="px-8 py-3.5 rounded-xl text-base font-black text-white transition-all hover:opacity-90"
              style={{ background: "#f97316", boxShadow: "0 4px 20px rgba(249,115,22,0.4)" }}
            >
              Trouver un garage près de moi →
            </Link>
            <Link
              href="/inscription/garage"
              className="px-8 py-3.5 rounded-xl text-base font-black transition-all hover:opacity-80"
              style={{ color: "rgba(255,255,255,0.6)", border: "2px solid rgba(255,255,255,0.15)" }}
            >
              🔧 Inscrire mon garage
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
