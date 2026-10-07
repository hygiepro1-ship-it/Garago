import { createHmac, timingSafeEqual } from "crypto";

// Lien de désabonnement signé (LCAP / CASL : tout courriel commercial doit en contenir un, et la demande
// doit être respectée sans condition). Le jeton est signé avec NEXTAUTH_SECRET : on ne peut désabonner
// que l'adresse pour laquelle le lien a été émis, et personne ne peut en fabriquer pour une autre adresse.

const BASE_URL = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";

function sign(payload: string): string {
  return createHmac("sha256", process.env.NEXTAUTH_SECRET ?? "").update(`unsub:${payload}`).digest("base64url");
}

export function unsubscribeToken(email: string): string {
  const payload = Buffer.from(email.trim().toLowerCase()).toString("base64url");
  return `${payload}.${sign(payload)}`;
}

/** Retourne l'adresse courriel si le jeton est authentique, sinon null. */
export function verifyUnsubscribeToken(token: string | null | undefined): string | null {
  if (!process.env.NEXTAUTH_SECRET || !token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  const expected = sign(payload);
  const a = Buffer.from(sig), b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try { return Buffer.from(payload, "base64url").toString("utf8"); } catch { return null; }
}

export function unsubscribeUrl(email: string): string {
  return `${BASE_URL}/api/unsubscribe?t=${unsubscribeToken(email)}`;
}
