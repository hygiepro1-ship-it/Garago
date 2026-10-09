"use client";

import { useState } from "react";

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

/** Plage bloquée par le garage (vacances, congé, pause). */
export interface WeekBlock { date: string; startTime?: string | null; endTime?: string | null; allDay?: boolean }

const STEP = 30;     // minutes par ligne
// Journées déjà passées : fines hachures, pour les distinguer d'un simple « complet »
// sans masquer les anciens rendez-vous posés dessus. La journée en cours n'est
// jamais hachurée, même pour ses heures déjà écoulées.
export const PAST_HATCH ="repeating-linear-gradient(135deg, #ffffff 0 6px, #e8edf3 6px 7px)";

const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;

export function apptColors(a: WeekAppointment): { bg: string; border: string; text: string } {
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
  days, appointments, availability, capacity, selectedDate, lang, onPickSlot, onPickAppointment, blocked = [], rowHeight = 30, byLoad = false, onPickDay,
}: {
  /**
   * Garage à plusieurs postes : chaque demi-heure affiche le nombre de postes pris
   * (« 5/8 ») au lieu d'empiler les rendez-vous côte à côte, illisibles au-delà de
   * deux ou trois. Le détail se lit dans la vue « jour » (voir AgendaDayView).
   */
  byLoad?: boolean;
  /** Clic sur l'en-tête d'un jour (ou sur une plage complète) : ouvrir la journée poste par poste. */
  onPickDay?: (date: string) => void;
  days: string[];                       // 7 dates "YYYY-MM-DD", du lundi au dimanche
  appointments: WeekAppointment[];
  availability: WeekAvailability[];
  capacity: number;
  selectedDate?: string;
  lang: string;
  blocked?: WeekBlock[];
  rowHeight?: number;                   // pixels par demi-heure
  onPickSlot: (date: string, time: string) => void;
  onPickAppointment: (appt: WeekAppointment) => void;
}) {
  const ROW_H = rowHeight;
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

  // Étiquette en mots (jamais la couleur seule) pour la liste du téléphone
  const stateLabel = (a: WeekAppointment) =>
    a.status === "NO_SHOW" ? "Client absent"
    : a.status === "COMPLETED" ? "Terminé"
    : a.confirmationStatus === "NO_RESPONSE" ? "À appeler"
    : a.confirmationStatus === "CONFIRMED" ? "Confirmé"
    : a.confirmationStatus === "AWAITING" || a.confirmationStatus === "SCHEDULED" ? "À confirmer"
    : a.status === "PENDING" ? "En attente" : "Prévu";

  // Téléphone : journées affichées ou masquées. Sans choix du garage, seule la journée en cours
  // est ouverte (ou le premier jour ouvert, pour une autre semaine).
  const [shownDays, setShownDays] = useState<Record<string, boolean>>({});
  const firstShown = days.includes(todayStr) ? todayStr : days.find((d) => hoursOf(d)) ?? days[0];
  const isShown = (d: string) => shownDays[d] ?? d === firstShown;
  const allShown = days.every(isShown);

  // Première plage libre du jour (pour le bouton « + Rendez-vous » de la liste du téléphone)
  const firstFree = (d: string): string => {
    const hours = hoursOf(d);
    if (!hours) return "09:00";
    const dayAppts = active.filter((a) => a.date === d && a.status !== "NO_SHOW");
    for (let m = hours.open; m + STEP <= hours.close; m += STEP) {
      const past = d < todayStr || (d === todayStr && m < nowMin);
      const busy = dayAppts.filter((a) => toMin(a.startTime) < m + STEP && toMin(a.endTime) > m).length;
      const isBlocked = blocked.some((b) => b.date === d && (b.allDay || !b.startTime || !b.endTime || (toMin(b.startTime) < m + STEP && toMin(b.endTime) > m)));
      if (!past && !isBlocked && busy < capacity) return toHHMM(m);
    }
    return toHHMM(hours.open);
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.05)" }}>
      {/* Téléphone : une liste par jour (7 colonnes ne tiennent pas sur 375 px de large).
          Chaque journée se masque d'un toucher sur son en-tête, pour ne pas faire défiler
          des pages de rendez-vous ; seule la journée en cours est ouverte au départ. */}
      <div className="sm:hidden divide-y divide-gray-100">
        <div className="flex items-center justify-between gap-2 px-3 py-1.5">
          <p className="text-xs text-gray-500">Touchez une journée pour l&apos;afficher ou la masquer.</p>
          <button type="button" onClick={() => setShownDays(Object.fromEntries(days.map((d) => [d, !allShown])))}
            className="shrink-0 min-h-[44px] px-2 text-xs font-bold underline text-gray-700" style={{ touchAction: "manipulation" }}>
            {allShown ? "Tout masquer" : "Tout afficher"}
          </button>
        </div>
        {days.map((d) => {
          const dt = new Date(d + "T12:00:00");
          const closed = !hoursOf(d);
          const list = active.filter((a) => a.date === d).sort((x, y) => x.startTime.localeCompare(y.startTime));
          const past = d < todayStr;
          const shown = isShown(d);
          const toCall = list.filter((a) => a.confirmationStatus === "NO_RESPONSE" && a.status === "CONFIRMED").length;
          return (
            <section key={d} aria-label={dt.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}
              style={{ background: d === selectedDate ? "#f8fafc" : undefined }}>
              <div className="flex items-center justify-between gap-2 px-3 py-2" style={{ background: d === todayStr ? "#fff7ed" : "#f8fafc" }}>
                <button type="button" onClick={() => setShownDays({ ...shownDays, [d]: !shown })} aria-expanded={shown} disabled={list.length === 0}
                  className="min-w-0 flex-1 flex items-center gap-2 text-left min-h-[44px]" style={{ touchAction: "manipulation" }}>
                  {list.length > 0 && <span aria-hidden="true" className="text-gray-500 text-xs w-3 shrink-0">{shown ? "▾" : "▸"}</span>}
                  <span className="min-w-0">
                    <span className="block text-sm font-black capitalize" style={{ color: closed ? "#94a3b8" : "#0b1f3a" }}>
                      {dt.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "short" })}
                      {d === todayStr && <span className="ml-2 text-[11px] font-bold" style={{ color: "#c2410c" }}>Aujourd&apos;hui</span>}
                    </span>
                    <span className="block text-xs text-gray-500">
                      {closed && list.length === 0 ? "Fermé" : list.length === 0 ? "Aucun rendez-vous" : `${list.length} rendez-vous`}
                      {toCall > 0 && <span className="font-bold" style={{ color: "#b91c1c" }}> · {toCall} à appeler</span>}
                    </span>
                  </span>
                </button>
                {!closed && !past && (
                  <button type="button" onClick={() => onPickSlot(d, firstFree(d))}
                    className="shrink-0 min-h-[44px] px-3 rounded-lg text-sm font-bold border border-gray-300 bg-white text-gray-800"
                    style={{ touchAction: "manipulation" }}>
                    + Rendez-vous
                  </button>
                )}
              </div>
              {shown && list.map((a) => {
                const c = apptColors(a);
                return (
                  <button key={a.id} type="button" onClick={() => onPickAppointment(a)}
                    className="w-full text-left flex items-center gap-3 px-3 min-h-[56px] py-2"
                    style={{ borderLeft: `4px solid ${c.border}`, background: c.bg, color: c.text, touchAction: "manipulation" }}>
                    <span className="text-sm font-black tabular-nums shrink-0">{a.startTime}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate">{a.customerName}</span>
                      <span className="block text-xs truncate">{a.serviceName ? `${a.serviceName} · ` : ""}{stateLabel(a)}</span>
                    </span>
                    <span aria-hidden="true" className="text-lg">›</span>
                  </button>
                );
              })}
            </section>
          );
        })}
      </div>

      {/* Ordinateur et tablette : la grille horaire */}
      <div className="hidden sm:block overflow-x-auto">
      <div style={{ minWidth: 620 }}>
        {/* En-tête : jours */}
        <div className="grid border-b border-gray-200" style={{ gridTemplateColumns: "48px repeat(7, minmax(0, 1fr))" }}>
          <div />
          {days.map((d) => {
            const dt = new Date(d + "T12:00:00");
            const closed = !hoursOf(d);
            const style = { background: d === selectedDate ? "#0b1f3a" : d === todayStr ? "#fff7ed" : undefined, color: d === selectedDate ? "#fff" : closed ? "#94a3b8" : "#0b1f3a" };
            const content = (
              <>
                <span className="block text-[11px] font-bold uppercase opacity-70">{dt.toLocaleDateString(locale, { weekday: "short" }).replace(".", "")}</span>
                <span className="block text-sm font-black leading-tight">{dt.getDate()}</span>
                {closed && <span className="block text-[10px] font-semibold">Fermé</span>}
              </>
            );
            return onPickDay ? (
              <button key={d} type="button" onClick={() => onPickDay(d)} style={style}
                title="Voir cette journée poste par poste"
                aria-label={`Voir la journée du ${dt.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}`}
                className="py-2 text-center border-l border-gray-100 hover:underline">
                {content}
              </button>
            ) : (
              <div key={d} className="py-2 text-center border-l border-gray-100" style={style}>{content}</div>
            );
          })}
        </div>

        {/* Grille */}
        <div className="grid" style={{ gridTemplateColumns: "48px repeat(7, minmax(0, 1fr))" }}>
          <div>
            {rows.map((m) => (
              <div key={m} className="text-[11px] text-gray-400 text-right pr-1.5 tabular-nums" style={{ height: ROW_H, lineHeight: "12px" }}>
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
                  const isBlocked = blocked.some((b) => b.date === d && (b.allDay || !b.startTime || !b.endTime || (toMin(b.startTime) < m + STEP && toMin(b.endTime) > m)));
                  const free = open && !past && !isBlocked && busy < capacity;
                  const label = `${new Date(d + "T12:00:00").toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" })}, ${toHHMM(m)}`;
                  if (byLoad && (busy > 0 || free)) {
                    // Postes pris sur cette demi-heure : « 5/8 », teinté selon la place qui reste.
                    const left = capacity - busy;
                    const tone = !free && left > 0 ? "past" : left <= 0 ? "full" : left <= Math.max(1, Math.floor(capacity / 4)) ? "tight" : "free";
                    const c = {
                      free:  { bg: "#f0fdf4", text: "#15803d", pip: "#0b1f3a" },
                      tight: { bg: "#fff7ed", text: "#9a3412", pip: "#0b1f3a" },
                      full:  { bg: "#e8edf3", text: "#475569", pip: "#64748b" },
                      past:  { bg: !open || isBlocked ? "#f1f5f9" : d < todayStr ? PAST_HATCH : "#fff", text: "#64748b", pip: "#94a3b8" },
                    }[tone];
                    const toCall = holding.some((a) => a.confirmationStatus === "NO_RESPONSE" && a.status === "CONFIRMED" && toMin(a.startTime) < m + STEP && toMin(a.endTime) > m);
                    const taken = `${busy} ${busy > 1 ? "postes pris" : "poste pris"} sur ${capacity}`;
                    return (
                      <button key={m} type="button" onClick={() => (free ? onPickSlot(d, toHHMM(m)) : onPickDay?.(d))}
                        title={free ? `${toHHMM(m)} · ${taken}` : `${toHHMM(m)} · ${taken} · voir la journée`}
                        aria-label={`${label} : ${taken}${toCall ? ", un client à appeler" : ""}. ${free ? "Ajouter un rendez-vous" : "Voir la journée"}`}
                        className="flex w-full items-center justify-between gap-1 px-1.5 text-[11px] font-bold tabular-nums hover:brightness-95 focus-visible:brightness-95"
                        style={{ height: ROW_H, background: c.bg, color: c.text, borderTop: `1px ${m % 60 === 0 ? "solid" : "dashed"} #ffffff`, touchAction: "manipulation" }}>
                        {capacity <= 10 ? (
                          <span className="flex gap-[2px]" aria-hidden="true">
                            {Array.from({ length: capacity }, (_, i) => (
                              <i key={i} className="block rounded-[1px]" style={{ width: 5, height: Math.min(11, ROW_H - 8), background: i < busy ? c.pip : "rgba(11,31,58,0.14)" }} />
                            ))}
                          </span>
                        ) : (
                          <span className="block flex-1 max-w-[64px] rounded-full overflow-hidden" aria-hidden="true" style={{ height: 5, background: "rgba(11,31,58,0.14)" }}>
                            <i className="block h-full" style={{ width: `${Math.min(100, (busy / capacity) * 100)}%`, background: c.pip }} />
                          </span>
                        )}
                        <span className="flex items-center gap-1 whitespace-nowrap">
                          {toCall && <i aria-hidden="true" className="block w-1.5 h-1.5 rounded-full" style={{ background: "#dc2626" }} />}
                          {left <= 0 ? "Complet" : `${busy}/${capacity}`}
                        </span>
                      </button>
                    );
                  }
                  return free ? (
                    <button key={m} type="button" onClick={() => onPickSlot(d, toHHMM(m))}
                      aria-label={`Disponible : ${label}. Ajouter un rendez-vous`}
                      className="block w-full hover:bg-green-100 focus-visible:bg-green-100"
                      style={{ height: ROW_H, background: "#f0fdf4", borderTop: `1px ${m % 60 === 0 ? "solid" : "dashed"} #dcfce7`, touchAction: "manipulation" }} />
                  ) : (
                    <div key={m} aria-hidden="true"
                      style={{ height: ROW_H, background: !open || isBlocked ? "#f1f5f9" : d < todayStr ? PAST_HATCH : "#fff", borderTop: `1px ${m % 60 === 0 ? "solid" : "dashed"} ${open ? "#f1f5f9" : "#e2e8f0"}` }} />
                  );
                })}

                {!byLoad && layout(dayAppts).map(({ appt, lane, lanes }) => {
                  const c = apptColors(appt);
                  const top = ((toMin(appt.startTime) - from) / STEP) * ROW_H;
                  const height = Math.max(((toMin(appt.endTime) - toMin(appt.startTime)) / STEP) * ROW_H - 2, 16);
                  const oneLine = height < 30;
                  return (
                    <button key={appt.id} type="button" onClick={() => onPickAppointment(appt)}
                      title={`${appt.startTime}–${appt.endTime} · ${appt.customerName}${appt.serviceName ? ` · ${appt.serviceName}` : ""}`}
                      className="absolute text-left rounded-md px-1 py-0.5 overflow-hidden"
                      style={{
                        top: top + 1, height, left: `calc(${(lane / lanes) * 100}% + 2px)`, width: `calc(${100 / lanes}% - 4px)`,
                        background: c.bg, borderLeft: `3px solid ${c.border}`, color: c.text, touchAction: "manipulation",
                      }}>
                      {oneLine ? (
                        <span className="block text-[11px] font-semibold leading-tight truncate"><span className="font-bold tabular-nums">{appt.startTime}</span> {appt.customerName}</span>
                      ) : (
                        <>
                          <span className="block text-[10px] font-bold tabular-nums leading-tight">{appt.startTime}</span>
                          <span className="block text-[11px] font-semibold leading-tight truncate">{appt.customerName}</span>
                        </>
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      </div>

      {/* Légende : un mot par couleur */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 px-3 py-2 border-t border-gray-100 text-[11px] text-gray-500">
        {byLoad ? (
          <>
            <span className="hidden sm:flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }} />De la place</span>
            <span className="hidden sm:flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }} />Presque complet</span>
            <span className="hidden sm:flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#e8edf3", border: "1px solid #cbd5e1" }} />Complet</span>
            <span className="hidden sm:flex items-center gap-1.5"><i className="inline-block w-2 h-2 rounded-full" style={{ background: "#dc2626" }} />Client à appeler</span>
            <span className="hidden sm:inline">Cliquez un jour pour le voir poste par poste.</span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0" }} />Libre</span>
            <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#fff7ed", borderLeft: "3px solid #fb923c" }} />À confirmer</span>
            <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#ecfdf5", borderLeft: "3px solid #34d399" }} />Confirmé</span>
            <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#fff1f2", borderLeft: "3px solid #f87171" }} />À appeler</span>
          </>
        )}
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: PAST_HATCH, border: "1px solid #e2e8f0" }} />Passé</span>
        <span className="flex items-center gap-1.5"><i className="inline-block w-3 h-3 rounded-sm" style={{ background: "#f1f5f9", border: "1px solid #e2e8f0" }} />Fermé</span>
      </div>
    </div>
  );
}
