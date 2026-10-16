import type { Metadata } from "next";

export type PageLang = "fr" | "en";

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

/**
 * Pages qui existent dans les deux langues, chacune à sa propre adresse : [français, anglais].
 * Google lit ces paires (balises hreflang et plan du site) pour proposer la bonne version selon la langue
 * de la recherche. Le bouton FR/EN du site passe aussi d'une page à sa traduction grâce à cette table.
 */
export const PAGE_PAIRS: [string, string][] = [
  ["/", "/en"],
  ["/garagistes", "/en/garage-owners"],
  ["/pourquoi-garago", "/en/why-garago"],
  ["/garagistes/rendez-vous-manques", "/en/garage-owners/missed-appointments"],
  ["/garagistes/agenda-en-ligne", "/en/garage-owners/online-scheduling-calendar"],
  ["/garagistes/saison-pneus-hiver", "/en/garage-owners/winter-tire-season"],
  ["/garagistes/logiciel-garage-automobile", "/en/garage-owners/auto-repair-shop-software"],
  ["/garagistes/modele-facture-garage", "/en/garage-owners/auto-repair-invoice-template"],
  ["/garagistes/rappel-rendez-vous-sms", "/en/garage-owners/sms-appointment-reminders"],
  ["/garagistes/prise-de-rendez-vous-en-ligne", "/en/garage-owners/online-booking"],
  ["/garagistes/attirer-clients-garage", "/en/garage-owners/get-more-customers"],
  ["/garagistes/ouvrir-un-garage-quebec", "/en/garage-owners/open-auto-repair-shop-quebec"],
  ["/conducteurs/reserver-garage-en-ligne", "/en/drivers/book-garage-online"],
  ["/videos/reserver-son-garage-en-ligne", "/en/videos/book-your-garage-online"],
  ["/videos/prise-de-rendez-vous-en-ligne-garage", "/en/videos/online-booking-for-auto-repair-shops"],
];

const FR_TO_EN = new Map(PAGE_PAIRS);
const EN_TO_FR = new Map(PAGE_PAIRS.map(([fr, en]) => [en, fr]));

/** Langue imposée par l'adresse, ou null si la page n'a qu'une version (la langue choisie par le visiteur s'applique). */
export function langOfPath(path: string): PageLang | null {
  if (path === "/en" || path.startsWith("/en/")) return "en";
  return FR_TO_EN.has(path) ? "fr" : null;
}

/** Traduction d'une page dans l'autre langue, si elle existe. */
export function counterpart(path: string): string | null {
  return FR_TO_EN.get(path) ?? EN_TO_FR.get(path) ?? null;
}

/** Lien vers la version d'une page dans la langue voulue (le lien d'origine s'il n'y a pas de traduction). */
export function localHref(href: string, lang: PageLang): string {
  if (lang === "en") return FR_TO_EN.get(href) ?? href;
  return EN_TO_FR.get(href) ?? href;
}

/** Adresses des deux versions d'une page, pour hreflang et le plan du site. Le français est la version par défaut. */
export function languagesFor(path: string): Record<string, string> | undefined {
  const fr = FR_TO_EN.has(path) ? path : EN_TO_FR.get(path);
  if (!fr) return undefined;
  const en = FR_TO_EN.get(fr)!;
  return { "fr-CA": `${BASE_URL}${fr}`, "en-CA": `${BASE_URL}${en}`, "x-default": `${BASE_URL}${fr}` };
}

/** Métadonnées d'une page : titre, description, adresse canonique, traductions et aperçu de partage. */
export function pageMetadata({ path, lang, title, description, ogTitle, ogDescription, type = "article" }: {
  path: string; lang: PageLang; title: string; description: string; ogTitle?: string; ogDescription?: string; type?: "article" | "website";
}): Metadata {
  const url = `${BASE_URL}${path}`;
  return {
    title,
    description,
    alternates: { canonical: url, languages: languagesFor(path) },
    openGraph: {
      title: ogTitle ?? title.replace(/ \| Garago$/, ""),
      description: ogDescription ?? description,
      url, siteName: "Garago", locale: lang === "en" ? "en_CA" : "fr_CA", type,
    },
  };
}
