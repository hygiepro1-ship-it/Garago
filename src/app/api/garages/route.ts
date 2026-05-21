import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const service = searchParams.get("service");
    const make = searchParams.get("make");
    const year = searchParams.get("year");
    const q = searchParams.get("q");
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "12");

    const where: any = {
      subscriptionStatus: { in: ["ACTIVE", "TRIAL"] },
    };

    if (city) where.city = { contains: city };
    if (q) {
      where.OR = [
        { name: { contains: q } },
        { description: { contains: q } },
        { city: { contains: q } },
      ];
    }

    if (make) {
      where.brands = {
        some: {
          brand: make,
          accepts: true,
        },
      };
    }

    if (service) {
      where.services = {
        some: {
          categoryId: service,
          active: true,
        },
      };
    }

    const [garages, total] = await Promise.all([
      prisma.garage.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          services: {
            include: { category: true },
            where: { active: true },
          },
          brands: true,
          reviews: {
            select: { rating: true },
          },
          _count: {
            select: { reviews: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.garage.count({ where }),
    ]);

    const garagesWithRating = garages.map((g) => {
      const avgRating =
        g.reviews.length > 0
          ? g.reviews.reduce((s, r) => s + r.rating, 0) / g.reviews.length
          : 0;
      return {
        ...g,
        avgRating: Math.round(avgRating * 10) / 10,
        reviewCount: g._count.reviews,
      };
    });

    return NextResponse.json({
      garages: garagesWithRating,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
