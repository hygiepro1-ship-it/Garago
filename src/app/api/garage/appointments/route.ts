import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedGarageWhere, readGarageId } from "@/lib/garage-access";
import { wouldExceedCapacity, bayIsFree, pickBay, toHHMM, toMinutes, DEFAULT_DURATION_MIN } from "@/lib/availability";
import { loadBayRules } from "@/lib/bays";
import { withGarageDayLock, SlotError } from "@/lib/slot-lock";
import { cleanText, isValidEmail, isOverLimit, recordAttempt } from "@/lib/abuse";
import { quebecInstant, planManualConfirmation, MANUAL_REQUEST_HOURS_BEFORE } from "@/lib/rdv-confirmation";
import { processRdvConfirmations } from "@/lib/rdv-confirmation-run";
import { toE164, sendBookingConfirmedSMS } from "@/lib/sms";
import { sendManualBookingConfirmation } from "@/lib/email";
import { rememberCustomer } from "@/lib/customers";
import { formatPhone, isFormattedPhone, normalizePlate } from "@/lib/contact-format";

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
  // Un seul format de téléphone dans l'agenda et le carnet de clients : (514) 555-0123.
  const phone = formatPhone(String(customerPhone));
  if (!isFormattedPhone(phone)) {
    return NextResponse.json({ error: "Entrez un numéro de téléphone à 10 chiffres, par exemple (514) 555-0123." }, { status: 400 });
  }
  if (customerEmail && !isValidEmail(customerEmail)) {
    return NextResponse.json({ error: "Adresse courriel invalide" }, { status: 400 });
  }
  if (contactChannel === "EMAIL" && !customerEmail) {
    return NextResponse.json({ error: "Entrez le courriel du client pour lui envoyer la confirmation par courriel." }, { status: 400 });
  }
  if (contactChannel === "SMS") {
    const e164 = toE164(String(customerPhone));
    if (!e164) {
      return NextResponse.json({ error: "Les textos ne partent que vers un numéro canadien à 10 chiffres. Choisissez le courriel, ou corrigez le numéro." }, { status: 400 });
    }
    // Le compteur n'avance qu'une fois le rendez-vous créé : une saisie refusée (créneau occupé, erreur de
    // formulaire) n'envoie aucun texto et ne doit pas user le plafond.
    // Aucun plafond quotidien par garage (début de saison : le carnet entier peut être saisi d'un coup).
    // Seul garde-fou : 3 textos par jour vers un même numéro (saisie en rafale, erreur de frappe).
    if (await isOverLimit(`smsn:${e164}`, 3, 24 * 60 * 60 * 1000)) {
      return NextResponse.json({ error: "Ce numéro a déjà reçu plusieurs textos aujourd'hui. Choisissez le courriel ou réessayez demain." }, { status: 429 });
    }
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

  const capacity = garage.capacity ?? 1;
  const rules = await loadBayRules(garage.id, capacity);
  const now = new Date();
  const start = quebecInstant(date, startTime);
  const plan = planManualConfirmation(start, now, { enabled: garage.requireConfirmation ?? true, reachable: contactChannel !== null });

  // Vérifier puis créer sous le verrou de la journée (src/lib/slot-lock.ts) : un client en ligne
  // ou un autre poste du garage ne peut pas prendre la même place entre les deux.
  let appt;
  try {
    appt = await withGarageDayLock(garage.id, date, async (tx) => {
      const sameDay = await tx.appointment.findMany({
        where: { garageId: garage.id, date, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
        select: { startTime: true, endTime: true, bay: true },
      });
      if (wouldExceedCapacity(startTime, durationMin, sameDay, capacity)) {
        throw new SlotError(409, "Toutes vos portes sont déjà occupées sur ce créneau.");
      }

      // Poste : celui choisi par le garage s'il est libre. Sinon « Automatique » : le poste le
      // plus spécialisé parmi ceux où ce service se fait, ou à défaut n'importe quel poste libre
      // (le garage qui saisit lui-même un rendez-vous a toujours le dernier mot).
      let bay: number | null;
      const wantedBay = Number(body.bay);
      if (body.bay !== undefined && body.bay !== null && body.bay !== "" && Number.isInteger(wantedBay) && wantedBay >= 1 && wantedBay <= capacity) {
        if (!bayIsFree(wantedBay, startTime, durationMin, sameDay)) {
          throw new SlotError(409, `La porte ${wantedBay} est déjà occupée sur ce créneau. Choisissez-en une autre ou laissez « Automatique ».`);
        }
        bay = wantedBay;
      } else {
        const allowed = categoryId ? rules.forCategories([String(categoryId)]) : rules.forServiceName(serviceName);
        bay = pickBay(startTime, durationMin, sameDay, capacity, { allowed, versatility: rules.versatility })
          ?? pickBay(startTime, durationMin, sameDay, capacity, { versatility: rules.versatility });
      }

      // Le client reste dans le carnet du garage : ses coordonnées reviendront à sa
      // prochaine visite. Un souci de carnet ne doit jamais empêcher de prendre le rendez-vous.
      const customerId = await rememberCustomer(
        garage.id,
        { name: customerName, phone, email: customerEmail, language, contactChannel },
        typeof body.customerId === "string" && body.customerId ? body.customerId : null,
      ).catch((e) => { console.error("[CUSTOMER]", e); return null; });

      return tx.appointment.create({
        data: {
          garageId: garage.id,
          userId: null,
          customerId,
          customerName: cleanText(customerName, 80),
          customerPhone: phone,
          customerEmail: customerEmail ? String(customerEmail).toLowerCase() : null,
          vehicleYear:  Number.isInteger(Number(vehicleYear)) && Number(vehicleYear) >= 1950 && Number(vehicleYear) <= new Date().getFullYear() + 1 ? Number(vehicleYear) : null,
          vehicleMake:  cleanText(vehicleMake, 60)  || null,
          vehicleModel: cleanText(vehicleModel, 60) || null,
          licensePlate: normalizePlate(body.licensePlate) || null,
          serviceName:  cleanText(serviceName, 120) || null,
          date,
          startTime,
          endTime,
          bay,
          notes: notes ? String(notes).slice(0, 1000) : null,
          status: "CONFIRMED", // manual = direct confirm
          source: "MANUAL",
          contactChannel,
          language,
          confirmationStatus: plan.confirmationStatus, confirmTier: plan.confirmTier,
          confirmBy: plan.confirmBy, confirmToken: plan.confirmToken, confirmRequestedAt: plan.confirmRequestedAt,
        },
      });
    });
  } catch (err) {
    if (err instanceof SlotError) return NextResponse.json({ error: err.message }, { status: err.status });
    throw err;
  }

  if (contactChannel === "SMS") {
    const e164 = toE164(String(customerPhone));
    if (e164) await recordAttempt(`smsn:${e164}`)
      .catch((e) => console.error("[SMS LIMIT]", e));
  }

  // Confirmation tout de suite au client, par le SEUL moyen qu'il a choisi (courriel ou texto, jamais les deux).
  // « Aucun » (contactChannel null) : rien ne part. À moins de 48 h, la demande de confirmation part
  // déjà maintenant par ce moyen-là : on n'envoie pas deux messages à la suite.
  const requestNow = plan.confirmTier === "MANUAL" && start.getTime() - now.getTime() <= MANUAL_REQUEST_HOURS_BEFORE * 60 * 60 * 1000;
  const reminderPlanned = plan.confirmTier === "MANUAL" && !requestNow;
  if (contactChannel !== null) {
    const lang = language as "fr" | "en";
    const sends: Promise<unknown>[] = [];
    if (contactChannel === "EMAIL" && appt.customerEmail && !requestNow) {
      sends.push(sendManualBookingConfirmation({
        to: appt.customerEmail, lang, customerName: appt.customerName,
        garageName: garage.name, garagePhone: garage.phone, garageAddress: [garage.address, garage.city].filter(Boolean).join(", "),
        date, startTime, endTime, serviceName: appt.serviceName, appointmentId: appt.id, reminderPlanned,
      }).catch((e) => console.error("[BOOKING EMAIL]", e)));
    }
    if (contactChannel === "SMS" && !requestNow) {
      sends.push(sendBookingConfirmedSMS({
        to: phone, garageId: garage.id, lang, garageName: garage.name, garagePhone: garage.phone,
        date, startTime, reminderPlanned,
      }).catch((e) => console.error("[BOOKING SMS]", e)));
    }
    await Promise.all(sends);
  }

  // À moins de 48 h, la demande de confirmation part tout de suite (sinon la tâche planifiée s'en charge).
  if (requestNow) {
    await processRdvConfirmations(now, appt.id).catch((e) => console.error("[MANUAL CONFIRMATION]", e));
    const fresh = await prisma.appointment.findUnique({ where: { id: appt.id } });
    return NextResponse.json(fresh ?? appt, { status: 201 });
  }

  return NextResponse.json(appt, { status: 201 });
}
