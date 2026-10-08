import { prisma } from "@/lib/prisma";
import {
  sendConfirmationRequest, sendSlotReleased, sendArrivalReminder, sendGarageSlotReleased,
  sendManualConfirmationRequest, sendGarageNoResponse,
} from "@/lib/email";
import { sendConfirmationRequestSMS } from "@/lib/sms";
import {
  quebecInstant, quebecDateStr, formatQuebecMoment, standardDeadline, manualDeadline, confirmPageUrl, cancelPageUrl, shortConfirmUrl,
  REQUEST_HOURS_BEFORE, NUDGE_HOURS_BEFORE, ARRIVAL_REMINDER_HOURS_BEFORE, MANUAL_REQUEST_HOURS_BEFORE,
} from "@/lib/rdv-confirmation";

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

export interface RdvRunStats { requested: number; nudged: number; released: number; arrivalReminders: number; toCall: number; errors: number }

/**
 * Fait avancer le cycle de confirmation de tous les rendez-vous concernés.
 * Appelée toutes les ~15 minutes par /api/cron/rdv-confirmations. Chaque étape
 * « réserve » sa ligne avec un updateMany conditionnel avant d'envoyer le
 * courriel : deux exécutions qui se chevauchent n'envoient jamais deux fois.
 *
 * `onlyId` : ne traite qu'un rendez-vous (appelé à la création d'un rendez-vous
 * manuel à moins de 48 h, pour que le message parte sans attendre la tâche).
 */
