import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") return null;
  return session;
}

// GET /api/admin/claims — demandes de réclamation de fiche en attente
export async function GET(_req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });

  const claims = await prisma.claimRequest.findMany({
    where: { status: "en_attente" },
    orderBy: { createdAt: "asc" },
    include: { garage: { select: { name: true, slug: true, city: true, address: true, phone: true } } },
  });

  return NextResponse.json(claims);
}
