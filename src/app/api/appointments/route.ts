import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation, sendGarageNewAppointment } from "@/lib/email";
import { sendBookingConfirmationSMS } from "@/lib/sms";

// GET /api/appointments — liste des RDV du client connecté
export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const userId = (session.user as any)?.id;
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
    serviceName,
    date,
    startTime,
  } = body;

  if (!garageId || !customerName || !customerPhone || !date || !startTime) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  // Compute endTime (+60 min)
  const [h, m] = startTime.split(":").map(Number);
  const endMin = h * 60 + m + 60;
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

  // Check slot is still available
  const conflict = await prisma.appointment.findFirst({
    where: { garageId, date, startTime, status: { not: "CANCELLED" } },
  });
  if (conflict) {
    return NextResponse.json({ error: "Ce créneau vient d'être réservé. Veuillez en choisir un autre." }, { status: 409 });
  }

  const sessionUserId = (session?.user as any)?.id ?? null;

  // Récupère les préférences de notification du client connecté
  const userPref = sessionUserId
    ? await prisma.user.findUnique({ where: { id: sessionUserId }, select: { notifPref: true, phone: true } })
    : null;
  const notifPref = userPref?.notifPref ?? "EMAIL";

  const appt = await prisma.appointment.create({
    data: {
      garageId,
      userId: sessionUserId,
      customerName,
      customerPhone,
      customerEmail: customerEmail || null,
      vehicleYear:  vehicleYear  ? Number(vehicleYear)  : null,
      vehicleMake:  vehicleMake  || null,
      vehicleModel: vehicleModel || null,
      serviceName:  serviceName  || null,
      date,
      startTime,
      endTime,
      status: "PENDING",
      source: "ONLINE",
    },
    include: { garage: true },
  });

  const garageAddress = [appt.garage.address, appt.garage.city].filter(Boolean).join(", ");

  // Envoyer les notifications en parallèle (await pour que Vercel ne coupe pas)
  const notifPromises: Promise<void>[] = [];

  // 1a. Email de confirmation au client (si EMAIL ou BOTH)
  const recipientEmail = appt.customerEmail
    || (sessionUserId ? (await prisma.user.findUnique({ where: { id: sessionUserId }, select: { email: true } }))?.email : null)
    || null;

  if (recipientEmail && (notifPref === "EMAIL" || notifPref === "BOTH")) {
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

  // 1b. SMS de confirmation au client (si SMS ou BOTH)
  const smsPhone = appt.customerPhone || userPref?.phone;
  if (smsPhone && (notifPref === "SMS" || notifPref === "BOTH")) {
    notifPromises.push(
      sendBookingConfirmationSMS({
        to:           smsPhone,
        customerName: appt.customerName,
        garageName:   appt.garage.name,
        garagePhone:  appt.garage.phone ?? "",
        date:         appt.date,
        startTime:    appt.startTime,
        serviceName:  appt.serviceName,
      }).catch(e => console.error("[BOOKING CONFIRMATION SMS]", e))
    );
  }

  // 2. Notification au garage
  if (appt.garage.email) {
    notifPromises.push(
      sendGarageNewAppointment({
        to:            appt.garage.email,
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
