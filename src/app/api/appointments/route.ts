import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendBookingConfirmation, sendGarageNewAppointment } from "@/lib/email";

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

  const appt = await prisma.appointment.create({
    data: {
      garageId,
      userId: (session?.user as any)?.id ?? null,
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

  // 1. Email de confirmation au client
  if (appt.customerEmail) {
    sendBookingConfirmation({
      to:            appt.customerEmail,
      customerName:  appt.customerName,
      garageName:    appt.garage.name,
      garagePhone:   appt.garage.phone,
      garageAddress: [appt.garage.address, appt.garage.city].filter(Boolean).join(", "),
      date:          appt.date,
      startTime:     appt.startTime,
      endTime:       appt.endTime,
      serviceName:   appt.serviceName,
      appointmentId: appt.id,
    }).catch(console.error);
  }

  // 2. Notification au garage
  if (appt.garage.email) {
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
    }).catch(console.error);
  }

  return NextResponse.json(appt, { status: 201 });
}
