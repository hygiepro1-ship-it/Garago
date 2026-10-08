"use client";

/**
 * Vue « semaine » de l'agenda du garage : une colonne par jour, une ligne par
 * demi-heure. Les plages encore disponibles (garage ouvert, un poste libre, pas
 * dans le passé) sont légèrement teintées ; un clic dessus ouvre le formulaire
 * de rendez-vous à cette date et cette heure.
 */

export interface WeekAppointment {
  id: string;
  customerName: string;
  serviceName?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  confirmationStatus?: string;
}

export interface WeekAvailability { dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }

const STEP = 30;     // minutes par ligne
const ROW_H = 30;    // pixels par ligne

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

function apptColors(a: WeekAppointment): { bg: string; border: string; text: string } {
  if (a.status === "COMPLETED") return { bg: "#f0fdf4", border: "#86efac", text: "#166534" };
  if (a.status === "NO_SHOW") return { bg: "#fef2f2", border: "#fca5a5", text: "#991b1b" };
  if (a.confirmationStatus === "NO_RESPONSE") return { bg: "#fff1f2", border: "#f87171", text: "#991b1b" };
  if (a.confirmationStatus === "CONFIRMED") return { bg: "#ecfdf5", border: "#34d399", text: "#065f46" };
  return { bg: "#fff7ed", border: "#fb923c", text: "#9a3412" };
}

/** Répartit les rendez-vous qui se chevauchent en colonnes côte à côte. */
function layout(appts: WeekAppointment[]): { appt: WeekAppointment; lane: number; lanes: number }[] {
  const sorted = [...appts].sort((x, y) => x.startTime.localeCompare(y.startTime) || x.endTime.localeCompare(y.endTime));
  const out: { appt: WeekAppointment; lane: number; lanes: number }[] = [];
  let group: { appt: WeekAppointment; lane: number }[] = [];
  let groupEnd = -1;
  const flush = () => {
    const lanes = group.reduce((n, g) => Math.max(n, g.lane + 1), 1);
    for (const g of group) out.push({ ...g, lanes });
    group = [];
  };
  for (const appt of sorted) {
    const start = toMin(appt.startTime);
    if (group.length && start >= groupEnd) flush();
    const used = new Set(group.filter((g) => toMin(g.appt.endTime) > start).map((g) => g.lane));
    let lane = 0;
    while (used.has(lane)) lane++;
    group.push({ appt, lane });
    groupEnd = Math.max(groupEnd, toMin(appt.endTime));
  }
  if (group.length) flush();
  return out;
}

