import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { clientIp, isRateLimited, cleanText } from "@/lib/abuse";
import { sendAdminNewSuggestion } from "@/lib/email";

// Avis sur Garago laissé depuis un rappel de rendez-vous (page /avis). Rangé avec les
// suggestions (onglet « Suggestions » de l'administration), avec sa note de 1 à 5.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  if (body._hp) return NextResponse.json({ error: "Requête invalide." }, { status: 400 });

  const rating = Number(body.rating);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json({ error: "Choisissez une note de 1 à 5." }, { status: 400 });
  }
  const comment = cleanText(body.comment, 2000);
  if (/(https?:\/\/|www\.)/i.test(comment)) return NextResponse.json({ error: "Les liens ne sont pas autorisés." }, { status: 400 });
  if (await isRateLimited(`avis:${clientIp(req)}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop d'envois. Réessayez plus tard." }, { status: 429 });
  }

  // Lien d'un courriel : le jeton du rendez-vous dit de quel garage vient l'avis. Sans jeton (texto), avis anonyme.
  const token = typeof body.r === "string" && /^[a-f0-9]{48}$/.test(body.r) ? body.r : null;
  const appt = token
    ? await prisma.appointment.findFirst({ where: { confirmToken: token }, select: { id: true, garageId: true, customerName: true, garage: { select: { name: true } } } })
    : null;
  const source = appt ? "RAPPEL_EMAIL" : "RAPPEL_SMS";
  const stars = "★".repeat(rating) + "☆".repeat(5 - rating);
  const content = `${stars} (${rating}/5) · Avis après un rappel par ${appt ? "courriel" : "texto"}${appt ? ` · ${appt.garage.name}` : ""}${comment ? `\n\n${comment}` : ""}`;

  const data = { content, rating, source, garageId: appt?.garageId ?? null, authorName: appt ? cleanText(appt.customerName, 80) : null };
  if (appt) {
    const previous = await prisma.suggestion.findFirst({ where: { appointmentId: appt.id }, select: { id: true } });
    if (previous) await prisma.suggestion.update({ where: { id: previous.id }, data: { ...data, status: "PENDING" } });
    else await prisma.suggestion.create({ data: { ...data, appointmentId: appt.id } });
  } else {
    await prisma.suggestion.create({ data });
  }

  await sendAdminNewSuggestion({ content, authorName: data.authorName, authorEmail: null })
    .catch((e) => console.error("[AVIS] courriel admin", e));
  return NextResponse.json({ ok: true });
}