export async function processRdvConfirmations(now: Date = new Date(), onlyId?: string): Promise<RdvRunStats> {
  const stats: RdvRunStats = { requested: 0, nudged: 0, released: 0, arrivalReminders: 0, toCall: 0, errors: 0 };
  const yesterday = quebecDateStr(new Date(now.getTime() - 24 * HOUR));

  const rows = await prisma.appointment.findMany({
    where: {
      confirmationStatus: { in: ["SCHEDULED", "AWAITING", "CONFIRMED"] },
      status: { notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"] },
      date: { gte: yesterday },
      ...(onlyId ? { id: onlyId } : {}),
    },
    include: {
      garage: { select: { name: true, phone: true, address: true, city: true, email: true, owner: { select: { email: true } } } },
      user: { select: { email: true } },
    },
  });

  for (const a of rows) {
    const start = quebecInstant(a.date, a.startTime);
    const to = a.customerEmail || a.user?.email || null;
    const token = a.confirmToken;
    if (!token) continue;

    const details = {
      to: to ?? "",
      customerName: a.customerName,
      garageName: a.garage.name,
      garagePhone: a.garage.phone,
      garageAddress: [a.garage.address, a.garage.city].filter(Boolean).join(", "),
      date: a.date, startTime: a.startTime, endTime: a.endTime,
      serviceName: a.serviceName,
    };

    try {
      // 0. Rendez-vous saisis par le garage : texto ou courriel à −48 h, garage prévenu à −24 h.
      //    Le créneau n'est jamais libéré automatiquement.
      if (a.confirmTier === "MANUAL") {
        const garageTo = a.garage.email || a.garage.owner?.email;
        const callGarage = async (undelivered: boolean) => {
          stats.toCall++;
          if (!garageTo) return;
          await sendGarageNoResponse({ to: garageTo, customerName: a.customerName, customerPhone: a.customerPhone, date: a.date, startTime: a.startTime, serviceName: a.serviceName, undelivered })
            .catch((e) => { stats.errors++; console.error("[rdv] sendGarageNoResponse", e); });
        };

        if (a.confirmationStatus === "SCHEDULED") {
          if (start.getTime() - now.getTime() > MANUAL_REQUEST_HOURS_BEFORE * HOUR) continue;
          const deadline = manualDeadline(start, now);
          if (!deadline) {
            await prisma.appointment.updateMany({ where: { id: a.id, confirmationStatus: "SCHEDULED" }, data: { confirmationStatus: "NOT_REQUIRED" } });
            continue;
          }
          const claimed = await prisma.appointment.updateMany({
            where: { id: a.id, confirmationStatus: "SCHEDULED" },
            data: { confirmationStatus: "AWAITING", confirmBy: deadline, confirmRequestedAt: now },
          });
          if (claimed.count !== 1) continue;
          try {
            const lang = a.language === "en" ? "en" : "fr";
            if (a.contactChannel === "SMS") {
              await sendConfirmationRequestSMS({ to: a.customerPhone, lang, garageName: a.garage.name, date: a.date, startTime: a.startTime, url: shortConfirmUrl(token) });
            } else if (a.contactChannel === "EMAIL" && a.customerEmail) {
              await sendManualConfirmationRequest({ ...details, to: a.customerEmail, lang, confirmUrl: confirmPageUrl(token), cancelUrl: cancelPageUrl(token) });
            } else {
              throw new Error("Aucun moyen de contact utilisable");
            }
            stats.requested++;
          } catch (e) {
            // Message non parti (numéro invalide, ligne fixe, service en panne) : inutile
            // d'attendre une réponse qui ne viendra pas, le garage est prévenu tout de suite.
            stats.errors++;
            console.error(`[rdv] demande de confirmation non remise pour ${a.id}`, e);
            await prisma.appointment.updateMany({
              where: { id: a.id, confirmationStatus: "AWAITING" },
              data: { confirmationStatus: "NO_RESPONSE", noResponseAt: now, confirmRequestedAt: null },
            });
            await callGarage(true);
          }
          continue;
        }

        if (a.confirmationStatus === "AWAITING" && a.confirmBy && a.confirmBy.getTime() <= now.getTime()) {
          // Rendez-vous imminent ou commencé : trop tard pour appeler, on clôt simplement la demande.
          if (start.getTime() - now.getTime() < 30 * MINUTE) {
            await prisma.appointment.updateMany({ where: { id: a.id, confirmationStatus: "AWAITING" }, data: { confirmationStatus: "NOT_REQUIRED" } });
            continue;
          }
          const claimed = await prisma.appointment.updateMany({
            where: { id: a.id, confirmationStatus: "AWAITING" },
            data: { confirmationStatus: "NO_RESPONSE", noResponseAt: now },
          });
          if (claimed.count === 1) await callGarage(false);
        }
        continue;
      }

      // 1. Demande de confirmation à −24 h (rendez-vous STANDARD)
      if (a.confirmationStatus === "SCHEDULED") {
        if (start.getTime() - now.getTime() > REQUEST_HOURS_BEFORE * HOUR) continue;
        const deadline = to ? standardDeadline(start, now) : null;
        if (!deadline) {
          await prisma.appointment.updateMany({ where: { id: a.id, confirmationStatus: "SCHEDULED" }, data: { confirmationStatus: "NOT_REQUIRED" } });
          continue;
        }
        const claimed = await prisma.appointment.updateMany({
          where: { id: a.id, confirmationStatus: "SCHEDULED" },
          data: { confirmationStatus: "AWAITING", confirmBy: deadline, confirmRequestedAt: now },
        });
        if (claimed.count !== 1) continue;
        try {
          await sendConfirmationRequest({ ...details, confirmUrl: confirmPageUrl(token), cancelUrl: cancelPageUrl(token), deadline: formatQuebecMoment(deadline), variant: "request" });
          stats.requested++;
        } catch (e) {
          // Courriel non parti : on remet en file plutôt que de risquer de libérer le créneau d'un client jamais prévenu.
          await prisma.appointment.updateMany({ where: { id: a.id }, data: { confirmationStatus: "SCHEDULED", confirmBy: null, confirmRequestedAt: null } });
          throw e;
        }
        continue;
      }

      // 2. Libération : l'échéance est passée sans confirmation
      if (a.confirmationStatus === "AWAITING" && a.confirmBy && a.confirmBy.getTime() <= now.getTime()) {
        // Tâche en retard : un rendez-vous déjà commencé ou imminent n'est jamais
        // annulé (le client est peut-être venu sans confirmer). On clôt simplement
        // la demande de confirmation.
        if (start.getTime() - now.getTime() < 30 * MINUTE) {
          await prisma.appointment.updateMany({ where: { id: a.id, confirmationStatus: "AWAITING" }, data: { confirmationStatus: "NOT_REQUIRED" } });
          continue;
        }
        const claimed = await prisma.appointment.updateMany({
          where: { id: a.id, confirmationStatus: "AWAITING" },
          data: { status: "CANCELLED", confirmationStatus: "EXPIRED" },
        });
        if (claimed.count !== 1) continue;
        stats.released++;
        if (start.getTime() > now.getTime()) {
          if (to) await sendSlotReleased({ ...details, retakeUrl: confirmPageUrl(token) }).catch((e) => { stats.errors++; console.error("[rdv] sendSlotReleased", e); });
          const garageTo = a.garage.email || a.garage.owner?.email;
          if (garageTo) {
            await sendGarageSlotReleased({ to: garageTo, garageName: a.garage.name, customerName: a.customerName, date: a.date, startTime: a.startTime, serviceName: a.serviceName })
              .catch((e) => { stats.errors++; console.error("[rdv] sendGarageSlotReleased", e); });
          }
        }
        continue;
      }

      // 3. Relance à −16 h (STANDARD, toujours sans réponse)
      if (
        a.confirmationStatus === "AWAITING" && a.confirmTier === "STANDARD" && !a.confirmNudgeAt && a.confirmBy && to &&
        now.getTime() >= start.getTime() - NUDGE_HOURS_BEFORE * HOUR &&
        a.confirmBy.getTime() - now.getTime() > 30 * MINUTE &&
        (!a.confirmRequestedAt || now.getTime() - a.confirmRequestedAt.getTime() >= 3 * HOUR)
      ) {
        const claimed = await prisma.appointment.updateMany({
          where: { id: a.id, confirmationStatus: "AWAITING", confirmNudgeAt: null },
          data: { confirmNudgeAt: now },
        });
        if (claimed.count !== 1) continue;
        try {
          await sendConfirmationRequest({ ...details, confirmUrl: confirmPageUrl(token), cancelUrl: cancelPageUrl(token), deadline: formatQuebecMoment(a.confirmBy), variant: "nudge" });
          stats.nudged++;
        } catch (e) {
          await prisma.appointment.updateMany({ where: { id: a.id }, data: { confirmNudgeAt: null } });
          throw e;
        }
        continue;
      }

      // 4. « Vous arrivez ? » à −2 h (dernière minute, déjà confirmé, réservé au moins 3 h avant)
      if (
        a.confirmationStatus === "CONFIRMED" && a.confirmTier === "LAST_MINUTE" && !a.arrivalReminderAt && to &&
        now.getTime() >= start.getTime() - ARRIVAL_REMINDER_HOURS_BEFORE * HOUR &&
        start.getTime() - now.getTime() > 20 * MINUTE &&
        start.getTime() - a.createdAt.getTime() > 3 * HOUR
      ) {
        const claimed = await prisma.appointment.updateMany({
          where: { id: a.id, arrivalReminderAt: null },
          data: { arrivalReminderAt: now },
        });
        if (claimed.count !== 1) continue;
        await sendArrivalReminder({ ...details, confirmUrl: confirmPageUrl(token) });
        stats.arrivalReminders++;
      }
    } catch (e) {
      stats.errors++;
      console.error(`[rdv] échec pour le rendez-vous ${a.id}`, e);
    }
  }

  return stats;
}
