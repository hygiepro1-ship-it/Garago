import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const top = await prisma.garageService.groupBy({
      by: ["categoryId"],
      where: { active: true },
      _count: { categoryId: true },
      orderBy: { _count: { categoryId: "desc" } },
      take: 2,
    });

    const ids = top.map((t) => t.categoryId);
    const categories = await prisma.serviceCategory.findMany({
      where: { id: { in: ids } },
    });

    // Respect original ranking order
    const ordered = ids.map((id) => categories.find((c) => c.id === id)).filter(Boolean);

    return NextResponse.json(ordered);
  } catch (err) {
    console.error(err);
    return NextResponse.json([], { status: 500 });
  }
}
