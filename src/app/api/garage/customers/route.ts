import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedGarageWhere, readGarageId } from "@/lib/garage-access";
import { linkOrphanAppointments, searchCustomers } from "@/lib/customers";

// POST /api/garage/customers { q: "jean" } — clients déjà connus du garage dont le
// nom ou le téléphone contient `q`, pour préremplir le formulaire de rendez-vous.
// En POST pour que le nom tapé ne se retrouve pas dans les adresses journalisées.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const garage = await prisma.garage.findFirst({ where: ownedGarageWhere(session.user.id, readGarageId(req.url)), select: { id: true } });
  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const q = typeof body.q === "string" ? body.q.slice(0, 80) : "";
  if (q.trim().length < 2) return NextResponse.json([]);

  await linkOrphanAppointments(garage.id);
  return NextResponse.json(await searchCustomers(garage.id, q), { headers: { "Cache-Control": "no-store" } });
}
