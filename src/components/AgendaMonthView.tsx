"use client";

/**
 * Vue « mois » de l'agenda du garage : un coup d'œil sur la charge de chaque
 * jour. Les jours où il reste de la place sont légèrement teintés, avec le temps
 * encore libre ; les jours fermés ou bloqués sont grisés. Un clic sur un jour
 * ouvre sa semaine, un clic sur un rendez-vous ouvre sa fiche.
 */

import { CANCELLED_STYLE, cancelledCount, PAST_OVERLAY, type WeekAppointment, type WeekAvailability, type WeekBlock } from "@/components/AgendaWeekView";
import { useTr } from "@/lib/dashboard-en";

const STEP = 30;
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

function chipColors(a: WeekAppointment): { bg: string; border: string; text: string } {
  if (a.status === "COMPLETED") return { bg: "#f0fdf4", border: "#86efac", text: "#166534" };
  if (a.status === "NO_SHOW" || a.confirmationStatus === "NO_RESPONSE") return { bg: "#fff1f2", border: "#f87171", text: "#991b1b" };
  if (a.confirmationStatus === "CONFIRMED") return { bg: "#ecfdf5", border: "#34d399", text: "#065f46" };
  return { bg: "#fff7ed", border: "#fb923c", text: "#9a3412" };
}

