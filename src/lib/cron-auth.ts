import { timingSafeEqual } from "crypto";

/**
 * Appel légitime d'une tâche planifiée (Vercel Cron ou GitHub Actions) : en-tête
 * `Authorization: Bearer <CRON_SECRET>`. Sans CRON_SECRET configuré, tout est refusé.
 * Comparaison à durée constante : le temps de réponse ne révèle pas combien de caractères sont justes.
 */
export function isCronAuthorized(req: { headers: { get(name: string): string | null } }): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const given = Buffer.from(req.headers.get("authorization") ?? "");
  const expected = Buffer.from(`Bearer ${secret}`);
  return given.length === expected.length && timingSafeEqual(given, expected);
}
