/**
 * Webhook Stripe → reçoit les événements de paiement.
 *
 * Événements gérés :
 *   - customer.subscription.created  → abonnement activé
 *   - customer.subscription.updated  → changement de statut
 *   - customer.subscription.deleted  → résiliation
 *   - invoice.payment_succeeded      → paiement réussi (renouvellement)
 *   - invoice.payment_failed         → paiement échoué
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Force la route en dynamique — empêche Next.js d'évaluer ce module au build
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  // Import dynamique de Stripe — évite l'évaluation au build sans STRIPE_SECRET_KEY
  const { default: Stripe } = await import("stripe");

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  const stripe  = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
  const payload = await req.text();
  const sig     = req.headers.get("stripe-signature") ?? "";

  let event: import("stripe").Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err: any) {
    console.error("Stripe webhook signature invalide :", err.message);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── Abonnement activé / renouvelé ────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as import("stripe").Stripe.Subscription;
        await handleSubscriptionChange(sub);
        break;
      }

      // ── Abonnement résilié ───────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as import("stripe").Stripe.Subscription;
        await prisma.garage.updateMany({
          where: { stripeCustomerId: sub.customer as string },
          data:  { subscriptionStatus: "EXPIRED" },
        });
        break;
      }

      // ── Paiement réussi (renouvellement mensuel + parrainage) ────────────
      case "invoice.payment_succeeded": {
        const inv = event.data.object as any;
        if (inv.subscription) {
          const { default: Stripe2 } = await import("stripe");
          const stripe2 = new Stripe2(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });
          const sub = await stripe2.subscriptions.retrieve(inv.subscription as string);
          await handleSubscriptionChange(sub);

          // ── Commission de parrainage au 1er paiement ──────────────────
          if (inv.billing_reason === "subscription_create" && (inv.amount_paid ?? 0) > 0) {
            const newGarage = await prisma.garage.findFirst({
              where: { stripeCustomerId: inv.customer as string },
            });
            if (newGarage?.referredByCode && !newGarage.referralRewardGranted) {
              const referrer = await prisma.garage.findUnique({
                where: { referralCode: newGarage.referredByCode },
              });
              if (referrer) {
                // 15% de commission sur le premier paiement
                const commissionCents = Math.round((inv.amount_paid ?? 0) * 0.15);
                const commissionDollars = commissionCents / 100;

                // Crédit Stripe sur le compte du parrain
                if (referrer.stripeCustomerId && commissionCents > 0) {
                  try {
                    await stripe.customers.createBalanceTransaction(referrer.stripeCustomerId, {
                      amount: -commissionCents, // négatif = crédit
                      currency: "cad",
                      description: `Commission parrainage — ${newGarage.name}`,
                    });
                  } catch (e) {
                    console.error("Erreur crédit Stripe parrainage :", e);
                  }
                }

                // Mise à jour compteur + tiers ambassadeur
                const newCount = (referrer.referralCount ?? 0) + 1;
                const newTier = newCount >= 20 ? 5 : newCount >= 15 ? 4 : newCount >= 10 ? 3 : newCount >= 6 ? 2 : newCount >= 3 ? 1 : 0;
                const oldTier = referrer.ambassadorTier ?? 0;
                const firstTier = oldTier === 0 && newTier >= 1;

                const updateData: any = {
                  referralCount: newCount,
                  referralCommissionEarned: { increment: commissionDollars },
                  ambassadorTier: newTier,
                  ambassadorSince: firstTier ? new Date() : referrer.ambassadorSince,
                  isAmbassador: newTier >= 5,
                };

                // Palier 2 — -10% sur prochaine facture (une seule fois)
                if (newTier >= 2 && !referrer.palier2Applied && referrer.stripeCustomerId) {
                  updateData.palier2Applied = true;
                  try {
                    const COUPON_ID = process.env.STRIPE_AMBASSADOR_COUPON_ID ?? "garago-ambassador-10pct";
                    try { await stripe2.coupons.retrieve(COUPON_ID); } catch {
                      await stripe2.coupons.create({ id: COUPON_ID, percent_off: 10, duration: "once", name: "−10% Ambassadeur Garago (palier 2)" });
                    }
                    const subs = await stripe2.subscriptions.list({ customer: referrer.stripeCustomerId, status: "active", limit: 1 });
                    if (subs.data[0]) await stripe2.subscriptions.update(subs.data[0].id, { discounts: [{ coupon: COUPON_ID }] });
                  } catch (e) { console.error("Erreur coupon palier 2 :", e); }
                }

                // Palier 3 — -20% (-30% annuel) sur prochaine facture (une seule fois)
                if (newTier >= 3 && !referrer.palier3Applied && referrer.stripeCustomerId) {
                  updateData.palier3Applied = true;
                  try {
                    const isAnnual = inv.lines?.data?.[0]?.plan?.interval === "year";
                    const pct = isAnnual ? 30 : 20;
                    const COUPON_ID3 = `garago-ambassador-${pct}pct`;
                    try { await stripe2.coupons.retrieve(COUPON_ID3); } catch {
                      await stripe2.coupons.create({ id: COUPON_ID3, percent_off: pct, duration: "once", name: `−${pct}% Ambassadeur Garago (palier 3)` });
                    }
                    const subs = await stripe2.subscriptions.list({ customer: referrer.stripeCustomerId, status: "active", limit: 1 });
                    if (subs.data[0]) await stripe2.subscriptions.update(subs.data[0].id, { discounts: [{ coupon: COUPON_ID3 }] });
                  } catch (e) { console.error("Erreur coupon palier 3 :", e); }
                }

                // Palier 4 — priorité recherche 30 jours
                if (newTier >= 4 && oldTier < 4) {
                  updateData.palier4Expiry = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
                }

                await prisma.garage.update({ where: { id: referrer.id }, data: updateData });
                await prisma.garage.update({
                  where: { id: newGarage.id },
                  data: { referralRewardGranted: true },
                });
                const tierLabel = ["", "📊 PALIER 1", "💰 PALIER 2", "💰 PALIER 3", "🔝 PALIER 4", "🏆 CERTIFIÉ"][newTier] ?? "";
                console.log(`💰 Commission ${commissionDollars}$ → ${referrer.name} (parrainage ${newGarage.name}) ${tierLabel}`);
              }
            }
          }
        }
        break;
      }

      // ── Paiement échoué ──────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const inv = event.data.object as any;
        await prisma.garage.updateMany({
          where: { stripeCustomerId: inv.customer as string },
          data:  { subscriptionStatus: "PAST_DUE" },
        });
        break;
      }
    }
  } catch (err) {
    console.error("Erreur traitement webhook Stripe :", err);
    return NextResponse.json({ error: "Erreur interne" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

async function handleSubscriptionChange(sub: import("stripe").Stripe.Subscription) {
  const isActive = sub.status === "active" || sub.status === "trialing";
  const subAny   = sub as any;
  const endDate  = subAny.current_period_end
    ? new Date(subAny.current_period_end * 1000)
    : null;

  await prisma.garage.updateMany({
    where: { stripeCustomerId: sub.customer as string },
    data: {
      subscriptionStatus: isActive ? "ACTIVE" : sub.status.toUpperCase(),
      stripePriceId:      sub.items.data[0]?.price?.id ?? null,
      subscriptionEndAt:  endDate,
    },
  });

  if (isActive) {
    console.log(`✅ Abonnement activé pour customer=${sub.customer}`);
  }
}
