import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/abuse";
import { quebecInstant, quebecDateStr } from "@/lib/rdv-confirmation";
import { sendCancelledByCustomer } from "@/lib/email";
import { smsReplyText, gsmSafe, toE164 } from "@/lib/sms";
import { smsIntent, isCarrierKeyword, validTwilioSignature } from "@/lib/sms-reply";

// Texto reçu sur le numéro Garago (Twilio → « A message comes in » → POST ici).
// Le client répond au rappel 48 h avant : « Oui » confirme, « Non » annule (le garage est prévenu).
// La réponse automatique part dans la réponse HTTP (TwiML) : aucun autre appel à Twilio.

const xml = (message?: string) => new Response(
  `<?xml version="1.0" encoding="UTF-8"?><Response>${message ? `<Message>${gsmSafe(message).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")}</Message>` : ""}</Response>`,
  { status: 200, headers: { "Content-Type": "text/xml; charset=utf-8" } },
);

export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!authToken) return new Response("SMS non configuré", { status: 503 });

  const form = await req.formData();
  const params: Record<string, string> = {};
  form.forEach((v, k) => { params[k] = String(v); });

  // Seul Twilio peut appeler cette adresse : signature vérifiée sur l'adresse publique configurée chez Twilio.
  const publicUrl = process.env.TWILIO_WEBHOOK_URL || `${process.env.NEXTAUTH_URL ?? req.nextUrl.origin}/api/webhooks/twilio-sms`;
  if (!validTwilioSignature(authToken, publicUrl, params, req.headers.get("x-twilio-signature"))) {
    return new Response("Signature invalide", { status: 403 });
  }

  const from = params.From ?? "";
  const body = params.Body ?? "";
  const digits = from.replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (national.length !== 10) return xml();
  // STOP, ARRET, AIDE… : Twilio s'en occupe (désabonnement), on ne répond rien par-dessus.
  if (isCarrierKeyword(body)) return xml();
  // Un échange en boucle (répondeur automatique) ne doit pas coûter des dizaines de textos.
  if (await isRateLimited(`smsin:${national}`, 8, 24 * 60 * 60 * 1000)) return xml();

  const now = new Date();
  // Le rendez-vous à venir de ce numéro dont le rappel est parti le plus récemment.
  const candidates = await prisma.appointment.findMany({
    where: {
      contactChannel: "SMS",
      confirmTier: "MANUAL",
      confirmRequestedAt: { not: null },
      status: { in: ["PENDING", "CONFIRMED"] },
      date: { gte: quebecDateStr(now) },
    },
    orderBy: { confirmRequestedAt: "desc" },
    take: 200,
    include: { garage: { select: { name: true, phone: true, email: true, owner: { select: { email: true } } } } },
  });
  // Le numéro est saisi par le garage (anciens rendez-vous : format libre) : on compare les numéros normalisés.
  const from164 = toE164(national);
  if (!from164) return xml();
  const a = candidates.find((x) => toE164(x.customerPhone) === from164 && quebecInstant(x.date, x.startTime).getTime() > now.getTime());
  if (!a) return xml(); // aucun rendez-vous en attente : on ne répond pas

  const lang = a.language === "en" ? "en" : "fr";
  const info = { lang: lang as "fr" | "en", garageName: a.garage.name, garagePhone: a.garage.phone, date: a.date, startTime: a.startTime };
  const intent = smsIntent(body);

  if (intent === "YES") {
    await prisma.appointment.updateMany({
      where: { id: a.id, status: { in: ["PENDING", "CONFIRMED"] }, confirmationStatus: { in: ["AWAITING", "SCHEDULED", "NO_RESPONSE", "CONFIRMED"] } },
      data: { confirmationStatus: "CONFIRMED", confirmedVia: "SMS", confirmRespondedAt: a.confirmRespondedAt ?? now },
    });
    return xml(smsReplyText("CONFIRMED", info));
  }

  if (intent === "NO") {
    // Le jour même, à moins de 2 h : le garage a peut-être déjà préparé la pièce, on renvoie vers lui.
    if (quebecInstant(a.date, a.startTime).getTime() - now.getTime() < 2 * 3600 * 1000) return xml(smsReplyText("TOO_LATE", info));
    const done = await prisma.appointment.updateMany({
      where: { id: a.id, status: { in: ["PENDING", "CONFIRMED"] } },
      data: { status: "CANCELLED", cancelledBy: "CLIENT", cancelledAt: now, confirmRespondedAt: a.confirmRespondedAt ?? now },
    });
    const garageTo = a.garage.email || a.garage.owner?.email;
    if (done.count === 1 && garageTo) {
      await sendCancelledByCustomer({
        to: garageTo, garageName: a.garage.name, customerName: a.customerName, customerPhone: a.customerPhone,
        serviceName: a.serviceName, date: a.date, startTime: a.startTime,
      }).catch((e) => console.error("[sms-in] sendCancelledByCustomer", e));
    }
    return xml(smsReplyText("CANCELLED", info));
  }

  // Déjà confirmé : un « merci » ou un « à jeudi » n'appelle pas de réponse.
  if (a.confirmationStatus === "CONFIRMED") return xml();
  return xml(smsReplyText("ASK_AGAIN", info));
}
