import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Seuils minimaux avant d'afficher une stat
const THRESHOLDS = { garages: 30, reviews: 50, cities: 2 } as const;

// Arrondit au multiple de 50 inférieur, minimum 100
function roundStat(n: number): number {
  return Math.max(100, Math.floor(n / 50) * 50);
}

// Formate un nombre avec séparateur d'espace (ex: 8 400)
function fmtNum(n: number): string {
  return n.toLocaleString("fr-CA").replace(/,/g, " ");
}

export async function GET() {
  const [garageCount, reviewAgg, cityRows] = await Promise.all([
    prisma.garage.count(),
    prisma.review.aggregate({
      _count: { id: true },
      _avg:   { rating: true },
    }),
    prisma.garage.findMany({
      distinct: ["city"],
      select:   { city: true },
      where:    { city: { not: "" } },
    }),
  ]);

  const totalReviews = reviewAgg._count.id;
  const avgRating    = reviewAgg._avg.rating;
  const cityCount    = cityRows.length;

  return NextResponse.json({
    // null = sous le seuil → le front ne doit pas afficher la stat
    garages:   garageCount  >= THRESHOLDS.garages  ? `${fmtNum(roundStat(garageCount))}+`  : null,
    reviews:   totalReviews >= THRESHOLDS.reviews  ? `${fmtNum(roundStat(totalReviews))}+` : null,
    avgRating: avgRating != null                   ? `${Number(avgRating).toFixed(1)} / 5`  : null,
    cities:    cityCount    >= THRESHOLDS.cities   ? `${fmtNum(roundStat(cityCount))}+`    : null,
  });
}
