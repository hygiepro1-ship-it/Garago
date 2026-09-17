import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ownedGarageWhere, readGarageId } from "@/lib/garage-access";

// Bornée pour éviter qu'une durée nulle/négative (saisie invalide, ou 0) ne
// puisse un jour faire boucler indéfiniment la génération de créneaux
// (voir generateSlots) — et qu'une valeur absurde ne bloque une journée entière.
function sanitizeDuration(v: unknown): number | null {
  const n = typeof v === "string" ? parseInt(v, 10) : typeof v === "number" ? v : NaN;
  if (!Number.isFinite(n) || n <= 0) return null; // pas de valeur = durée par défaut (60 min)
  return Math.min(Math.max(Math.round(n), 5), 480);
}

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  const { services } = await req.json();

  const garage = await prisma.garage.findFirst({ where: ownedGarageWhere(userId, readGarageId(req.url)) });
  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  await prisma.garageService.deleteMany({ where: { garageId: garage.id } });

  if (services?.length > 0) {
    // Ensure service categories exist
    for (const s of services) {
      const cat = await prisma.serviceCategory.upsert({
        where: { id: s.categoryId },
        update: {},
        create: {
          id: s.categoryId,
          name: s.categoryName,
          icon: s.icon,
        },
      });

      await prisma.garageService.create({
        data: {
          garageId: garage.id,
          categoryId: cat.id,
          name: s.name,
          description: s.description,
          priceMin: s.priceMin ? parseFloat(s.priceMin) : null,
          priceMax: s.priceMax ? parseFloat(s.priceMax) : null,
          durationMin: sanitizeDuration(s.durationMin),
          active: true,
        },
      });
    }
  }

  const updated = await prisma.garageService.findMany({
    where: { garageId: garage.id },
    include: { category: true },
  });
  return NextResponse.json(updated);
}
