"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const AUTH_PATHS = ["/connexion", "/inscription", "/maintenance"];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  // Le proxy réécrit la page vers /maintenance en gardant l'URL du navigateur
  // inchangée (un rewrite est transparent) — usePathname() ne peut donc jamais
  // le détecter. Le proxy pose plutôt un cookie de courte durée à chaque
  // requête réécrite ; on le lit ici pour savoir s'il faut masquer le Header
  // (connexion, inscription, menu) par-dessus le message de maintenance,
  // sans jamais toucher au rendu serveur (garder les pages statiques rapides).
  const [maintenanceActive, setMaintenanceActive] = useState(false);
  useEffect(() => {
    setMaintenanceActive(document.cookie.split("; ").includes("gp_maintenance=1"));
  }, [pathname]);

  const isAuth = maintenanceActive || AUTH_PATHS.some((p) => pathname.startsWith(p));

  return (
    <>
      {/* Lien d'évitement : visible seulement au clavier, mène directement au contenu (WCAG 2.4.1). */}
      <a href="#contenu"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:px-4 focus:py-2 focus:rounded-lg focus:text-sm focus:font-bold focus:text-white"
        style={{ background: "#0b1f3a" }}>
        Aller au contenu principal
      </a>
      {!isAuth && <Header />}
      <main id="contenu" tabIndex={-1} className="flex-1 focus:outline-none">{children}</main>
      {!isAuth && <Footer />}
    </>
  );
}
