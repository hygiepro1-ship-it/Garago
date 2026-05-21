import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = (session.user as any).id;
  const { brands } = await req.json();

  const garage = await prisma.garage.findUnique({ where: { ownerId: userId } });
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

  const updated = await prisma.garageBrand.findMany({ where: { garageId: garage.id } });
  return NextResponse.json(updated);
}
