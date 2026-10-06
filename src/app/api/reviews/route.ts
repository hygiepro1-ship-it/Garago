import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { sendAdminBadReviewAlert } from "@/lib/email";
import { cleanText, isRateLimited } from "@/lib/abuse";
import { quebecToday } from "@/lib/availability";

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

    return NextResponse.json(review);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
