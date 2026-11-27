// Extrait de src/app/tableau-de-bord/garage/page.tsx (découpage du tableau de bord du garage).

import { confirmationLabel } from "@/components/GarageAgenda";
import { quebecToday, quebecMinutes, garageTimeZone } from "@/lib/availability";

/**
 * Un propriétaire peut gérer plusieurs garages. Le garage actif est passé aux
 * routes API via `?g=<id>` — lu depuis l'URL de la page (paramètre `g`).
 * Sans paramètre, les routes ciblent le garage principal du propriétaire.
 */
// « Aujourd'hui » et « maintenant » dans le fuseau du garage (voir garageTimeZone), pas celui de l'appareil.
export const quebecTodayStr = (tz: string) => quebecToday(new Date(), tz);

/** Heure actuelle du garage, en minutes depuis minuit. */
export const quebecNowMin = (tz: string) => quebecMinutes(new Date(), tz);

export const UPCOMING_WINDOW_MIN = 3 * 60;

/** « Terminé » n'est proposé qu'à partir de l'heure de début (il envoie « véhicule prêt » au client). */
export function hasStarted(a: { date: string; startTime: string }, tz: string): boolean {
  const today = quebecTodayStr(tz);
  if (a.date !== today) return a.date < today;
  const [h, m] = a.startTime.split(":").map(Number);
  return h * 60 + m <= quebecNowMin(tz);
}

/**
 * « Prochains rendez-vous » : seulement ceux d'aujourd'hui en cours ou qui commencent dans les 3 prochaines heures.
 * Le reste se lit dans l'agenda, juste au-dessus : la liste reste courte même un jour chargé.
 * S'il n'y en a aucun, la liste montre les 3 prochains rendez-vous à venir (voir isUpcomingLater).
 */
export function isUpcomingSoon(a: { date: string; startTime: string; endTime: string; status: string }, tz: string): boolean {
  if (a.status === "CANCELLED" || a.status === "COMPLETED" || a.status === "NO_SHOW" || a.date !== quebecTodayStr(tz)) return false;
  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const now = quebecNowMin(tz);
  return toMin(a.endTime) > now && toMin(a.startTime) < now + UPCOMING_WINDOW_MIN;
}

/** Rendez-vous encore à venir (plus tard aujourd'hui ou un jour suivant) : affichés quand rien ne tombe dans les 3 prochaines heures. */
export function isUpcomingLater(a: { date: string; startTime: string; status: string }, tz: string): boolean {
  if (a.status === "CANCELLED" || a.status === "COMPLETED" || a.status === "NO_SHOW") return false;
  const today = quebecTodayStr(tz);
  if (a.date !== today) return a.date > today;
  const [h, m] = a.startTime.split(":").map(Number);
  return h * 60 + m >= quebecNowMin(tz);
}

export const UPCOMING_FALLBACK_COUNT = 3;

export function selectedGarageId(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("g");
}

export function gfetch(path: string, init?: RequestInit) {
  const g = selectedGarageId();
  if (!g) return fetch(path, init);
  const sep = path.includes("?") ? "&" : "?";
  return fetch(`${path}${sep}g=${encodeURIComponent(g)}`, init);
}

export type Tab = "apercu" | "clients" | "services" | "marques" | "horaires" | "profil" | "abonnement" | "ambassadeur";

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface GarageAvailability {
  dayOfWeek: number;
  openTime:  string;
  closeTime: string;
  isClosed:  boolean;
}

export interface GarageService {
  categoryId:   string;
  categoryName: string;
  icon:         string;
  name:         string;
  priceMin:     string;
  priceMax:     string;
  durationMin:  string;
  /** Portes où ce service se fait — vide ou absent = tous les postes. */
  bays?:        number[];
}

export interface GarageBrand {
  brand:   string;
  accepts: boolean;
}

export interface GarageBrandModel {
  brand: string;
  model: string;
}

export interface GarageReview {
  id:          string;
  rating:      number;
  comment?:    string | null;
  ownerReply?: string | null;
  user?:       { name?: string | null } | null;
  authorName?: string | null;
  isHidden?:   boolean;
}

export interface Garage {
  id:                       string;
  parentId:                 string | null;
  slug:                     string;
  name:                     string;
  address?:                 string | null;
  city:                     string | null;
  postalCode?:              string | null;
  province:                 string | null;
  description:              string | null;
  descriptionDraft:         string | null;
  logoUrl:                  string | null;
  logoPosition:             string | null;
  coverUrl:                 string | null;
  coverPosition:            string | null;
  subscriptionStatus:       string | null;
  subscriptionEndAt:        string | null;
  pastDueSince:             string | null;
  cancelAtPeriodEnd?:       boolean;
  stripeCustomerId?:        string | null;
  stripePriceId?:           string | null;
  verificationStatus?:      string | null;
  createdAt?:               string;
  referralCode:             string | null;
  referralCount:            number;
  ambassadorTier:           number;
  ambassadorSince:          string | null;
  capacity?:                number;
  requireConfirmation?:     boolean;
  availability:             GarageAvailability[];
  services:                 GarageService[];
  brands:                   GarageBrand[];
  brandModels?:             GarageBrandModel[];
  reviews:                  GarageReview[];
  _count?:                  { reviews: number };
}

// ─── Image position helper ───────────────────────────────────────────────────
export function parseImgPos(raw: string | null | undefined): { tx: number; ty: number; zoom: number; color?: string } {
  const d = { tx: 0, ty: 0, zoom: 1 };
  if (!raw) return d;
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === "object") {
      const color = typeof p.color === "string" && p.color ? p.color : undefined;
      if ("tx" in p) return { tx: Number(p.tx) || 0, ty: Number(p.ty) || 0, zoom: Math.max(0.1, Number(p.zoom) || 1), color };
      if ("x"  in p) return { tx: (Number(p.x) || 50) - 50, ty: (Number(p.y) || 50) - 50, zoom: Math.max(0.1, Number(p.zoom) || 1), color };
    }
  } catch { /**/ }
  if (raw === "top")    return { tx: 0, ty: -20, zoom: 1 };
  if (raw === "bottom") return { tx: 0, ty:  20, zoom: 1 };
  return d;
}

// ─── Calendar helpers ────────────────────────────────────────────────────────
export function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

export function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Mon=0 … Sun=6
}

export const MONTH_NAMES_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];

export const DAY_ABBR_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

export const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: "#fef3c7", color: "#92400e", label: "En attente" },
  // Statut « à l'agenda » : ne dit rien de la réponse du client (voir confirmationLabel).
  CONFIRMED: { bg: "#f1f5f9", color: "#475569", label: "Prévu"      },
  COMPLETED: { bg: "#ede9fe", color: "#5b21b6", label: "Terminé"    },
  CANCELLED: { bg: "#fee2e2", color: "#991b1b", label: "Annulé"     },
  NO_SHOW:   { bg: "#fee2e2", color: "#991b1b", label: "Absent"     },
};

/** Badge d'un rendez-vous : la réponse du client quand une confirmation est en jeu, sinon le statut à l'agenda. */
export function statusBadge(a: any, tr: ((fr: string) => string) & { en?: boolean }): { bg: string; color: string; label: string } {
  if (a.status === "PENDING" || a.status === "CONFIRMED") {
    const c = confirmationLabel(a, tr, !!tr.en);
    if (c) return { bg: c.bg, color: c.color, label: c.label };
  }
  return STATUS_COLORS[a.status] ?? STATUS_COLORS.PENDING;
}

// ─── Ambassador overview card ─────────────────────────────────────────────────
