import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ownedGarageWhere, readGarageId } from "@/lib/garage-access";
import { hasOverlap, toHHMM, toMinutes, DEFAULT_DURATION_MIN } from "@/lib/availability";

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

  if (!customerName || !customerPhone || !date || !startTime) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
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
  const endTime = toHHMM(toMinutes(startTime) + durationMin);

  const sameDay = await prisma.appointment.findMany({
    where: { garageId: garage.id, date, status: { not: "CANCELLED" } },
    select: { startTime: true, endTime: true },
  });
  if (hasOverlap(startTime, durationMin, sameDay)) {
    return NextResponse.json({ error: "Ce créneau chevauche un rendez-vous déjà pris." }, { status: 409 });
  }

  const appt = await prisma.appointment.create({
    data: {
      garageId: garage.id,
      userId: null,
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
      notes: notes || null,
      status: "CONFIRMED", // manual = direct confirm
      source: "MANUAL",
    },
  });

  return NextResponse.json(appt, { status: 201 });
}
