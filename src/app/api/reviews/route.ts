import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendAdminBadReviewAlert } from "@/lib/email";

const OFFENSIVE_WORDS = [
  "merde", "putain", "connard", "connasse", "salaud", "salope",
  "enculé", "encule", "nique", "fdp", "va te", "imbécile", "idiot",
  "crisse", "tabarnak", "ostie", "estie", "câlisse", "calice",
  "fuck", "shit", "bitch", "bastard", "asshole",
];

function containsOffensiveContent(text: string): boolean {
  const lower = text.toLowerCase();
  return OFFENSIVE_WORDS.some((word) => lower.includes(word));
}

// ── Seuils d'alerte ──────────────────────────────────────────────────────────
const MIN_REVIEWS_FOR_AVG_ALERT = 5;   // minimum d'avis avant d'alerter sur la moyenne
const AVG_ALERT_THRESHOLD       = 3.0; // note moyenne en dessous de laquelle on alerte
const STREAK_WINDOW_DAYS        = 30;  // fenêtre glissante pour détecter une série
const STREAK_COUNT              = 3;   // nombre d'avis ≤ 2 en N jours pour déclencher

async function checkAndCreateAlerts(
  garageId:     string,
  garageName:   string,
  garageSlug:   string,
  newRating:    number,
  reviewerName: string | null,
) {
  // Récupère tous les avis visibles du garage
  const allReviews = await prisma.review.findMany({
    where:   { garageId, isHidden: false },
    orderBy: { createdAt: "desc" },
    select:  { rating: true, createdAt: true },
  });

  const count   = allReviews.length;
  const avg     = count > 0 ? allReviews.reduce((s, r) => s + r.rating, 0) / count : 0;
  const avgRounded = Math.round(avg * 10) / 10;

  // Évite les doublons d'alerte : regarde si une alerte du même type existe dans les 24h
  async function alreadyAlerted(type: string) {
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const existing = await prisma.garageAlert.findFirst({
      where: { garageId, type, createdAt: { gte: since } },
    });
    return !!existing;
  }

  const alertsToCreate: Array<{ type: string; message: string }> = [];

  // 1. Avis 1 étoile
  if (newRating === 1) {
    if (!(await alreadyAlerted("ONE_STAR"))) {
      alertsToCreate.push({
        type:    "ONE_STAR",
        message: `${garageName} a reçu un avis 1/5. Moyenne actuelle : ${avgRounded}/5 (${count} avis).`,
      });
    }
  }

  // 2. Note moyenne sous le seuil (min 5 avis)
  if (count >= MIN_REVIEWS_FOR_AVG_ALERT && avg < AVG_ALERT_THRESHOLD) {
    if (!(await alreadyAlerted("LOW_RATING"))) {
      alertsToCreate.push({
        type:    "LOW_RATING",
        message: `${garageName} a une note moyenne de ${avgRounded}/5 sur ${count} avis.`,
      });
    }
  }

  // 3. Série de mauvais avis (≤ 2 étoiles dans les 30 derniers jours)
  const since30 = new Date(Date.now() - STREAK_WINDOW_DAYS * 24 * 3600 * 1000);
  const recentBad = allReviews.filter(r => r.rating <= 2 && r.createdAt >= since30);
  if (recentBad.length >= STREAK_COUNT) {
    if (!(await alreadyAlerted("BAD_STREAK"))) {
      alertsToCreate.push({
        type:    "BAD_STREAK",
        message: `${garageName} a reçu ${recentBad.length} avis ≤ 2/5 en moins de ${STREAK_WINDOW_DAYS} jours.`,
      });
    }
  }

  // Crée les alertes en DB + envoie les emails
  await Promise.all(alertsToCreate.map(async ({ type, message }) => {
    await prisma.garageAlert.create({
      data: { garageId, type, message, avgRating: avgRounded, reviewCount: count, emailSent: true },
    });
    await sendAdminBadReviewAlert({
      garageName,
      garageSlug,
      alertType:    type as "LOW_RATING" | "BAD_STREAK" | "ONE_STAR",
      avgRating:    avgRounded,
      reviewCount:  count,
      lastRating:   newRating,
      reviewerName,
    }).catch(err => console.error("[Alert email]", err));
  }));
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const body = await req.json();
    const { garageId, rating, title, comment, service, vehicleMake, vehicleModel, vehicleYear } = body;

    if (!garageId || !rating) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const userId = (session.user as any).id;

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
        rating: parseInt(rating),
        title, comment, service, vehicleMake, vehicleModel,
        vehicleYear: vehicleYear ? parseInt(vehicleYear) : null,
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

    return NextResponse.json(review);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
