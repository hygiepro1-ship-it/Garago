import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVehicleReady, sendRescheduleNotification, sendCancelledByGarage, sendCancelledByCustomer } from "@/lib/email";
import { wouldExceedCapacity, computeFreeSlots, bayIsFree, pickBay, toMinutes, toHHMM, quebecToday, addDaysStr, dayOfWeekOf } from "@/lib/availability";
import { loadBayRules } from "@/lib/bays";
import { quebecInstant, planConfirmation, planManualConfirmation } from "@/lib/rdv-confirmation";
import { processRdvConfirmations } from "@/lib/rdv-confirmation-run";
import { sendRescheduleSMS, sendServiceChangedSMS, sendCancelledByGarageSMS } from "@/lib/sms";
import { cleanText, isValidEmail } from "@/lib/abuse";
import { formatPhone, isFormattedPhone } from "@/lib/contact-format";

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
    // Les notes sont celles du garage (« visibles seulement par vous ») : le client n'y écrit pas.
    if ((status && status !== "CANCELLED") || completionNote !== undefined || notes !== undefined) {
      return NextResponse.json({ error: "Action réservée au garage." }, { status: 403 });
    }
  }

  // Le garage peut corriger toute la fiche : client, service, véhicule. Seuls les champs envoyés changent.
  const details: Record<string, string | number | null> = {};
  if (isGarageOwner) {
    if (body.customerName !== undefined) {
      const name = cleanText(body.customerName, 80);
      if (name.length < 2) return NextResponse.json({ error: "Entrez le nom du client." }, { status: 400 });
      details.customerName = name;
    }
    if (body.customerPhone !== undefined) {
      const phone = formatPhone(String(body.customerPhone));
      if (!isFormattedPhone(phone)) return NextResponse.json({ error: "Entrez un numéro de téléphone à 10 chiffres, par exemple (514) 555-0123." }, { status: 400 });
      details.customerPhone = phone;
    }
    if (body.customerEmail !== undefined) {
      const email = String(body.customerEmail ?? "").trim().toLowerCase();
      if (email && !isValidEmail(email)) return NextResponse.json({ error: "Adresse courriel invalide" }, { status: 400 });
      if (!email && appt.contactChannel === "EMAIL") return NextResponse.json({ error: "Ce client reçoit ses messages par courriel : gardez une adresse." }, { status: 400 });
      details.customerEmail = email || null;
    }
    if (body.serviceName !== undefined) details.serviceName = cleanText(body.serviceName, 120) || null;
    if (body.vehicleYear !== undefined) {
      const year = Number(body.vehicleYear);
      details.vehicleYear = Number.isInteger(year) && year >= 1950 && year <= new Date().getFullYear() + 1 ? year : null;
    }
    if (body.vehicleMake !== undefined) details.vehicleMake = cleanText(body.vehicleMake, 60) || null;
    if (body.vehicleModel !== undefined) details.vehicleModel = cleanText(body.vehicleModel, 60) || null;
  }

  // « Confirmé par téléphone » : le garage a joint lui-même un client qui n'avait pas répondu.
  const phoneConfirmed = body.phoneConfirmed === true && isGarageOwner
    && ["SCHEDULED", "AWAITING", "NO_RESPONSE"].includes(appt.confirmationStatus)
    && appt.status !== "CANCELLED" && appt.status !== "COMPLETED";

  // Un déplacement de date/heure ne doit pas chevaucher un autre RDV du garage —
  // vérifié par intervalle (durée réelle du RDV déplacé), pas par égalité d'heure.
  const movesAppt = !!(date || startTime || endTime);
  // Le garage peut aussi changer le poste d'un rendez-vous, avec ou sans déplacement.
  const bayAsked = isGarageOwner && body.bay !== undefined;
  let newEndTimeForClient: string | null = null;
  let newBay: number | null | undefined = undefined;
  // Rendez-vous suivants que cette modification repousse (envoyés par l'agenda du garage).
  type Row = Awaited<ReturnType<typeof prisma.appointment.findMany>>[number];
  const shifted: { row: Row; startTime: string; endTime: string; bay: number | null; durationMin: number }[] = [];
  if (movesAppt || bayAsked) {
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
      select: { id: true, startTime: true, endTime: true, bay: true },
    });
    const capacity = appt.garage.capacity ?? 1;

    // Décalage en chaîne : tout est vérifié ici, puis enregistré d'un seul coup plus bas.
    // Si un seul décalage est impossible, rien ne change, ni pour ce rendez-vous ni pour les autres.
    const rawShifts: unknown[] = isGarageOwner && Array.isArray(body.shifts) ? body.shifts.slice(0, 40) : [];
    if (rawShifts.length > 0) {
      const wanted = new Map<string, { startTime: string; bay?: number }>();
      for (const raw of rawShifts) {
        const x = (raw ?? {}) as Record<string, unknown>;
        if (typeof x.id !== "string" || x.id === id || !isTime(x.startTime)) {
          return NextResponse.json({ error: "Décalage invalide." }, { status: 400 });
        }
        const b = Number(x.bay);
        wanted.set(x.id, { startTime: x.startTime as string, ...(Number.isInteger(b) && b >= 1 && b <= capacity ? { bay: b } : {}) });
      }
      const rows = await prisma.appointment.findMany({
        where: { id: { in: [...wanted.keys()] }, garageId: appt.garageId, date: newDate, status: { in: ["PENDING", "CONFIRMED"] } },
      });
      if (rows.length !== wanted.size) {
        return NextResponse.json({ error: "Un des rendez-vous à décaler a changé entre-temps. Rechargez l'agenda et réessayez. Rien n'a été modifié." }, { status: 409 });
      }
      for (const row of rows) {
        const w = wanted.get(row.id)!;
        const dur = toMinutes(row.endTime) - toMinutes(row.startTime);
        if (toMinutes(w.startTime) + dur > 24 * 60 - 1) {
          return NextResponse.json({ error: `Le rendez-vous de ${row.customerName} dépasserait minuit. Rien n'a été modifié.` }, { status: 400 });
        }
        shifted.push({ row, startTime: w.startTime, endTime: toHHMM(toMinutes(w.startTime) + dur), bay: w.bay ?? row.bay, durationMin: dur });
      }
      // La journée telle qu'elle sera après les décalages : c'est contre elle que tout se vérifie.
      for (const other of sameDay) {
        const sh = shifted.find((x) => x.row.id === other.id);
        if (sh) { other.startTime = sh.startTime; other.endTime = sh.endTime; other.bay = sh.bay; }
      }
    }

    if (movesAppt && wouldExceedCapacity(newStartTime, durationMin, sameDay, capacity)) {
      return NextResponse.json({ error: "Toutes les portes du garage sont déjà occupées sur ce créneau." }, { status: 409 });
    }
    // Postes où le service de ce rendez-vous peut se faire.
    const bayRules = await loadBayRules(appt.garageId, capacity);
    const allowedBays = bayRules.forServiceName(appt.serviceName);
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
      const free = computeFreeSlots(availRow ?? undefined, blocks, sameDay, durationMin, { isToday: newDate === today, now: new Date(), capacity, allowedBays });
      if (!free.includes(newStartTime)) {
        return NextResponse.json({ error: "Ce créneau n'est pas disponible." }, { status: 409 });
      }
    }

    // Poste : celui demandé par le garage s'il est libre ; sinon le rendez-vous garde son
    // poste quand c'est possible ; sinon le poste le plus spécialisé qui convient.
    const wantedBay = Number(body.bay);
    if (bayAsked && body.bay !== null && body.bay !== "" && Number.isInteger(wantedBay) && wantedBay >= 1 && wantedBay <= capacity) {
      if (!bayIsFree(wantedBay, newStartTime, durationMin, sameDay)) {
        return NextResponse.json({ error: `La porte ${wantedBay} est déjà occupée sur ce créneau.` }, { status: 409 });
      }
      newBay = wantedBay;
    } else if (appt.bay && appt.bay <= capacity && bayIsFree(appt.bay, newStartTime, durationMin, sameDay) && (!clientOnly || allowedBays.includes(appt.bay))) {
      newBay = appt.bay;
    } else {
      newBay = pickBay(newStartTime, durationMin, sameDay, capacity, { allowed: allowedBays, versatility: bayRules.versatility })
        ?? (clientOnly ? null : pickBay(newStartTime, durationMin, sameDay, capacity, { versatility: bayRules.versatility }));
    }

    // Chaque rendez-vous décalé doit tenir à sa nouvelle place : garage pas plein, porte libre.
    const mainAfter = { id, startTime: newStartTime, endTime: newEndTime, bay: newBay ?? null };
    for (const sh of shifted) {
      const others = [...sameDay.filter((o) => o.id !== sh.row.id), mainAfter];
      if (wouldExceedCapacity(sh.startTime, sh.durationMin, others, capacity) || (sh.bay !== null && !bayIsFree(sh.bay, sh.startTime, sh.durationMin, others))) {
        return NextResponse.json({ error: `Impossible de décaler le rendez-vous de ${sh.row.customerName} à ${sh.startTime} : la place est prise. Rien n'a été modifié.` }, { status: 409 });
      }
    }
  }

  // Un rendez-vous déplacé repart à zéro côté confirmation : sinon une échéance ou un rappel de
  // l'ancienne date pourrait libérer le créneau (ou rester muet) à la nouvelle date.
  const freshConfirmation = (a: { source: string; contactChannel: string | null; customerEmail: string | null }, d: string, t: string) => {
    const newStart = quebecInstant(d, t);
    const enabled = appt.garage.requireConfirmation ?? true;
    const plan = a.source === "MANUAL"
      ? planManualConfirmation(newStart, new Date(), {
          enabled,
          reachable: a.contactChannel === "SMS" || (a.contactChannel === "EMAIL" && !!a.customerEmail),
        })
      : planConfirmation(newStart, new Date(), { enabled, hasEmail: !!a.customerEmail });
    return {
      confirmationStatus: plan.confirmationStatus, confirmTier: plan.confirmTier, confirmBy: plan.confirmBy,
      confirmToken: plan.confirmToken, confirmRequestedAt: plan.confirmRequestedAt,
      confirmNudgeAt: null, arrivalReminderAt: null, reminderSent: false,
      confirmedVia: null, confirmRespondedAt: null, noResponseAt: null,
    };
  };
  // La date ou l'heure change vraiment (pas seulement renvoyée telle quelle, ni la durée seule).
  const timeChanged = (!!date && date !== appt.date) || (!!startTime && startTime !== appt.startTime);
  const resetConfirmation = timeChanged && appt.status !== "CANCELLED" && appt.status !== "COMPLETED"
    ? freshConfirmation(appt, date ?? appt.date, startTime ?? appt.startTime)
    : {};

  // Ce rendez-vous et ceux qu'il repousse s'enregistrent ensemble : tout passe, ou rien.
  const [updated, ...shiftedRows] = await prisma.$transaction([
    prisma.appointment.update({
    where: { id },
    data: {
      ...(status                        ? { status }         : {}),
      ...(notes !== undefined           ? { notes }          : {}),
      ...(date                          ? { date }           : {}),
      ...(startTime                     ? { startTime }      : {}),
      ...(newEndTimeForClient           ? { endTime: newEndTimeForClient } : endTime ? { endTime } : {}),
      ...(completionNote !== undefined  ? { completionNote } : {}),
      ...(newBay !== undefined          ? { bay: newBay }    : {}),
      ...details,
      ...resetConfirmation,
      ...(phoneConfirmed ? { confirmationStatus: "CONFIRMED", confirmedVia: "PHONE", confirmRespondedAt: appt.confirmRespondedAt ?? new Date() } : {}),
      ...(status === "CANCELLED" && appt.status !== "CANCELLED" ? { cancelledBy: isGarageOwner ? "GARAGE" : "CLIENT", cancelledAt: new Date() } : {}),
      ...(status && status !== "CANCELLED" && appt.status === "CANCELLED" ? { cancelledBy: null, cancelledAt: null } : {}),
    },
    include: { garage: true },
    }),
    ...shifted.map((sh) => prisma.appointment.update({
      where: { id: sh.row.id },
      data: { startTime: sh.startTime, endTime: sh.endTime, bay: sh.bay, ...freshConfirmation(sh.row, sh.row.date, sh.startTime) },
      include: { garage: true },
    })),
  ]);

  // ── Annulation : l'autre partie doit toujours être prévenue ──────────────────────
  // Garage qui annule -> courriel au client ; client qui annule -> courriel au garage.
  if (status === "CANCELLED" && appt.status !== "CANCELLED") {
    const jobs: Promise<void>[] = [];
    if (isGarageOwner) {
      const acct = updated.userId ? await prisma.user.findUnique({ where: { id: updated.userId }, select: { email: true } }) : null;
      const to = updated.customerEmail || acct?.email || null;
      if (updated.contactChannel === "SMS") {
        jobs.push(sendCancelledByGarageSMS({
          to: updated.customerPhone, lang: updated.language === "en" ? "en" : "fr", garageName: updated.garage.name,
          garagePhone: updated.garage.phone ?? "", date: updated.date, startTime: updated.startTime,
        }).catch((e) => console.error("[CANCELLED BY GARAGE SMS]", e)));
      } else if (to) {
        jobs.push(sendCancelledByGarage({
          to, customerName: updated.customerName, garageName: updated.garage.name, garagePhone: updated.garage.phone ?? "",
          serviceName: updated.serviceName, date: updated.date, startTime: updated.startTime,
        }).catch((e) => console.error("[CANCELLED BY GARAGE EMAIL]", e)));
      }
    } else {
      const owner = await prisma.user.findUnique({ where: { id: updated.garage.ownerId ?? "" }, select: { email: true } });
      const to = updated.garage.email || owner?.email || null;
      if (to) {
        jobs.push(sendCancelledByCustomer({
          to, garageName: updated.garage.name, customerName: updated.customerName, customerPhone: updated.customerPhone,
          serviceName: updated.serviceName, date: updated.date, startTime: updated.startTime,
        }).catch((e) => console.error("[CANCELLED BY CUSTOMER EMAIL]", e)));
      }
    }
    await Promise.all(jobs);
  }

  // ── Le client n'est prévenu que de ce qui le touche : la date, l'heure ou le service ──
  // (un nom corrigé, une note, une porte ou une durée allongée ne lui envoient rien).
  const serviceChanged = isGarageOwner && details.serviceName !== undefined
    && String(details.serviceName ?? "") !== String(appt.serviceName ?? "");
  const notifyChange = async (a: typeof updated, what: "time" | "service") => {
    const garageAddress = [a.garage.address, a.garage.city].filter(Boolean).join(", ");
    const garagePhone   = a.garage.phone ?? "";
    // Priorité : courriel du rendez-vous, sinon celui du compte Garago du client.
    const userRecord = a.userId ? await prisma.user.findUnique({ where: { id: a.userId }, select: { email: true } }) : null;
    const recipientEmail = a.customerEmail || userRecord?.email || null;
    const lang = a.language === "en" ? "en" : "fr";
    if (a.contactChannel === "SMS") {
      const sms = { to: a.customerPhone, lang, garageName: a.garage.name, garagePhone, date: a.date, startTime: a.startTime } as const;
      await (what === "time" ? sendRescheduleSMS(sms) : sendServiceChangedSMS({ ...sms, serviceName: a.serviceName }))
        .catch((e) => console.error("[CHANGE SMS]", e));
    } else if (recipientEmail) {
      await sendRescheduleNotification({
        to: recipientEmail, customerName: a.customerName, garageName: a.garage.name, garagePhone, garageAddress,
        date: a.date, startTime: a.startTime, endTime: a.endTime, serviceName: a.serviceName, what,
      }).catch((e) => console.error("[CHANGE EMAIL]", e));
    }
    // Déplacé à moins de 48 h : la demande de confirmation part tout de suite.
    if (what === "time" && a.confirmTier === "MANUAL" && a.confirmationStatus === "SCHEDULED") {
      await processRdvConfirmations(new Date(), a.id).catch((e) => console.error("[RESCHEDULE CONFIRMATION]", e));
    }
  };
  if (isGarageOwner && timeChanged) await notifyChange(updated, "time");
  else if (serviceChanged) await notifyChange(updated, "service");
  for (const row of shiftedRows) await notifyChange(row, "time");

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
