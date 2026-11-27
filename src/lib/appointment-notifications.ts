// Messages envoyés au client ou au garage après une modification de rendez-vous (route PATCH
// src/app/api/appointments/[id]/route.ts). Règle commune : un seul moyen, celui choisi par le client
// (texto s'il l'a choisi, sinon courriel), dans sa langue. Un échec d'envoi est journalisé, jamais bloquant.

import prisma from "@/lib/prisma";
import type { Appointment, Garage } from "@/generated/prisma/client";
import { sendVehicleReady, sendRescheduleNotification, sendCancelledByGarage, sendCancelledByCustomer } from "@/lib/email";
import { sendRescheduleSMS, sendServiceChangedSMS, sendCancelledByGarageSMS, sendVehicleReadySMS } from "@/lib/sms";
import { processRdvConfirmations } from "@/lib/rdv-confirmation-run";
import { reviewPageUrl, newReviewToken, reviewWindowOpen } from "@/lib/review-checks";

export type AppointmentWithGarage = Appointment & { garage: Garage };

const langOf = (a: Appointment): "fr" | "en" => (a.language === "en" ? "en" : "fr");
const addressOf = (g: Garage) => [g.address, g.city].filter(Boolean).join(", ");

/** Courriel pour joindre le client : celui du rendez-vous, sinon celui de son compte Garago. */
async function customerEmail(a: Appointment): Promise<string | null> {
  if (a.customerEmail) return a.customerEmail;
  if (!a.userId) return null;
  return (await prisma.user.findUnique({ where: { id: a.userId }, select: { email: true } }))?.email ?? null;
}

/** Annulation : l'autre partie est toujours prévenue (garage qui annule → client ; client qui annule → garage). */
export async function notifyCancellation(a: AppointmentWithGarage, byGarage: boolean): Promise<void> {
  if (byGarage) {
    if (a.contactChannel === "SMS") {
      await sendCancelledByGarageSMS({
        to: a.customerPhone, garageId: a.garageId, lang: langOf(a), garageName: a.garage.name,
        garagePhone: a.garage.phone ?? "", date: a.date, startTime: a.startTime,
      }).catch((e) => console.error("[CANCELLED BY GARAGE SMS]", e));
      return;
    }
    const to = await customerEmail(a);
    if (to) {
      await sendCancelledByGarage({
        to, customerName: a.customerName, garageName: a.garage.name, garagePhone: a.garage.phone ?? "",
        serviceName: a.serviceName, date: a.date, startTime: a.startTime, lang: langOf(a),
      }).catch((e) => console.error("[CANCELLED BY GARAGE EMAIL]", e));
    }
    return;
  }
  const owner = a.garage.ownerId ? await prisma.user.findUnique({ where: { id: a.garage.ownerId }, select: { email: true } }) : null;
  const to = a.garage.email || owner?.email || null;
  if (to) {
    await sendCancelledByCustomer({
      to, garageName: a.garage.name, customerName: a.customerName, customerPhone: a.customerPhone,
      serviceName: a.serviceName, date: a.date, startTime: a.startTime,
    }).catch((e) => console.error("[CANCELLED BY CUSTOMER EMAIL]", e));
  }
}

/** Date, heure ou service changés par le garage : seul ce qui touche le client lui est envoyé. */
export async function notifyChange(a: AppointmentWithGarage, what: "time" | "service"): Promise<void> {
  const garagePhone = a.garage.phone ?? "";
  const lang = langOf(a);
  if (a.contactChannel === "SMS") {
    const sms = { to: a.customerPhone, garageId: a.garageId, lang, garageName: a.garage.name, garagePhone, date: a.date, startTime: a.startTime } as const;
    await (what === "time" ? sendRescheduleSMS(sms) : sendServiceChangedSMS({ ...sms, serviceName: a.serviceName }))
      .catch((e) => console.error("[CHANGE SMS]", e));
  } else {
    const to = await customerEmail(a);
    if (to) {
      await sendRescheduleNotification({
        to, customerName: a.customerName, garageName: a.garage.name, garagePhone, garageAddress: addressOf(a.garage),
        date: a.date, startTime: a.startTime, endTime: a.endTime, serviceName: a.serviceName, what, lang,
      }).catch((e) => console.error("[CHANGE EMAIL]", e));
    }
  }
  // Déplacé à moins de 48 h : la demande de confirmation part tout de suite.
  if (what === "time" && a.confirmTier === "MANUAL" && a.confirmationStatus === "SCHEDULED") {
    await processRdvConfirmations(new Date(), a.id).catch((e) => console.error("[RESCHEDULE CONFIRMATION]", e));
  }
}

/**
 * « Véhicule prêt » quand le garage marque le rendez-vous terminé, avec le lien pour noter le garage.
 * Le code d'avis est le même si le garage renvoie le message ; aucun nouveau code si l'avis est déjà déposé
 * ou si les 15 jours sont passés (le message part alors sans lien).
 */
export async function notifyVehicleReady(a: AppointmentWithGarage, completionNote: string | null | undefined): Promise<void> {
  let reviewToken = a.reviewToken;
  if (!reviewToken && reviewWindowOpen(a.date)
      && !(await prisma.review.findFirst({ where: { appointmentId: a.id }, select: { id: true } }))) {
    reviewToken = newReviewToken();
    await prisma.appointment.update({ where: { id: a.id }, data: { reviewToken } });
  }
  const reviewUrl = reviewToken ? reviewPageUrl(reviewToken) : null;
  const lang = langOf(a);

  if (a.contactChannel === "SMS") {
    await sendVehicleReadySMS({ to: a.customerPhone, garageId: a.garageId, lang, garageName: a.garage.name, reviewUrl })
      .catch((e) => console.error("[VEHICLE READY SMS]", e));
    return;
  }
  const to = await customerEmail(a);
  if (to) {
    await sendVehicleReady({
      to, customerName: a.customerName, garageName: a.garage.name, garageAddress: addressOf(a.garage),
      garagePhone: a.garage.phone ?? "", completionNote: completionNote ?? a.completionNote, lang, reviewUrl,
    }).catch((e) => console.error("[VEHICLE READY EMAIL]", e));
  }
}
