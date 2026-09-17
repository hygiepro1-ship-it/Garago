import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation, sendGarageNewAppointment } from "@/lib/email";
import { wouldExceedCapacity, toHHMM, toMinutes, DEFAULT_DURATION_MIN } from "@/lib/availability";

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
  const body = await req.json();

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
    notes,
    date,
    startTime,
  } = body;

  if (!garageId || !customerName || !customerPhone || !date || !startTime) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  // La durée du RDV vient toujours du service configuré par le garage (jamais
  // d'une valeur envoyée par le client) — c'est ce qui doit réellement combler
  // l'agenda, pas un bloc fixe de 60 minutes pour toutes les prestations.
  const [svc, garageForCapacity] = await Promise.all([
    categoryId
      ? prisma.garageService.findFirst({ where: { garageId, categoryId, active: true }, select: { durationMin: true } })
      : null,
    prisma.garage.findUnique({ where: { id: garageId }, select: { capacity: true } }),
  ]);
  const durationMin = svc?.durationMin ?? DEFAULT_DURATION_MIN;
  const capacity = garageForCapacity?.capacity ?? 1;
  const endTime = toHHMM(toMinutes(startTime) + durationMin);

  const sessionUserId = (session?.user as any)?.id ?? null;

  // Check-then-create sous isolation Serializable pour empêcher une double réservation
  // du même créneau par deux clients simultanés (Postgres détecte et rejette le conflit).
  // Le conflit se vérifie par chevauchement d'intervalles, pas par égalité d'heure de
  // début, puisque deux services peuvent avoir des durées différentes.
  let appt;
  try {
    appt = await prisma.$transaction(async (tx) => {
      const sameDay = await tx.appointment.findMany({
        where: { garageId, date, status: { not: "CANCELLED" } },
        select: { startTime: true, endTime: true },
      });
      if (wouldExceedCapacity(startTime, durationMin, sameDay, capacity)) {
        throw new Error("SLOT_TAKEN");
      }
      return tx.appointment.create({
        data: {
          garageId,
          userId: sessionUserId,
          customerName,
          customerPhone,
          customerEmail: customerEmail || null,
          vehicleYear:  vehicleYear  ? Number(vehicleYear)  : null,
          vehicleMake:  vehicleMake  || null,
          vehicleModel: vehicleModel || null,
          vehicleTrim:     vehicleTrim     || null,
          vehicleVin:      vehicleVin      || null,
          vehicleTireSize: vehicleTireSize || null,
          vehicleSpecs:    vehicleSpecs    || null,
          serviceName:  serviceName  || null,
          notes:        notes        || null,
          date,
          startTime,
          endTime,
          status: "CONFIRMED",
          source: "ONLINE",
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
