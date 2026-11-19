import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { clientIp, isRateLimited } from "@/lib/abuse";
import { containsOffensiveContent, checkAndCreateAlerts, reviewerDisplayName } from "@/lib/review-checks";
import { revalidateGarage } from "@/lib/revalidate-garage";

// Avis sur un garage laissé depuis le lien du message « véhicule prêt » (page /avis/[jeton]).
// Le jeton prouve la visite : l'avis est « vérifié », sans compte. Un seul avis par rendez-vous :
// le renvoyer remplace le premier.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body._hp) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const token = typeof body.token === "string" && /^[a-f0-9]{48}$/.test(body.token) ? body.token : null;
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
    where: { reviewToken: token, status: "COMPLETED" },
    select: {
      id: true, garageId: true, userId: true, customerName: true, serviceName: true,
      vehicleMake: true, vehicleModel: true, vehicleYear: true,
      garage: { select: { name: true, slug: true } },
    },
  });
  if (!appt) return NextResponse.json({ error: "Ce lien n'est plus valide." }, { status: 404 });

  const isHidden = containsOffensiveContent(comment ?? "");
  const data = {
    rating, comment, isHidden, isVerified: true,
    authorName: reviewerDisplayName(appt.customerName),
    service: appt.serviceName?.slice(0, 80) ?? null,
    vehicleMake: appt.vehicleMake, vehicleModel: appt.vehicleModel, vehicleYear: appt.vehicleYear,
  };
  // Même rendez-vous, ou client avec compte qui a déjà noté ce garage : on remplace son avis.
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
