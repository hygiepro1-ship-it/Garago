import { prisma } from "@/lib/prisma";
import { addDaysStr, quebecToday } from "@/lib/availability";
import { newReviewToken, reviewPageUrl } from "@/lib/review-checks";
import { sendVisitReviewRequest } from "@/lib/email";
import { sendVisitReviewSMS } from "@/lib/sms";

// Le lendemain d'un rendez-vous confirmé que le garage n'a pas marqué « Terminé », le client reçoit
// quand même son code pour noter le garage (le garage oublie souvent de cliquer « Terminé »).
// Appelé une fois par jour (/api/cron/rdv-confirmations, le matin).
//
// - Rendez-vous d'hier ou d'avant-hier seulement (un jour de tâche manqué est rattrapé, jamais plus) :
//   aucun envoi en masse vers de vieux rendez-vous.
// - Un rendez-vous qui a déjà un code, ou déjà un avis, ne reçoit rien (pas de doublon avec le
//   message « véhicule prêt » envoyé quand le garage a marqué « Terminé »).
// - Un seul moyen : texto si le client l'a choisi, sinon courriel ; « Aucun » (rendez-vous saisi
//   par le garage sans moyen de contact) : rien ne part et aucun code n'est créé.
export async function processReviewRequests(now: Date = new Date()) {
  const today = quebecToday(now);
  const rows = await prisma.appointment.findMany({
    where: {
      status: { in: ["CONFIRMED", "COMPLETED"] },
      reviewToken: null,
      date: { gte: addDaysStr(today, -2), lt: today },
    },
    select: {
      id: true, garageId: true, userId: true, source: true, contactChannel: true, language: true,
      customerName: true, customerPhone: true, customerEmail: true,
      garage: { select: { name: true } },
      user: { select: { email: true } },
    },
    take: 500,
  });

  let sms = 0, email = 0, skipped = 0;
  for (const a of rows) {
    const to = a.customerEmail || a.user?.email || null;
    const channel = a.contactChannel === "SMS" ? "SMS" : (a.source === "MANUAL" && !a.contactChannel) ? null : to ? "EMAIL" : null;
    if (!channel) { skipped++; continue; }
    if (await prisma.review.findFirst({ where: { appointmentId: a.id }, select: { id: true } })) { skipped++; continue; }

    // Le code n'est posé que s'il n'y en a toujours pas (deux tâches simultanées n'envoient pas deux fois).
    const reviewToken = newReviewToken();
    const set = await prisma.appointment.updateMany({ where: { id: a.id, reviewToken: null }, data: { reviewToken } });
    if (set.count !== 1) { skipped++; continue; }

    const lang = a.language === "en" ? "en" : "fr";
    const reviewUrl = reviewPageUrl(reviewToken);
    try {
      if (channel === "SMS") {
        await sendVisitReviewSMS({ to: a.customerPhone, garageId: a.garageId, lang, garageName: a.garage.name, reviewUrl });
        sms++;
      } else {
        await sendVisitReviewRequest({ to: to!, customerName: a.customerName, garageName: a.garage.name, reviewUrl, lang });
        email++;
      }
    } catch (e) {
      console.error("[REVIEW REQUEST]", a.id, e);
    }
  }
  return { reviewRequestsSms: sms, reviewRequestsEmail: email, reviewRequestsSkipped: skipped };
}
