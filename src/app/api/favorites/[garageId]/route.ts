import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ garageId: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const userId  = (session.user as any).id;
  const { garageId } = await params;

  await prisma.garageFavorite.deleteMany({ where: { userId, garageId } });
  return NextResponse.json({ ok: true });
}
