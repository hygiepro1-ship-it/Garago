import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVehicleReady, sendRescheduleNotification } from "@/lib/email";
import { wouldExceedCapacity, computeFreeSlots, toMinutes, toHHMM, quebecToday, addDaysStr, dayOfWeekOf } from "@/lib/availability";
import { quebecInstant, planConfirmation } from "@/lib/rdv-confirmation";

// PATCH /api/appointments/[id] — update status (garage owner)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const { status, date, startTime, endTime } = body;
  // Textes libres bornés (ils s'affichent dans l'agenda du garage et dans des courriels)
  const clip = (v: unknown) => (v === undefined ? undefined : v === null ? null : String(v).replace(/[\u0000-\u0008\u000B-\u001F\u007F]/g, " ").slice(0, 1000));
  const notes = clip(body.notes);
  const completionNote = clip(body.completionNote);

  // Formats de date et d'heure stricts : on ne stocke jamais une valeur arbitraire envoyée par le client.
  const isDate = (v: unknown) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v);
  const isTime = (v: unknown) => typeof v === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(v);
  if ((date !== undefined && !isDate(date)) || (startTime !== undefined && !isTime(startTime)) || (endTime !== undefined && !isTime(endTime))) {
    return NextResponse.json({ error: "Date ou heure invalide." }, { status: 400 });
  }

  const ALLOWED_STATUSES = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW"];
  if (status && !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
  }

  const appt = await prisma.appointment.findUnique({
    where: { id },
    include: { garage: true },
  });
  if (!appt) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const userId = session.user?.id;
  const isGarageOwner = appt.garage.ownerId === userId;
  const isClient      = appt.userId === userId;

  if (!isGarageOwner && !isClient) {
    return NextResponse.json({ error: "Interdit" }, { status: 403 });
  }

  // Client ne peut modifier que les RDV ONLINE à plus de 24h, et seulement
  // pour se déplacer ou s'annuler — jamais changer un statut comme COMPLETED
  // ni écrire la note de complétion, qui appartiennent au garage.
  if (isClient && !isGarageOwner) {
    // Heure réelle du rendez-vous (fuseau du Québec) — le serveur tourne en UTC.
    const hoursUntil = (quebecInstant(appt.date, appt.startTime).getTime() - Date.now()) / 3600000;
    if (hoursUntil < 24) {
      return NextResponse.json({ error: "Modification impossible à moins de 24h du rendez-vous. Appelez le garage directement." }, { status: 403 });
    }
    if (appt.source !== "ONLINE") {
      return NextResponse.json({ error: "Seuls les rendez-vous en ligne peuvent être modifiés ici." }, { status: 403 });
    }
    if ((status && status !== "CANCELLED") || completionNote !== undefined) {
      return NextResponse.json({ error: "Action réservée au garage." }, { status: 403 });
    }
  }

  // Un déplacement de date/heure ne doit pas chevaucher un autre RDV du garage —
  // vérifié par intervalle (durée réelle du RDV déplacé), pas par égalité d'heure.
  const movesAppt = !!(date || startTime || endTime);
  let newEndTimeForClient: string | null = null;
  if (movesAppt) {
    const newDate      = date ?? appt.date;
    const newStartTime = startTime ?? appt.startTime;
    // Un client ne choisit jamais la durée : elle reste celle du rendez-vous d'origine.
    const originalMin  = toMinutes(appt.endTime) - toMinutes(appt.startTime);
    const clientOnly   = isClient && !isGarageOwner;
    const newEndTime   = clientOnly ? toHHMM(toMinutes(newStartTime) + originalMin) : (endTime ?? appt.endTime);
    if (clientOnly) newEndTimeForClient = newEndTime;
    const durationMin  = toMinutes(newEndTime) - toMinutes(newStartTime);
    if (durationMin <= 0) {
      return NextResponse.json({ error: "Heure de fin invalide." }, { status: 400 });
    }
    const sameDay = await prisma.appointment.findMany({
      where: { garageId: appt.garageId, date: newDate, id: { not: id }, status: { notIn: ["CANCELLED", "NO_SHOW"] } },
      select: { startTime: true, endTime: true },
    });
    if (wouldExceedCapacity(newStartTime, durationMin, sameDay, appt.garage.capacity ?? 1)) {
      return NextResponse.json({ error: "Tous les postes du garage sont déjà occupés sur ce créneau." }, { status: 409 });
    }
    // Le client ne peut déplacer son rendez-vous que vers un créneau réellement offert par le garage
    // (heures d'ouverture, vacances, jour fermé, heure déjà passée) — jamais vers un horaire forcé.
    if (clientOnly) {
      const today = quebecToday();
      if (newDate < today || newDate > addDaysStr(today, 120)) {
        return NextResponse.json({ error: "Cette date n'est pas disponible." }, { status: 400 });
      }
      const [blocks, availRow] = await Promise.all([
        prisma.blockedSlot.findMany({ where: { garageId: appt.garageId, date: newDate }, select: { startTime: true, endTime: true, allDay: true } }),
        prisma.garageAvailability.findFirst({ where: { garageId: appt.garageId, dayOfWeek: dayOfWeekOf(newDate) } }),
      ]);
      const free = computeFreeSlots(availRow ?? undefined, blocks, sameDay, durationMin, { isToday: newDate === today, now: new Date(), capacity: appt.garage.capacity ?? 1 });
      if (!free.includes(newStartTime)) {
        return NextResponse.json({ error: "Ce créneau n'est pas disponible." }, { status: 409 });
      }
    }
  }

  // Un rendez-vous déplacé repart à zéro côté confirmation : sinon une échéance ou un rappel de
  // l'ancienne date pourrait libérer le créneau (ou rester muet) à la nouvelle date.
  const resetConfirmation = movesAppt && (date || startTime) && appt.status !== "CANCELLED" && appt.status !== "COMPLETED"
    ? (() => {
        const plan = planConfirmation(quebecInstant(date ?? appt.date, startTime ?? appt.startTime), new Date(), {
          enabled: appt.garage.requireConfirmation ?? true,
          hasEmail: !!appt.customerEmail,
        });
        return {
          confirmationStatus: plan.confirmationStatus, confirmTier: plan.confirmTier, confirmBy: plan.confirmBy,
          confirmToken: plan.confirmToken, confirmRequestedAt: plan.confirmRequestedAt,
          confirmNudgeAt: null, arrivalReminderAt: null, reminderSent: false,
        };
      })()
    : {};

  const updated = await prisma.appointment.update({
    where: { id },
    data: {
      ...(status                        ? { status }         : {}),
      ...(notes !== undefined           ? { notes }          : {}),
      ...(date                          ? { date }           : {}),
      ...(startTime                     ? { startTime }      : {}),
      ...(newEndTimeForClient           ? { endTime: newEndTimeForClient } : endTime ? { endTime } : {}),
      ...(completionNote !== undefined  ? { completionNote } : {}),
      ...resetConfirmation,
    },
    include: { garage: true },
  });

  // ── Notification "déplacement" quand le garage change la date/heure ──────────
  const isReschedule = isGarageOwner && !!(date || startTime);
  if (isReschedule) {
    const garageAddress = [updated.garage.address, updated.garage.city].filter(Boolean).join(", ");
    const garagePhone   = updated.garage.phone ?? "";

    // Récupère l'email du compte client (si RDV lié à un compte)
    const userRecord = updated.userId
      ? await prisma.user.findUnique({
          where:  { id: updated.userId },
          select: { email: true },
        })
      : null;

    // Priorité : email stocké dans le RDV, sinon email du compte Garago
    const recipientEmail = updated.customerEmail || userRecord?.email || null;

    const reschedulePromises: Promise<void>[] = [];

    if (recipientEmail) {
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

    await Promise.all(reschedulePromises);
  }

  // ── Notifications "véhicule prêt" quand le garage marque COMPLETED
  if (status === "COMPLETED") {
    const garageAddress = [updated.garage.address, updated.garage.city].filter(Boolean).join(", ");
    const note = completionNote ?? updated.completionNote;

    // Récupère l'email du compte client
    const userRecord2 = updated.userId
      ? await prisma.user.findUnique({
          where:  { id: updated.userId },
          select: { email: true },
        })
      : null;
    const recipientEmail2 = updated.customerEmail || userRecord2?.email || null;
    const garagePhone2    = updated.garage.phone ?? "";

    const completedPromises: Promise<void>[] = [];

    if (recipientEmail2) {
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

    await Promise.all(completedPromises);
  }

  return NextResponse.json(updated);
}
