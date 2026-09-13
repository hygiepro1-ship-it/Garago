import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendCardReminder } from "@/lib/email";
import { CARD_REQUIRED_SINCE } from "@/lib/trial-card";

export const dynamic = "force-dynamic";

/**
 * Relance les garages qui ont créé leur compte mais n'ont jamais complété
 * l'ajout de leur carte (aucun abonnement Stripe réel — voir lib/trial-card.ts) —
 * leur tableau de bord reste bloqué tant que ce n'est pas fait.
 *
 * Cadence : J+1, J+3, J+7 après l'inscription, puis on arrête (3 relances max).
 * S'arrête aussi dès que le garage ajoute sa carte (stripePriceId non nul) ou
 * quitte l'état TRIAL.
 */
const SCHEDULE_DAYS = [1, 3, 7]; // index 0 → 1ʳᵉ relance, etc.

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await prisma.garage.findMany({
    where: {
      parentId:           null,
      subscriptionStatus: "TRIAL",
      stripePriceId:      null,
      cardReminderCount:  { lt: SCHEDULE_DAYS.length },
      createdAt:          { gte: CARD_REQUIRED_SINCE },
    },
    select: { id: true, name: true, email: true, createdAt: true, cardReminderCount: true, owner: { select: { email: true } } },
  });

  let sent = 0;
  const now = Date.now();

  for (const garage of candidates) {
    const daysSince = (now - garage.createdAt.getTime()) / (24 * 60 * 60 * 1000);

    // Combien de relances devraient déjà être parties à ce stade ?
    let targetCount = 0;
    for (const d of SCHEDULE_DAYS) if (daysSince >= d) targetCount++;

    if (targetCount <= garage.cardReminderCount) continue; // rien à envoyer pour l'instant

    const recipient = garage.email || garage.owner?.email || null;
    if (!recipient) continue;

    const isFinal = targetCount >= SCHEDULE_DAYS.length;
    try {
      await sendCardReminder({ to: recipient, garageName: garage.name, isFinal });
      await prisma.garage.update({
        where: { id: garage.id },
        data:  { cardReminderCount: targetCount, cardReminderSentAt: new Date() },
      });
      sent++;
    } catch (err) {
      console.error(`[card-reminders] Échec pour ${garage.id}:`, err);
    }
  }

  return NextResponse.json({ ok: true, sent, checked: candidates.length });
}
