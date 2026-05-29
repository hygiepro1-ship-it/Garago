import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Coupon ID for 10% off first payment — create once in Stripe dashboard
// or set STRIPE_REFERRAL_COUPON_ID in env (percent_off: 10, duration: once)
const REFERRAL_COUPON_ID = process.env.STRIPE_REFERRAL_COUPON_ID ?? "garago-referral-10pct";

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

  // Apply 10% referral coupon if this garage was referred
  const discounts: { coupon: string }[] = [];
  if (garage.referredByCode) {
    try {
      // Ensure the coupon exists — create it if not
      try {
        await stripe.coupons.retrieve(REFERRAL_COUPON_ID);
      } catch {
        await stripe.coupons.create({
          id: REFERRAL_COUPON_ID,
          percent_off: 10,
          duration: "once",
          name: "10% parrainage — premier paiement",
        });
      }
      discounts.push({ coupon: REFERRAL_COUPON_ID });
    } catch {
      // Non-blocking — proceed without coupon if Stripe fails
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
