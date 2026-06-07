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
    const garagePhone   = updated.garage.phone ?? "";

    // Récupère préférences + email du compte client (si RDV lié à un compte)
    const userRecord = updated.userId
      ? await prisma.user.findUnique({
          where:  { id: updated.userId },
          select: { notifPref: true, phone: true, email: true },
        })
      : null;

    const notifPref    = userRecord?.notifPref ?? "EMAIL";
    // Priorité : email stocké dans le RDV, sinon email du compte Garago
    const recipientEmail = updated.customerEmail || userRecord?.email || null;

    console.log("[RESCHEDULE NOTIF]", {
      apptId: updated.id,
      recipientEmail,
      notifPref,
      hasGaragePhone: !!garagePhone,
    });

    const reschedulePromises: Promise<void>[] = [];

    if (recipientEmail && (notifPref === "EMAIL" || notifPref === "BOTH")) {
      reschedulePromises.push(
        sendRescheduleNotification({
          to:           recipientEmail,
          customerName: updated.customerName,
          garageName:   updated.garage.name,
          garagePhone,
          garageAddress,
          date:         updated.date,
          startTime:    updated.startTime,
          endTime:      updated.endTime,
          serviceName:  updated.serviceName,
        }).catch(e => console.error("[RESCHEDULE EMAIL]", e))
      );
    }

    const smsPhone = updated.customerPhone || userRecord?.phone || null;
    if (smsPhone && (notifPref === "SMS" || notifPref === "BOTH")) {
      reschedulePromises.push(
        sendRescheduleSMS({
          to:           smsPhone,
          customerName: updated.customerName,
          garageName:   updated.garage.name,
          garagePhone,
          date:         updated.date,
          startTime:    updated.startTime,
          serviceName:  updated.serviceName,
        }).catch(e => console.error("[RESCHEDULE SMS]", e))
      );
    }

    await Promise.all(reschedulePromises);
  }

  // ── Notifications "véhicule prêt" quand le garage marque COMPLETED
  if (status === "COMPLETED") {
    const garageAddress = [updated.garage.address, updated.garage.city].filter(Boolean).join(", ");
    const note = completionNote ?? updated.completionNote;

    // Récupère la préférence + email du compte client
    const userRecord2 = updated.userId
      ? await prisma.user.findUnique({
          where:  { id: updated.userId },
          select: { notifPref: true, phone: true, email: true },
        })
      : null;
    const notifPref2     = userRecord2?.notifPref ?? "EMAIL";
    const recipientEmail2 = updated.customerEmail || userRecord2?.email || null;
    const garagePhone2    = updated.garage.phone ?? "";

    const completedPromises: Promise<void>[] = [];

    if (recipientEmail2 && (notifPref2 === "EMAIL" || notifPref2 === "BOTH")) {
      completedPromises.push(
        sendVehicleReady({
          to:            recipientEmail2,
          customerName:  updated.customerName,
          garageName:    updated.garage.name,
          garageAddress,
          garagePhone:   garagePhone2,
          completionNote: note,
        }).catch(e => console.error("[VEHICLE READY EMAIL]", e))
      );
    }

    const smsPhone2 = updated.customerPhone || userRecord2?.phone || null;
    if (smsPhone2 && (notifPref2 === "SMS" || notifPref2 === "BOTH")) {
      completedPromises.push(
        sendVehicleReadySMS({
          to:            smsPhone2,
          customerName:  updated.customerName,
          garageName:    updated.garage.name,
          garageAddress,
          garagePhone:   garagePhone2,
          completionNote: note,
        }).catch(e => console.error("[VEHICLE READY SMS]", e))
      );
    }

    await Promise.all(completedPromises);
  }

  return NextResponse.json(updated);
}
