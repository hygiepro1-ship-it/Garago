import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBillingGarage } from "@/lib/garage-access";

export const dynamic = "force-dynamic";

/**
 * GET /api/stripe/billing
 * Résumé de facturation du dossier (garage principal) : prochaine facture
 * (montant + date), périodicité, moyen de paiement actif.
 */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const garage = await getBillingGarage(session.user.id);
  if (!garage) return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });

  if (!process.env.STRIPE_SECRET_KEY || !garage.stripeCustomerId) {
    return NextResponse.json({ hasSubscription: false });
  }

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });

  const subs = await stripe.subscriptions.list({
    customer: garage.stripeCustomerId,
    status: "active",
    limit: 1,
    expand: ["data.default_payment_method"],
  });
  const sub = subs.data[0];
  if (!sub) return NextResponse.json({ hasSubscription: false });

  const subAny = sub as any;
  const interval: string = subAny.items?.data?.[0]?.price?.recurring?.interval ?? "month";
  const currency: string = (subAny.currency ?? "cad").toUpperCase();

  // Prochaine facture : montant réel (avec réductions/taxes) via la facture à venir,
  // sinon on retombe sur la somme des lignes de l'abonnement.
  let nextAmount: number | null = null;
  let nextDate: number | null = subAny.current_period_end ?? null;
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const upcoming: any = await (stripe.invoices as any).retrieveUpcoming({ customer: garage.stripeCustomerId });
    nextAmount = upcoming.amount_due ?? upcoming.total ?? null;
    nextDate = upcoming.next_payment_attempt ?? upcoming.period_end ?? nextDate;
  } catch {
    nextAmount = subAny.items.data.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (s: number, it: any) => s + (it.price?.unit_amount ?? 0) * (it.quantity ?? 1),
      0,
    );
  }

  // Moyen de paiement par défaut
  let paymentMethod: { type: string; brand?: string; last4?: string } | null = null;
  const pm = subAny.default_payment_method;
  if (pm && typeof pm === "object") {
    if (pm.type === "card" && pm.card) {
      paymentMethod = { type: "card", brand: pm.card.brand, last4: pm.card.last4 };
    } else if (pm.type === "acss_debit" && pm.acss_debit) {
      paymentMethod = { type: "acss_debit", last4: pm.acss_debit.last4 };
    } else {
      paymentMethod = { type: pm.type };
    }
  }

  return NextResponse.json({
    hasSubscription: true,
    interval,                       // "month" | "year"
    currency,                       // "CAD"
    nextAmount,                     // cents
    nextDate: nextDate ? nextDate * 1000 : null, // ms epoch
    cancelAtPeriodEnd: subAny.cancel_at_period_end ?? false,
    paymentMethod,                  // { type, brand?, last4? } | null
  });
}

/**
 * POST /api/stripe/billing — crée une session du portail client Stripe
 * (mise à jour du moyen de paiement, historique des factures).
 * Nécessite l'activation du portail dans le dashboard Stripe.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const garage = await getBillingGarage(session.user.id);
  if (!garage?.stripeCustomerId) {
    return NextResponse.json({ error: "Aucun abonnement actif" }, { status: 400 });
  }
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  const { default: Stripe } = await import("stripe");
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });
  const origin = req.headers.get("origin") ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";

  try {
    const portal = await stripe.billingPortal.sessions.create({
      customer: garage.stripeCustomerId,
      return_url: `${origin}/tableau-de-bord/garage`,
    });
    return NextResponse.json({ url: portal.url });
  } catch (e) {
    console.error("[stripe/billing] portail :", e);
    return NextResponse.json(
      { error: "Le portail de facturation n'est pas encore activé. Contactez le support." },
      { status: 503 },
    );
  }
}
