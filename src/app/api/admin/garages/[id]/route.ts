import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") return null;
  return session;
}

// DELETE /api/admin/garages/[id] — supprime définitivement un garage et toutes
// ses données rattachées (services, marques, avis, rendez-vous, horaires,
// photos, favoris, alertes — toutes en cascade au niveau de la base). Ne
// touche pas au compte utilisateur du propriétaire.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { id } = await params;

  const garage = await prisma.garage.findUnique({
    where: { id },
    select: { id: true, name: true, _count: { select: { branches: true } } },
  });
  if (!garage) return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });

  if (garage._count.branches > 0) {
    return NextResponse.json(
      { error: "Ce garage a des succursales rattachées. Supprimez-les (ou détachez-les) d'abord." },
      { status: 409 }
    );
  }

  await prisma.garage.delete({ where: { id } });

  return NextResponse.json({ ok: true, deleted: garage.name });
}
