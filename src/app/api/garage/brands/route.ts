import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { ownedGarageWhere, readGarageId } from "@/lib/garage-access";
import { cleanText } from "@/lib/abuse";

export async function PUT(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = session.user.id;
  const { brands, brandModels } = await req.json();

  const garage = await prisma.garage.findFirst({ where: ownedGarageWhere(userId, readGarageId(req.url)) });
  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  // Upsert all brands
  // Validation avant toute écriture (listes bornées, textes nettoyés), puis écriture atomique : une requête
  // invalide ne doit jamais effacer les marques existantes.
  if (!Array.isArray(brands) || (brandModels !== undefined && (typeof brandModels !== "object" || brandModels === null || Array.isArray(brandModels)))) {
    return NextResponse.json({ error: "Données de marques invalides." }, { status: 400 });
  }
  const brandRows: { garageId: string; brand: string; accepts: boolean; note: string | null }[] = [];
  const seenBrands = new Set<string>();
  for (const raw of Array.isArray(brands) ? brands.slice(0, 300) : []) {
    const b = (raw ?? {}) as Record<string, unknown>;
    const brand = cleanText(b.brand, 50);
    if (!brand || seenBrands.has(brand)) continue;
    seenBrands.add(brand);
    brandRows.push({ garageId: garage.id, brand, accepts: b.accepts === true, note: cleanText(b.note, 200) || null });
  }
  const modelRows: { garageId: string; brand: string; model: string }[] = [];
  if (brandModels && typeof brandModels === "object" && !Array.isArray(brandModels)) {
    for (const [brandRaw, models] of Object.entries(brandModels as Record<string, unknown>).slice(0, 300)) {
      const brand = cleanText(brandRaw, 50);
      if (!brand || !Array.isArray(models)) continue;
      for (const m of models.slice(0, 300)) {
        const model = cleanText(m, 60);
        if (model) modelRows.push({ garageId: garage.id, brand, model });
      }
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.garageBrand.deleteMany({ where: { garageId: garage.id } });
    if (brandRows.length > 0) await tx.garageBrand.createMany({ data: brandRows });
    if (brandModels !== undefined) {
      await tx.garageBrandModel.deleteMany({ where: { garageId: garage.id } });
      if (modelRows.length > 0) await tx.garageBrandModel.createMany({ data: modelRows });
    }
  });

  const updated = await prisma.garageBrand.findMany({ where: { garageId: garage.id } });
  return NextResponse.json(updated);
}
