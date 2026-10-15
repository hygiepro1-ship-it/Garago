"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import { type Lang, type Translations, translations } from "@/lib/i18n";
import { counterpart, langOfPath } from "@/lib/alternates";

interface LanguageContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang:    "fr",
  setLang: () => {},
  t:       translations.fr as Translations,
});

function store(l: Lang) {
  try { localStorage.setItem("garago_lang", l); } catch { /* stockage indisponible : la langue vaut pour cette visite */ }
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname() ?? "/";
  const router = useRouter();
  // Les pages qui existent dans les deux langues imposent la leur dès le rendu serveur :
  // Google et le visiteur reçoivent directement le bon texte.
  const forced = langOfPath(pathname);
  const [chosen, setChosen] = useState<Lang>(forced ?? "fr");
  // Un visiteur arrivé sur une page anglaise garde l'anglais sur les pages sans traduction (inscription, connexion…).
  if (forced && forced !== chosen) setChosen(forced);
  const lang = forced ?? chosen;

  useEffect(() => { if (forced) store(forced); }, [forced]);

  // Pages sans traduction : la langue choisie lors d'une visite précédente.
  useEffect(() => {
    if (langOfPath(window.location.pathname)) return;
    try {
      const stored = localStorage.getItem("garago_lang") as Lang | null;
      // eslint-disable-next-line react-hooks/set-state-in-effect -- lecture unique du stockage du navigateur, indisponible au rendu serveur
      if (stored === "fr" || stored === "en") setChosen(stored);
    } catch { /* stockage indisponible */ }
  }, []);

  useEffect(() => { document.documentElement.lang = lang === "en" ? "en-CA" : "fr-CA"; }, [lang]);

  function setLang(l: Lang) {
    store(l);
    // Sur une page traduite, changer de langue mène à sa traduction (une autre adresse).
    const other = langOfPath(pathname) && langOfPath(pathname) !== l ? counterpart(pathname) : null;
    if (other) { router.push(other); return; }
    setChosen(l);
  }

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] as Translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLang() {
  return useContext(LanguageContext);
}
