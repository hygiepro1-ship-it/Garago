// Calcul des disponibilités réelles d'un garage — partagé entre l'API de créneaux
// (une seule date, un seul garage, une durée de service précise) et la recherche
// (plusieurs garages, plusieurs jours à l'avance) afin que les deux calculs ne
// divergent jamais.
//
// La durée d'un créneau dépend de la prestation choisie (GarageService.durationMin,
// configurée par le garage) : deux services de durées différentes ne doivent
// jamais se chevaucher dans l'agenda, donc toute vérification de disponibilité se
// fait par recouvrement d'intervalles [début, fin) — jamais par simple égalité
// d'heure de début, qui ne détecterait pas qu'un RDV de 90 min en cours à 10h00
// occupe encore le garage à 10h30.

export function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function toHHMM(min: number): string {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && aEnd > bStart;
}

export const DEFAULT_DURATION_MIN = 60;

// Le serveur tourne en UTC alors que les garages et les rendez-vous sont en heure du
// Québec : « aujourd'hui » et « maintenant » se calculent toujours dans ce fuseau.
const QUEBEC_TZ = "America/Toronto";

/** "YYYY-MM-DD" du jour courant au Québec. */
export function quebecToday(at: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: QUEBEC_TZ }).format(at);
}

/** Minutes écoulées depuis minuit, heure du Québec. */
export function quebecMinutes(at: Date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: QUEBEC_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(at);
  const h = Number(parts.find((p) => p.type === "hour")?.value ?? 0);
  const m = Number(parts.find((p) => p.type === "minute")?.value ?? 0);
  return h * 60 + m;
}

/** Ajoute des jours à une date "YYYY-MM-DD" (calendrier pur, sans fuseau). */
export function addDaysStr(date: string, days: number): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

/** Jour de la semaine (0 = dimanche) d'une date "YYYY-MM-DD". */
export function dayOfWeekOf(date: string): number {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d)).getUTCDay();
}

/**
 * Heures de départ candidates entre `open` et `close`, espacées de `durationMin`
 * pour que des RDV de cette durée s'enchaînent sans trou ni chevauchement.
 */
export function generateSlots(open: string, close: string, durationMin = DEFAULT_DURATION_MIN): string[] {
  // Une durée nulle ou négative ferait boucler la génération de créneaux à
  // l'infini (le pas n'avancerait jamais, ou reculerait) — garde défensive
  // même si l'écriture (durée par service, ou déduite d'un RDV) est déjà
  // validée en amont, pour qu'une donnée corrompue ne puisse jamais figer
  // toute une requête de recherche.
  if (!Number.isFinite(durationMin) || durationMin <= 0) return [];
  const startMin = toMinutes(open);
  const endMin = toMinutes(close) - durationMin; // dernier départ possible avant la fermeture
  const result: string[] = [];
  for (let m = startMin; m <= endMin; m += durationMin) result.push(toHHMM(m));
  return result;
}

export interface AvailabilityRow {
  dayOfWeek: number;
  openTime: string;
  closeTime: string;
  isClosed: boolean;
}

export interface BlockedRow {
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
}

export interface BookedRow {
  startTime: string;
  endTime: string;
  /** Poste attribué (1..capacité). Absent ou null : le rendez-vous occupe un poste, sans qu'on sache lequel. */
  bay?: number | null;
}

// ── Postes de travail ─────────────────────────────────────────────────────────
// Un garage peut réserver certains postes à certains services (ex. l'alignement ne
// se fait qu'au poste 2). Chaque service porte la liste des postes où il se fait ;
// une liste vide veut dire « tous ». Un rendez-vous pris en ligne n'est offert que
// si un poste autorisé est libre, et il va d'abord sur le poste le plus spécialisé,
// pour garder les postes polyvalents libres pour les autres services.

const validBay = (b: unknown, capacity: number): b is number => typeof b === "number" && Number.isInteger(b) && b >= 1 && b <= capacity;

/**
 * Postes où un rendez-vous peut se faire, pour les services demandés (une liste de
 * postes par service ; liste vide = tous). Plusieurs services : les postes qui les
 * font tous ; s'il n'y en a aucun, ceux qui en font au moins un.
 */
export function allowedBaysFor(capacity: number, serviceBays: number[][]): number[] {
  const all = Array.from({ length: Math.max(1, capacity) }, (_, i) => i + 1);
  const lists = serviceBays.map((l) => l.filter((b) => validBay(b, capacity))).filter((l) => l.length > 0);
  if (lists.length === 0) return all;
  const common = all.filter((b) => lists.every((l) => l.includes(b)));
  return common.length > 0 ? common : all.filter((b) => lists.some((l) => l.includes(b)));
}

