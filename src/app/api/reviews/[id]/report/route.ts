import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendReviewReport } from "@/lib/email";

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const garage = await prisma.garage.findFirst({
    where: { ownerId: session.user.id },
  });
  if (!garage) return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });

  const review = await prisma.review.findFirst({
    where: { id, garageId: garage.id },
    include: { user: { select: { name: true } } },
  });
  if (!review) return NextResponse.json({ error: "Avis introuvable" }, { status: 404 });

  const body = await req.json().catch(() => ({}));

  await sendReviewReport({
    reviewId:     review.id,
    reviewerName: review.user?.name ?? null,
    reviewRating: review.rating,
    reviewText:   review.comment ?? null,
    garageName:   garage.name,
    garageSlug:   garage.slug,
    reason:       body.reason ?? null,
  });

  return NextResponse.json({ ok: true });
}
