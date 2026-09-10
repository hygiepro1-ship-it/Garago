import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ownedGarageWhere, readGarageId } from "@/lib/garage-access";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  const { brands, brandModels } = await req.json();

  const garage = await prisma.garage.findFirst({ where: ownedGarageWhere(userId, readGarageId(req.url)) });
  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  // Upsert all brands
  await prisma.garageBrand.deleteMany({ where: { garageId: garage.id } });
  if (brands?.length > 0) {
    await prisma.garageBrand.createMany({
      data: brands.map((b: { brand: string; accepts: boolean; note?: string }) => ({
        garageId: garage.id,
        brand: b.brand,
        accepts: b.accepts,
        note: b.note,
      })),
    });
  }

  // Modèles précis par marque — absence d'entrée pour une marque = tous les modèles acceptés
  await prisma.garageBrandModel.deleteMany({ where: { garageId: garage.id } });
  if (brandModels && typeof brandModels === "object") {
    const rows = Object.entries(brandModels as Record<string, string[]>)
      .flatMap(([brand, models]) => (models ?? []).map((model) => ({ garageId: garage.id, brand, model })));
    if (rows.length > 0) {
      await prisma.garageBrandModel.createMany({ data: rows });
    }
  }

  const updated = await prisma.garageBrand.findMany({ where: { garageId: garage.id } });
  return NextResponse.json(updated);
}
