/**
 * SMS via Twilio — actif uniquement si TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 * et TWILIO_FROM_NUMBER sont définis dans les variables d'environnement.
 * Appel direct de l'API REST de Twilio (aucun paquet à installer).
 *
 * Les textos partent au nom du garage (« Garage Untel: … ») : le client ne
 * connaît pas Garago, un message signé d'un inconnu ressemble à de l'hameçonnage.
 */

import { isRateLimited } from "@/lib/abuse";

export type SmsLang = "fr" | "en";

// Plafonds quotidiens appliqués à tout envoi (voir sendSMS). Celui du site entier se règle
// avec la variable d'environnement SMS_DAILY_LIMIT.
const SMS_PER_NUMBER_DAILY = 6;
const SMS_ALL_DAILY = 1000;
// Un garage très occupé envoie quelques dizaines de textos par jour (confirmations, déplacements) :
// 100 laisse de la marge, et un compte de garage piraté ne peut plus vider à lui seul le quota du site.
export const SMS_PER_GARAGE_DAILY = 100;

/** Plafonds quotidiens qu'un texto doit respecter : par numéro, par garage (si connu) et pour le site entier. */
export function smsQuotas(e164: string, garageId?: string): { key: string; max: number; label: string }[] {
  return [
    { key: `smsto:${e164}`, max: SMS_PER_NUMBER_DAILY, label: "ce numéro" },
    ...(garageId ? [{ key: `smsgarage:${garageId}`, max: SMS_PER_GARAGE_DAILY, label: "ce garage" }] : []),
    { key: "smsall", max: Number(process.env.SMS_DAILY_LIMIT) || SMS_ALL_DAILY, label: "l'ensemble du site (SMS_DAILY_LIMIT)" },
  ];
}

export function smsConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
}

// Indicatifs régionaux canadiens. Le plan de numérotation nord-américain (+1) couvre aussi des tarifs spéciaux
// (900, 976) et des pays des Caraïbes où un texto coûte beaucoup plus cher et où la fraude « un coup de sonnerie »
// sévit : on n'envoie des textos qu'aux numéros canadiens, ce qui borne aussi le coût d'un abus.
const CANADIAN_AREA_CODES = new Set([
  "204", "226", "236", "249", "250", "257", "263", "289", "306", "343", "354", "365", "367", "368", "382", "403",
  "416", "418", "428", "431", "437", "438", "450", "468", "474", "506", "514", "519", "548", "579", "581", "584",
  "587", "604", "613", "639", "647", "672", "683", "705", "709", "742", "753", "778", "780", "782", "807", "819",
  "825", "867", "873", "879", "902", "905", "942",
]);

/** Numéro canadien → E.164 (+1XXXXXXXXXX), ou null s'il n'a pas 10 chiffres ou n'est pas un indicatif canadien. */
export function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  const national = digits.length === 10 ? digits : digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : null;
  if (!national || !CANADIAN_AREA_CODES.has(national.slice(0, 3))) return null;
  return `+1${national}`;
}

// Alphabet GSM-7 : tant qu'un texto n'en sort pas, il fait 160 caractères. Un seul
// caractère hors alphabet (ê, ç, ’, …) le fait tomber à 70 et double ou triple le coût.
const GSM7 = new Set(
  "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑܧ¿abcdefghijklmnopqrstuvwxyzäöñüà",
);
const TYPO: Record<string, string> = { "’": "'", "‘": "'", "“": '"', "”": '"', "«": '"', "»": '"', "–": "-", "—": "-", "…": "...", " ": " ", " ": " ", "œ": "oe", "Œ": "OE" };

/** Ramène un texte à l'alphabet GSM-7 (ê → e, ç → c, ’ → ') sans toucher aux é, è, à, ù. */
export function gsmSafe(text: string): string {
  let out = "";
  for (const ch of text) {
    if (GSM7.has(ch)) { out += ch; continue; }
    if (TYPO[ch] !== undefined) { out += TYPO[ch]; continue; }
    const base = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
    out += [...base].every((c) => GSM7.has(c)) ? base : "";
  }
  return out;
}

/**
 * Envoie un texto. Lève une erreur si Twilio n'est pas configuré, si le numéro
 * est invalide ou si Twilio refuse le message : l'appelant décide quoi faire
 * (ne jamais considérer qu'un client a été prévenu quand rien n'est parti).
 */
