/**
 * Webhook Stripe → reçoit les événements de paiement.
 *
 * Événements gérés :
 *   - customer.subscription.created  → abonnement activé
 *   - customer.subscription.updated  → changement de statut
 *   - customer.subscription.deleted  → résiliation
 *   - invoice.payment_succeeded      → paiement réussi (renouvellement)
 *   - invoice.payment_failed         → paiement échoué
 *
 * À chaque activation : invite automatiquement le garagiste sur Calendly.
 */

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { inviteToOrg } from "@/lib/calendly";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2026-04-22.dahlia" });

// Next.js App Router — désactiver le body parser pour que Stripe puisse vérifier la signature
export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const payload = await req.text();
  const sig     = req.headers.get("stripe-signature") ?? "";
  const secret  = process.env.STRIPE_WEBHOOK_SECRET!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(payload, sig, secret);
  } catch (err: any) {
    console.error("Stripe webhook signature invalide :", err.message);
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 });
  }

  try {
    switch (event.type) {

      // ── Abonnement activé / renouvelé ────────────────────────────────────
      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const sub = event.data.object as Stripe.Subscription;
        await handleSubscriptionChange(sub);
        break;
      }

      // ── Abonnement résilié ───────────────────────────────────────────────
      case "customer.subscription.deleted": {
        const sub = event.data.object as Stripe.Subscription;
        await prisma.garage.updateMany({
          where: { stripeCustomerId: sub.customer as string },
          data: { subscriptionStatus: "EXPIRED" },
        });
        break;
      }

      // ── Paiement réussi (renouvellement mensuel) ─────────────────────────
      case "invoice.payment_succeeded": {
        const inv = event.data.object as any;
        if (inv.subscription) {
          const sub = await stripe.subscriptions.retrieve(inv.subscription as string);
          await handleSubscriptionChange(sub);
        }
        break;
      }

      // ── Paiement échoué ──────────────────────────────────────────────────
      case "invoice.payment_failed": {
        const inv = event.data.object as any;
        await prisma.garage.updateMany({
          where: { stripeCustomerId: inv.customer as string },
          data: { subscriptionStatus: "PAST_DUE" },
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

async function handleSubscriptionChange(sub: Stripe.Subscription) {
  const isActive = sub.status === "active" || sub.status === "trialing";
  const subAny   = sub as any;
  const endDate  = subAny.current_period_end
    ? new Date(subAny.current_period_end * 1000)
    : null;

  const garage = await prisma.garage.findFirst({
    where: { stripeCustomerId: sub.customer as string },
    include: { owner: { select: { email: true } } },
  });

  if (!garage) return;

  await prisma.garage.update({
    where: { id: garage.id },
    data: {
      subscriptionStatus: isActive ? "ACTIVE" : sub.status.toUpperCase(),
      stripePriceId:      sub.items.data[0]?.price?.id ?? null,
      subscriptionEndAt:  endDate,
    },
  });

  // ── Invitation Calendly automatique à la première activation ────────────
  if (isActive && garage.owner?.email && !garage.calcomLink) {
    const result = await inviteToOrg(garage.owner.email);
    if (result.success) {
      console.log(`✉️  Invitation Calendly envoyée à ${garage.owner.email}`);
    } else {
      console.error(`❌ Échec invitation Calendly :`, result.error);
    }
  }
}
