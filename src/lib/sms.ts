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
export async function sendSMS(to: string, body: string): Promise<void> {
  if (!smsConfigured()) throw new Error("SMS non configuré (variables TWILIO_* absentes)");
  const e164 = toE164(to);
  if (!e164) throw new Error(`Numéro de téléphone invalide : ${to}`);

  // Garde-fous valables pour tous les envois (demande de confirmation, déplacement, annulation,
  // tâche planifiée) : chaque texto est facturé à Garago, et un compte de garage piraté ne doit
  // pouvoir ni harceler un numéro en déplaçant un rendez-vous en boucle, ni vider le budget.
  const DAY = 24 * 60 * 60 * 1000;
  if (await isRateLimited(`smsto:${e164}`, SMS_PER_NUMBER_DAILY, DAY)) {
    throw new Error("Plafond quotidien de textos atteint pour ce numéro");
  }
  if (await isRateLimited("smsall", Number(process.env.SMS_DAILY_LIMIT) || SMS_ALL_DAILY, DAY)) {
    throw new Error("Plafond quotidien de textos atteint pour l'ensemble du site (SMS_DAILY_LIMIT)");
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
  lang:       SmsLang;
  garageName: string;
  date:       string;
  startTime:  string;
}

// ── Textes — c'est ici qu'on façonne les messages envoyés aux clients ─────────

/** Demande de confirmation (48 h avant) : un lien pour confirmer ou annuler. */
export async function sendConfirmationRequestSMS(params: RdvSmsParams & { url: string }) {
  const when = `${smsDate(params.date, params.lang)} ${params.lang === "en" ? "at" : "à"} ${smsTime(params.startTime, params.lang)}`;
  const msg = params.lang === "en"
    ? `${smsName(params.garageName)}: appointment ${when}. Confirm or cancel: ${params.url}`
    : `${smsName(params.garageName)}: RDV ${when}. Confirmez ou annulez: ${params.url}`;
  await sendSMS(params.to, msg);
}

/** Le garage a déplacé le rendez-vous. */
export async function sendRescheduleSMS(params: RdvSmsParams & { garagePhone: string }) {
  const when = `${smsDate(params.date, params.lang)} ${params.lang === "en" ? "at" : "à"} ${smsTime(params.startTime, params.lang)}`;
  const msg = params.lang === "en"
    ? `${smsName(params.garageName)}: your appointment has been moved to ${when}. Questions: ${params.garagePhone}`
    : `${smsName(params.garageName)}: votre RDV est déplacé au ${when}. Questions: ${params.garagePhone}`;
  await sendSMS(params.to, msg);
}

/** Le garage a annulé le rendez-vous. */
export async function sendCancelledByGarageSMS(params: RdvSmsParams & { garagePhone: string }) {
  const when = `${smsDate(params.date, params.lang)} ${params.lang === "en" ? "at" : "à"} ${smsTime(params.startTime, params.lang)}`;
  const msg = params.lang === "en"
    ? `${smsName(params.garageName)}: your appointment on ${when} has been cancelled. To rebook: ${params.garagePhone}`
    : `${smsName(params.garageName)}: votre RDV du ${when} est annulé. Pour le reprendre: ${params.garagePhone}`;
  await sendSMS(params.to, msg);
}
