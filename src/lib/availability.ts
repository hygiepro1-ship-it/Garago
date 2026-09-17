// Calcul des disponibilités réelles d'un garage — partagé entre l'API de créneaux
// (une seule date, un seul garage) et la recherche (plusieurs garages, plusieurs
// jours à l'avance) afin que les deux calculs ne divergent jamais.

export function generateSlots(open: string, close: string, step = 60): string[] {
  const [oh, om] = open.split(":").map(Number);
  const [ch, cm] = close.split(":").map(Number);
  const startMin = oh * 60 + om;
  const endMin = ch * 60 + cm - step; // last slot starts 'step' min before close

  const result: string[] = [];
  for (let m = startMin; m <= endMin; m += step) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    result.push(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
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

export interface NextAvailability {
  date: string; // "YYYY-MM-DD"
  slots: string[]; // premiers créneaux libres ce jour-là (HH:MM)
  at: string; // "YYYY-MM-DDTHH:MM", comparable lexicographiquement pour trier
}

/**
 * Trouve les premiers créneaux réellement libres d'un garage, en tenant compte
 * de ses horaires d'ouverture, des blocages du garagiste et des RDV déjà pris.
 * Parcourt les `daysAhead` prochains jours et s'arrête au premier jour qui a au
 * moins un créneau libre.
 */
export function findNextAvailability(
  availability: AvailabilityRow[],
  blockedByDate: Map<string, BlockedRow[]>,
  bookedByDate: Map<string, Set<string>>,
  opts: { daysAhead?: number; now?: Date; maxSlots?: number } = {}
): NextAvailability | null {
  const { daysAhead = 14, now = new Date(), maxSlots = 3 } = opts;

  for (let offset = 0; offset <= daysAhead; offset++) {
    const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const dow = d.getDay();
    const avail = availability.find((a) => a.dayOfWeek === dow);
    if (!avail || avail.isClosed) continue;

    let slots = generateSlots(avail.openTime, avail.closeTime, 60);

    const blocks = blockedByDate.get(dateStr) ?? [];
    if (blocks.some((b) => b.allDay)) continue;

    const blockedTimes = new Set<string>();
    for (const block of blocks) {
      if (!block.startTime || !block.endTime) continue;
      const [bh, bm] = block.startTime.split(":").map(Number);
      const [eh, em] = block.endTime.split(":").map(Number);
      const blockStart = bh * 60 + bm;
      const blockEnd = eh * 60 + em;
      for (const slot of slots) {
        const [sh, sm] = slot.split(":").map(Number);
        const slotStart = sh * 60 + sm;
        const slotEnd = slotStart + 60;
        if (slotStart < blockEnd && slotEnd > blockStart) blockedTimes.add(slot);
      }
    }

    const booked = bookedByDate.get(dateStr) ?? new Set<string>();
    const isToday = offset === 0;
    const nowMinutes = now.getHours() * 60 + now.getMinutes() + 30;

    slots = slots.filter((s) => {
      if (booked.has(s)) return false;
      if (blockedTimes.has(s)) return false;
      if (isToday) {
        const [h, m] = s.split(":").map(Number);
        if (h * 60 + m <= nowMinutes) return false;
      }
      return true;
    });

    if (slots.length > 0) {
      return { date: dateStr, slots: slots.slice(0, maxSlots), at: `${dateStr}T${slots[0]}` };
    }
  }
  return null;
}
