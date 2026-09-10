import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

/** GET /api/garage/list — tous les garages du propriétaire connecté (principal + succursales). */
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const garages = await prisma.garage.findMany({
    where: { ownerId: session.user.id },
    select: {
      id: true,
      name: true,
      city: true,
      slug: true,
      parentId: true,
      subscriptionStatus: true,
      subscriptionEndAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  // Garage principal (parentId null) toujours en tête
  garages.sort((a, b) => (a.parentId === null ? -1 : 0) - (b.parentId === null ? -1 : 0));

  return NextResponse.json(garages);
}
