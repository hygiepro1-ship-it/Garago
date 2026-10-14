"use client";

import { useState } from "react";

// Taux d'absence : fourchette citée pour les garages indépendants qui n'envoient ni rappel ni confirmation
// (Car Spot, guide de gestion des rendez-vous de garage). C'est une estimation d'éditeur, pas une statistique
// officielle : le garagiste ne saisit donc pas son propre taux, que la plupart ne connaissent pas précisément.
const TAUX_BAS = 10;
const TAUX_HAUT = 15;
const SEMAINES = 50;

export default function CoutAbsences() {
  const [parSemaine, setParSemaine] = useState(40);
  const [valeur, setValeur] = useState(150);

  const perte = (taux: number) => (parSemaine * taux) / 100 * valeur * SEMAINES;
  const fmt = (n: number) => new Intl.NumberFormat("fr-CA", { maximumFractionDigits: 0 }).format(n);
  const field = "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base bg-white text-gray-900";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-black" style={{ color: "#0b1f3a" }}>Estimez ce que les rendez-vous manqués peuvent vous coûter</h3>
      <p className="mt-1 text-sm text-gray-600">
        Indiquez votre volume et la valeur d&apos;un rendez-vous. Le calcul utilise la fourchette de {TAUX_BAS} à {TAUX_HAUT} % citée
        pour les garages qui n&apos;envoient ni rappel ni confirmation. Rien n&apos;est envoyé : le calcul se fait sur cette page.
      </p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-gray-700">
          Rendez-vous par semaine
          <input type="number" inputMode="numeric" min={1} max={1000} className={field + " mt-1"}
            value={parSemaine} onChange={(e) => setParSemaine(Math.max(0, Number(e.target.value) || 0))} />
        </label>
        <label className="block text-sm font-semibold text-gray-700">
          Valeur moyenne d&apos;un rendez-vous ($)
          <input type="number" inputMode="numeric" min={0} className={field + " mt-1"}
            value={valeur} onChange={(e) => setValeur(Math.max(0, Number(e.target.value) || 0))} />
        </label>
      </div>
      <div className="mt-5 rounded-xl p-4" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }} role="status" aria-live="polite">
        <p className="text-sm text-gray-700">
          Entre <strong>{fmt((parSemaine * TAUX_BAS) / 100)}</strong> et <strong>{fmt((parSemaine * TAUX_HAUT) / 100)}</strong> rendez-vous
          manqués par semaine, soit une perte d&apos;environ{" "}
          <strong style={{ color: "#c2410c" }}>{fmt(perte(TAUX_BAS))} $ à {fmt(perte(TAUX_HAUT))} $ par année</strong> (sur {SEMAINES} semaines).
        </p>
        <p className="mt-2 text-xs text-gray-500">
          Estimation d&apos;un éditeur de logiciel (France) pour les garages indépendants sans rappel ni confirmation ; il n&apos;existe pas,
          à notre connaissance, de statistique indépendante pour le Québec. Source :{" "}
          <a href="https://car-spot.io/fr/guides/how-to-manage-garage-appointments" target="_blank" rel="noopener noreferrer" className="underline">Car Spot</a>.
          Votre taux réel peut être plus bas ou plus élevé.
        </p>
      </div>
    </div>
  );
}
