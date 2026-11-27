import { prisma } from "@/lib/prisma";
import { addDaysStr, quebecToday, garageTimeZone } from "@/lib/availability";
import { quebecInstant } from "@/lib/rdv-confirmation";
import { newReviewToken, reviewPageUrl, THANKS_DELAY_MS } from "@/lib/review-checks";
import { sendVisitReviewRequest } from "@/lib/email";
import { sendVisitReviewSMS } from "@/lib/sms";
import { QUEBEC_TZ } from "@/lib/availability";

// « Merci de votre visite » : 12 heures après l'heure de fin d'un rendez-vous confirmé que le garage
// n'a pas marqué « Terminé », le client reçoit un merci avec son code pour noter le garage.
// Appelé toutes les 15 minutes (/api/cron/rdv-confirmations, .github/workflows/rdv-confirmations.yml).
// Jamais la nuit : entre 21 h et 8 h (heure du Québec), le message attend 8 h du matin.
//
// - Un client qui a reçu « véhicule prêt » (le garage a cliqué « Terminé ») ne reçoit pas ce merci :
//   le rendez-vous n'est plus « confirmé » mais « terminé », et il a déjà son code.
// - Rendez-vous d'aujourd'hui et des 2 jours précédents seulement (une panne de la tâche est
//   rattrapée, jamais plus) : aucun envoi en masse vers de vieux rendez-vous.
// - Un rendez-vous qui a déjà un code, ou déjà un avis, ne reçoit rien (pas de doublon).
// - Un seul moyen : texto si le client l'a choisi, sinon courriel ; « Aucun » (rendez-vous saisi
//   par le garage sans moyen de contact) : rien ne part et aucun code n'est créé.
/** Heure locale (0 à 23) dans le fuseau donné : Québec par défaut, sinon celui du garage. */
function quebecHour(at: Date, tz: string = QUEBEC_TZ): number {
  return Number(new Intl.DateTimeFormat("en-CA", { timeZone: tz, hour: "numeric", hourCycle: "h23" }).format(at));
}
const QUIET_FROM = 21, QUIET_UNTIL = 8;

export async function processReviewRequests(now: Date = new Date()) {
  // Heures de silence vérifiées garage par garage plus bas (fuseaux de Terre-Neuve à la Colombie-Britannique).
  const today = quebecToday(now);
  const candidates = await prisma.appointment.findMany({
    where: {
      status: "CONFIRMED",
      reviewToken: null,
      date: { gte: addDaysStr(today, -2), lte: today },
    },
    select: {
      id: true, garageId: true, source: true, contactChannel: true, language: true, date: true, endTime: true,
      customerName: true, customerPhone: true, customerEmail: true,
      garage: { select: { name: true, province: true } },
      user: { select: { email: true } },
    },
    take: 500,
  });
  // Heure de fin et heures de silence comptées dans le fuseau de chaque garage.
  const rows = candidates.filter((a) => {
    const tz = garageTimeZone(a.garage.province);
    const localHour = quebecHour(now, tz);
    if (localHour >= QUIET_FROM || localHour < QUIET_UNTIL) return false;
    return quebecInstant(a.date, a.endTime, tz).getTime() + THANKS_DELAY_MS <= now.getTime();
  });

  let sms = 0, email = 0, skipped = 0;
  for (const a of rows) {
    const to = a.customerEmail || a.user?.email || null;
    const channel = a.contactChannel === "SMS" ? "SMS" : (a.source === "MANUAL" && !a.contactChannel) ? null : to ? "EMAIL" : null;
    if (!channel) { skipped++; continue; }
    if (await prisma.review.findFirst({ where: { appointmentId: a.id }, select: { id: true } })) { skipped++; continue; }

    // Le code n'est posé que si le rendez-vous est toujours « confirmé » sans code : le garage qui clique
    // « Terminé » au même moment, ou deux tâches simultanées, n'entraînent pas deux messages.
    const reviewToken = newReviewToken();
    const set = await prisma.appointment.updateMany({ where: { id: a.id, status: "CONFIRMED", reviewToken: null }, data: { reviewToken } });
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
  return { thanksSms: sms, thanksEmail: email, thanksSkipped: skipped };
}
