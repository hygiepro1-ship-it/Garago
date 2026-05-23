import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = (session.user as any).id;
  const garage = await prisma.garage.findUnique({ where: { ownerId: userId }, select: { id: true } });
  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  const { horaires } = await req.json();
  if (!Array.isArray(horaires)) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  // Upsert each day
  await Promise.all(
    horaires.map((h: { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }) =>
      prisma.garageAvailability.upsert({
        where: { garageId_dayOfWeek: { garageId: garage.id, dayOfWeek: h.dayOfWeek } },
        update: { openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
        create: { garageId: garage.id, dayOfWeek: h.dayOfWeek, openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
      })
    )
  );

  return NextResponse.json({ success: true });
}
