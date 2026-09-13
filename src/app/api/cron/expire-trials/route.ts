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
  // Ne concerne que les garages sans carte enregistrée : ceux qui en ont une
  // ont un abonnement Stripe en essai, et c'est Stripe (via webhook) qui fait
  // passer le statut à ACTIVE ou PAST_DUE à la fin de l'essai — pas ce cron.
  const trials = await prisma.garage.updateMany({
    where: {
      parentId: null,
      subscriptionStatus: "TRIAL",
      subscriptionEndAt:  { lt: new Date() },
      stripeCustomerId:   null,
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
