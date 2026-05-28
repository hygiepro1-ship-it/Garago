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

      // ── Paiement réussi (renouvellement mensuel) ─────────────────────────
      case "invoice.payment_succeeded": {
        const inv = event.data.object as any;
        if (inv.subscription) {
          const { default: Stripe2 } = await import("stripe");
          const stripe2 = new Stripe2(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });
          const sub = await stripe2.subscriptions.retrieve(inv.subscription as string);
          await handleSubscriptionChange(sub);
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
