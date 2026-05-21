import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = (session.user as any).id;
  const { services } = await req.json();

  const garage = await prisma.garage.findUnique({ where: { ownerId: userId } });
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
          durationMin: s.durationMin ? parseInt(s.durationMin) : null,
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
