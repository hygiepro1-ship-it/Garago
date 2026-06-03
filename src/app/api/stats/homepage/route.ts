import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

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
    garages:    `${fmtNum(roundStat(garageCount))}+`,
    reviews:    `${fmtNum(roundStat(totalReviews))}+`,
    avgRating:  avgRating ? `${Number(avgRating).toFixed(1)} / 5` : "— / 5",
    cities:     `${fmtNum(roundStat(cityCount))}+`,
  });
}
