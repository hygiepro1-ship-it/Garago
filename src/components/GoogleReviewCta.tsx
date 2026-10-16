"use client";

import { useLang } from "@/contexts/LanguageContext";
import { GOOGLE_REVIEW_URL } from "@/lib/google-business";

const TEXT = {
  drivers: {
    fr: { title: "Garago vous a été utile ?", text: "Un avis sur Google aide d'autres conducteurs à trouver leur garage facilement.", button: "Laisser un avis sur Google" },
    en: { title: "Did Garago help you?", text: "A Google review helps other drivers find their garage easily.", button: "Leave a Google review" },
  },
  garages: {
    fr: { title: "Vous aimez Garago ?", text: "Votre avis sur Google aide d'autres garagistes à découvrir Garago. Ça prend une minute.", button: "Laisser un avis sur Google" },
    en: { title: "Enjoying Garago?", text: "Your Google review helps other shop owners discover Garago. It takes a minute.", button: "Leave a Google review" },
  },
} as const;

/** Encart qui invite à laisser un avis sur la fiche Google de Garago (lien ouvert dans un nouvel onglet). */
export default function GoogleReviewCta({ audience, compact = false }: { audience: "drivers" | "garages"; compact?: boolean }) {
  const { lang } = useLang();
  const t = TEXT[audience][lang === "en" ? "en" : "fr"];
  const stars = (
    <span aria-hidden="true" className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <svg key={i} viewBox="0 0 24 24" width="16" height="16" fill="#f59e0b"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
      ))}
    </span>
  );
  if (compact) {
    return (
      <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:border-orange-300 transition-colors">
        {stars}{t.button}
      </a>
    );
  }
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 flex flex-col sm:flex-row sm:items-center gap-4 shadow-sm">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">{stars}<p className="font-bold text-gray-900">{t.title}</p></div>
        <p className="mt-1 text-sm text-gray-600">{t.text}</p>
      </div>
      <a href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center justify-center min-h-[44px] px-5 rounded-xl text-sm font-bold text-white flex-shrink-0" style={{ background: "#e0600c" }}>
        {t.button}
      </a>
    </div>
  );
}
