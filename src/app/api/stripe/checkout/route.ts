import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Coupon ambassadeur — 10% de réduction permanente (duration: forever)
const AMBASSADOR_COUPON_ID = process.env.STRIPE_AMBASSADOR_COUPON_ID ?? "garago-ambassador-10pct";

export async function POST(req: NextRequest) {
  const { default: Stripe } = await import("stripe");

  if (!process.env.STRIPE_SECRET_KEY || !process.env.STRIPE_PRICE_ID) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = (session.user as any).id;
  const garage = await prisma.garage.findUnique({ where: { ownerId: userId } });
  if (!garage) return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });

  // Ensure a Stripe customer exists for this garage
  let customerId = garage.stripeCustomerId ?? undefined;
  if (!customerId) {
    const customer = await stripe.customers.create({
      email: (session.user as any).email ?? undefined,
      name: garage.name,
      metadata: { garageId: garage.id },
    });
    customerId = customer.id;
    await prisma.garage.update({ where: { id: garage.id }, data: { stripeCustomerId: customerId } });
  }

  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  // Réduction ambassadeur permanente si le garage est ambassadeur
  const discounts: { coupon: string }[] = [];
  if ((garage as any).isAmbassador) {
    try {
      try {
        await stripe.coupons.retrieve(AMBASSADOR_COUPON_ID);
      } catch {
        await stripe.coupons.create({
          id: AMBASSADOR_COUPON_ID,
          percent_off: 10,
          duration: "forever",
          name: "10% Ambassadeur Garago — réduction permanente",
        });
      }
      discounts.push({ coupon: AMBASSADOR_COUPON_ID });
    } catch {
      // Non-bloquant
    }
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
    discounts: discounts.length > 0 ? discounts : undefined,
    success_url: `${origin}/tableau-de-bord/garage?checkout=success`,
    cancel_url:  `${origin}/tableau-de-bord/garage?checkout=cancelled`,
    metadata: { garageId: garage.id },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