/** Pour chaque poste (indice = numéro − 1), nombre de services du garage qui peuvent s'y faire. */
export function bayVersatility(capacity: number, allServiceBays: number[][]): number[] {
  const count = Array.from({ length: Math.max(1, capacity) }, () => 0);
  for (const raw of allServiceBays) {
    const list = raw.filter((b) => validBay(b, capacity));
    for (let b = 1; b <= count.length; b++) if (list.length === 0 || list.includes(b)) count[b - 1]++;
  }
  return count;
}

/** true si aucun rendez-vous déjà attribué à ce poste ne chevauche [startTime, startTime + durationMin). */
export function bayIsFree(bay: number, startTime: string, durationMin: number, existing: BookedRow[]): boolean {
  const start = toMinutes(startTime);
  const end = start + durationMin;
  return !existing.some((a) => a.bay === bay && overlaps(start, end, toMinutes(a.startTime), toMinutes(a.endTime)));
}

/**
 * Poste à attribuer à un nouveau rendez-vous, ou null si rien n'est possible :
 * garage plein sur cette plage, ou aucun poste autorisé libre. Parmi les postes
 * possibles : celui demandé (`prefer`) s'il est libre, sinon le plus spécialisé
 * (celui où le moins de services se font), puis le plus petit numéro.
 */
export function pickBay(
  startTime: string,
  durationMin: number,
  existing: BookedRow[],
  capacity: number,
  opts: { allowed?: number[]; versatility?: number[]; prefer?: number | null } = {},
): number | null {
  const cap = Math.max(1, capacity);
  const start = toMinutes(startTime);
  const end = start + durationMin;
  const over = existing.filter((a) => overlaps(start, end, toMinutes(a.startTime), toMinutes(a.endTime)));
  if (over.length >= cap) return null;
  const taken = new Set(over.map((a) => a.bay).filter((b) => validBay(b, cap)));
  // Les rendez-vous sans poste attribué occuperont chacun un des postes encore libres.
  const floating = over.filter((a) => !validBay(a.bay, cap)).length;
  const free = Array.from({ length: cap }, (_, i) => i + 1).filter((b) => !taken.has(b));
  if (free.length - floating < 1) return null;
  const allowed = opts.allowed;
  const candidates = allowed ? free.filter((b) => allowed.includes(b)) : free;
  if (candidates.length === 0) return null;
  if (opts.prefer && candidates.includes(opts.prefer)) return opts.prefer;
  const v = opts.versatility;
  return [...candidates].sort((x, y) => (v ? (v[x - 1] ?? 0) - (v[y - 1] ?? 0) : 0) || x - y)[0];
}

/**
 * Créneaux de départ réellement libres pour un service d'une durée donnée, un
 * jour précis. Chevauchement d'intervalles contre les blocages et les RDV déjà
 * pris — pas une simple comparaison d'heure de début.
 */
export function computeFreeSlots(
  avail: AvailabilityRow | undefined,
  blocks: BlockedRow[],
  booked: BookedRow[],
  durationMin: number,
  opts: { isToday?: boolean; now?: Date; capacity?: number; allowedBays?: number[] } = {}
): string[] {
  if (!avail || avail.isClosed) return [];
  // Un blocage (vacances, fermeture exceptionnelle) ferme tout le garage, peu
  // importe le nombre de postes — contrairement à un RDV, qui n'occupe qu'un
  // poste parmi ceux disponibles en même temps (voir `capacity`).
  if (blocks.some((b) => b.allDay)) return [];

  const candidates = generateSlots(avail.openTime, avail.closeTime, durationMin);

  const blockedIntervals = blocks
    .filter((b): b is { startTime: string; endTime: string; allDay: boolean } => !!b.startTime && !!b.endTime)
    .map((b) => ({ start: toMinutes(b.startTime), end: toMinutes(b.endTime) }));
  const { isToday = false, now = new Date(), capacity = 1, allowedBays } = opts;
  const nowMinutes = quebecMinutes(now) + 30;

  return candidates.filter((s) => {
    const start = toMinutes(s);
    const end = start + durationMin;
    if (isToday && start <= nowMinutes) return false; // passé
    if (blockedIntervals.some((b) => overlaps(start, end, b.start, b.end))) return false;
    // Un créneau n'est complet que lorsque tous les postes de travail sont
    // occupés en même temps — pas dès le premier RDV qui le chevauche. Si le
    // service ne se fait qu'à certains postes, il faut que l'un d'eux soit libre.
    return pickBay(s, durationMin, booked, capacity, { allowed: allowedBays }) !== null;
  });
}

