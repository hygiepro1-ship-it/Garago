import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { containsOffensiveContent, checkAndCreateAlerts } from "@/lib/review-checks";
import { cleanText, isRateLimited } from "@/lib/abuse";
import { quebecToday } from "@/lib/availability";
import { revalidateGarage } from "@/lib/revalidate-garage";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { garageId, rating: ratingRaw, title: titleRaw, comment: commentRaw, service: serviceRaw, vehicleMake: makeRaw, vehicleModel: modelRaw, vehicleYear } = body;

    const rating = Number(ratingRaw);
    if (!garageId || typeof garageId !== "string" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Données manquantes ou note invalide (1 à 5)" }, { status: 400 });
    }
    const title = cleanText(titleRaw, 100) || null;
    const comment = commentRaw ? String(commentRaw).replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ").trim().slice(0, 2000) : null;
    const service = cleanText(serviceRaw, 80) || null;
    const vehicleMake = cleanText(makeRaw, 60) || null;
    const vehicleModel = cleanText(modelRaw, 60) || null;

    const userId = session.user.id;

    // Anti-abus : au plus 5 avis par heure et par compte.
    if (await isRateLimited(`rv:${userId}`, 5, 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Trop d'avis en peu de temps. Réessayez plus tard." }, { status: 429 });
    }

    const garageRow = await prisma.garage.findUnique({ where: { id: garageId }, select: { ownerId: true } });
    if (!garageRow) return NextResponse.json({ error: "Garage introuvable" }, { status: 404 });
    if (garageRow.ownerId === userId) {
      return NextResponse.json({ error: "Vous ne pouvez pas évaluer votre propre garage." }, { status: 403 });
    }

    // « Avis vérifiés » : seul un client ayant réellement eu un rendez-vous dans ce garage peut l'évaluer
    // (rendez-vous terminé, ou passé et non annulé) — lié à son compte ou à son courriel.
    const email = session.user.email;
    const who: Record<string, unknown>[] = [{ userId }];
    if (email) who.push({ customerEmail: { equals: email, mode: "insensitive" } });
    const visit = await prisma.appointment.findFirst({
      where: {
        garageId,
        OR: who as any,
        AND: [{ OR: [{ status: "COMPLETED" }, { status: "CONFIRMED", date: { lt: quebecToday() } }] }],
      },
      select: { id: true },
    });
    if (!visit) {
      return NextResponse.json({ error: "Seuls les clients ayant eu un rendez-vous dans ce garage peuvent laisser un avis." }, { status: 403 });
    }

    const existing = await prisma.review.findFirst({ where: { garageId, userId } });
    if (existing) {
      return NextResponse.json({ error: "Vous avez déjà laissé un avis pour ce garage" }, { status: 409 });
    }

    const textToCheck = `${title ?? ""} ${comment ?? ""}`;
    const isHidden    = containsOffensiveContent(textToCheck);

    const review = await prisma.review.create({
      data: {
        garageId,
        userId,
        rating,
        title, comment, service, vehicleMake, vehicleModel,
        vehicleYear: Number.isInteger(Number(vehicleYear)) && Number(vehicleYear) >= 1950 && Number(vehicleYear) <= new Date().getFullYear() + 1 ? Number(vehicleYear) : null,
        isHidden,
      },
      include: {
        user:   { select: { name: true, image: true } },
        garage: { select: { name: true, slug: true } },
      },
    });

    // Vérification des seuils — après réponse pour ne pas bloquer le client
    if (!isHidden) {
      checkAndCreateAlerts(
        garageId,
        review.garage.name,
        review.garage.slug,
        review.rating,
        review.user?.name ?? null,
      ).catch(err => console.error("[Review alert check]", err));
    }

    await revalidateGarage({ slug: review.garage.slug });
    return NextResponse.json(review);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
