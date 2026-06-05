import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVehicleReady, sendRescheduleNotification } from "@/lib/email";
import { sendVehicleReadySMS, sendRescheduleSMS } from "@/lib/sms";

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

  // ── Notification "déplacement" quand le garage change la date/heure ──────────
  const isReschedule = isGarageOwner && !!(date || startTime);
  if (isReschedule) {
    const garageAddress = [updated.garage.address, updated.garage.city].filter(Boolean).join(", ");

    const userPref = updated.userId
      ? await prisma.user.findUnique({ where: { id: updated.userId }, select: { notifPref: true, phone: true } })
      : null;
    const notifPref = userPref?.notifPref ?? "EMAIL";

    if (updated.customerEmail && (notifPref === "EMAIL" || notifPref === "BOTH")) {
      sendRescheduleNotification({
        to:           updated.customerEmail,
        customerName: updated.customerName,
        garageName:   updated.garage.name,
        garagePhone:  updated.garage.phone,
        garageAddress,
        date:         updated.date,
        startTime:    updated.startTime,
        endTime:      updated.endTime,
        serviceName:  updated.serviceName,
      }).catch(console.error);
    }

    const smsPhone = updated.customerPhone || userPref?.phone;
    if (smsPhone && (notifPref === "SMS" || notifPref === "BOTH")) {
      sendRescheduleSMS({
        to:          smsPhone,
        customerName:updated.customerName,
        garageName:  updated.garage.name,
        garagePhone: updated.garage.phone,
        date:        updated.date,
        startTime:   updated.startTime,
        serviceName: updated.serviceName,
      }).catch(console.error);
    }
  }

  // ── Notifications "véhicule prêt" quand le garage marque COMPLETED
  if (status === "COMPLETED") {
    const garageAddress = [updated.garage.address, updated.garage.city].filter(Boolean).join(", ");
    const note = completionNote ?? updated.completionNote;

    // Récupère la préférence du client lié (si compte Garago)
    const userPref = updated.userId
      ? await prisma.user.findUnique({ where: { id: updated.userId }, select: { notifPref: true, phone: true } })
      : null;
    const notifPref = userPref?.notifPref ?? "EMAIL";

    // Email (si EMAIL ou BOTH)
    if (updated.customerEmail && (notifPref === "EMAIL" || notifPref === "BOTH")) {
      sendVehicleReady({
        to:            updated.customerEmail,
        customerName:  updated.customerName,
        garageName:    updated.garage.name,
        garageAddress,
        garagePhone:   updated.garage.phone,
        completionNote: note,
      }).catch(console.error);
    }

    // SMS (si SMS ou BOTH)
    const smsPhone = updated.customerPhone || userPref?.phone;
    if (smsPhone && (notifPref === "SMS" || notifPref === "BOTH")) {
      sendVehicleReadySMS({
        to:            smsPhone,
        customerName:  updated.customerName,
        garageName:    updated.garage.name,
        garageAddress,
        garagePhone:   updated.garage.phone,
        completionNote: note,
      }).catch(console.error);
    }
  }

  return NextResponse.json(updated);
}
