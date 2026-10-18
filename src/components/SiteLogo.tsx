"use client";

import { useLang } from "@/contexts/LanguageContext";

/** Logo Garago dans la langue de la page : slogan français ou anglais (« Find the perfect garage for your needs »). */
export default function SiteLogo({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { lang } = useLang();
  return (
    // Version 280 px pour l'affichage courant (environ 140 px de large), 400 px pour les écrans très denses
    // eslint-disable-next-line @next/next/no-img-element -- logo statique déjà optimisé (webp)
    <img src={lang === "en" ? "/logo-garago-400-en.webp" : "/logo-garago-400.webp"}
      srcSet={lang === "en" ? "/logo-garago-280-en.webp 280w, /logo-garago-400-en.webp 400w" : "/logo-garago-280.webp 280w, /logo-garago-400.webp 400w"}
      sizes="150px" width={400} height={124} alt="Garago"
      decoding="async" className={className} style={style} />
  );
}
