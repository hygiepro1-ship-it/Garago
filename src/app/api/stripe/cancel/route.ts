import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getBillingGarage } from "@/lib/garage-access";

export const dynamic = "force-dynamic";

// POST { resume?: boolean } — annule l'abonnement à la fin de la période déjà
// payée (aucune coupure immédiate, aucun remboursement nécessaire), ou annule
// cette demande si resume=true (réactive le renouvellement automatique).
export async function POST(req: NextRequest) {
  const { default: Stripe } = await import("stripe");

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const body   = await req.json().catch(() => ({}));
  const resume = body?.resume === true;

  const userId = session.user.id;
  // L'abonnement est porté par le garage principal du propriétaire ; les
  // succursales partagent le même client Stripe.
  const garage = await getBillingGarage(userId);
  if (!garage) return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });
  if (!garage.stripeCustomerId) {
    return NextResponse.json({ error: "Aucun abonnement actif" }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
  const subs = await stripe.subscriptions.list({ customer: garage.stripeCustomerId, status: "active", limit: 1 });
  const sub = subs.data[0];
  if (!sub) return NextResponse.json({ error: "Aucun abonnement actif" }, { status: 400 });

  const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: !resume });

  // Répercute sur tous les garages du dossier (principal + succursales)
  await prisma.garage.updateMany({
    where: { stripeCustomerId: garage.stripeCustomerId },
    data:  { cancelAtPeriodEnd: updated.cancel_at_period_end ?? false },
  });

  return NextResponse.json({ success: true, cancelAtPeriodEnd: updated.cancel_at_period_end });
}
