import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedGarageWhere, readGarageId } from "@/lib/garage-access";
import { wouldExceedCapacity, toHHMM, toMinutes, DEFAULT_DURATION_MIN } from "@/lib/availability";
import { cleanText, isValidEmail } from "@/lib/abuse";
import { quebecInstant, planManualConfirmation, MANUAL_REQUEST_HOURS_BEFORE } from "@/lib/rdv-confirmation";
import { processRdvConfirmations } from "@/lib/rdv-confirmation-run";
import { toE164 } from "@/lib/sms";

// GET /api/garage/appointments — list all appointments for the logged garage
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const garage = await prisma.garage.findFirst({ where: ownedGarageWhere(session.user.id, readGarageId(req.url)) });
  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  const { searchParams } = req.nextUrl;
  const from = searchParams.get("from"); // YYYY-MM-DD
  const to   = searchParams.get("to");   // YYYY-MM-DD

  const appointments = await prisma.appointment.findMany({
    where: {
      garageId: garage.id,
      ...(from || to ? {
        date: {
          ...(from ? { gte: from } : {}),
          ...(to   ? { lte: to   } : {}),
        },
      } : {}),
    },
    orderBy: [{ date: "asc" }, { startTime: "asc" }],
  });

  return NextResponse.json(appointments);
}

// POST /api/garage/appointments — create manual appointment (garage adds client)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const garage = await prisma.garage.findFirst({ where: ownedGarageWhere(session.user.id, readGarageId(req.url)) });
  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  const body = await req.json();
  const {
    customerName, customerPhone, customerEmail,
    vehicleYear, vehicleMake, vehicleModel,
    serviceName, categoryId, date, startTime, notes,
  } = body;
  // Moyen choisi par le client au téléphone pour recevoir la demande de confirmation.
  const contactChannel: "SMS" | "EMAIL" | null = body.contactChannel === "SMS" || body.contactChannel === "EMAIL" ? body.contactChannel : null;
  const language = body.language === "en" ? "en" : "fr";

  if (!customerName || !customerPhone || !date || !startTime) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }
  if (typeof date !== "string" || typeof startTime !== "string"
      || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
    return NextResponse.json({ error: "Date ou heure invalide" }, { status: 400 });
  }
  if (customerEmail && !isValidEmail(customerEmail)) {
    return NextResponse.json({ error: "Adresse courriel invalide" }, { status: 400 });
  }
  if (contactChannel === "EMAIL" && !customerEmail) {
    return NextResponse.json({ error: "Entrez le courriel du client pour lui envoyer la confirmation par courriel." }, { status: 400 });
  }
  if (contactChannel === "SMS" && !toE164(String(customerPhone))) {
    return NextResponse.json({ error: "Entrez un numéro de cellulaire à 10 chiffres pour envoyer la confirmation par texto." }, { status: 400 });
  }

  // Même règle de durée que la réservation en ligne : celle configurée par le
  // garage pour la prestation choisie, pas un bloc fixe de 60 minutes.
  let durationMin = DEFAULT_DURATION_MIN;
  if (categoryId) {
    const svc = await prisma.garageService.findFirst({
      where: { garageId: garage.id, categoryId, active: true },
      select: { durationMin: true },
    });
    if (svc?.durationMin) durationMin = svc.durationMin;
  }
  // Durée estimée par le garage au moment de la prise de rendez-vous : elle prime.
  const customDuration = Number(body.durationMin);
  if (Number.isInteger(customDuration) && customDuration >= 10 && customDuration <= 600) durationMin = customDuration;
  if (toMinutes(startTime) + durationMin > 24 * 60) {
    return NextResponse.json({ error: "Ce rendez-vous dépasse minuit : réduisez la durée." }, { status: 400 });
  }
  const endTime = toHHMM(toMinutes(startTime) + durationMin);

  const sameDay = await prisma.appointment.findMany({
    where: { garageId: garage.id, date, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
    select: { startTime: true, endTime: true },
  });
  if (wouldExceedCapacity(startTime, durationMin, sameDay, garage.capacity ?? 1)) {
    return NextResponse.json({ error: "Tous vos postes sont déjà occupés sur ce créneau." }, { status: 409 });
  }

  const now = new Date();
  const start = quebecInstant(date, startTime);
  const plan = planManualConfirmation(start, now, { enabled: garage.requireConfirmation ?? true, reachable: contactChannel !== null });

  const appt = await prisma.appointment.create({
    data: {
      garageId: garage.id,
      userId: null,
      customerName: cleanText(customerName, 80),
      customerPhone: cleanText(customerPhone, 30),
      customerEmail: customerEmail ? String(customerEmail).toLowerCase() : null,
      vehicleYear:  Number.isInteger(Number(vehicleYear)) && Number(vehicleYear) >= 1950 && Number(vehicleYear) <= new Date().getFullYear() + 1 ? Number(vehicleYear) : null,
      vehicleMake:  cleanText(vehicleMake, 60)  || null,
      vehicleModel: cleanText(vehicleModel, 60) || null,
      serviceName:  cleanText(serviceName, 120) || null,
      date,
      startTime,
      endTime,
      notes: notes ? String(notes).slice(0, 1000) : null,
      status: "CONFIRMED", // manual = direct confirm
      source: "MANUAL",
      contactChannel,
      language,
      confirmationStatus: plan.confirmationStatus, confirmTier: plan.confirmTier,
      confirmBy: plan.confirmBy, confirmToken: plan.confirmToken, confirmRequestedAt: plan.confirmRequestedAt,
    },
  });

  // À moins de 48 h, la demande de confirmation part tout de suite (sinon la tâche planifiée s'en charge).
  if (plan.confirmTier === "MANUAL" && start.getTime() - now.getTime() <= MANUAL_REQUEST_HOURS_BEFORE * 60 * 60 * 1000) {
    await processRdvConfirmations(now, appt.id).catch((e) => console.error("[MANUAL CONFIRMATION]", e));
    const fresh = await prisma.appointment.findUnique({ where: { id: appt.id } });
    return NextResponse.json(fresh ?? appt, { status: 201 });
  }

  return NextResponse.json(appt, { status: 201 });
}
