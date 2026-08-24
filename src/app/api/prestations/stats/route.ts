import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const revalidate = 3600; // 1h cache

export async function GET() {
  const rows = await prisma.garageService.groupBy({
    by: ["categoryId"],
    _avg: { durationMin: true },
    _count: { durationMin: true },
    where: { active: true, durationMin: { not: null } },
  });

  const stats: Record<string, { avgDuration: number; garageCount: number }> = {};
  for (const row of rows) {
    if (row._avg.durationMin) {
      stats[row.categoryId] = {
        avgDuration: Math.round(row._avg.durationMin),
        garageCount: row._count.durationMin,
      };
    }
  }

  return NextResponse.json(stats);
}
