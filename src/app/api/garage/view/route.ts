import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { garageId } = await req.json();
    if (!garageId) return NextResponse.json({ ok: false }, { status: 400 });

    await prisma.garageProfileView.create({ data: { garageId } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
