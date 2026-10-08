/**
 * SMS via Twilio — actif uniquement si TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN
 * et TWILIO_FROM_NUMBER sont définis dans les variables d'environnement.
 * Appel direct de l'API REST de Twilio (aucun paquet à installer).
 *
 * Les textos partent au nom du garage (« Garage Untel: … ») : le client ne
 * connaît pas Garago, un message signé d'un inconnu ressemble à de l'hameçonnage.
 */

export type SmsLang = "fr" | "en";

export function smsConfigured(): boolean {
  return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_NUMBER);
}

/** Numéro nord-américain → E.164 (+1XXXXXXXXXX), ou null s'il n'a pas 10 chiffres. */
export function toE164(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  return null;
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
    ? `${params.garageName}: appointment ${when}. Confirm or cancel: ${params.url}`
    : `${params.garageName}: RDV ${when}. Confirmez ou annulez: ${params.url}`;
  await sendSMS(params.to, msg);
}

/** Le garage a déplacé le rendez-vous. */
export async function sendRescheduleSMS(params: RdvSmsParams & { garagePhone: string }) {
  const when = `${smsDate(params.date, params.lang)} ${params.lang === "en" ? "at" : "à"} ${smsTime(params.startTime, params.lang)}`;
  const msg = params.lang === "en"
    ? `${params.garageName}: your appointment has been moved to ${when}. Questions: ${params.garagePhone}`
    : `${params.garageName}: votre RDV est déplacé au ${when}. Questions: ${params.garagePhone}`;
  await sendSMS(params.to, msg);
}

/** Le garage a annulé le rendez-vous. */
export async function sendCancelledByGarageSMS(params: RdvSmsParams & { garagePhone: string }) {
  const when = `${smsDate(params.date, params.lang)} ${params.lang === "en" ? "at" : "à"} ${smsTime(params.startTime, params.lang)}`;
  const msg = params.lang === "en"
    ? `${params.garageName}: your appointment on ${when} has been cancelled. To rebook: ${params.garagePhone}`
    : `${params.garageName}: votre RDV du ${when} est annulé. Pour le reprendre: ${params.garagePhone}`;
  await sendSMS(params.to, msg);
}
