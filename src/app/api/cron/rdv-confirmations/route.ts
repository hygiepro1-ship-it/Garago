import { NextRequest, NextResponse } from "next/server";
import { processRdvConfirmations } from "@/lib/rdv-confirmation-run";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

// Appelée toutes les ~15 minutes (service de tâches planifiées externe ou Vercel
// Cron) : envoie les demandes de confirmation, les relances et libère les
// créneaux non confirmés. Voir lib/rdv-confirmation.ts pour les règles.
export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const stats = await processRdvConfirmations();
  return NextResponse.json({ ok: true, ...stats });
}
