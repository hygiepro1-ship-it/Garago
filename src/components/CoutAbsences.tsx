"use client";

import { useState } from "react";

// Taux d'absence : fourchette citée pour les garages indépendants qui n'envoient ni rappel ni confirmation
// (Car Spot, guide de gestion des rendez-vous de garage). C'est une estimation d'éditeur, pas une statistique
// officielle : le garagiste ne saisit donc pas son propre taux, que la plupart ne connaissent pas précisément.
const TAUX_BAS = 10;
const TAUX_HAUT = 15;
const SEMAINES = 50;

const T = {
  fr: {
    title: "Estimez ce que les rendez-vous manqués peuvent vous coûter",
    intro: (lo: number, hi: number) => `Indiquez votre volume et la valeur d'un rendez-vous. Le calcul utilise la fourchette de ${lo} à ${hi} % citée pour les garages qui n'envoient ni rappel ni confirmation. Rien n'est envoyé : le calcul se fait sur cette page.`,
    perWeek: "Rendez-vous par semaine", value: "Valeur moyenne d'un rendez-vous ($)",
    between: "Entre", and: "et", missed: "rendez-vous manqués par semaine, soit une perte d'environ",
    perYear: (a: string, b: string) => `${a} $ à ${b} $ par année`, weeks: (n: number) => `(sur ${n} semaines).`,
    note: "Estimation d'un éditeur de logiciel (France) pour les garages indépendants sans rappel ni confirmation ; il n'existe pas, à notre connaissance, de statistique indépendante pour le Québec. Source :",
    real: "Votre taux réel peut être plus bas ou plus élevé.", locale: "fr-CA",
  },
  en: {
    title: "Estimate what missed appointments may cost you",
    intro: (lo: number, hi: number) => `Enter your volume and the value of an appointment. The calculation uses the ${lo} to ${hi}% range cited for shops that send no reminder or confirmation. Nothing is sent: the calculation happens on this page.`,
    perWeek: "Appointments per week", value: "Average value of an appointment ($)",
    between: "Between", and: "and", missed: "missed appointments per week, a loss of about",
    perYear: (a: string, b: string) => `$${a} to $${b} per year`, weeks: (n: number) => `(over ${n} weeks).`,
    note: "Estimate from a software publisher (France) for independent shops with no reminder or confirmation; to our knowledge, there is no independent statistic for Quebec. Source:",
    real: "Your actual rate may be lower or higher.", locale: "en-CA",
  },
} as const;

export default function CoutAbsences({ lang = "fr" }: { lang?: "fr" | "en" }) {
  const [parSemaine, setParSemaine] = useState(40);
  const [valeur, setValeur] = useState(150);
  const t = T[lang];

  const perte = (taux: number) => (parSemaine * taux) / 100 * valeur * SEMAINES;
  const fmt = (n: number) => new Intl.NumberFormat(t.locale, { maximumFractionDigits: 0 }).format(n);
  const field = "w-full border border-gray-300 rounded-xl px-3 py-2.5 text-base bg-white text-gray-900";

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6">
      <h3 className="text-lg font-black" style={{ color: "#0b1f3a" }}>{t.title}</h3>
      <p className="mt-1 text-sm text-gray-600">{t.intro(TAUX_BAS, TAUX_HAUT)}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-semibold text-gray-700">
          {t.perWeek}
          <input type="number" inputMode="numeric" min={1} max={1000} className={field + " mt-1"}
            value={parSemaine} onChange={(e) => setParSemaine(Math.max(0, Number(e.target.value) || 0))} />
        </label>
        <label className="block text-sm font-semibold text-gray-700">
          {t.value}
          <input type="number" inputMode="numeric" min={0} className={field + " mt-1"}
            value={valeur} onChange={(e) => setValeur(Math.max(0, Number(e.target.value) || 0))} />
        </label>
      </div>
      <div className="mt-5 rounded-xl p-4" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }} role="status" aria-live="polite">
        <p className="text-sm text-gray-700">
          {t.between} <strong>{fmt((parSemaine * TAUX_BAS) / 100)}</strong> {t.and} <strong>{fmt((parSemaine * TAUX_HAUT) / 100)}</strong> {t.missed}{" "}
          <strong style={{ color: "#c2410c" }}>{t.perYear(fmt(perte(TAUX_BAS)), fmt(perte(TAUX_HAUT)))}</strong> {t.weeks(SEMAINES)}
        </p>
        <p className="mt-2 text-xs text-gray-500">
          {t.note}{" "}
          <a href="https://car-spot.io/fr/guides/how-to-manage-garage-appointments" target="_blank" rel="noopener noreferrer" className="underline">Car Spot</a>.{" "}
          {t.real}
        </p>
      </div>
    </div>
  );
}
