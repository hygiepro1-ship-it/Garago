import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PAST_DUE_GRACE_DAYS } from "@/lib/garage-access";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel cron call
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 1. Essais échus → EXPIRED (les succursales héritent du statut du principal).
  // Ne concerne que les garages sans abonnement Stripe réel (stripePriceId, posé
  // uniquement par le webhook une fois la carte saisie) : ceux qui en ont un sont
  // pris en charge par Stripe (webhook → ACTIVE/PAST_DUE à la fin de l'essai).
  // stripeCustomerId seul ne suffit pas ici : il est écrit dès la création du
  // client Stripe, avant même que la carte soit saisie (cf. /api/stripe/start-trial) —
  // un garage qui abandonne à cette étape n'a jamais de stripePriceId et doit
  // donc bien expirer normalement.
  const trials = await prisma.garage.updateMany({
    where: {
      parentId: null,
      subscriptionStatus: "TRIAL",
      subscriptionEndAt:  { lt: new Date() },
      stripePriceId:      null,
    },
    data: { subscriptionStatus: "EXPIRED" },
  });

  // 2. Paiements échoués dont la période de grâce est dépassée → EXPIRED
  const graceCutoff = new Date(Date.now() - PAST_DUE_GRACE_DAYS * 24 * 60 * 60 * 1000);
  const pastDue = await prisma.garage.updateMany({
    where: {
      subscriptionStatus: "PAST_DUE",
      pastDueSince: { lt: graceCutoff },
    },
    data: { subscriptionStatus: "EXPIRED", pastDueSince: null },
  });

  return NextResponse.json({ ok: true, trialsExpired: trials.count, pastDueExpired: pastDue.count });
}
