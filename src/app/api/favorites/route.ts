import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json([], { status: 401 });
  const userId = session.user.id;

  const favs = await prisma.garageFavorite.findMany({
    where: { userId },
    include: {
      garage: {
        select: {
          id: true, name: true, slug: true, city: true, province: true,
          phone: true, logoUrl: true,
          _count: { select: { reviews: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(favs);
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
  const userId = session.user.id;
  const { garageId } = await req.json().catch(() => ({}));
  if (!garageId || typeof garageId !== "string") return NextResponse.json({ error: "garageId requis" }, { status: 400 });
  if (!(await prisma.garage.findUnique({ where: { id: garageId }, select: { id: true } }))) {
    return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });
  }
  if ((await prisma.garageFavorite.count({ where: { userId } })) >= 200) {
    return NextResponse.json({ error: "Limite de favoris atteinte." }, { status: 400 });
  }

  const fav = await prisma.garageFavorite.upsert({
    where:  { userId_garageId: { userId, garageId } },
    update: {},
    create: { userId, garageId },
  });

  return NextResponse.json(fav, { status: 201 });
}
