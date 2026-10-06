import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { clientIp, isRateLimited } from "@/lib/abuse";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { garageId } = await req.json();
    if (!garageId || typeof garageId !== "string") return NextResponse.json({ ok: false }, { status: 400 });

    // Statistiques fiables : une seule vue comptée par visiteur et par garage toutes les 30 minutes.
    if (await isRateLimited(`gv:${clientIp(req)}:${garageId}`, 1, 30 * 60 * 1000)) {
      return NextResponse.json({ ok: true });
    }
    const exists = await prisma.garage.findUnique({ where: { id: garageId }, select: { id: true } });
    if (!exists) return NextResponse.json({ ok: false }, { status: 404 });

    await prisma.garageProfileView.create({ data: { garageId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