export async function sendSMS(to: string, body: string, garageId?: string): Promise<void> {
  if (!smsConfigured()) throw new Error("SMS non configuré (variables TWILIO_* absentes)");
  const e164 = toE164(to);
  if (!e164) throw new Error(`Numéro de téléphone invalide : ${to}`);

  // Garde-fous valables pour tous les envois (demande de confirmation, déplacement, annulation,
  // tâche planifiée) : chaque texto est facturé à Garago, et un compte de garage piraté ne doit
  // pouvoir ni harceler un numéro en déplaçant un rendez-vous en boucle, ni vider le budget.
  const DAY = 24 * 60 * 60 * 1000;
  for (const q of smsQuotas(e164, garageId)) {
    if (await isRateLimited(q.key, q.max, DAY)) {
      throw new Error(`Plafond quotidien de textos atteint pour ${q.label}`);
    }
  }

  const sid = process.env.TWILIO_ACCOUNT_SID as string;
  const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${sid}:${process.env.TWILIO_AUTH_TOKEN}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ From: process.env.TWILIO_FROM_NUMBER as string, To: e164, Body: gsmSafe(body) }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Twilio ${res.status} : ${err.message ?? "envoi refusé"}`);
  }
}

// ── Mise en forme ─────────────────────────────────────────────────────────────

/** « mar. 14 oct. » / « Tue, Oct 14 » */
function smsDate(date: string, lang: SmsLang): string {
  return new Date(date + "T12:00:00Z").toLocaleDateString(lang === "en" ? "en-CA" : "fr-CA", {
    timeZone: "UTC", weekday: "short", day: "numeric", month: "short",
  });
}

/** « 9h00 » / « 9:00 AM » */
function smsTime(time: string, lang: SmsLang): string {
  const [h, m] = time.split(":").map(Number);
  const mm = String(m).padStart(2, "0");
  if (lang === "en") return `${h % 12 === 0 ? 12 : h % 12}:${mm} ${h < 12 ? "AM" : "PM"}`;
  return `${h}h${mm}`;
}

/**
 * Nom du garage tel qu'il apparaît en tête d'un texto : sans adresse web ni lien (un nom de
 * garage ne doit jamais servir à glisser un lien d'hameçonnage dans un message), et borné.
 */
function smsName(name: string): string {
  return name.replace(/https?:\/\/\S*|www\.\S*|\S+\.(?:com|ca|net|org|io|co|info|xyz|app|ly|me)\b\S*/gi, " ").replace(/\s+/g, " ").trim().slice(0, 40) || "Garage";
}

interface RdvSmsParams {
  to:         string;
  garageId:   string; // compté dans le plafond quotidien de ce garage

  lang:       SmsLang;
  garageName: string;
  date:       string;
  startTime:  string;
}

// ── Textes — c'est ici qu'on façonne les messages envoyés aux clients ─────────

/** « jeu. 26 nov. à 12h30 » / « Thu, Nov 26 at 12:30 PM » */
export function smsWhen(date: string, startTime: string, lang: SmsLang): string {
  return `${smsDate(date, lang)} ${lang === "en" ? "at" : "à"} ${smsTime(startTime, lang)}`;
}

/** Texte du rappel 48 h avant : le client répond OUI ou NON (voir /api/webhooks/twilio-sms). */
export function confirmationRequestText(params: { lang: SmsLang; garageName: string; date: string; startTime: string }): string {
  const when = smsWhen(params.date, params.startTime, params.lang);
  return params.lang === "en"
    ? `${smsName(params.garageName)}: reminder, appointment ${when}. Reply YES to confirm or NO to cancel.`
    : `${smsName(params.garageName)}: rappel, RDV ${when}. Répondez OUI pour confirmer ou NON pour annuler.`;
}

/** Rappel 48 h avant : le client confirme ou annule en répondant au texto. */
export async function sendConfirmationRequestSMS(params: RdvSmsParams) {
  await sendSMS(params.to, confirmationRequestText(params), params.garageId);
}

/** Réponse automatique au texto du client (renvoyée directement à Twilio, pas par sendSMS). */
export function smsReplyText(kind: "CONFIRMED" | "CANCELLED" | "ASK_AGAIN" | "TOO_LATE", params: { lang: SmsLang; garageName: string; garagePhone: string; date: string; startTime: string }): string {
  const name = smsName(params.garageName);
  const when = smsWhen(params.date, params.startTime, params.lang);
  const en = params.lang === "en";
  switch (kind) {
    case "CONFIRMED": return en ? `${name}: thank you, your appointment ${when} is confirmed.` : `${name}: merci, votre RDV du ${when} est confirmé.`;
    case "CANCELLED": return en ? `${name}: your appointment ${when} is cancelled, the garage has been notified. To rebook: ${params.garagePhone}` : `${name}: votre RDV du ${when} est annulé, le garage est prévenu. Pour en reprendre un: ${params.garagePhone}`;
    case "ASK_AGAIN": return en ? `${name}: reply YES to confirm your appointment ${when}, or NO to cancel it.` : `${name}: répondez OUI pour confirmer votre RDV du ${when}, ou NON pour l'annuler.`;
    case "TOO_LATE": return en ? `${name}: your appointment ${when} can no longer be changed by text. Call the garage: ${params.garagePhone}` : `${name}: votre RDV du ${when} ne peut plus être modifié par texto. Appelez le garage: ${params.garagePhone}`;
  }
}

