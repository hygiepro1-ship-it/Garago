import { randomBytes } from "crypto";

/**
 * Cycle de confirmation des rendez-vous en ligne.
 *
 *  - STANDARD (plus de 24 h avant) : courriel de confirmation à −24 h, relance à
 *    −16 h, créneau libéré à −12 h sans réponse.
 *  - LAST_MINUTE (2 h à 24 h avant) : confirmation exigée dans l'heure suivant la
 *    réservation, puis un dernier courriel « vous arrivez ? » à −2 h.
 *  - Moins de 2 h avant : aucune confirmation, la réservation vaut engagement.
 */

export const QUEBEC_TZ = "America/Toronto";

export const REQUEST_HOURS_BEFORE = 24;
export const NUDGE_HOURS_BEFORE = 16;
export const RELEASE_HOURS_BEFORE = 12;
export const LAST_MINUTE_WINDOW_MIN = 60;
export const LAST_MINUTE_MAX_HOURS = 24;
export const EXPRESS_MAX_HOURS = 2;
export const ARRIVAL_REMINDER_HOURS_BEFORE = 2;

const HOUR = 60 * 60 * 1000;
const MINUTE = 60 * 1000;

/** Rendez-vous qui occupent encore le créneau (ni annulé, ni absent, ni terminé). */
export const HOLDING_STATUSES = ["PENDING", "CONFIRMED"];

/** Statuts qui libèrent le créneau dans le calcul des disponibilités. */
export const FREE_SLOT_STATUSES = ["CANCELLED", "NO_SHOW"];

function tzOffsetMs(at: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: QUEBEC_TZ, hourCycle: "h23",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  }).formatToParts(at);
  const g = (t: string) => Number(parts.find((p) => p.type === t)!.value);
  const wallAsUtc = Date.UTC(g("year"), g("month") - 1, g("day"), g("hour"), g("minute"), g("second"));
  return wallAsUtc - Math.floor(at.getTime() / 1000) * 1000;
}

/** Instant réel (UTC) d'une date/heure affichée en heure du Québec. */
export function quebecInstant(date: string, time: string): Date {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = time.split(":").map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  const first = tzOffsetMs(new Date(wall));
  let t = wall - first;
  const second = tzOffsetMs(new Date(t));
  if (second !== first) t = wall - second;
  return new Date(t);
}

/** "YYYY-MM-DD" du jour courant au Québec (le serveur tourne en UTC). */
export function quebecDateStr(at: Date): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: QUEBEC_TZ }).format(at);
}

/** « jeudi 8 octobre à 20 h 00 » */
export function formatQuebecMoment(at: Date): string {
  return new Intl.DateTimeFormat("fr-CA", {
    timeZone: QUEBEC_TZ, weekday: "long", day: "numeric", month: "long", hour: "numeric", minute: "2-digit",
  }).format(at);
}

export function newConfirmToken(): string {
  return randomBytes(24).toString("hex");
}

export interface ConfirmationPlan {
  confirmationStatus: "NOT_REQUIRED" | "SCHEDULED" | "AWAITING";
  confirmTier: "STANDARD" | "LAST_MINUTE" | null;
  confirmBy: Date | null;
  confirmToken: string | null;
  confirmRequestedAt: Date | null;
}

const NONE: ConfirmationPlan = {
  confirmationStatus: "NOT_REQUIRED", confirmTier: null, confirmBy: null, confirmToken: null, confirmRequestedAt: null,
};

/**
 * Palier applicable à une réservation en ligne.
 * Sans courriel pour joindre le client, ou si le garage a désactivé la
 * confirmation, aucune règle ne s'applique : on ne libère jamais le créneau
 * d'une personne qu'on ne peut pas prévenir.
 */
export function planConfirmation(start: Date, now: Date, opts: { enabled: boolean; hasEmail: boolean }): ConfirmationPlan {
  if (!opts.enabled || !opts.hasEmail) return NONE;
  const hours = (start.getTime() - now.getTime()) / HOUR;
  if (hours > LAST_MINUTE_MAX_HOURS) {
    return { confirmationStatus: "SCHEDULED", confirmTier: "STANDARD", confirmBy: null, confirmToken: newConfirmToken(), confirmRequestedAt: null };
  }
  if (hours > EXPRESS_MAX_HOURS) {
    return {
      confirmationStatus: "AWAITING", confirmTier: "LAST_MINUTE",
      confirmBy: new Date(now.getTime() + LAST_MINUTE_WINDOW_MIN * MINUTE),
      confirmToken: newConfirmToken(), confirmRequestedAt: now,
    };
  }
  return NONE;
}

/**
 * Échéance d'un rendez-vous STANDARD au moment où le courriel part : −12 h,
 * mais jamais moins d'une heure de délai si la tâche a du retard.
 * Retourne null si le rendez-vous est trop proche pour demander une confirmation.
 */
export function standardDeadline(start: Date, now: Date): Date | null {
  let by = start.getTime() - RELEASE_HOURS_BEFORE * HOUR;
  if (by < now.getTime() + HOUR) by = Math.min(now.getTime() + HOUR, start.getTime() - HOUR);
  return by > now.getTime() ? new Date(by) : null;
}

export function confirmPageUrl(token: string): string {
  const base = process.env.NEXTAUTH_URL ?? "https://garagopro.ca";
  return `${base}/rdv/confirmer/${token}`;
}
