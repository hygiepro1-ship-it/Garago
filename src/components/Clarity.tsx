"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

// Microsoft Clarity : cartes de clics et enregistrements anonymes des visites, pour voir où les visiteurs
// bloquent. Le numéro de projet est public par nature (il est visible dans la page), ce n'est pas un secret.
//
// Chargé seulement sur le site en ligne (pas sur les aperçus Vercel ni en local), et jamais dans les espaces
// connectés ni sur les pages de connexion / inscription : on n'envoie pas à Microsoft les noms, téléphones et
// rendez-vous des clients que les garages voient dans leur tableau de bord. Si un visiteur passe d'une page
// publique à un espace connecté sans recharger la page, l'enregistrement est arrêté.
const CLARITY_ID = "zbjz7rbfaq";

const PRIVE = ["/tableau-de-bord", "/connexion", "/inscription", "/mot-de-passe-oublie", "/rdv", "/c"];
const estPrive = (p: string) => PRIVE.some((x) => p === x || p.startsWith(x + "/"));

type ClarityFn = ((...args: unknown[]) => void) & { q?: unknown[][] };
declare global {
  interface Window { clarity?: ClarityFn }
}

let charge = false;

export default function Clarity() {
  const pathname = usePathname() ?? "/";

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_VERCEL_ENV !== "production") return;
    const prive = estPrive(pathname);

    if (!charge) {
      if (prive) return;
      charge = true;
      const fn: ClarityFn = (...args: unknown[]) => { (fn.q = fn.q || []).push(args); };
      window.clarity = window.clarity || fn;
      const s = document.createElement("script");
      s.async = true;
      s.src = `https://www.clarity.ms/tag/${CLARITY_ID}`;
      document.head.appendChild(s);
      return;
    }
    window.clarity?.(prive ? "stop" : "start");
  }, [pathname]);

  return null;
}
