"use client";

// Extrait de src/app/tableau-de-bord/garage/page.tsx (découpage du tableau de bord du garage).

import { translateServiceName } from "@/lib/services";
import { useTr } from "@/lib/dashboard-en";
import { statusBadge, type DashboardAppointment, type DashboardBlock } from "../_lib/dashboard";

export function MultiDaySummary({ appointments, selectedDays, blockedSlots, onDeleteBlock }: {
  appointments: DashboardAppointment[];
  selectedDays: string[];
  blockedSlots: DashboardBlock[];
  onDeleteBlock: (id: string) => void;
}) {
  const tr = useTr();
  const multiAppts  = appointments.filter(a => selectedDays.includes(a.date));
  const multiBlocks = blockedSlots.filter(s => selectedDays.includes(s.date));
  return (
    <div className="space-y-4">
      {multiAppts.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Rendez-vous sur ces jours ({multiAppts.length})</p>
          <div className="space-y-2">
            {multiAppts
              .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
              .map(a => {
                const sc = statusBadge(a, tr);
                const dFr = new Date(a.date + "T12:00:00").toLocaleDateString(tr.locale, { weekday: "short", day: "numeric", month: "short" });
                return (
                  <div key={a.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="text-center min-w-[70px]">
                      <p className="text-xs text-gray-400 font-medium capitalize">{dFr}</p>
                      <p className="text-sm font-extrabold text-orange-500">{a.startTime}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{a.customerName}</p>
                      <p className="text-xs text-gray-500">{translateServiceName(a.serviceName, tr.en ? "en" : "fr") || "—"}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style={{ backgroundColor: sc.bg, color: sc.color }}>{tr(sc.label)}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      {multiBlocks.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">{tr.en ? "Blocked slots on these days" : "Créneaux bloqués sur ces jours"} ({multiBlocks.length})</p>
          <div className="space-y-2">
            {multiBlocks
              .sort((a, b) => a.date.localeCompare(b.date))
              .map(s => {
                const dFr = new Date(s.date + "T12:00:00").toLocaleDateString(tr.locale, { weekday: "short", day: "numeric", month: "short" });
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#fef2f2", border: "1px solid #fca5a5" }}>
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-red-800">{dFr}, {s.allDay ? tr("Journée entière") : `${s.startTime} – ${s.endTime}`}</p>
                      {s.reason && <p className="text-xs text-red-600">{s.reason}</p>}
                    </div>
                    <button onClick={() => onDeleteBlock(s.id)} className="text-xs text-red-400 hover:text-red-600 font-semibold px-2">{tr("Retirer")}</button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      {multiAppts.length === 0 && multiBlocks.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-4">{tr.en ? `Nothing scheduled on these ${selectedDays.length} days.` : `Aucun événement sur ces ${selectedDays.length} jours.`}</p>
      )}
    </div>
  );
}

// ─── Ambassadeur tab ─────────────────────────────────────────────────────────
