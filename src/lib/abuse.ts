import type { NextRequest } from "next/server";
import prisma from "@/lib/prisma";

/** Adresse IP du client (Vercel renseigne x-forwarded-for avec l'IP réelle en premier). */
export function clientIp(req: NextRequest): string {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? req.headers.get("x-real-ip")
    ?? "unknown";
}

/**
 * Limiteur de débit simple adossé à la table RegistrationAttempt (clé libre dans la colonne `ip`,
 * purgée automatiquement après 7 jours par le cron cleanup-abuse-tables).
 * Retourne true si la limite est atteinte (la requête doit être refusée) ; sinon enregistre l'appel.
 */
export async function isRateLimited(key: string, max: number, windowMs: number): Promise<boolean> {
  const recent = await prisma.registrationAttempt.count({
    where: { ip: key, createdAt: { gt: new Date(Date.now() - windowMs) } },
  });
  if (recent >= max) return true;
  await prisma.registrationAttempt.create({ data: { ip: key } });
  return false;
}

/** Téléphone nord-américain : 10 chiffres (ou 11 avec l'indicatif 1). Retourne les 10 chiffres, ou null. */
export function normalizePhone(raw: unknown): string | null {
  const digits = String(raw ?? "").replace(/\D/g, "");
  if (digits.length === 10) return digits;
  if (digits.length === 11 && digits.startsWith("1")) return digits.slice(1);
  return null;
}

export function isValidEmail(raw: unknown): raw is string {
  return typeof raw === "string" && raw.length <= 120 && /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]{2,}$/.test(raw);
}

/** Texte libre : retire les caractères de contrôle, espaces superflus, et borne la longueur. */
export function cleanText(raw: unknown, max: number): string {
  return String(raw ?? "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, max);
}
