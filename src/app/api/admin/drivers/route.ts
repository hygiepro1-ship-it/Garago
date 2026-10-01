import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") return null;
  return session;
}

// GET /api/admin/drivers — liste des conducteurs inscrits, pour la vue
// "Conducteurs" du tableau de bord admin.
export async function GET(_req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const drivers = await prisma.user.findMany({
    where: { role: "DRIVER" },
    select: {
      id: true, name: true, email: true, phone: true, createdAt: true,
      marketingConsent: true,
      _count: { select: { appointments: true, favorites: true, vehicles: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(drivers.map((d) => ({
    id: d.id, name: d.name, email: d.email, phone: d.phone, createdAt: d.createdAt,
    marketingConsent: d.marketingConsent,
    appointmentCount: d._count.appointments,
    favoriteCount: d._count.favorites,
    vehicleCount: d._count.vehicles,
  })));
}
