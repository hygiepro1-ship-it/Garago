import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") return null;
  return session;
}

// GET /api/admin/garages — liste complète des garages principaux (pas les
// succursales) avec leurs indicateurs de santé, pour la vue "Garages" du
// tableau de bord admin (distinct de /pending, réservé à la file NEQ).
export async function GET(_req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const garages = await prisma.garage.findMany({
    where: { parentId: null },
    select: {
      id: true, name: true, slug: true, city: true, province: true,
      subscriptionStatus: true, verificationStatus: true, createdAt: true,
      isAmbassador: true,
      owner: { select: { name: true, email: true } },
      reviews: { select: { rating: true } },
      _count: { select: { appointments: true, reviews: true, services: true, branches: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const withHealth = garages.map((g) => {
    const avgRating = g.reviews.length > 0
      ? g.reviews.reduce((s, r) => s + r.rating, 0) / g.reviews.length
      : null;
    return {
      id: g.id, name: g.name, slug: g.slug, city: g.city, province: g.province,
      subscriptionStatus: g.subscriptionStatus, verificationStatus: g.verificationStatus,
      createdAt: g.createdAt, isAmbassador: g.isAmbassador,
      owner: g.owner,
      appointmentCount: g._count.appointments,
      reviewCount: g._count.reviews,
      serviceCount: g._count.services,
      branchCount: g._count.branches,
      avgRating: avgRating !== null ? Math.round(avgRating * 10) / 10 : null,
    };
  });

  return NextResponse.json(withHealth);
}
