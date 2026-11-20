import { randomInt } from "crypto";
import prisma from "@/lib/prisma";
import { sendAdminBadReviewAlert } from "@/lib/email";
import { addDaysStr, quebecToday } from "@/lib/availability";

// ── Code pour noter le garage ────────────────────────────────────────────────
// Chaque rendez-vous reçoit un code unique de 16 caractères, créé quand le garage le marque « Terminé »
// ou, à défaut, le lendemain de sa date (src/lib/review-requests.ts) ; jamais avant : le code n'existe
// pas tant qu'il ne peut pas servir. 16 caractères (lettres minuscules et chiffres,
// environ 82 bits : impossible à deviner). Il donne le droit de déposer UN avis, puis il est effacé :
// dès que l'avis est déposé, ou 15 jours après la date du rendez-vous (purge quotidienne,
// /api/cron/cleanup-abuse-tables). Un code volé ensuite ne sert plus à rien.

export const REVIEW_TOKEN_RE = /^[a-z0-9]{16}$/;
export const REVIEW_WINDOW_DAYS = 15;
const TOKEN_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

export function newReviewToken(): string {
  let s = "";
  for (let i = 0; i < 16; i++) s += TOKEN_ALPHABET[randomInt(TOKEN_ALPHABET.length)];
  return s;
}

/**
 * Rendez-vous qu'on peut noter : terminé (le garage l'a marqué « Terminé ») ou confirmé et dont la
 * date est passée (le garage ne l'a pas marqué, le client est quand même venu). Annulé, absent
 * (« NO_SHOW ») ou jamais confirmé : pas d'avis.
 */
export const REVIEWABLE_STATUSES = ["COMPLETED", "CONFIRMED"];
export function canReview(status: string, date: string): boolean {
  return status === "COMPLETED" || (status === "CONFIRMED" && date < quebecToday());
}

/** Vrai tant qu'on peut encore noter ce rendez-vous (jusqu'à 15 jours après sa date, inclus). */
export function reviewWindowOpen(date: string): boolean {
  return addDaysStr(date, REVIEW_WINDOW_DAYS) >= quebecToday();
}

// Contrôles communs aux avis sur un garage : avis laissé depuis un compte (/api/reviews)
// ou depuis le lien du message « véhicule prêt » (/api/reviews/rdv).

const OFFENSIVE_WORDS = [
  "merde", "putain", "connard", "connasse", "salaud", "salope",
  "enculé", "encule", "nique", "fdp", "va te", "imbécile", "idiot",
  "crisse", "tabarnak", "ostie", "estie", "câlisse", "calice",
  "fuck", "shit", "bitch", "bastard", "asshole",
];

export function containsOffensiveContent(text: string): boolean {
  const lower = text.toLowerCase();
  return OFFENSIVE_WORDS.some((word) => lower.includes(word));
}

// ── Seuils d'alerte ──────────────────────────────────────────────────────────
const MIN_REVIEWS_FOR_AVG_ALERT = 5;   // minimum d'avis avant d'alerter sur la moyenne
const AVG_ALERT_THRESHOLD       = 3.0; // note moyenne en dessous de laquelle on alerte
const STREAK_WINDOW_DAYS        = 30;  // fenêtre glissante pour détecter une série
const STREAK_COUNT              = 3;   // nombre d'avis ≤ 2 en N jours pour déclencher

export async function checkAndCreateAlerts(
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

/** Nom public d'un client sans compte : prénom et initiale du nom (« Marc Vidal » → « Marc V. »). */
export function reviewerDisplayName(fullName: string): string {
  const parts = fullName.replace(/[^\p{L}\p{M}' -]/gu, " ").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "Client";
  const first = parts[0].slice(0, 30);
  const last = parts.length > 1 ? ` ${parts[parts.length - 1][0].toUpperCase()}.` : "";
  return first[0].toUpperCase() + first.slice(1) + last;
}

/** Page où le client note le garage après sa réparation. */
export function reviewPageUrl(token: string): string {
  const base = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";
  return `${base}/avis/${token}`;
}
