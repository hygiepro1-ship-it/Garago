import prisma from "@/lib/prisma";

/**
 * Tarification « un garage supplémentaire = +49,99 $/mois » (−20 % en annuel).
 * Les Price IDs sont créés dans le dashboard Stripe et lus depuis l'environnement.
 * Tant qu'ils ne sont pas configurés, les succursales ne sont pas facturées
 * (le garage principal paie son abonnement de base seul).
 */
export const EXTRA_PRICE_MONTHLY = process.env.STRIPE_PRICE_ID_EXTRA;
export const EXTRA_PRICE_ANNUAL = process.env.STRIPE_PRICE_ID_EXTRA_ANNUAL;

/** Nombre maximum de garages sur un même compte (garde-fou anti-abus). */
export const MAX_GARAGES_PER_OWNER = 10;

/** Price ID de la ligne « garage supplémentaire » selon l'intervalle de l'abonnement. */
export function extraPriceForInterval(interval: string | undefined): string | undefined {
  return interval === "year" ? EXTRA_PRICE_ANNUAL : EXTRA_PRICE_MONTHLY;
}

/** Nombre de succursales (garages rattachés) d'un propriétaire. */
export function countBranches(ownerId: string) {
  return prisma.garage.count({ where: { ownerId, parentId: { not: null } } });
}

/**
 * Aligne la quantité de la ligne « garage supplémentaire » de l'abonnement Stripe
 * actif sur le nombre réel de succursales du propriétaire.
 *
 * Idempotent (aucune dérive après plusieurs ajouts/retraits). Stripe calcule et
 * facture le prorata automatiquement (`create_prorations`). Ne fait rien si :
 *  - aucun abonnement actif (le propriétaire est encore en essai — la quantité
 *    sera prise en compte au checkout) ;
 *  - le Price « garage supplémentaire » n'est pas configuré dans l'environnement.
 *
 * @param stripe  instance Stripe déjà initialisée
 * @param sub     l'abonnement Stripe actif (résultat de subscriptions.list)
 * @param ownerId propriétaire concerné
 */
export async function syncBranchQuantity(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  stripe: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  sub: any,
  ownerId: string,
): Promise<void> {
  const interval: string | undefined = sub.items?.data?.[0]?.price?.recurring?.interval;
  const extraPriceId = extraPriceForInterval(interval);
  if (!extraPriceId) return; // tarification « garage supplémentaire » pas encore configurée

  const branchCount = await countBranches(ownerId);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existing = sub.items.data.find((i: any) => i.price?.id === extraPriceId);

  if (branchCount === 0) {
    if (existing) {
      await stripe.subscriptions.update(sub.id, {
        items: [{ id: existing.id, deleted: true }],
        proration_behavior: "create_prorations",
      });
    }
    return;
  }

  if (existing) {
    if (existing.quantity !== branchCount) {
      await stripe.subscriptions.update(sub.id, {
        items: [{ id: existing.id, quantity: branchCount }],
        proration_behavior: "create_prorations",
      });
    }
  } else {
    await stripe.subscriptions.update(sub.id, {
      items: [{ price: extraPriceId, quantity: branchCount }],
      proration_behavior: "create_prorations",
    });
  }
}
