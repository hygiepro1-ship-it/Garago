import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  // Verify this is a legitimate Vercel cron call
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Bascule tout garage encore en TRIAL dont la période d'essai est révolue vers EXPIRED
  const result = await prisma.garage.updateMany({
    where: {
      subscriptionStatus: "TRIAL",
      subscriptionEndAt:  { lt: new Date() },
    },
    data: { subscriptionStatus: "EXPIRED" },
  });

  return NextResponse.json({ ok: true, expired: result.count });
}
