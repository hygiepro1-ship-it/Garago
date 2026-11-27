"use client";

import { useSyncExternalStore } from "react";

// Paramètres de l'adresse de la page (« ?from=dashboard »), lus sans effet et sans useSearchParams
// (qui forcerait le rendu de toute la page dans le navigateur, hors du HTML vu par Google).
// Chaîne vide pendant le rendu serveur et l'hydratation, puis la vraie valeur : aucun écart d'hydratation.
const noSubscribe = () => () => {};

export function useLocationSearch(): URLSearchParams {
  const search = useSyncExternalStore(noSubscribe, () => window.location.search, () => "");
  return new URLSearchParams(search);
}

/** true une fois dans le navigateur (après l'hydratation), false pendant le rendu serveur. */
export function useIsClient(): boolean {
  return useSyncExternalStore(noSubscribe, () => true, () => false);
}