/** Rendez-vous enregistré par le garage : envoyé tout de suite après la saisie. */
export async function sendBookingConfirmedSMS(params: RdvSmsParams & { garagePhone: string; reminderPlanned: boolean }) {
  const when = `${smsDate(params.date, params.lang)} ${params.lang === "en" ? "at" : "à"} ${smsTime(params.startTime, params.lang)}`;
  const msg = params.lang === "en"
    ? `${smsName(params.garageName)}: your appointment is booked for ${when}.${params.reminderPlanned ? " Reminder 48 h before." : ""} Questions: ${params.garagePhone}`
    : `${smsName(params.garageName)}: votre RDV est enregistré le ${when}.${params.reminderPlanned ? " Rappel 48 h avant." : ""} Questions: ${params.garagePhone}`;
  await sendSMS(params.to, msg, params.garageId);
}

/** Véhicule prêt (le garage a marqué le rendez-vous « Terminé »), avec le lien pour noter le garage. */
export function vehicleReadyText(params: { lang: SmsLang; garageName: string; reviewUrl: string | null }): string {
  const en = params.lang === "en";
  const link = params.reviewUrl ? (en ? ` Rate the garage: ${params.reviewUrl}` : ` Notez le garage: ${params.reviewUrl}`) : "";
  return en ? `${smsName(params.garageName)}: your vehicle is ready.${link}` : `${smsName(params.garageName)}: votre véhicule est prêt.${link}`;
}

export async function sendVehicleReadySMS(params: { to: string; garageId: string; lang: SmsLang; garageName: string; reviewUrl: string | null }) {
  await sendSMS(params.to, vehicleReadyText(params), params.garageId);
}

/** Lendemain d'un rendez-vous que le garage n'a pas marqué « Terminé » : lien pour noter le garage. */
export function visitReviewText(params: { lang: SmsLang; garageName: string; reviewUrl: string }): string {
  return params.lang === "en"
    ? `${smsName(params.garageName)}: thank you for your visit. Rate the garage: ${params.reviewUrl}`
    : `${smsName(params.garageName)}: merci de votre visite. Notez le garage: ${params.reviewUrl}`;
}

export async function sendVisitReviewSMS(params: { to: string; garageId: string; lang: SmsLang; garageName: string; reviewUrl: string }) {
  await sendSMS(params.to, visitReviewText(params), params.garageId);
}

/** Le garage a déplacé le rendez-vous. */
export async function sendRescheduleSMS(params: RdvSmsParams & { garagePhone: string }) {
  const when = `${smsDate(params.date, params.lang)} ${params.lang === "en" ? "at" : "à"} ${smsTime(params.startTime, params.lang)}`;
  const msg = params.lang === "en"
    ? `${smsName(params.garageName)}: your appointment has been moved to ${when}. Questions: ${params.garagePhone}`
    : `${smsName(params.garageName)}: votre RDV est déplacé au ${when}. Questions: ${params.garagePhone}`;
  await sendSMS(params.to, msg, params.garageId);
}

/** Le garage a changé le service du rendez-vous (la date et l'heure ne bougent pas). */
export async function sendServiceChangedSMS(params: RdvSmsParams & { garagePhone: string; serviceName: string | null }) {
  const when = `${smsDate(params.date, params.lang)} ${params.lang === "en" ? "at" : "à"} ${smsTime(params.startTime, params.lang)}`;
  const service = (params.serviceName ?? "").replace(/\s+/g, " ").trim().slice(0, 40);
  const msg = params.lang === "en"
    ? `${smsName(params.garageName)}: your appointment ${when} was updated${service ? ` (service: ${service})` : ""}. Questions: ${params.garagePhone}`
    : `${smsName(params.garageName)}: votre RDV du ${when} a été modifié${service ? ` (service : ${service})` : ""}. Questions: ${params.garagePhone}`;
  await sendSMS(params.to, msg, params.garageId);
}

/** Le garage a annulé le rendez-vous. */
export async function sendCancelledByGarageSMS(params: RdvSmsParams & { garagePhone: string }) {
  const when = `${smsDate(params.date, params.lang)} ${params.lang === "en" ? "at" : "à"} ${smsTime(params.startTime, params.lang)}`;
  const msg = params.lang === "en"
    ? `${smsName(params.garageName)}: your appointment on ${when} has been cancelled. To rebook: ${params.garagePhone}`
    : `${smsName(params.garageName)}: votre RDV du ${when} est annulé. Pour le reprendre: ${params.garagePhone}`;
  await sendSMS(params.to, msg, params.garageId);
}
