"use client";

// Avis sur Garago, depuis le lien des rappels de rendez-vous (texto et courriel).
// ?l=en : en anglais. ?r=<jeton> : le rendez-vous d'où vient l'avis (courriel seulement).

import { useState } from "react";

const T = {
  fr: {
    title: "Votre avis sur Garago",
    sub: "Votre garage utilise Garago pour ses rendez-vous et ses rappels. Votre avis nous aide à l'améliorer.",
    q1: "Que pensez-vous des rappels de rendez-vous ?",
    stars: ["Pas du tout utiles", "Peu utiles", "Corrects", "Utiles", "Très utiles"],
    q2: "Ce que vous aimez, ou ce qu'on pourrait faire mieux (facultatif)",
    ph: "Ex. le rappel 48 h avant m'a évité d'oublier, j'aimerais aussi…",
    send: "Envoyer mon avis", pick: "Choisissez une note.", err: "Envoi impossible. Réessayez.",
    thanks: "Merci pour votre avis !", thanksSub: "Il est bien arrivé chez l'équipe Garago.",
  },
  en: {
    title: "Your opinion of Garago",
    sub: "Your garage uses Garago for its appointments and reminders. Your opinion helps us improve it.",
    q1: "What do you think of the appointment reminders?",
    stars: ["Not useful at all", "Not very useful", "OK", "Useful", "Very useful"],
    q2: "What you like, or what we could do better (optional)",
    ph: "E.g. the reminder 48 h before kept me from forgetting, I would also like…",
    send: "Send my opinion", pick: "Choose a rating.", err: "Could not send. Please try again.",
    thanks: "Thank you for your opinion!", thanksSub: "The Garago team has received it.",
  },
};

export default function AvisForm({ lang, token }: { lang: "fr" | "en"; token: string | null }) {
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [hp, setHp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const t = T[lang];

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!rating) { setError(t.pick); return; }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/avis", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment, r: token, _hp: hp }),
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
    <main className="min-h-[70vh] px-4 py-10" style={{ background: "#f8fafc" }} lang={lang}>
      <div className="max-w-lg mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm p-5 sm:p-8">
        {done ? (
          <div className="text-center py-6" role="status">
            <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center rounded-full" style={{ background: "#ecfdf5" }}>
              <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6L9 17l-5-5" /></svg>
            </div>
            <h1 className="text-xl font-extrabold text-gray-900 mb-1">{t.thanks}</h1>
            <p className="text-sm text-gray-500">{t.thanksSub}</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 mb-1">{t.title}</h1>
              <p className="text-sm text-gray-500 leading-relaxed">{t.sub}</p>
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
