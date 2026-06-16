import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  const garages = await prisma.garage.findMany({
    where: { hourlyRate: { not: null } },
    select: { hourlyRate: true },
  });

  const rates = garages.map((g) => g.hourlyRate as number).filter((r) => r > 0);
  const minRate = rates.length > 0 ? Math.min(...rates) : 90;
  const avgRate =
    rates.length > 0
      ? Math.round(rates.reduce((a, b) => a + b, 0) / rates.length)
      : 95;

  return NextResponse.json({ minRate, avgRate, garageCount: rates.length });
}
