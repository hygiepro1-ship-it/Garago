/**
 * Depuis ce moment, l'inscription garage exige une carte pour démarrer l'essai
 * de 30 jours (voir /api/stripe/start-trial). Les garages déjà en essai avant
 * cette date gardent l'accès promis à l'époque, sans carte.
 *
 * Fichier volontairement sans dépendance serveur (pas d'import Prisma) — utilisé
 * à la fois par des composants client (tableau de bord, agenda) et des routes
 * API/cron.
 */
export const CARD_REQUIRED_SINCE = new Date("2026-09-13T00:00:00Z");

export interface GarageCardCheck {
  parentId?:          string | null;
  subscriptionStatus: string | null;
  stripePriceId?:     string | null;
  createdAt?:         string | Date | null;
}

/**
 * Vrai si ce garage (principal) est en essai, n'a pas de carte enregistrée
 * (stripePriceId — pas stripeCustomerId, qui est écrit avant même la saisie de
 * la carte) et s'est inscrit après le passage à l'essai "carte requise".
 */
export function isCardRequired(garage: GarageCardCheck): boolean {
  if ((garage.parentId ?? null) !== null) return false;
  if (garage.subscriptionStatus !== "TRIAL") return false;
  if (garage.stripePriceId) return false;
  if (!garage.createdAt) return false;
  return new Date(garage.createdAt) >= CARD_REQUIRED_SINCE;
}
