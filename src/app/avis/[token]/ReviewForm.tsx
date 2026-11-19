"use client";

// Formulaire de note du garage (voir page.tsx). L'avis paraît sur la fiche du garage dans Garago,
// marqué « vérifié » puisqu'il vient d'un rendez-vous terminé.

import { useState } from "react";
import Link from "next/link";

const T = {
  fr: {
    title: (g: string) => `Comment s'est passée votre visite chez ${g} ?`,
    sub: "Votre note paraît sur la fiche du garage dans Garago et aide d'autres conducteurs à choisir. Seuls votre prénom et l'initiale de votre nom sont affichés.",
    again: "Vous avez déjà noté ce garage. Vous pouvez modifier votre avis.",
    q1: "Votre note",
    stars: ["Très déçu", "Déçu", "Correct", "Satisfait", "Très satisfait"],
    q2: "Votre commentaire (facultatif)",
    ph: "Ex. accueil, respect des délais, prix, qualité du travail…",
    send: "Publier mon avis", pick: "Choisissez une note.", err: "Envoi impossible. Réessayez.",
    thanks: "Merci pour votre avis !", thanksSub: "Il paraît maintenant sur la fiche du garage.", see: "Voir la fiche du garage",
    service: "Service",
  },
  en: {
    title: (g: string) => `How was your visit to ${g}?`,
    sub: "Your rating appears on the garage's Garago page and helps other drivers choose. Only your first name and last initial are shown.",
    again: "You have already rated this garage. You can change your review.",
    q1: "Your rating",
    stars: ["Very disappointed", "Disappointed", "OK", "Satisfied", "Very satisfied"],
    q2: "Your comment (optional)",
    ph: "E.g. welcome, timing, price, quality of the work…",
    send: "Publish my review", pick: "Choose a rating.", err: "Could not send. Please try again.",
    thanks: "Thank you for your review!", thanksSub: "It now appears on the garage's page.", see: "See the garage's page",
    service: "Service",
  },
};

export default function ReviewForm(props: {
  token: string; lang: "fr" | "en"; garageName: string; garageSlug: string; serviceName: string | null;
  initialRating: number; initialComment: string; alreadyReviewed: boolean;
}) {
  const [rating, setRating] = useState(props.initialRating);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState(props.initialComment);
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const t = T[props.lang];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { setError(t.pick); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/reviews/rdv", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: props.token, rating, comment, _hp: hp }),
      });
      if (!res.ok) { const d = await res.json().catch(() => ({})); setError(d.error ?? t.err); return; }
      setDone(true);
    } catch {
      setError(t.err);
    } finally {
      setBusy(false);
    }
  }

  const shown = hover || rating;
  return (
    <main className="min-h-[70vh] px-4 py-10" style={{ background: "#f8fafc" }} lang={props.lang}>
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-8">
        {done ? (
          <div className="text-center py-6" role="status">
            <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ background: "#ecfdf5" }}>
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 mb-1">{t.thanks}</h1>
            <p className="text-sm text-gray-500 mb-5">{t.thanksSub}</p>
            <Link href={`/garage/${props.garageSlug}`} className="inline-block font-bold text-sm rounded-xl px-4 py-2.5 border border-gray-200 text-gray-800 hover:bg-gray-50">{t.see}</Link>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{t.title(props.garageName)}</h1>
              {props.serviceName && <p className="text-sm text-gray-700 mb-2">{t.service} : {props.serviceName}</p>}
              <p className="text-sm text-gray-500 leading-relaxed">{t.sub}</p>
              {props.alreadyReviewed && <p className="text-sm text-gray-700 mt-2 font-semibold">{t.again}</p>}
            </div>

            <div style={{ position: "absolute", left: "-9999px" }} aria-hidden="true">
              <input type="text" tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
            </div>

            <fieldset>
              <legend className="block text-sm font-semibold text-gray-800 mb-2">{t.q1}</legend>
              <div className="flex gap-1" role="radiogroup" aria-label={t.q1} onMouseLeave={() => setHover(0)}>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n}/5 · ${t.stars[n - 1]}`}
                    onClick={() => { setRating(n); setError(""); }} onMouseEnter={() => setHover(n)}
                    className="w-11 h-11 flex items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400">
                    <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true"
                      fill={n <= shown ? "#f59e0b" : "none"} stroke={n <= shown ? "#f59e0b" : "#cbd5e1"} strokeWidth={1.5} strokeLinejoin="round">
                      <path d="M12 2.5l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.4l-5.9 3.1 1.2-6.5L2.5 9.4l6.6-.9z" />
                    </svg>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-1 min-h-[1rem]" aria-live="polite">{shown ? t.stars[shown - 1] : ""}</p>
            </fieldset>

            <div>
              <label htmlFor="avis-comment" className="block text-sm font-semibold text-gray-800 mb-1.5">{t.q2}</label>
              <textarea id="avis-comment" rows={4} maxLength={2000} value={comment} onChange={(e) => setComment(e.target.value)} placeholder={t.ph}
                className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-orange-400" />
            </div>

            {error && <p className="text-sm font-semibold text-red-600" role="alert">{error}</p>}

            <button type="submit" disabled={busy} className="w-full text-white font-bold rounded-xl py-3 disabled:opacity-60" style={{ background: "#e0600c" }}>
              {busy ? "…" : t.send}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
