"use client";

import { useLang } from "@/contexts/LanguageContext";

/** Logo Garago dans la langue de la page : slogan français ou anglais (« Find the perfect garage for your needs »). */
export default function SiteLogo({ className, style }: { className?: string; style?: React.CSSProperties }) {
  const { lang } = useLang();
  return (
    // eslint-disable-next-line @next/next/no-img-element -- logo statique déjà optimisé (webp)
    <img src={lang === "en" ? "/logo-garago-400-en.webp" : "/logo-garago-400.webp"} width={400} height={124} alt="Garago"
      decoding="async" className={className} style={style} />
  );
}
