import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if ((session?.user as any)?.role !== "ADMIN") return null;
  return session;
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ garageId: string }> }
) {
  if (!await requireAdmin()) return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
  const { garageId } = await params;
  const { action } = await req.json(); // "approve" | "reject"

  if (action === "approve") {
    const garage = await prisma.garage.findUnique({ where: { id: garageId }, select: { descriptionDraft: true } });
    await prisma.garage.update({
      where: { id: garageId },
      data: {
        description:       garage?.descriptionDraft ?? null,
        descriptionDraft:  null,
        descriptionStatus: "APPROVED",
      },
    });
    return NextResponse.json({ ok: true });
  }

  if (action === "reject") {
    await prisma.garage.update({
      where: { id: garageId },
      data: { descriptionDraft: null, descriptionStatus: "REJECTED" },
    });
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Action invalide" }, { status: 400 });
}
