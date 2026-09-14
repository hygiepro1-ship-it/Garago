import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") return null;
  return session;
}

export async function GET(_req: NextRequest) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const garages = await prisma.garage.findMany({
    where: { verificationStatus: "PENDING" },
    select: {
      id: true, name: true, slug: true, neq: true,
      address: true, city: true, postalCode: true, phone: true,
      createdAt: true,
      owner: { select: { name: true, email: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(garages);
}
