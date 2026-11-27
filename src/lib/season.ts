import { QUEBEC_TZ } from "@/lib/availability";

/** Mois en cours au Québec (0 = janvier), pour les contenus de saison calculés côté serveur. */
export function quebecMonth(now = new Date()): number {
  return Number(new Intl.DateTimeFormat("en-CA", { timeZone: QUEBEC_TZ, month: "numeric" }).format(now)) - 1;
}
