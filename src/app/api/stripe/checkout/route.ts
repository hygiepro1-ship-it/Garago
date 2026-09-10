import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { getBillingGarage } from "@/lib/garage-access";
import { countBranches, extraPriceForInterval } from "@/lib/stripe-branches";

export const dynamic = "force-dynamic";

// Un seul Price ID par plan, lu depuis l'environnement — pour changer un prix,
// il suffit de créer le nouveau Price dans Stripe et de mettre à jour la variable
// correspondante sur Vercel, sans toucher au code.
const PRICE_IDS: Record<string, string | undefined> = {
  monthly: process.env.STRIPE_PRICE_ID,
  annual:  process.env.STRIPE_PRICE_ID_ANNUAL,
};

export async function POST(req: NextRequest) {
  const { default: Stripe } = await import("stripe");

  const body = await req.json().catch(() => ({}));
  const plan = body?.plan === "annual" ? "annual" : "monthly";
  const priceId = PRICE_IDS[plan];

  if (!process.env.STRIPE_SECRET_KEY || !priceId) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  // L'abonnement couvre l'ensemble du dossier et est porté par le garage principal.
  const garage = await getBillingGarage(userId);
  if (!garage) return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });

  // Ensure a Stripe customer exists for this garage
  let customerId = garage.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: session.user.email ?? undefined,
      name: garage.name,
      metadata: { garageId: garage.id },
    });
    customerId = customer.id;
    // Tous les garages du dossier (principal + succursales) partagent le client Stripe
    await prisma.garage.updateMany({ where: { ownerId: userId }, data: { stripeCustomerId: customerId } });
  }

  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  // Les réductions ambassadeur (paliers 2 et 3) sont ponctuelles et appliquées
  // par le webhook sur l'abonnement actif — pas de réduction à l'inscription.

  // Garages supplémentaires (succursales) déjà rattachés : facturés dès l'activation
  const branchCount = await countBranches(userId);
  const extraPriceId = extraPriceForInterval(plan === "annual" ? "year" : "month");
  const lineItems: { price: string; quantity: number }[] = [{ price: priceId, quantity: 1 }];
  if (branchCount > 0 && extraPriceId) {
    lineItems.push({ price: extraPriceId, quantity: branchCount });
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: lineItems,
    success_url: `${origin}/tableau-de-bord/garage?checkout=success`,
    cancel_url:  `${origin}/tableau-de-bord/garage?checkout=cancelled`,
    metadata: { garageId: garage.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
