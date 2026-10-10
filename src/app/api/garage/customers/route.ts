import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedGarageWhere, readGarageId } from "@/lib/garage-access";
import { linkOrphanAppointments, listCustomers, searchCustomers } from "@/lib/customers";

// POST /api/garage/customers
//   { q: "jean" }                      — suggestions du formulaire de rendez-vous (quelques clients)
//   { list: true, q?: "jean", page? }  — une page du carnet de clients, par ordre alphabétique
// En POST pour que le nom tapé ne se retrouve pas dans les adresses journalisées.
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const garage = await prisma.garage.findFirst({ where: ownedGarageWhere(session.user.id, readGarageId(req.url)), select: { id: true } });
  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const q = typeof body.q === "string" ? body.q.slice(0, 80) : "";
  const headers = { "Cache-Control": "no-store" };

  if (body.list === true) {
    await linkOrphanAppointments(garage.id);
    return NextResponse.json(await listCustomers(garage.id, q, Number(body.page) || 1), { headers });
  }

  if (q.trim().length < 2) return NextResponse.json([]);
  await linkOrphanAppointments(garage.id);
  return NextResponse.json(await searchCustomers(garage.id, q), { headers });
}
