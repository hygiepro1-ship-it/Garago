"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLang } from "@/contexts/LanguageContext";

const AUTH_PATHS = ["/connexion", "/inscription"];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const skipEn = useLang().lang === "en";

  const isAuth = AUTH_PATHS.some((p) => pathname.startsWith(p));

  return (
    <>
      {/* Lien d'évitement : visible seulement au clavier, mène directement au contenu (WCAG 2.4.1). */}
      <a href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold focus:text-white"
        style={{ background: "#0b1f3a" }}>
        {skipEn ? "Skip to main content" : "Aller au contenu principal"}
      </a>
      {!isAuth && <Header />}
      <main id="contenu" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
      {!isAuth && <Footer />}
    </>
  );
}
