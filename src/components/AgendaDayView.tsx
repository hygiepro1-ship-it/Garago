"use client";

/**
 * Vue « jour » de l'agenda du garage : une colonne par poste de travail, une
 * ligne par demi-heure. Chaque rendez-vous garde toute la largeur de sa colonne,
 * donc son nom reste lisible même quand huit postes travaillent à la même heure.
 * Les rendez-vous ne sont pas rattachés à un poste précis : ils sont répartis
 * ici dans l'ordre des heures, sur le premier poste libre.
 */

import { apptColors, PAST_HATCH, type WeekAppointment, type WeekAvailability, type WeekBlock } from "@/components/AgendaWeekView";

const STEP = 30; // minutes par ligne

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

/** Place chaque rendez-vous sur le premier poste libre, dans l'ordre des heures de début. */
function assignPosts(appts: WeekAppointment[]): WeekAppointment[][] {
  const posts: WeekAppointment[][] = [];
  const sorted = [...appts].sort((x, y) => x.startTime.localeCompare(y.startTime) || x.endTime.localeCompare(y.endTime));
  for (const appt of sorted) {
    const post = posts.find((p) => toMin(p[p.length - 1].endTime) <= toMin(appt.startTime));
    if (post) post.push(appt); else posts.push([appt]);
  }
  return posts;
}