export default function AgendaWeekView({
  days, appointments, availability, capacity, selectedDate, lang, onPickSlot, onPickAppointment,
}: {
  days: string[];                       // 7 dates "YYYY-MM-DD", du lundi au dimanche
  appointments: WeekAppointment[];
  availability: WeekAvailability[];
  capacity: number;
  selectedDate: string;
  lang: string;
  onPickSlot: (date: string, time: string) => void;
  onPickAppointment: (appt: WeekAppointment) => void;
}) {
  const active = appointments.filter((a) => a.status !== "CANCELLED");
  const hoursOf = (date: string) => {
    const dow = new Date(date + "T12:00:00").getDay();
    const h = availability.find((a) => a.dayOfWeek === dow);
    return h && !h.isClosed ? { open: toMin(h.openTime), close: toMin(h.closeTime) } : null;
  };

  // Plage affichée : de la première ouverture à la dernière fermeture de la semaine,
  // élargie si un rendez-vous déborde (heure pleine la plus proche).
  const opens = days.map(hoursOf).filter((h): h is { open: number; close: number } => h !== null);
  let from = opens.length ? Math.min(...opens.map((h) => h.open)) : 8 * 60;
  let to = opens.length ? Math.max(...opens.map((h) => h.close)) : 18 * 60;
  for (const a of active) { from = Math.min(from, toMin(a.startTime)); to = Math.max(to, toMin(a.endTime)); }
  from = Math.floor(from / 60) * 60;
  to = Math.ceil(to / 60) * 60;
  const rows = Array.from({ length: (to - from) / STEP }, (_, i) => from + i * STEP);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const locale = lang === "fr" ? "fr-CA" : "en-CA";

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div style={{ minWidth: 620 }}>
        {/* En-tête : jours */}
        <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: "48px repeat(7, minmax(0, 1fr))" }}>
          <div />
          {days.map((d) => {
            const dt = new Date(d + "T12:00:00");
            const closed = !hoursOf(d);
            return (
              <div key={d} className="py-2 text-center border-l border-gray-100"
                style={{ background: d === selectedDate ? "#0b1f3a" : d === todayStr ? "#fff7ed" : undefined, color: d === selectedDate ? "#fff" : closed ? "#94a3b8" : "#0b1f3a" }}>
                <p className="text-[11px] font-bold uppercase opacity-70">{dt.toLocaleDateString(locale, { weekday: "short" }).replace(".", "")}</p>
                <p className="text-sm font-black leading-tight">{dt.getDate()}</p>
                {closed && <p className="text-[10px] font-semibold">Fermé</p>}
              </div>
            );
          })}
        </div>

        {/* Grille */}
        <div className="grid" style={{ gridTemplateColumns: "48px repeat(7, minmax(0, 1fr))" }}>
          <div>
            {rows.map((m) => (
              <div key={m} className="text-[11px] text-gray-400 text-right pr-1.5 tabular-nums" style={{ height: ROW_H, lineHeight: "14px" }}>
                {m % 60 === 0 ? toHHMM(m) : ""}
              </div>
            ))}
          </div>

          {days.map((d) => {
            const hours = hoursOf(d);
            const dayAppts = active.filter((a) => a.date === d);
            const holding = dayAppts.filter((a) => a.status !== "NO_SHOW");
            return (
              <div key={d} className="relative border-l border-gray-100">
                {rows.map((m) => {
                  const open = !!hours && m >= hours.open && m + STEP <= hours.close;
                  const past = d < todayStr || (d === todayStr && m < nowMin);
                  const busy = holding.filter((a) => toMin(a.startTime) < m + STEP && toMin(a.endTime) > m).length;
                  const free = open && !past && busy < capacity;
                  const label = `${new Date(d + "T12:00:00").toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}, ${toHHMM(m)}`;
                  return free ? (
                    <button key={m} type="button" onClick={() => onPickSlot(d, toHHMM(m))}
                      aria-label={`Disponible : ${label}. Ajouter un rendez-vous`}
                      className="block w-full hover:bg-green-100 focus-visible:bg-green-100"
                      style={{ height: ROW_H, background: "#f0fdf4", borderTop: `1px ${m % 60 === 0 ? "solid" : "dashed"} #dcfce7`, touchAction: "manipulation" }} />
                  ) : (
                    <div key={m} aria-hidden="true"
                      style={{ height: ROW_H, background: open ? "#fff" : "#f1f5f9", borderTop: `1px ${m % 60 === 0 ? "solid" : "dashed"} ${open ? "#f1f5f9" : "#e2e8f0"}` }} />
                  );
                })}

                {layout(dayAppts).map(({ appt, lane, lanes }) => {
                  const c = apptColors(appt);
                  const top = ((toMin(appt.startTime) - from) / STEP) * ROW_H;
                  const height = Math.max(((toMin(appt.endTime) - toMin(appt.startTime)) / STEP) * ROW_H - 2, 20);
                  return (
                    <button key={appt.id} type="button" onClick={() => onPickAppointment(appt)}
                      title={`${appt.startTime}–${appt.endTime} · ${appt.customerName}${appt.serviceName ? ` · ${appt.serviceName}` : ""}`}
                      className="absolute text-left rounded-md px-1 py-0.5 overflow-hidden"
                      style={{
                        top: top + 1, height, left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)`,
                        background: c.bg, borderLeft: `3px solid ${c.border}`, color: c.text, touchAction: "manipulation",
                      }}>
                      <span className="block text-[10px] font-bold tabular-nums leading-tight">{appt.startTime}</span>
                      <span className="block text-[11px] font-semibold leading-tight truncate">{appt.customerName}</span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>

      {/* Légende */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 border-t border-gray-100 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }} />Disponible</span>
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#fff7ed", borderLeft: "3px solid #fb923c" }} />Rendez-vous</span>
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#ecfdf5", borderLeft: "3px solid #34d399" }} />Confirmé par le client</span>
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#fff1f2", borderLeft: "3px solid #f87171" }} />À appeler</span>
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }} />Fermé</span>
      </div>
    </div>
  );
}
