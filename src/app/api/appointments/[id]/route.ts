import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVehicleReady } from "@/lib/email";

// PATCH /api/appointments/[id] — update status (garage owner)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const { status, notes, date, startTime, endTime, completionNote } = await req.json();

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { garage: true },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = (session.user as any)?.id;
  const isGarageOwner = appt.garage.ownerId === userId;
  const isClient      = appt.userId === userId;

  if (!isGarageOwner && !isClient) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  // Client ne peut modifier que les RDV ONLINE à plus de 24h
  if (isClient && !isGarageOwner) {
    const apptDateTime = new Date(`${appt.date}T${appt.startTime}:00`);
    const hoursUntil = (apptDateTime.getTime() - Date.now()) / 3600000;
    if (hoursUntil < 24) {
      return NextResponse.json({ error: "Modification impossible à moins de 24h du rendez-vous. Appelez le garage directement." }, { status: 403 });
    }
    if (appt.source !== "ONLINE") {
      return NextResponse.json({ error: "Seuls les rendez-vous en ligne peuvent être modifiés ici." }, { status: 403 });
    }
  }

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      ...(status                        ? { status }         : {}),
      ...(notes !== undefined           ? { notes }          : {}),
      ...(date                          ? { date }           : {}),
      ...(startTime                     ? { startTime }      : {}),
      ...(endTime                       ? { endTime }        : {}),
      ...(completionNote !== undefined  ? { completionNote } : {}),
    },
    include: { garage: true },
  });

  // Email "véhicule prêt" quand le garage marque COMPLETED
  if (status === "COMPLETED" && updated.customerEmail) {
    sendVehicleReady({
      to:            updated.customerEmail,
      customerName:  updated.customerName,
      garageName:    updated.garage.name,
      garageAddress: [updated.garage.address, updated.garage.city].filter(Boolean).join(", "),
      garagePhone:   updated.garage.phone,
      completionNote: completionNote ?? updated.completionNote,
    }).catch(console.error);
  }

  return NextResponse.json(updated);
}