export default function AgendaDayView({
  date, appointments, availability, capacity, lang, onPickSlot, onPickAppointment, blocked = [], rowHeight = 26,
}: {
  date: string;                         // "YYYY-MM-DD"
  appointments: WeekAppointment[];      // rendez-vous de ce jour
  availability: WeekAvailability[];
  capacity: number;
  lang: string;
  blocked?: WeekBlock[];
  rowHeight?: number;                   // pixels par demi-heure
  onPickSlot: (date: string, time: string) => void;
  onPickAppointment: (appt: WeekAppointment) => void;
}) {
  const ROW_H = rowHeight;
  const active = appointments.filter((a) => a.date === date && a.status !== "CANCELLED");
  // Un client absent a libéré son poste : il reste affiché, mais ne bloque plus la plage.
  const assigned = assignPosts(active.filter((a) => a.status !== "NO_SHOW"));
  const noShows = active.filter((a) => a.status === "NO_SHOW");
  const posts = Array.from({ length: Math.max(capacity, assigned.length) }, (_, i) => assigned[i] ?? []);

  const h = availability.find((a) => a.dayOfWeek === new Date(date + "T12:00:00").getDay());
  const hours = h && !h.isClosed ? { open: toMin(h.openTime), close: toMin(h.closeTime) } : null;
  const dayBlocks = blocked.filter((b) => b.date === date);

  let from = hours ? hours.open : 8 * 60;
  let to = hours ? hours.close : 18 * 60;
  for (const a of active) { from = Math.min(from, toMin(a.startTime)); to = Math.max(to, toMin(a.endTime)); }
  from = Math.floor(from / 60) * 60;
  to = Math.ceil(to / 60) * 60;
  const rows = Array.from({ length: (to - from) / STEP }, (_, i) => from + i * STEP);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const locale = lang === "fr" ? "fr-CA" : "en-CA";
  const dayLabel = new Date(date + "T12:00:00").toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" });
  const columns = `48px repeat(${posts.length}, minmax(104px, 1fr))`;

  if (!hours && active.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 px-4 py-10 text-center text-sm text-gray-500" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
        Le garage est fermé ce jour-là.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      <div className="overflow-x-auto">
        <div style={{ minWidth: 48 + posts.length * 104 }}>
          {/* En-tête : postes */}
          <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: columns }}>
            <div />
            {posts.map((list, i) => {
              const open = hours ? hours.close - hours.open : 0;
              const taken = hours ? list.reduce((n, a) => n + Math.max(0, Math.min(toMin(a.endTime), hours.close) - Math.max(toMin(a.startTime), hours.open)), 0) : 0;
              const freeH = Math.max(0, open - taken) / 60;
              const extra = i >= capacity;
              return (
                <div key={i} className="py-1.5 px-2 text-center border-l border-gray-100">
                  <p className="text-xs font-black" style={{ color: extra ? "#b91c1c" : "#0b1f3a" }}>{extra ? "En surplus" : `Poste ${i + 1}`}</p>
                  <p className="text-[11px] text-gray-500">
                    {list.length === 0 ? "Libre" : freeH === 0 ? "Complet" : `${String(Math.round(freeH * 10) / 10).replace(".", ",")} h libres`}
                  </p>
                  <div className="h-1 rounded-full mt-1 overflow-hidden" style={{ background: "#f1f5f9" }} aria-hidden="true">
                    <i className="block h-full" style={{ width: open ? `${Math.min(100, (taken / open) * 100)}%` : 0, background: "#0b1f3a" }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Grille */}
          <div className="grid" style={{ gridTemplateColumns: columns }}>
            <div>
              {rows.map((m) => (
                <div key={m} className="text-[11px] text-gray-400 text-right pr-1.5 tabular-nums" style={{ height: ROW_H, lineHeight: "12px" }}>
                  {m % 60 === 0 ? toHHMM(m) : ""}
                </div>
              ))}
            </div>

            {posts.map((list, i) => (
              <div key={i} className="relative border-l border-gray-100">
                {rows.map((m) => {
                  const open = !!hours && m >= hours.open && m + STEP <= hours.close;
                  const past = date < todayStr || (date === todayStr && m < nowMin);
                  const isBlocked = dayBlocks.some((b) => b.allDay || !b.startTime || !b.endTime || (toMin(b.startTime) < m + STEP && toMin(b.endTime) > m));
                  const taken = list.some((a) => toMin(a.startTime) < m + STEP && toMin(a.endTime) > m);
                  const free = open && !past && !isBlocked && !taken && i < capacity;
                  return free ? (
                    <button key={m} type="button" onClick={() => onPickSlot(date, toHHMM(m))}
                      aria-label={`Poste ${i + 1} libre : ${dayLabel}, ${toHHMM(m)}. Ajouter un rendez-vous`}
                      className="block w-full hover:bg-green-100 focus-visible:bg-green-100"
                      style={{ height: ROW_H, background: "#f0fdf4", borderTop: `1px ${m % 60 === 0 ? "solid" : "dashed"} #dcfce7`, touchAction: "manipulation" }} />
                  ) : (
                    <div key={m} aria-hidden="true"
                      style={{ height: ROW_H, background: !open || isBlocked ? "#f1f5f9" : date < todayStr ? PAST_HATCH : "#fff", borderTop: `1px ${m % 60 === 0 ? "solid" : "dashed"} ${open ? "#f1f5f9" : "#e2e8f0"}` }} />
                  );
                })}

                {/* Un client absent partage la colonne du premier poste, en demi-largeur à droite */}
                {[...list.map((appt) => ({ appt, half: false })), ...(i === 0 ? noShows.map((appt) => ({ appt, half: true })) : [])].map(({ appt, half }) => {
                  const c = apptColors(appt);
                  const top = ((toMin(appt.startTime) - from) / STEP) * ROW_H;
                  const height = Math.max(((toMin(appt.endTime) - toMin(appt.startTime)) / STEP) * ROW_H - 2, 18);
                  return (
                    <button key={appt.id} type="button" onClick={() => onPickAppointment(appt)}
                      title={`${appt.startTime}–${appt.endTime} · ${appt.customerName}${appt.serviceName ? ` · ${appt.serviceName}` : ""}`}
                      className="absolute text-left rounded-md px-1.5 py-0.5 overflow-hidden"
                      style={{
                        top: top + 1, height, left: half ? "50%" : 3, right: 3,
                        background: c.bg, borderLeft: `3px solid ${c.border}`, color: c.text, touchAction: "manipulation",
                      }}>
                      <span className="block text-[11px] font-semibold leading-tight truncate">
                        <span className="font-bold tabular-nums">{appt.startTime}</span> {appt.customerName}
                      </span>
                      {height >= 34 && appt.serviceName && <span className="block text-[10.5px] leading-tight truncate opacity-90">{appt.serviceName}</span>}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Légende : un mot par couleur */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 border-t border-gray-100 text-[11px] text-gray-500">
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }} />Libre</span>
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#fff7ed", borderLeft: "3px solid #fb923c" }} />À confirmer</span>
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#ecfdf5", borderLeft: "3px solid #34d399" }} />Confirmé</span>
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#fff1f2", borderLeft: "3px solid #f87171" }} />À appeler</span>
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }} />Fermé</span>
      </div>
    </div>
  );
}
