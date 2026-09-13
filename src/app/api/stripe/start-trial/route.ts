import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getBillingGarage } from "@/lib/garage-access";

export const dynamic = "force-dynamic";

// Même Price ID que /api/stripe/checkout — un seul plan par intervalle, configuré
// via l'environnement.
const PRICE_IDS: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_ID,
  annual:  process.env.STRIPE_PRICE_ID_ANNUAL,
};

// POST /api/stripe/checkout ouvre une session immédiate ; celle-ci sert
// uniquement à l'inscription : elle démarre l'abonnement en essai (Stripe gère
// le compte à rebours) tout en collectant la carte, sans facturer avant la fin
// des jours d'essai déjà accordés en base (30 jours, ou 60 en cas de parrainage).
export async function POST(req: NextRequest) {
  const { default: Stripe } = await import("stripe");

  const body = await req.json().catch(() => ({}));
  const plan = body?.plan === "annual" ? "annual" : "monthly";
  const priceId = PRICE_IDS[plan];
  // "wizard" : annulation depuis l'inscription → retour à l'étape du choix de
  // formule avec un message d'erreur, pour forcer une nouvelle tentative
  // immédiate plutôt que d'atterrir sur le tableau de bord (même bloqué).
  const cancelTo = body?.cancelTo === "wizard" ? "wizard" : "dashboard";

  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  const garage = await getBillingGarage(userId);
  if (!garage) return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });

  try {
    // Abonnement déjà configuré (carte déjà ajoutée) — rien à refaire.
    if (garage.stripeCustomerId) {
      const existing = await stripe.subscriptions.list({
        customer: garage.stripeCustomerId, status: "all", limit: 5,
      });
      if (existing.data.some(s => s.status === "trialing" || s.status === "active")) {
        return NextResponse.json({ error: "Un moyen de paiement est déjà enregistré." }, { status: 409 });
      }
    }

    let customerId = garage.stripeCustomerId ?? undefined;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: session.user.email ?? undefined,
        name: garage.name,
        metadata: { garageId: garage.id },
      });
      customerId = customer.id;
      await prisma.garage.updateMany({ where: { ownerId: userId }, data: { stripeCustomerId: customerId } });
    }

    // Le nombre de jours d'essai restants a été fixé à l'inscription (30 jours,
    // 60 en cas de parrainage) — on le reprend tel quel pour que l'horloge Stripe
    // corresponde exactement à celle déjà communiquée au garage.
    const msRemaining = garage.subscriptionEndAt ? garage.subscriptionEndAt.getTime() - Date.now() : 0;
    const trialDays = Math.max(1, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));

    const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
    const cancelUrl = cancelTo === "wizard"
      ? `${origin}/inscription/garage?step=3&cardError=1`
      : `${origin}/tableau-de-bord/garage?trial=skipped`;

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: { trial_period_days: trialDays },
      success_url: `${origin}/tableau-de-bord/garage?trial=started`,
      cancel_url:  cancelUrl,
      metadata: { garageId: garage.id },
    });

    return NextResponse.json({ url: checkoutSession.url });
  } catch (err) {
    console.error("[stripe/start-trial] Erreur :", err);
    return NextResponse.json({ error: "Impossible de démarrer l'essai pour le moment." }, { status: 500 });
  }
}
