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

/**
 * Heures de départ candidates entre `open` et `close`, espacées de `durationMin`
 * pour que des RDV de cette durée s'enchaînent sans trou ni chevauchement.
 */
export function generateSlots(open: string, close: string, durationMin = DEFAULT_DURATION_MIN): string[] {
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
  opts: { isToday?: boolean; now?: Date } = {}
): string[] {
  if (!avail || avail.isClosed) return [];
  if (blocks.some((b) => b.allDay)) return [];

  const candidates = generateSlots(avail.openTime, avail.closeTime, durationMin);

  const blockedIntervals = blocks
    .filter((b): b is { startTime: string; endTime: string; allDay: boolean } => !!b.startTime && !!b.endTime)
    .map((b) => ({ start: toMinutes(b.startTime), end: toMinutes(b.endTime) }));
  const bookedIntervals = booked.map((a) => ({ start: toMinutes(a.startTime), end: toMinutes(a.endTime) }));

  const { isToday = false, now = new Date() } = opts;
  const nowMinutes = now.getHours() * 60 + now.getMinutes() + 30;

  return candidates.filter((s) => {
    const start = toMinutes(s);
    const end = start + durationMin;
    if (isToday && start <= nowMinutes) return false; // passé
    if (blockedIntervals.some((b) => overlaps(start, end, b.start, b.end))) return false;
    if (bookedIntervals.some((b) => overlaps(start, end, b.start, b.end))) return false;
    return true;
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
  opts: { daysAhead?: number; now?: Date; maxSlots?: number; durationMin?: number } = {}
): NextAvailability | null {
  const { daysAhead = 14, now = new Date(), maxSlots = 3, durationMin = DEFAULT_DURATION_MIN } = opts;

  for (let offset = 0; offset <= daysAhead; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dow = d.getDay();
    const avail = availability.find((a) => a.dayOfWeek === dow);

    const slots = computeFreeSlots(
      avail,
      blockedByDate.get(dateStr) ?? [],
      bookedByDate.get(dateStr) ?? [],
      durationMin,
      { isToday: offset === 0, now }
    );

    if (slots.length > 0) {
      return { date: dateStr, slots: slots.slice(0, maxSlots), at: `${dateStr}T${slots[0]}` };
    }
  }
  return null;
}

/** true si un nouveau RDV [startTime, startTime+durationMin) chevauche un RDV existant. */
export function hasOverlap(
  startTime: string,
  durationMin: number,
  existing: BookedRow[]
): boolean {
  const start = toMinutes(startTime);
  const end = start + durationMin;
  return existing.some((a) => overlaps(start, end, toMinutes(a.startTime), toMinutes(a.endTime)));
}
