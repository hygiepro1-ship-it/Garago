import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/garage/appointments — list all appointments for the logged garage
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const garage = await prisma.garage.findUnique({ where: { ownerId: (session.user as any).id } });
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

  const garage = await prisma.garage.findUnique({ where: { ownerId: (session.user as any).id } });
  if (!garage) return NextResponse.json({ error: "Garage non trouvé" }, { status: 404 });

  const body = await req.json();
  const {
    customerName, customerPhone, customerEmail,
    vehicleYear, vehicleMake, vehicleModel,
    serviceName, date, startTime, notes,
  } = body;

  if (!customerName || !customerPhone || !date || !startTime) {
    return NextResponse.json({ error: "Champs obligatoires manquants" }, { status: 400 });
  }

  const [h, m] = startTime.split(":").map(Number);
  const endMin = h * 60 + m + 60;
  const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;

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
