"use client";

import { useState } from "react";

// Calculateur : le garagiste entre ses propres chiffres, aucune statistique externe n'est présumée.
export default function CoutAbsences() {
  const [parSemaine, setParSemaine] = useState(40);
  const [taux, setTaux] = useState(10);
  const [valeur, setValeur] = useState(150);

  const manquesParSemaine = (parSemaine * taux) / 100;
  const perteAnnuelle = manquesParSemaine * valeur * 50; // 50 semaines ouvrées

  const fmt = (n: number) => new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 0 }).format(n);
  const field = "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base bg-white text-gray-900";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-black" style={{ color: "#0b1f3a" }}>Calculez ce que vos absences vous coûtent</h3>
      <p className="mt-1 text-sm text-gray-600">Entrez vos propres chiffres : rien n&apos;est envoyé, le calcul se fait sur cette page.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <label className="block text-sm font-semibold text-gray-700">
          Rendez-vous par semaine
          <input type="number" inputMode="numeric" min={1} max={1000} className={field + " mt-1"}
            value={parSemaine} onChange={(e) => setParSemaine(Math.max(0, Number(e.target.value) || 0))} />
        </label>
        <label className="block text-sm font-semibold text-gray-700">
          Taux d&apos;absence (%)
          <input type="number" inputMode="numeric" min={0} max={100} className={field + " mt-1"}
            value={taux} onChange={(e) => setTaux(Math.min(100, Math.max(0, Number(e.target.value) || 0)))} />
        </label>
        <label className="block text-sm font-semibold text-gray-700">
          Valeur moyenne d&apos;un rendez-vous ($)
          <input type="number" inputMode="numeric" min={0} className={field + " mt-1"}
            value={valeur} onChange={(e) => setValeur(Math.max(0, Number(e.target.value) || 0))} />
        </label>
      </div>
      <div className="mt-5 rounded-xl p-4" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }} role="status" aria-live="polite">
        <p className="text-sm text-gray-700">
          Environ <strong>{fmt(manquesParSemaine)}</strong> rendez-vous manqué{manquesParSemaine >= 2 ? "s" : ""} par semaine, soit une perte
          d&apos;environ <strong style={{ color: "#c2410c" }}>{fmt(perteAnnuelle)} $ par année</strong> (sur 50 semaines).
        </p>
        <p className="mt-1 text-xs text-gray-500">
          Vous ne connaissez pas votre taux ? Divisez les clients absents par le nombre de rendez-vous pris sur trois mois.
        </p>
      </div>
    </div>
  );
}