export default function AgendaMonthView({
  year, month, appointments, availability, capacity, blocked = [], lang, onPickDay, onPickAppointment, showCancelled = false,
}: {
  /** Afficher les rendez-vous annulés dans les cases (sinon seulement leur nombre). */
  showCancelled?: boolean;
  year: number;
  month: number;                        // 0 = janvier
  appointments: WeekAppointment[];
  availability: WeekAvailability[];
  capacity: number;
  blocked?: WeekBlock[];
  lang: string;
  onPickDay: (date: string) => void;
  onPickAppointment: (appt: WeekAppointment) => void;
}) {
  const tr = useTr();
  const locale = lang === "fr" ? "fr-CA" : "en-CA";
  const now = new Date();
  const todayStr = toDateStr(now);
  const nowMin = now.getHours() * 60 + now.getMinutes();

  // Grille du lundi au dimanche couvrant tout le mois.
  const first = new Date(year, month, 1, 12);
  first.setDate(first.getDate() - ((first.getDay() + 6) % 7));
  const last = new Date(year, month + 1, 0, 12);
  const weeks = Math.ceil(((last.getTime() - first.getTime()) / 86400000 + 1) / 7);
  const days = Array.from({ length: weeks * 7 }, (_, i) => { const d = new Date(first); d.setDate(first.getDate() + i); return d; });

  const active = appointments.filter((a) => a.status !== "CANCELLED");

  /** Minutes encore libres ce jour-là (garage ouvert, pas bloqué, pas passé, un poste disponible). */
  function freeMinutes(date: string, dow: number, dayAppts: WeekAppointment[]): number | null {
    const h = availability.find((a) => a.dayOfWeek === dow);
    if (!h || h.isClosed) return null;
    const dayBlocks = blocked.filter((b) => b.date === date);
    if (dayBlocks.some((b) => b.allDay || !b.startTime || !b.endTime)) return null;
    const holding = dayAppts.filter((a) => a.status !== "NO_SHOW");
    let free = 0;
    for (let m = toMin(h.openTime); m + STEP <= toMin(h.closeTime); m += STEP) {
      if (date < todayStr || (date === todayStr && m < nowMin)) continue;
      if (dayBlocks.some((b) => toMin(b.startTime as string) < m + STEP && toMin(b.endTime as string) > m)) continue;
      if (holding.filter((a) => toMin(a.startTime) < m + STEP && toMin(a.endTime) > m).length < capacity) free += STEP;
    }
    return free;
  }

  const weekdayNames = Array.from({ length: 7 }, (_, i) => new Date(2024, 0, 1 + i, 12).toLocaleDateString(locale, { weekday: "short" }).replace(".", ""));

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekdayNames.map((n) => <div key={n} className="py-1.5 text-center text-[11px] font-bold uppercase text-gray-500">{n}</div>)}
      </div>
      <div className="grid grid-cols-7">
        {days.map((d) => {
          const date = toDateStr(d);
          const inMonth = d.getMonth() === month;
          const dayAppts = active.filter((a) => a.date === date).sort((x, y) => x.startTime.localeCompare(y.startTime));
          const dayCancelled = appointments.filter((a) => a.date === date && a.status === "CANCELLED");
          // Les annulés passent après les rendez-vous actifs : ils ne prennent jamais leur place dans la case.
          const chips = showCancelled ? [...dayAppts, ...dayCancelled.sort((x, y) => x.startTime.localeCompare(y.startTime))] : dayAppts;
          const free = freeMinutes(date, d.getDay(), dayAppts);
          const closed = free === null;
          const hasRoom = !closed && free > 0;
          const freeLabel = hasRoom ? `${Math.floor(free / 60)} h${free % 60 ? " 30" : ""} ${lang === "en" ? "free" : `libre${free > 60 ? "s" : ""}`}` : closed ? tr("Fermé") : date < todayStr ? "" : tr("Complet");
          return (
            // Toute la case mène à sa semaine (la souris) ; le bouton du numéro reste le point d'accès au clavier.
            <div key={date} onClick={() => onPickDay(date)} className="relative border-t border-l border-gray-100 p-1 flex flex-col gap-0.5 cursor-pointer hover:brightness-[0.97]"
              style={{ minHeight: 84, background: closed ? "#f1f5f9" : date < todayStr ? "#fff" : hasRoom ? "#f0fdf4" : "#fff", opacity: inMonth ? 1 : 0.45 }}>
              {date < todayStr && <div aria-hidden="true" className="absolute inset-0 z-10 pointer-events-none" style={{ background: PAST_OVERLAY }} />}
              <button type="button" onClick={(e) => { e.stopPropagation(); onPickDay(date); }}
                aria-label={`${d.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })} : ${dayAppts.length} ${lang === "en" ? "appointments" : "rendez-vous"}${freeLabel ? `, ${freeLabel}` : ""}. ${lang === "en" ? "Open the week" : "Ouvrir la semaine"}`}
                className="flex items-baseline justify-between gap-1 text-left rounded hover:bg-black/5 px-0.5">
                <span className="text-xs font-black" style={date === todayStr
                  ? { background: "#e0600c", color: "#fff", borderRadius: 9999, padding: "0 6px" }
                  : { color: closed ? "#94a3b8" : "#0b1f3a" }}>{d.getDate()}</span>
                <span className="text-[10px] font-semibold truncate" style={{ color: hasRoom ? "#15803d" : "#94a3b8" }}>{freeLabel}</span>
              </button>
              {chips.slice(0, 3).map((a) => {
                const isCancelled = a.status === "CANCELLED";
                const c = isCancelled ? CANCELLED_STYLE : chipColors(a);
                return (
                  <button key={a.id} type="button" onClick={(e) => { e.stopPropagation(); onPickAppointment(a); }}
                    title={`${a.startTime}–${a.endTime} · ${a.customerName}${a.serviceName ? ` · ${a.serviceName}` : ""}`}
                    className="text-left text-[10px] leading-tight rounded px-1 py-0.5 truncate"
                    style={{ background: c.bg, borderLeft: `3px solid ${c.border}`, color: c.text }}>
                    <span className={isCancelled ? "line-through" : undefined}><span className="font-bold tabular-nums">{a.startTime}</span> {a.customerName}</span>
                  </button>
                );
              })}
              {chips.length > 3 && (
                <button type="button" onClick={(e) => { e.stopPropagation(); onPickDay(date); }} className="text-left text-[10px] font-semibold text-gray-500 px-1 hover:underline">
                  + {chips.length - 3} autre{chips.length - 3 > 1 ? "s" : ""}
                </button>
              )}
              {dayCancelled.length > 0 && (
                <span className="text-[10px] font-semibold px-1" style={{ color: CANCELLED_STYLE.text }}>{cancelledCount(dayCancelled.length, lang)}</span>
              )}
            </div>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 border-t border-gray-100 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }} />{tr("Libre")}</span>
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#fff", border: "1px solid #e2e8f0" }} />{tr("Complet")}</span>
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: `${PAST_OVERLAY}, #ecfdf5`, border: "1px solid #e2e8f0" }} />{tr("Journée passée")}</span>
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }} />{tr("Fermé")}</span>
        <span>{tr("Cliquez n'importe où sur un jour pour ouvrir sa semaine.")}</span>
      </div>
    </div>
  );
}
