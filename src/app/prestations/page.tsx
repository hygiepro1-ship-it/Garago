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

function fmtDuration(min: number): string {
  if (min < 60) return `~${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m === 0 ? `~${h} h` : `~${h} h ${m} min`;
}

export default function PrestationsPage() {
  const [stats, setStats] = useState<Record<string, { avgDuration: number; garageCount: number }>>({});

  useEffect(() => {
    fetch("/api/prestations/stats")
      .then((r) => r.json())
      .then(setStats)
      .catch(() => {});
  }, []);

  return (
    <main>
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section style={{ background: "#0b1f3a" }} className="py-16 px-4">
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
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "rgba(255,255,255,0.6)" }}>
            Trouvez le bon garage pour chaque besoin. Les durées affichées sont calculées
            à partir des estimations réelles de nos garagistes partenaires.
          </p>
        </div>
      </section>

      {/* ── Service catalog grid ───────────────────────────────────────────── */}
      <section className="py-12 px-4" style={{ background: "#f8fafc" }}>
        <div className="max-w-6xl mx-auto">

          <div className="flex items-center gap-3 mb-8">
            <div className="h-px flex-1" style={{ background: "#e2e8f0" }} />
            <span className="text-xs font-black uppercase tracking-widest px-3" style={{ color: "#94a3b8" }}>
              {SERVICE_CATEGORIES.length} prestations disponibles
            </span>
            <div className="h-px flex-1" style={{ background: "#e2e8f0" }} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICE_CATEGORIES.map((cat) => {
              const s = stats[cat.id];
              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl overflow-hidden flex flex-col"
                  style={{ boxShadow: "0 2px 12px rgba(11,31,58,0.06)", border: "1px solid #e2e8f0" }}
                >
                  {/* Photo */}
                  <div
                    className="relative overflow-hidden flex-shrink-0"
                    style={{ height: 160, background: "linear-gradient(135deg, #1e3a5f 0%, #0b1f3a 100%)" }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center text-6xl" style={{ opacity: 0.18 }}>
                      {cat.icon}
                    </div>
                    {SERVICE_IMAGES[cat.id] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://source.unsplash.com/${SERVICE_IMAGES[cat.id]}/800x450`}
                        alt={cat.name}
                        loading="lazy"
                        className="absolute inset-0 w-full h-full"
                        style={{ objectFit: "cover", opacity: 0, transition: "opacity 0.4s ease" }}
                        onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "1"; }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    <div
                      className="absolute inset-x-0 bottom-0 pointer-events-none"
                      style={{ height: 60, background: "linear-gradient(to top, rgba(0,0,0,0.45), transparent)" }}
                    />
                    <div
                      className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-black"
                      style={{ background: "rgba(255,255,255,0.92)", color: "#0b1f3a", backdropFilter: "blur(4px)" }}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.name}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <div className="p-5 flex-1 flex flex-col gap-4">
                    <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                      {cat.description}
                    </p>

                    {/* Durée moyenne */}
                    <div
                      className="rounded-xl px-4 py-3 flex items-center justify-between"
                      style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                    >
                      <span className="text-xs font-semibold" style={{ color: "#64748b" }}>
                        ⏱ Durée moyenne
                      </span>
                      {s ? (
                        <div className="text-right">
                          <span className="text-sm font-black" style={{ color: "#0b1f3a" }}>
                            {fmtDuration(s.avgDuration)}
                          </span>
                          <p className="text-xs" style={{ color: "#94a3b8" }}>
                            selon {s.garageCount} garagiste{s.garageCount > 1 ? "s" : ""}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs font-semibold" style={{ color: "#94a3b8" }}>Variable</span>
                      )}
                    </div>
                  </div>

                  {/* CTA */}
                  <div className="px-5 pb-5">
                    <Link
                      href={`/rechercher?service=${cat.id}`}
                      className="block text-center py-2.5 rounded-xl text-sm font-black transition-all hover:opacity-90 active:scale-95"
                      style={{ background: "#0b1f3a", color: "white" }}
                    >
                      Trouver un garage&nbsp;→
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section className="py-16 px-4" style={{ background: "#0b1f3a" }}>
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-xs font-black uppercase tracking-widest mb-3" style={{ color: "#f97316" }}>
            Prêt à réserver ?
          </p>
          <h2 className="text-3xl font-black text-white mb-4">
            Comparez les garages,
            <br />
            réservez en ligne.
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
