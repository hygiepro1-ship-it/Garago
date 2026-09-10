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
