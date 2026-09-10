import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ownedGarageWhere, readGarageId } from "@/lib/garage-access";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  const garage = await prisma.garage.findFirst({ where: ownedGarageWhere(userId, readGarageId(req.url)), select: { id: true } });
  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  const { horaires } = await req.json();
  if (!Array.isArray(horaires)) return NextResponse.json({ error: "Données invalides" }, { status: 400 });

  const TIME_RE = /^([01]\d|2[0-3]):([0-5]\d)$/;
  for (const h of horaires) {
    if (typeof h.dayOfWeek !== "number" || h.dayOfWeek < 0 || h.dayOfWeek > 6) {
      return NextResponse.json({ error: "Jour invalide" }, { status: 400 });
    }
    if (h.isClosed) continue;
    if (!TIME_RE.test(h.openTime) || !TIME_RE.test(h.closeTime)) {
      return NextResponse.json({ error: "Format d'heure invalide (attendu HH:MM)" }, { status: 400 });
    }
    if (h.closeTime <= h.openTime) {
      return NextResponse.json({ error: "L'heure de fermeture doit être après l'heure d'ouverture" }, { status: 400 });
    }
  }

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
