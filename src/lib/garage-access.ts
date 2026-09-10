import prisma from "@/lib/prisma";

/**
 * Un propriétaire peut posséder plusieurs garages : un garage principal
 * (`parentId: null`) et des succursales rattachées. Le garage principal porte
 * l'abonnement Stripe ; les succursales partagent son `stripeCustomerId` et son
 * statut d'abonnement.
 *
 * Ces helpers centralisent le contrôle d'accès « ce garage appartient bien à
 * l'utilisateur connecté » pour éviter toute faille d'accès indirect (IDOR).
 */

/** Lit le paramètre `g` (garage sélectionné) d'une URL. */
export function readGarageId(url: string): string | null {
  try {
    return new URL(url).searchParams.get("g") || null;
  } catch {
    return null;
  }
}

/**
 * Clause `where` d'un garage appartenant à `userId`.
 * - avec `garageId` : ce garage précis, seulement s'il appartient à `userId`.
 * - sans `garageId` : le garage principal du propriétaire.
 */
export function ownedGarageWhere(userId: string, garageId?: string | null) {
  return garageId
    ? { id: garageId, ownerId: userId }
    : { ownerId: userId, parentId: null };
}

/** Le garage de facturation d'un propriétaire : son garage principal. */
export function getBillingGarage(userId: string) {
  return prisma.garage.findFirst({ where: { ownerId: userId, parentId: null } });
}

/**
 * Période de grâce après un paiement échoué : le garage reste visible pendant
 * ces jours (le temps que Stripe retente la carte / que le garage la mette à
 * jour), puis un cron le bascule en EXPIRED.
 */
export const PAST_DUE_GRACE_DAYS = 7;

/**
 * Fragment `where` : l'abonnement du garage le rend visible dans la recherche
 * — actif, en essai, ou impayé mais encore dans la période de grâce.
 */
export function activeSubscriptionOr() {
  const graceCutoff = new Date(Date.now() - PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000);
  return [
    { subscriptionStatus: { in: ["ACTIVE", "TRIAL"] } },
    { subscriptionStatus: "PAST_DUE", pastDueSince: { gte: graceCutoff } },
  ];
}
