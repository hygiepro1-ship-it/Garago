import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const garage = await prisma.garage.findUnique({
      where: { slug },
      include: {
        services: {
          include: { category: true },
          where: { active: true },
          orderBy: { category: { sortOrder: "asc" } },
        },
        brands: { orderBy: { brand: "asc" } },
        availability: { orderBy: { dayOfWeek: "asc" } },
        photos: { orderBy: { sortOrder: "asc" } },
        reviews: {
          include: { user: { select: { name: true, image: true } } },
          where: { isHidden: false },
          orderBy: { createdAt: "desc" as const },
          take: 20,
        },
        owner: { select: { name: true, email: true } },
        _count: { select: { reviews: true } },
      },
    });

    if (!garage) {
      return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });
    }

    const avgRating =
      garage.reviews.length > 0
        ? garage.reviews.reduce((s, r) => s + r.rating, 0) / garage.reviews.length
        : 0;

    return NextResponse.json({
      ...garage,
      avgRating: Math.round(avgRating * 10) / 10,
      reviewCount: garage._count.reviews,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
