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
      {!isAuth && <Header />}
      <main className="flex-1">{children}</main>
      {!isAuth && <Footer />}
    </>
  );
}
