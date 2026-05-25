import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  });

  return NextResponse.json(appt, { status: 201 });
}
