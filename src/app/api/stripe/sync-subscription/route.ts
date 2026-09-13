import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getBillingGarage } from "@/lib/garage-access";
import { syncSubscriptionToGarage } from "@/lib/stripe-sync";

export const dynamic = "force-dynamic";

// POST /api/stripe/sync-subscription — force la synchronisation de l'abonnement
// Stripe du garage vers la base, sans attendre le webhook. Appelé au retour de
// Stripe Checkout (success_url) : Stripe ne garantit pas que le webhook soit
// traité avant que l'utilisateur revienne sur le site, ce qui bloquerait à tort
// l'accès au tableau de bord juste après une carte ajoutée avec succès.
export async function POST() {
  const { default: Stripe } = await import("stripe");
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({ error: "Stripe non configuré" }, { status: 500 });
  }

  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const garage = await getBillingGarage(session.user.id);
  if (!garage?.stripeCustomerId) return NextResponse.json({ ok: true, synced: false });

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" });

  try {
    const subs = await stripe.subscriptions.list({
      customer: garage.stripeCustomerId, status: "all", limit: 5,
    });
    // Priorité au premier abonnement encore vivant (trialing/active/past_due) —
    // sinon le plus récent (ex. annulé), pour refléter son vrai statut.
    const sub = subs.data.find(s => ["trialing", "active", "past_due"].includes(s.status))
      ?? subs.data[0];
    if (!sub) return NextResponse.json({ ok: true, synced: false });

    await syncSubscriptionToGarage(sub);
    return NextResponse.json({ ok: true, synced: true, status: sub.status });
  } catch (err) {
    console.error("[stripe/sync-subscription] Erreur :", err);
    return NextResponse.json({ ok: true, synced: false });
  }
}
