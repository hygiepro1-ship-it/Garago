"use client";

import type { ReactNode } from "react";
import { useLang } from "@/contexts/LanguageContext";

/**
 * Affiche un texte dans la langue choisie par le visiteur. Sert dans les pages rendues
 * côté serveur (articles, pages d'information), qui ne connaissent pas cette langue :
 * elles fournissent les deux versions et le navigateur montre la bonne.
 */
export default function L({ fr, en }: { fr: ReactNode; en: ReactNode }) {
  const { lang } = useLang();
  return <>{lang === "en" ? en : fr}</>;
}

/** Date longue (« 14 octobre 2026 » / « October 14, 2026 ») dans la langue du visiteur. */
export function LDate({ iso }: { iso: string }) {
  const { lang } = useLang();
  // Midi : une date « AAAA-MM-JJ » lue à minuit UTC reculerait d'un jour à l'heure du Québec.
  return <>{new Date(iso.length === 10 ? `${iso}T12:00:00` : iso).toLocaleDateString(lang === "en" ? "en-CA" : "fr-CA", { day: "numeric", month: "long", year: "numeric" })}</>;
}
