import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation, sendGarageNewAppointment } from "@/lib/email";
import { computeFreeSlots, toHHMM, toMinutes, DEFAULT_DURATION_MIN, quebecToday, addDaysStr, dayOfWeekOf } from "@/lib/availability";
import { activeSubscriptionOr } from "@/lib/garage-access";
import { clientIp, isRateLimited, normalizePhone, isValidEmail, cleanText } from "@/lib/abuse";
import { verifyTurnstile, CAPTCHA_ERROR } from "@/lib/turnstile";
import { planConfirmation, quebecInstant, formatQuebecMoment, confirmPageUrl, cancelPageUrl } from "@/lib/rdv-confirmation";

// GET /api/appointments — liste des RDV du client connecté
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const userId = session.user?.id;
  const appts = await prisma.appointment.findMany({
    where:   { userId },
    include: { garage: { select: { name: true, address: true, city: true, phone: true, slug: true } } },
    orderBy: [{ date: "desc" }, { startTime: "desc" }],
  });

  return NextResponse.json(appts);
}

// POST /api/appointments — client booking (online)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Requête invalide" }, { status: 400 });

  const {
    garageId,
    customerName,
    customerPhone,
    customerEmail,
    vehicleYear,
    vehicleMake,
    vehicleModel,
    vehicleTrim,
    vehicleVin,
    vehicleTireSize,
    vehicleSpecs,
    serviceName,
    categoryId,
    categoryIds,
    notes,
    date,
    startTime,
  } = body;

  if (!garageId || !customerName || !customerPhone || !date || !startTime) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  // Client non connecté : captcha obligatoire (actif dès que les clés Turnstile sont configurées)
  if (!session?.user && !(await verifyTurnstile(body.turnstileToken, clientIp(req)))) {
    return NextResponse.json({ error: CAPTCHA_ERROR }, { status: 400 });
  }

  // Validation stricte des champs libres — ils finissent dans des courriels et dans l'agenda du garage.
  const name = cleanText(customerName, 80);
  const phoneDigits = normalizePhone(customerPhone);
  if (name.length < 2) return NextResponse.json({ error: "Nom invalide" }, { status: 400 });
  if (!phoneDigits) return NextResponse.json({ error: "Numéro de téléphone invalide (10 chiffres)" }, { status: 400 });
  const sessionEmail = (session?.user as any)?.email ?? null;
  if (customerEmail ? !isValidEmail(customerEmail) : !sessionEmail) {
    return NextResponse.json({ error: customerEmail ? "Adresse courriel invalide" : "Le courriel est obligatoire pour recevoir la confirmation du rendez-vous." }, { status: 400 });
  }
  if (typeof garageId !== "string" || typeof date !== "string" || typeof startTime !== "string"
      || !/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime)) {
    return NextResponse.json({ error: "Date ou heure invalide" }, { status: 400 });
  }
  const today = quebecToday();
  if (date < today || date > addDaysStr(today, 120)) {
    return NextResponse.json({ error: "Cette date n'est pas disponible à la réservation." }, { status: 400 });
  }

  // Seul un garage actif (réclamé, NEQ vérifié, abonnement valide) peut recevoir des réservations en ligne :
  // les fiches non activées n'ont personne pour les honorer.
  const subOr = activeSubscriptionOr();
  const eligible = await prisma.garage.findFirst({
    where: {
      id: garageId,
      claimStatus: "activee",
      onlineBooking: true,
      ownerId: { not: null },
      OR: [
        { parentId: null, verificationStatus: "APPROVED", AND: [{ OR: subOr }] },
        { parent: { verificationStatus: "APPROVED", AND: [{ OR: subOr }] } },
      ],
    },
    select: { id: true },
  });
  if (!eligible) return NextResponse.json({ error: "Ce garage n'accepte pas de réservation en ligne." }, { status: 400 });

  // Plafond de rendez-vous à venir par client (téléphone ou courriel) — évite qu'une même personne
  // n'accapare des créneaux dans plusieurs garages.
  // Téléphone enregistré sous une forme unique « (514) 555-0142 » pour que le plafond soit fiable.
  const phoneStd = `(${phoneDigits.slice(0, 3)}) ${phoneDigits.slice(3, 6)}-${phoneDigits.slice(6)}`;
  const identity: Record<string, unknown>[] = [{ customerPhone: phoneStd }];
  if (customerEmail) identity.push({ customerEmail: { equals: String(customerEmail).toLowerCase(), mode: "insensitive" } });
  const upcoming = await prisma.appointment.count({
    where: { date: { gte: today }, status: { notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"] }, OR: identity as any },
  });
  if (upcoming >= 4) {
    return NextResponse.json({ error: "Vous avez déjà plusieurs rendez-vous à venir. Annulez-en un avant d'en réserver un autre." }, { status: 429 });
  }

  // Anti-abus (après validation : une faute de frappe ne consomme pas le quota) : une réservation en ligne
  // ne demande pas de compte, donc on limite le débit par adresse IP pour empêcher qu'un script ne
  // remplisse l'agenda d'un garage ou n'envoie des courriels en rafale à des tiers.
  if (await isRateLimited(`bk:${clientIp(req)}`, 6, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Trop de réservations en peu de temps. Réessayez plus tard." }, { status: 429 });
  }

  // La durée du RDV vient toujours du service configuré par le garage (jamais
  // d'une valeur envoyée par le client) — c'est ce qui doit réellement combler
  // l'agenda, pas un bloc fixe de 60 minutes pour toutes les prestations.
  // Une ou plusieurs prestations (categoryIds) ; categoryId seul reste accepté.
  const wantedCats: string[] = Array.from(new Set(
    (Array.isArray(categoryIds) ? categoryIds : categoryId ? [categoryId] : [])
      .filter((c: unknown): c is string => typeof c === "string" && c.length > 0)
  )).slice(0, 6) as string[];
  const [svcs, garageForCapacity] = await Promise.all([
    wantedCats.length
      ? prisma.garageService.findMany({
          where: { garageId, categoryId: { in: wantedCats }, active: true },
          select: { durationMin: true, category: { select: { name: true } } },
        })
      : Promise.resolve([] as { durationMin: number | null; category: { name: string } }[]),
    prisma.garage.findUnique({ where: { id: garageId }, select: { capacity: true, requireConfirmation: true } }),
  ]);
  // Durée = somme des durées réglées par le garage ; nom du service recalculé côté serveur.
  const durationMin = svcs.length
    ? svcs.reduce((sum, s) => sum + (s.durationMin ?? DEFAULT_DURATION_MIN), 0)
    : DEFAULT_DURATION_MIN;
  const resolvedServiceName = svcs.length ? svcs.map((s) => s.category.name).join(" + ") : (serviceName || null);
  const capacity = garageForCapacity?.capacity ?? 1;
  const endTime = toHHMM(toMinutes(startTime) + durationMin);

  const sessionUserId = (session?.user as any)?.id ?? null;

  // Courriel pour joindre le client : celui saisi, sinon celui de son compte.
  // On l'enregistre sur le rendez-vous pour que rappels et confirmations
  // fonctionnent aussi pour les clients connectés qui ne l'ont pas retapé.
  const contactEmail: string | null = customerEmail || ((session?.user as any)?.email ?? null);

  // Palier de confirmation (standard / dernière minute / aucun) selon le délai.
  const startInstant = quebecInstant(date, startTime);
  const plan = planConfirmation(startInstant, new Date(), {
    enabled: garageForCapacity?.requireConfirmation ?? true,
    hasEmail: !!contactEmail,
  });

  // Check-then-create sous isolation Serializable pour empêcher une double réservation
  // du même créneau par deux clients simultanés (Postgres détecte et rejette le conflit).
  // Le conflit se vérifie par chevauchement d'intervalles, pas par égalité d'heure de
  // début, puisque deux services peuvent avoir des durées différentes.
  let appt;
  try {
    appt = await prisma.$transaction(async (tx) => {
      const [sameDay, blocks, availRow] = await Promise.all([
        tx.appointment.findMany({
          where: { garageId, date, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
          select: { startTime: true, endTime: true },
        }),
        tx.blockedSlot.findMany({ where: { garageId, date }, select: { startTime: true, endTime: true, allDay: true } }),
        tx.garageAvailability.findFirst({ where: { garageId, dayOfWeek: dayOfWeekOf(date) } }),
      ]);
      // Le créneau doit figurer parmi ceux réellement offerts : heures d'ouverture, blocages
      // (vacances), jour fermé, capacité et heure déjà passée — un client ne peut pas forcer
      // un horaire en contournant l'interface.
      const free = computeFreeSlots(availRow ?? undefined, blocks, sameDay, durationMin, { isToday: date === today, now: new Date(), capacity });
      if (!free.includes(startTime)) throw new Error("SLOT_TAKEN");
      return tx.appointment.create({
        data: {
          garageId,
          userId: sessionUserId,
          customerName: name,
          customerPhone: phoneStd,
          customerEmail: contactEmail ? contactEmail.toLowerCase() : null,
          vehicleYear:  Number.isInteger(Number(vehicleYear)) && Number(vehicleYear) >= 1950 && Number(vehicleYear) <= new Date().getFullYear() + 1 ? Number(vehicleYear) : null,
          vehicleMake:  cleanText(vehicleMake, 60)  || null,
          vehicleModel: cleanText(vehicleModel, 60) || null,
          vehicleTrim:     cleanText(vehicleTrim, 80)     || null,
          vehicleVin:      cleanText(vehicleVin, 20)      || null,
          vehicleTireSize: cleanText(vehicleTireSize, 30) || null,
          vehicleSpecs:    cleanText(vehicleSpecs, 300)    || null,
          serviceName:  resolvedServiceName ? cleanText(resolvedServiceName, 120) : null,
          notes:        notes ? String(notes).replace(/[ --]/g, " ").slice(0, 1000) : null,
          date,
          startTime,
          endTime,
          status: "CONFIRMED",
          source: "ONLINE",
          confirmationStatus: plan.confirmationStatus,
          confirmTier:        plan.confirmTier,
          confirmBy:          plan.confirmBy,
          confirmToken:       plan.confirmToken,
          confirmRequestedAt: plan.confirmRequestedAt,
        },
        include: { garage: { include: { owner: { select: { email: true } } } } },
      });
    }, { isolationLevel: "Serializable" });
  } catch (err: any) {
    // SLOT_TAKEN (conflit détecté) ou 40001 (échec de sérialisation Postgres — conflit concurrent)
    if (err?.message === "SLOT_TAKEN" || err?.code === "P2034" || err?.meta?.code === "40001") {
      return NextResponse.json({ error: "Ce créneau vient d'être réservé. Veuillez en choisir un autre." }, { status: 409 });
    }
    throw err;
  }

  const garageAddress = [appt.garage.address, appt.garage.city].filter(Boolean).join(", ");

  // Envoyer les notifications en parallèle (await pour que Vercel ne coupe pas)
  const notifPromises: Promise<void>[] = [];

  // 1a. Email de confirmation au client (si EMAIL ou BOTH)
  const recipientEmail = appt.customerEmail
    || (sessionUserId ? (await prisma.user.findUnique({ where: { id: sessionUserId }, select: { email: true } }))?.email : null)
    || null;

  if (recipientEmail) {
    notifPromises.push(
      sendBookingConfirmation({
        to:            recipientEmail,
        customerName:  appt.customerName,
        garageName:    appt.garage.name,
        garagePhone:   appt.garage.phone ?? "",
        garageAddress,
        date:          appt.date,
        startTime:     appt.startTime,
        endTime:       appt.endTime,
        serviceName:   appt.serviceName,
        appointmentId: appt.id,
        // Dernière minute : la confirmation se fait dès ce premier courriel.
        ...(plan.confirmTier === "LAST_MINUTE" && plan.confirmToken && plan.confirmBy
          ? { confirmUrl: confirmPageUrl(plan.confirmToken), cancelUrl: cancelPageUrl(plan.confirmToken), confirmDeadline: `avant ${formatQuebecMoment(plan.confirmBy)}` }
          : {}),
      }).catch(e => console.error("[BOOKING CONFIRMATION EMAIL]", e))
    );
  }

  // 2. Notification au garage (courriel public du garage, sinon celui du propriétaire)
  const garageEmail = appt.garage.email || appt.garage.owner?.email || null;
  if (garageEmail) {
    notifPromises.push(
      sendGarageNewAppointment({
        to:            garageEmail,
        garageName:    appt.garage.name,
        customerName:  appt.customerName,
        customerPhone: appt.customerPhone,
        customerEmail: appt.customerEmail,
        vehicleYear:   appt.vehicleYear,
        vehicleMake:   appt.vehicleMake,
        vehicleModel:  appt.vehicleModel,
        serviceName:   appt.serviceName,
        date:          appt.date,
        startTime:     appt.startTime,
        endTime:       appt.endTime,
        appointmentId: appt.id,
      }).catch(e => console.error("[GARAGE NEW APPT EMAIL]", e))
    );
  }

  await Promise.all(notifPromises);

  return NextResponse.json(appt, { status: 201 });
}
