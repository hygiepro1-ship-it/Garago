import prisma from "@/lib/prisma";

/**
 * Applique l'état d'un abonnement Stripe au garage correspondant. Utilisé à la
 * fois par le webhook (customer.subscription.created/updated) et par la
 * synchronisation à chaud sur la page de retour de Checkout — Stripe ne
 * garantit pas que le webhook soit traité avant que l'utilisateur revienne sur
 * le site, donc on doit pouvoir forcer la même mise à jour de manière
 * synchrone à ce moment-là.
 *
 * "trialing" reste TRIAL (carte enregistrée, essai en cours, pas encore
 * facturé) — pas ACTIVE, pour ne pas fausser les paliers de parrainage qui
 * exigent un garage réellement payant.
 */
export async function syncSubscriptionToGarage(sub: import("stripe").Stripe.Subscription) {
  const isTrialing = sub.status === "trialing";
  const isActive   = sub.status === "active";
  const subAny     = sub as any;
  const endDate    = subAny.current_period_end
    ? new Date(subAny.current_period_end * 1000)
    : null;

  const status = isTrialing ? "TRIAL" : isActive ? "ACTIVE" : sub.status.toUpperCase();

  await prisma.garage.updateMany({
    where: { stripeCustomerId: sub.customer as string },
    data: {
      subscriptionStatus: status,
      stripePriceId:      sub.items.data[0]?.price?.id ?? null,
      subscriptionEndAt:  endDate,
      cancelAtPeriodEnd:  sub.cancel_at_period_end ?? false,
      ...(isActive || isTrialing ? { pastDueSince: null } : {}),
    },
  });
}
