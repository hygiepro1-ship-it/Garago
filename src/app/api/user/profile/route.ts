import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });

  const userId = (session.user as any).id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      name:     true,
      email:    true,
      phone:    true,
      vehicles: {
        orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        select: { id: true, year: true, make: true, model: true, isDefault: true },
      },
    },
  });

  if (!user) return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 });

  return NextResponse.json(user);
}
