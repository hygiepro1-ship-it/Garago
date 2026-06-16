"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { LABOR_CATALOG, estimateQuote, type VehicleClass } from "@/lib/laborTimes";

const DEFAULT_RATE = 90;

const VEHICLE_CLASSES: {
  id: VehicleClass;
  label: string;
  emoji: string;
  examples: string;
}[] = [
  { id: "compact", label: "Compact",    emoji: "🚙", examples: "Yaris, Fit, Rio, Accent…" },
  { id: "regular", label: "Berline",    emoji: "🚗", examples: "Civic, Corolla, Accord…" },
  { id: "suv",     label: "VUS",        emoji: "🚐", examples: "RAV4, CR-V, Rogue, Tucson…" },
  { id: "truck",   label: "Camionnette",emoji: "🛻", examples: "F-150, RAM 1500, Tundra…" },
  { id: "luxury",  label: "Luxe",       emoji: "🏎️", examples: "BMW, Audi, Lexus, Mercedes…" },
];

function fmt(n: number): string {
  return `${n.toLocaleString("fr-CA")} $`;
}

export default function PrestationsPage() {
  const [vehicleClass, setVehicleClass] = useState<VehicleClass>("regular");
  const [minRate, setMinRate] = useState(DEFAULT_RATE);
  const [garageCount, setGarageCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/prestations/prices")
      .then((r) => r.json())
      .then((d) => {
        if (d.minRate > 0) setMinRate(d.minRate);
        if (d.garageCount) setGarageCount(d.garageCount);
      })
      .catch(() => {})
      .finally(() => setLoaded(true));
  }, []);

  const selected = VEHICLE_CLASSES.find((v) => v.id === vehicleClass)!;

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
            Tous nos services auto
            <br />
            <span style={{ color: "#f97316" }}>avec prix estimatifs</span>
          </h1>
          <p
            className="text-lg max-w-2xl mx-auto mb-4"
            style={{ color: "rgba(255,255,255,0.6)" }}
          >
            Consultez nos tarifs indicatifs avant de contacter un garage.
            Sélectionnez votre type de véhicule pour des estimations personnalisées.
          </p>
          {loaded && garageCount > 0 && (
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.35)" }}>
              Prix calculés à partir du taux horaire plancher de nos{" "}
              <strong style={{ color: "rgba(255,255,255,0.5)" }}>
                {garageCount} garages partenaires
              </strong>{" "}
              ({minRate} $/h min)
            </p>
          )}
        </div>
      </section>

      {/* ── Vehicle class selector ────────────────────────────────────────── */}
      <section
        style={{
          background: "#0d2347",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
          position: "sticky",
          top: 64,
          zIndex: 30,
        }}
        className="py-5 px-4"
      >
        <div className="max-w-4xl mx-auto">
          <p
            className="text-center text-xs font-bold uppercase tracking-widest mb-4"
            style={{ color: "rgba(255,255,255,0.4)" }}
          >
            Votre type de véhicule
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {VEHICLE_CLASSES.map((vc) => {
              const active = vehicleClass === vc.id;
              return (
                <button
                  key={vc.id}
                  onClick={() => setVehicleClass(vc.id)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all"
                  style={{
                    background: active ? "#f97316" : "rgba(255,255,255,0.07)",
                    color: active ? "white" : "rgba(255,255,255,0.55)",
                    border: `2px solid ${active ? "#f97316" : "rgba(255,255,255,0.1)"}`,
                    transform: active ? "translateY(-1px)" : "none",
                    boxShadow: active
                      ? "0 4px 15px rgba(249,115,22,0.35)"
                      : "none",
                  }}
                >
                  <span>{vc.emoji}</span>
                  <span>{vc.label}</span>
                </button>
              );
            })}
          </div>
          <p
            className="text-center text-xs mt-3"
            style={{ color: "rgba(255,255,255,0.3)" }}
          >
            ex.&nbsp;{selected.examples}
          </p>
        </div>
      </section>

      {/* ── Service catalog grid ───────────────────────────────────────────── */}
      <section className="py-12 px-4" style={{ background: "#f8fafc" }}>
        <div className="max-w-6xl mx-auto">

          {/* Section label */}
          <div className="flex items-center gap-3 mb-8">
            <div
              className="h-px flex-1"
              style={{ background: "#e2e8f0" }}
            />
            <span
              className="text-xs font-black uppercase tracking-widest px-3"
              style={{ color: "#94a3b8" }}
            >
              {SERVICE_CATEGORIES.length} prestations disponibles
            </span>
            <div
              className="h-px flex-1"
              style={{ background: "#e2e8f0" }}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {SERVICE_CATEGORIES.map((cat) => {
              const quote = LABOR_CATALOG[cat.id]
                ? estimateQuote(cat.id, minRate, vehicleClass)
                : null;

              return (
                <div
                  key={cat.id}
                  className="bg-white rounded-2xl overflow-hidden flex flex-col"
                  style={{
                    boxShadow: "0 2px 12px rgba(11,31,58,0.06)",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  {/* Card header */}
                  <div className="p-5 flex-1">
                    <div className="flex items-start gap-3 mb-4">
                      <span
                        className="text-3xl flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl"
                        style={{ background: "#f1f5f9" }}
                      >
                        {cat.icon}
                      </span>
                      <div>
                        <h2
                          className="font-black text-sm leading-snug"
                          style={{ color: "#0b1f3a" }}
                        >
                          {cat.name}
                        </h2>
                        <p
                          className="text-xs mt-0.5 leading-relaxed"
                          style={{ color: "#64748b" }}
                        >
                          {cat.description}
                        </p>
                      </div>
                    </div>

                    {quote ? (
                      <>
                        {/* Labor & parts breakdown */}
                        <div
                          className="rounded-xl p-3 space-y-2 mb-3"
                          style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}
                        >
                          <div className="flex justify-between items-center">
                            <span className="text-xs" style={{ color: "#64748b" }}>
                              Main-d'œuvre
                            </span>
                            <span
                              className="text-xs font-black"
                              style={{ color: "#0b1f3a" }}
                            >
                              {quote.laborHours} h &nbsp;·&nbsp; {fmt(quote.laborCost)}
                            </span>
                          </div>
                          {(quote.partsMin > 0 || quote.partsMax > 0) && (
                            <div className="flex justify-between items-center">
                              <span className="text-xs" style={{ color: "#64748b" }}>
                                Pièces (estim.)
                              </span>
                              <span
                                className="text-xs font-black"
                                style={{ color: "#0b1f3a" }}
                              >
                                {fmt(quote.partsMin)} – {fmt(quote.partsMax)}
                              </span>
                            </div>
                          )}
                          {quote.note && (
                            <p
                              className="text-xs italic pt-1"
                              style={{
                                color: "#94a3b8",
                                borderTop: "1px solid #e2e8f0",
                              }}
                            >
                              {quote.note}
                            </p>
                          )}
                        </div>

                        {/* Total */}
                        <div
                          className="rounded-xl p-3"
                          style={{ background: "#fff4ed" }}
                        >
                          <div className="flex items-baseline justify-between">
                            <span
                              className="text-xs font-black uppercase tracking-wide"
                              style={{ color: "#ea580c" }}
                            >
                              À partir de
                            </span>
                            <span
                              className="text-2xl font-black"
                              style={{ color: "#f97316" }}
                            >
                              {fmt(quote.totalMin)}
                            </span>
                          </div>
                          {quote.totalMax > quote.totalMin && (
                            <p
                              className="text-xs text-right mt-0.5"
                              style={{ color: "#fb923c" }}
                            >
                              jusqu'à&nbsp;{fmt(quote.totalMax)}
                            </p>
                          )}
                        </div>
                      </>
                    ) : (
                      <div
                        className="rounded-xl p-4 border-2 border-dashed text-center"
                        style={{ borderColor: "#e2e8f0" }}
                      >
                        <p
                          className="text-sm font-black"
                          style={{ color: "#475569" }}
                        >
                          Prix sur devis
                        </p>
                        <p
                          className="text-xs mt-1"
                          style={{ color: "#94a3b8" }}
                        >
                          Tarif variable selon l'étendue du travail
                        </p>
                      </div>
                    )}
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

          {/* Disclaimer */}
          <div
            className="mt-10 p-5 rounded-2xl"
            style={{ background: "#fef3c7", border: "1px solid #fde68a" }}
          >
            <p
              className="text-sm font-black mb-1"
              style={{ color: "#92400e" }}
            >
              ⚠️ Estimations indicatives seulement
            </p>
            <p className="text-xs leading-relaxed" style={{ color: "#a16207" }}>
              Les prix affichés sont calculés à partir du taux horaire plancher de nos garages
              partenaires et de barèmes de main-d'œuvre standards pour le Québec. Ils peuvent
              varier selon le garage, l'état de votre véhicule et les pièces réellement
              nécessaires.&nbsp;
              <strong>Obtenez toujours un devis écrit avant d'autoriser les réparations.</strong>
              &nbsp;Les pièces sont estimées à titre indicatif et ne proviennent pas d'un catalogue
              certifié.
            </p>
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ────────────────────────────────────────────────────── */}
      <section
        className="py-16 px-4"
        style={{ background: "#0b1f3a" }}
      >
        <div className="max-w-2xl mx-auto text-center">
          <p
            className="text-xs font-black uppercase tracking-widest mb-3"
            style={{ color: "#f97316" }}
          >
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
              style={{
                background: "#f97316",
                boxShadow: "0 4px 20px rgba(249,115,22,0.4)",
              }}
            >
              Trouver un garage près de moi →
            </Link>
            <Link
              href="/inscription/garage"
              className="px-8 py-3.5 rounded-xl text-base font-black transition-all hover:opacity-80"
              style={{
                color: "rgba(255,255,255,0.6)",
                border: "2px solid rgba(255,255,255,0.15)",
              }}
            >
              🔧 Inscrire mon garage
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
