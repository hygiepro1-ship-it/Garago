import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { clientIp, isRateLimited } from "@/lib/abuse";
import { containsOffensiveContent, checkAndCreateAlerts, reviewerDisplayName, REVIEW_TOKEN_RE, reviewWindowOpen, canReview, REVIEWABLE_STATUSES } from "@/lib/review-checks";
import { revalidateGarage } from "@/lib/revalidate-garage";

// Avis sur un garage laissé depuis le lien du message « véhicule prêt » (page /avis/[jeton]).
// Le code prouve la visite : l'avis est « vérifié », sans compte. Le code est effacé dès que
// l'avis est déposé (un seul avis par rendez-vous) et ne vaut plus rien 15 jours après le rendez-vous.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body._hp) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const token = typeof body.token === "string" && REVIEW_TOKEN_RE.test(body.token) ? body.token : null;
  const rating = Number(body.rating);
  if (!token) return NextResponse.json({ error: "Lien invalide." }, { status: 400 });
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Choisissez une note de 1 à 5." }, { status: 400 });
  }
  const comment = body.comment ? String(body.comment).replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ").trim().slice(0, 2000) || null : null;
  if (comment && /(https?:\/\/|www\.)/i.test(comment)) return NextResponse.json({ error: "Les liens ne sont pas autorisés." }, { status: 400 });
  if (await isRateLimited(`rvrdv:${clientIp(req)}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop d'envois. Réessayez plus tard." }, { status: 429 });
  }

  const appt = await prisma.appointment.findFirst({
    where: { reviewToken: token, status: { in: REVIEWABLE_STATUSES } },
    select: {
      id: true, garageId: true, userId: true, customerName: true, serviceName: true, date: true, status: true,
      vehicleMake: true, vehicleModel: true, vehicleYear: true,
      garage: { select: { name: true, slug: true } },
    },
  });
  if (!appt || !canReview(appt.status, appt.date) || !reviewWindowOpen(appt.date)) return NextResponse.json({ error: "Ce lien n'est plus valide." }, { status: 404 });

  // Le code n'est utilisable qu'une fois : on l'efface d'abord (deux envois simultanés ne passent pas tous les deux).
  const claimed = await prisma.appointment.updateMany({ where: { id: appt.id, reviewToken: token }, data: { reviewToken: null } });
  if (claimed.count !== 1) return NextResponse.json({ error: "Ce lien n'est plus valide." }, { status: 404 });

  const isHidden = containsOffensiveContent(comment ?? "");
  const data = {
    rating, comment, isHidden, isVerified: true,
    authorName: reviewerDisplayName(appt.customerName),
    service: appt.serviceName?.slice(0, 80) ?? null,
    vehicleMake: appt.vehicleMake, vehicleModel: appt.vehicleModel, vehicleYear: appt.vehicleYear,
  };
  // Client avec compte qui a déjà noté ce garage : on remplace son avis plutôt que d'en ajouter un second.
  const previous = await prisma.review.findFirst({
    where: { garageId: appt.garageId, OR: [{ appointmentId: appt.id }, ...(appt.userId ? [{ userId: appt.userId }] : [])] },
    select: { id: true },
  });
  if (previous) await prisma.review.update({ where: { id: previous.id }, data: { ...data, appointmentId: appt.id } });
  else await prisma.review.create({ data: { ...data, garageId: appt.garageId, userId: appt.userId, appointmentId: appt.id } });

  if (!isHidden) {
    checkAndCreateAlerts(appt.garageId, appt.garage.name, appt.garage.slug, rating, data.authorName)
      .catch((err) => console.error("[Review alert check]", err));
  }
  await revalidateGarage({ slug: appt.garage.slug });
  return NextResponse.json({ ok: true });
}
