// Langues qu'un garage peut déclarer parler sur place (affichées sur son profil public).
export const GARAGE_LANGUAGES = [
  { code: "fr",  fr: "Français",       en: "French" },
  { code: "en",  fr: "Anglais",        en: "English" },
  { code: "es",  fr: "Espagnol",       en: "Spanish" },
  { code: "ar",  fr: "Arabe",          en: "Arabic" },
  { code: "ht",  fr: "Créole haïtien", en: "Haitian Creole" },
  { code: "it",  fr: "Italien",        en: "Italian" },
  { code: "pt",  fr: "Portugais",      en: "Portuguese" },
  { code: "zh",  fr: "Mandarin",       en: "Mandarin" },
  { code: "yue", fr: "Cantonais",      en: "Cantonese" },
  { code: "vi",  fr: "Vietnamien",     en: "Vietnamese" },
  { code: "el",  fr: "Grec",           en: "Greek" },
  { code: "ro",  fr: "Roumain",        en: "Romanian" },
  { code: "ru",  fr: "Russe",          en: "Russian" },
  { code: "pl",  fr: "Polonais",       en: "Polish" },
  { code: "hi",  fr: "Hindi",          en: "Hindi" },
  { code: "pa",  fr: "Pendjabi",       en: "Punjabi" },
  { code: "ur",  fr: "Ourdou",         en: "Urdu" },
  { code: "tl",  fr: "Tagalog",        en: "Tagalog" },
] as const;

export function languageLabel(code: string, lang: "fr" | "en"): string {
  const l = GARAGE_LANGUAGES.find((x) => x.code === code);
  return l ? l[lang] : code;
}

/** Le champ est stocké en JSON texte (ex. '["fr","en"]') ; renvoie toujours un tableau de codes connus. */
export function parseLanguages(raw: unknown): string[] {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((c): c is string => typeof c === "string" && GARAGE_LANGUAGES.some((x) => x.code === c));
  } catch { return []; }
}
