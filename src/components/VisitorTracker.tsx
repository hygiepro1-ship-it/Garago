"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Envoie une seule visite par session de navigateur (pas par page vue) au
// tableau de bord admin — sert uniquement à comparer visiteurs vs inscriptions.
export default function VisitorTracker() {
  const pathname = usePathname();

  useEffect(() => {
    try {
      if (sessionStorage.getItem("gpv_sent")) return;
      sessionStorage.setItem("gpv_sent", "1");
    } catch {
      // Stockage indisponible (navigation privée, etc.) — on tente quand même
      // l'envoi une fois, sans bloquer la page.
    }
    fetch("/api/track/visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
