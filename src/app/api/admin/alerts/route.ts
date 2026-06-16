import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  if ((session.user as any).role !== "ADMIN") return null;
  return session;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const alerts = await prisma.garageAlert.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      garage: { select: { name: true, slug: true, city: true } },
    },
  });

  return NextResponse.json(alerts);
}

export async function PATCH(req: NextRequest) {
  if (!(await requireAdmin(req))) return NextResponse.json({ error: "Non autorisé" }, { status: 403 });

  const { ids, isRead } = await req.json();
  if (!Array.isArray(ids)) return NextResponse.json({ error: "ids requis" }, { status: 400 });

  await prisma.garageAlert.updateMany({
    where: { id: { in: ids } },
    data:  { isRead: isRead ?? true },
  });

  return NextResponse.json({ updated: ids.length });
}
