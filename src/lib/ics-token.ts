import { createHmac, timingSafeEqual } from "crypto";

/**
 * Jeton du lien « Ajouter au calendrier » (.ics) d'un rendez-vous : signé avec NEXTAUTH_SECRET.
 * Sans lui, quiconque connaissait l'identifiant d'un rendez-vous lisait le garage, le service et le véhicule.
 * Le lien reste utilisable sans connexion (réservation sans compte, courriel ouvert sur le téléphone).
 */
export function icsToken(appointmentId: string): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET manquant");
  return createHmac("sha256", secret).update(`ics:${appointmentId}`).digest("hex").slice(0, 32);
}

export function verifyIcsToken(appointmentId: string, token: string | null | undefined): boolean {
  if (typeof token !== "string" || !/^[a-f0-9]{32}$/.test(token)) return false;
  const expected = Buffer.from(icsToken(appointmentId));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}