export interface NextAvailability {
  date: string; // "YYYY-MM-DD"
  slots: string[]; // premiers créneaux libres ce jour-là (HH:MM)
  at: string; // "YYYY-MM-DDTHH:MM", comparable lexicographiquement pour trier
}

/**
 * Trouve les premiers créneaux réellement libres d'un garage, en parcourant les
 * `daysAhead` prochains jours et en s'arrêtant au premier jour qui a au moins un
 * créneau libre pour la durée de service donnée.
 */
export function findNextAvailability(
  availability: AvailabilityRow[],
  blockedByDate: Map<string, BlockedRow[]>,
  bookedByDate: Map<string, BookedRow[]>,
  opts: { daysAhead?: number; now?: Date; maxSlots?: number; durationMin?: number; capacity?: number } = {}
): NextAvailability | null {
  const { daysAhead = 14, now = new Date(), maxSlots = 3, durationMin = DEFAULT_DURATION_MIN, capacity = 1 } = opts;

  const baseDay = quebecToday(now);
  for (let offset = 0; offset <= daysAhead; offset++) {
    const dateStr = addDaysStr(baseDay, offset);
    const dow = dayOfWeekOf(dateStr);
    const avail = availability.find((a) => a.dayOfWeek === dow);

    const slots = computeFreeSlots(
      avail,
      blockedByDate.get(dateStr) ?? [],
      bookedByDate.get(dateStr) ?? [],
      durationMin,
      { isToday: offset === 0, now, capacity }
    );

    if (slots.length > 0) {
      return { date: dateStr, slots: slots.slice(0, maxSlots), at: `${dateStr}T${slots[0]}` };
    }
  }
  return null;
}

/**
 * Prochaine heure de départ réellement libre pour un rendez-vous de `durationMin`,
 * à partir de `fromDate` : garage ouvert, pas dans le passé, pas bloqué, et au
 * moins un poste libre pendant toute la durée. Sert à proposer d'emblée la bonne
 * heure quand le garage ouvre le formulaire de rendez-vous (ex. demain 08:00 si
 * la journée est finie). `today` et `nowMin` sont fournis par l'appelant, dans
 * son fuseau.
 */
export function findNextFreeStart(
  availability: AvailabilityRow[],
  blocked: { date: string; startTime?: string | null; endTime?: string | null; allDay?: boolean }[],
  booked: (BookedRow & { date: string })[],
  opts: { fromDate: string; today: string; nowMin: number; durationMin?: number; capacity?: number; stepMin?: number; daysAhead?: number },
): { date: string; time: string } | null {
  const { fromDate, today, nowMin, durationMin = DEFAULT_DURATION_MIN, capacity = 1, stepMin = 30, daysAhead = 60 } = opts;
  const first = fromDate < today ? today : fromDate;

  for (let offset = 0; offset <= daysAhead; offset++) {
    const date = addDaysStr(first, offset);
    const avail = availability.find((a) => a.dayOfWeek === dayOfWeekOf(date));
    if (!avail || avail.isClosed) continue;
    const blocks = blocked.filter((b) => b.date === date);
    if (blocks.some((b) => b.allDay || !b.startTime || !b.endTime)) continue;
    const dayBooked = booked.filter((a) => a.date === date);

    const close = toMinutes(avail.closeTime);
    for (let start = toMinutes(avail.openTime); start + durationMin <= close; start += stepMin) {
      if (date === today && start < nowMin) continue;
      if (blocks.some((b) => overlaps(start, start + durationMin, toMinutes(b.startTime!), toMinutes(b.endTime!)))) continue;
      if (wouldExceedCapacity(toHHMM(start), durationMin, dayBooked, capacity)) continue;
      return { date, time: toHHMM(start) };
    }
  }
  return null;
}

/**
 * true si réserver [startTime, startTime+durationMin) dépasserait la capacité
 * du garage — c.-à-d. si au moins `capacity` RDV existants chevauchent déjà ce
 * nouveau créneau (chacun occupant un poste de travail différent).
 */
export function wouldExceedCapacity(
  startTime: string,
  durationMin: number,
  existing: BookedRow[],
  capacity = 1
): boolean {
  const start = toMinutes(startTime);
  const end = start + durationMin;
  const concurrent = existing.filter((a) => overlaps(start, end, toMinutes(a.startTime), toMinutes(a.endTime))).length;
  return concurrent >= capacity;
}
