/**
 * Webhook Twilio → texto reçu sur le numéro d'envoi (TWILIO_FROM_NUMBER).
 *
 * Les clients répondent souvent « oui » au texto de confirmation au lieu d'ouvrir le lien :
 * OUI confirme le rendez-vous, NON l'annule (le garage est prévenu comme pour une annulation
 * par le lien), toute autre réponse renvoie la consigne. Le rendez-vous visé est la demande
 * de confirmation la plus récente envoyée à ce numéro.
 *
 * À configurer dans la console Twilio : numéro → Messaging → « A message comes in »
 * → Webhook POST vers https://<domaine>/api/webhooks/twilio-sms
 */

import { createHmac, timingSafeEqual } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRateLimited } from "@/lib/abuse";
import { parseSmsReply, smsReplyText, toE164 } from "@/lib/sms";
import { quebecInstant, quebecDateStr } from "@/lib/rdv-confirmation";
import { sendCancelledByCustomer } from "@/lib/email";

export const dynamic = "force-dynamic";

const DAY = 24 * 60 * 60 * 1000;

/** Signature X-Twilio-Signature : HMAC-SHA1 (jeton d'authentification) de l'URL suivie des paramètres triés. */
function validSignature(url: string, params: URLSearchParams, signature: string): boolean {
  const data = url + [...params.keys()].sort().map((k) => k + params.get(k)).join("");
  const expected = createHmac("sha1", process.env.TWILIO_AUTH_TOKEN as string).update(data).digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

function twiml(message?: string) {
  const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const body = message ? `<Message>${esc(message)}</Message>` : "";
  return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`, {
    headers: { "Content-Type": "text/xml" },
  });
}

export async function POST(req: NextRequest) {
  if (!process.env.TWILIO_AUTH_TOKEN) return NextResponse.json({ error: "SMS non configuré" }, { status: 500 });

  const params = new URLSearchParams(await req.text());
  const signature = req.headers.get("x-twilio-signature") ?? "";
  // L'URL signée est celle saisie dans la console Twilio : celle de la requête, ou le domaine public du site.
  const base = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";
  const urls = [req.url, `${base}/api/webhooks/twilio-sms`];
  if (!urls.some((u) => validSignature(u, params, signature))) {
    return NextResponse.json({ error: "Signature invalide" }, { status: 403 });
  }

  const from = toE164(params.get("From") ?? "");
  const reply = parseSmsReply(params.get("Body") ?? "");
  if (!from) return twiml();

  // Un répondeur automatique pourrait répondre à nos réponses sans fin : au-delà, on se tait.
  if (await isRateLimited(`smsin:${from}`, 8, DAY)) return twiml();

  const now = new Date();
  const candidates = await prisma.appointment.findMany({
    where: {
      contactChannel: "SMS",
      confirmRequestedAt: { not: null },
      confirmationStatus: { in: ["AWAITING", "NO_RESPONSE", "CONFIRMED"] },
      status: { notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"] },
      date: { gte: quebecDateStr(now) },
    },
    orderBy: { confirmRequestedAt: "desc" },
    include: { garage: { select: { name: true, phone: true, email: true, owner: { select: { email: true } } } } },
  });
  // Le numéro du client est saisi librement par le garage : on compare les numéros normalisés.
  const mine = candidates.filter((a) => toE164(a.customerPhone) === from && quebecInstant(a.date, a.startTime).getTime() > now.getTime());
  // Priorité au rendez-vous qui attend encore une réponse.
  const a = mine.find((x) => x.confirmationStatus !== "CONFIRMED") ?? mine[0];
  if (!a) return twiml();

  const text = (kind: "confirmed" | "cancelled" | "help") => smsReplyText(kind, {
    lang: a.language === "en" ? "en" : "fr", garageName: a.garage.name, garagePhone: a.garage.phone,
    date: a.date, startTime: a.startTime,
  });
  const live = { status: { notIn: ["CANCELLED", "NO_SHOW", "COMPLETED"] } };

  if (reply === "yes") {
    await prisma.appointment.updateMany({
      where: { id: a.id, ...live, confirmationStatus: { in: ["AWAITING", "SCHEDULED", "NO_RESPONSE"] } },
      data: { confirmationStatus: "CONFIRMED", confirmedVia: "SMS", confirmRespondedAt: a.confirmRespondedAt ?? now },
    });
    return twiml(text("confirmed"));
  }

  if (reply === "no") {
    const done = await prisma.appointment.updateMany({
      where: { id: a.id, ...live },
      data: { status: "CANCELLED", cancelledBy: "CLIENT", cancelledAt: now, confirmRespondedAt: a.confirmRespondedAt ?? now },
    });
    // Le garage doit le savoir tout de suite pour redonner le créneau.
    const garageTo = a.garage.email || a.garage.owner?.email;
    if (done.count === 1 && garageTo) {
      await sendCancelledByCustomer({
        to: garageTo, garageName: a.garage.name, customerName: a.customerName, customerPhone: a.customerPhone,
        serviceName: a.serviceName, date: a.date, startTime: a.startTime,
      }).catch((e) => console.error("[sms] sendCancelledByCustomer", e));
    }
    return twiml(text("cancelled"));
  }

  // Un « merci » après la confirmation n'appelle pas de réponse.
  if (a.confirmationStatus === "CONFIRMED") return twiml();
  return twiml(text("help"));
}
