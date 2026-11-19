// Réponses des clients au texto de rappel (48 h avant) : « Oui », « Yes », « Ok », « Non »,
// « Annuler »… Twilio nous transmet chaque texto reçu (voir /api/webhooks/twilio-sms).

import { createHmac, timingSafeEqual } from "crypto";

export type SmsIntent = "YES" | "NO" | "UNKNOWN";

/** Minuscules, sans accents, sans ponctuation ni espaces superflus. */
function normalize(text: string): string {
  return text
    .normalize("NFD").replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// Mots et expressions qui valent un « oui » ou un « non », en français et en anglais.
const YES = [
  "oui", "o", "ouais", "ouai", "ouin", "oui merci", "oui je confirme", "yes", "y", "yep", "yeah", "yup", "ya", "yes thanks",
  "ok", "okay", "oki", "okk", "k", "d accord", "daccord", "dacc", "confirme", "confirmer", "je confirme", "confirm",
  "confirmed", "i confirm", "parfait", "correct", "c est beau", "cest beau", "c est correct", "c est bon", "cest bon",
  "bien sur", "certainement", "absolument", "sure", "of course", "i ll be there", "je serai la", "j y serai", "present",
  "1",
];
const NO = [
  "non", "n", "no", "nope", "nah", "non merci", "no thanks", "annule", "annuler", "annulez", "j annule", "je annule",
  "cancel", "cancelled", "canceled", "please cancel", "je ne peux pas", "je peux pas", "peux pas", "pas disponible",
  "je ne serai pas la", "impossible", "can t", "cant", "cannot", "i can t make it", "not available", "2",
];
const YES_SET = new Set(YES);
const NO_SET = new Set(NO);

// Emojis courants (avant normalisation, qui les retirerait).
const YES_EMOJI = /^(👍|👌|✅|✔️|🙂|😊|👍🏻|👍🏼|👍🏽|👍🏾|👍🏿)+$/u;
const NO_EMOJI = /^(👎|❌|🚫|👎🏻|👎🏼|👎🏽|👎🏾|👎🏿)+$/u;

/**
 * Ce que veut dire la réponse du client. La phrase entière est comparée d'abord, puis son
 * premier mot (« Oui, à jeudi ! », « Non désolé »). Une réponse qui contient à la fois un
 * oui et un non (« oui mais non ») reste inconnue : on redemande plutôt que de deviner.
 */
export function smsIntent(raw: string): SmsIntent {
  const trimmed = raw.trim().replace(/\s+/g, "");
  if (YES_EMOJI.test(trimmed)) return "YES";
  if (NO_EMOJI.test(trimmed)) return "NO";
  const t = normalize(raw);
  if (!t) return "UNKNOWN";
  if (YES_SET.has(t)) return "YES";
  if (NO_SET.has(t)) return "NO";
  const words = t.split(" ");
  // Dans une phrase, seuls les mots d'au moins deux lettres comptent (« 2 » dans « vers 2h » n'est pas un non).
  const inside = (w: string) => /^[a-z ]{2,}$/.test(w) && (` ${t} `).includes(` ${w} `);
  const hasYes = YES.some(inside);
  const hasNo = NO.some(inside) || words.includes("pas") || words.includes("not");
  if (hasYes && !hasNo) return "YES";
  if (hasNo && !hasYes) return "NO";
  return "UNKNOWN";
}

/** Mots que Twilio traite lui-même (désabonnement, aide) : on ne répond jamais par-dessus. */
export function isCarrierKeyword(raw: string): boolean {
  return /^(stop|stopall|unsubscribe|end|quit|arret|arreter|start|unstop|help|aide|info)$/.test(normalize(raw).replace(/\s/g, ""));
}

/**
 * Vérifie la signature X-Twilio-Signature : HMAC-SHA1 (clé = jeton d'authentification Twilio)
 * de l'adresse appelée suivie des paramètres triés par nom, en base64.
 */
export function validTwilioSignature(authToken: string, url: string, params: Record<string, string>, signature: string | null): boolean {
  if (!signature) return false;
  const data = url + Object.keys(params).sort().map((k) => k + params[k]).join("");
  const expected = createHmac("sha1", authToken).update(data, "utf8").digest("base64");
  const a = Buffer.from(expected), b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}
