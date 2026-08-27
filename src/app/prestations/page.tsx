"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SERVICE_CATEGORIES } from "@/lib/services";

// IDs Unsplash (format images.unsplash.com/photo-{id}) — photos réalistes de pièces auto
const SERVICE_IMAGES: Record<string, string> = {
  "brakes":       "photo-1558618666-fcd25c85cd64", // disque de frein en gros plan
  "tires-winter": "photo-1548549557-dbe9946621da", // pneu neige bande de roulement
  "tires-summer": "photo-1611269154421-4e27233ac5c5", // pneu été
  "oil":          "photo-1635073942126-e84b48fdeeff", // huile moteur versée
  "engine":       "photo-1581092921461-eab62e97a780", // bloc moteur
  "battery":      "photo-1620714223084-8fcacc2dbe2d", // batterie voiture
  "ac":           "photo-1581091226033-d5c48150dbaa", // compresseur AC
  "transmission": "photo-1492144534655-ae79c964c9d7", // boîte de vitesses
  "suspension":   "photo-1609521263047-f8f205293f24", // amortisseur
  "inspection":   "photo-1625047509168-a7026f36de04", // mécanicien inspection
  "alignment":    "photo-1503376780353-7e6692767b70", // parallélisme roues
  "electrical":   "photo-1537984822441-cff330075342", // faisceau électrique
  "exhaust":      "photo-1558618047-3c0b2c9a4b2a", // ligne d'échappement
  "cooling":      "photo-1612544448445-b8232cff3b6c", // radiateur
  "bodywork":     "photo-1606813907291-d86efa9b94db", // carrosserie
  "detailing":    "photo-1558244402-286dd748c592", // polish carrosserie
  "ev":           "photo-1593941707882-a5bba14938c7", // prise recharge VE
  "glass":        "photo-1544636331-e26879cd4d9b", // pare-brise fêlé
  "timing":       "photo-1517524206127-48bbd363f3d7", // courroie de distribution
  "clutch":       "photo-1609630875171-b1321377ee65", // embrayage
  "preventive":   "photo-1486262715619-67b85e0b08d3", // entretien préventif
  "bearing":      "photo-1596742578443-7682ef5251cd", // roulement de roue
  "fuel":         "photo-1599256871679-69dc22f37e05", // injecteur carburant
  "rust":         "photo-1619683547237-54d9bf2d63c6", // traitement antirouille
  "diagnostic":   "photo-1563207153-f403bf289096", // valise diagnostic OBD
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
      <style>{`
        .prestation-card:hover .prestation-photo { transform: scale(1.07); }
        .prestation-photo { transition: opacity 0.4s, transform 0.5s ease; }
      `}</style>
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
                  className="prestation-card bg-white rounded-2xl overflow-hidden flex flex-col"
                  style={{ boxShadow: "0 2px 10px rgba(11,31,58,0.06)", border: "1px solid #e2e8f0" }}
                >
                  {/* Photo */}
                  <div
                    className="relative flex-shrink-0 overflow-hidden"
                    style={{ height: 180, background: "linear-gradient(135deg,#1e3a5f,#0b1f3a)" }}
                  >
                    {SERVICE_IMAGES[cat.id] && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`https://images.unsplash.com/${SERVICE_IMAGES[cat.id]}?w=600&h=360&fit=crop&q=80&auto=format`}
                        alt={cat.name}
                        loading="lazy"
                        className="prestation-photo absolute inset-0 w-full h-full"
                        style={{ objectFit: "cover", opacity: 0 }}
                        onLoad={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.85"; }}
                        onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                      />
                    )}
                    {/* Badge glass top-left */}
                    <div
                      className="absolute top-3 left-3 flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-black"
                      style={{
                        background: "rgba(0,0,0,0.45)",
                        backdropFilter: "blur(8px)",
                        color: "#fff",
                        border: "1px solid rgba(255,255,255,0.15)",
                      }}
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
