import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "GARAGE_OWNER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const { id } = await params;
    const { reply } = await req.json();

    // Verify this review belongs to the owner's garage
    const ownerId = (session.user as any).id;
    const review = await prisma.review.findFirst({
      where: { id, garage: { ownerId } },
    });
    if (!review) {
      return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });
    }

    const updated = await prisma.review.update({
      where: { id },
      data: { ownerReply: reply || null },
      include: { user: { select: { name: true, image: true } } },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
