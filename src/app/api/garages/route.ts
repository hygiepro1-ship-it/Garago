import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { activeSubscriptionOr } from "@/lib/garage-access";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const city = searchParams.get("city");
    const service = searchParams.get("service");
    const make = searchParams.get("make");
    const model = searchParams.get("model");
    const year = searchParams.get("year");
    const q = searchParams.get("q");
    const walkInOnly = searchParams.get("walkInOnly") === "1";
    const page = parseInt(searchParams.get("page") ?? "1");
    const limit = parseInt(searchParams.get("limit") ?? "12");

    // Un garage est visible si son abonnement (le sien s'il est principal/autonome,
    // celui de son garage principal s'il est une succursale) est actif, en essai,
    // ou impayé mais encore dans la période de grâce.
    const subOr = activeSubscriptionOr();
    const where: any = {
      AND: [
        {
          OR: [
            { parentId: null, OR: subOr },
            { parent: { OR: subOr } },
          ],
        },
      ],
    };

    if (city) where.city = { contains: city };
    if (walkInOnly) where.acceptsWalkIn = true;
    if (q) {
      where.AND.push({
        OR: [
          { name: { contains: q } },
          { description: { contains: q } },
          { city: { contains: q } },
        ],
      });
    }

    if (make) {
      where.brands = {
        some: {
          brand: make,
          accepts: true,
        },
      };

      // Filtre par modèle précis : un garage correspond s'il n'a configuré aucune
      // restriction de modèle pour cette marque (= tous les modèles acceptés par
      // défaut), ou s'il a explicitement coché ce modèle.
      if (model) {
        where.AND = [
          ...(where.AND ?? []),
          {
            OR: [
              { brandModels: { none: { brand: make } } },
              { brandModels: { some: { brand: make, model } } },
            ],
          },
        ];
      }
    }

    if (service) {
      where.services = {
        some: {
          categoryId: service,
          active: true,
        },
      };
    }

    const sort = searchParams.get("sort");
    const orderBy: any =
      sort === "popular"
        ? [{ isAmbassador: "desc" }, { reviews: { _count: "desc" } }, { appointments: { _count: "desc" } }]
        : [{ isAmbassador: "desc" }, { createdAt: "desc" }];

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
            select: { reviews: true, appointments: true },
          },
        },
        orderBy,
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
