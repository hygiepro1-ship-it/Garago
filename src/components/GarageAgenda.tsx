"use client";

/**
 * Agenda du garage, intégré au tableau de bord : le calendrier de la semaine
 * d'abord (vue d'ensemble, disponibilités teintées), et tout le reste part de
 * lui — clic sur une plage libre pour prendre un rendez-vous, clic sur un
 * rendez-vous pour le confirmer par téléphone, le terminer, le déplacer ou
 * l'annuler.
 */

import { useEffect, useState, type ReactNode } from "react";
import AgendaWeekView, { type WeekAvailability, type WeekBlock } from "@/components/AgendaWeekView";
import AgendaMonthView from "@/components/AgendaMonthView";

export interface AgendaAppointment {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  vehicleYear?: number | null;
  vehicleMake?: string | null;
  vehicleModel?: string | null;
  serviceName?: string | null;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  source: string;
  notes?: string | null;
  confirmationStatus?: string;
  confirmTier?: string | null;
  contactChannel?: string | null;
  language?: string;
  confirmedVia?: string | null;
}

interface AgendaService { categoryId: string; categoryName?: string; name?: string; category?: { name?: string }; durationMin?: number | null }

function gfetch(path: string, init?: RequestInit) {
  const g = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("g");
  if (!g) return fetch(path, init);
  return fetch(`${path}${path.includes("?") ? "&" : "?"}g=${encodeURIComponent(g)}`, init);
}

const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (date: string, n: number) => { const d = new Date(date + "T12:00:00"); d.setDate(d.getDate() + n); return toDateStr(d); };
const mondayOf = (date: string) => { const d = new Date(date + "T12:00:00"); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toDateStr(d); };
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const longDate = (date: string) => new Date(date + "T12:00:00").toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" });

const STATUS_LABEL: Record<string, string> = { PENDING: "En attente", CONFIRMED: "Prévu", COMPLETED: "Terminé", CANCELLED: "Annulé", NO_SHOW: "Client absent" };

function confirmationLabel(a: AgendaAppointment): { label: string; color: string; bg: string } | null {
  const via = a.contactChannel === "SMS" ? "texto" : "courriel";
  switch (a.confirmationStatus) {
    case "NO_RESPONSE": return { label: "À appeler : sans réponse", color: "#b91c1c", bg: "#fef2f2" };
    case "AWAITING":    return { label: `En attente de réponse (${via})`, color: "#b45309", bg: "#fffbeb" };
    case "SCHEDULED":   return { label: a.confirmTier === "MANUAL" ? `Confirmation par ${via} 48 h avant` : "Confirmation demandée 24 h avant", color: "#475569", bg: "#f1f5f9" };
    case "CONFIRMED":   return { label: a.confirmedVia === "PHONE" ? "Confirmé par téléphone" : "Confirmé par le client", color: "#15803d", bg: "#f0fdf4" };
    default: return null;
  }
}

const input = "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-orange-400";
const label = "block text-[11px] font-semibold text-gray-500 mb-0.5";

function Dialog({ title, subtitle, onClose, children, wide }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3" style={{ background: "rgba(11,31,58,0.55)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div role="dialog" aria-modal="true" aria-label={title}
        className={`bg-white rounded-2xl shadow-2xl w-full ${wide ? "max-w-2xl" : "max-w-md"} max-h-[94vh] overflow-y-auto`}>
        <div className="px-4 py-2.5 flex items-center justify-between gap-3" style={{ borderBottom: "1px solid #f1f5f9" }}>
          <div className="min-w-0">
            <h3 className="font-bold text-gray-900 text-sm">{title}</h3>
            {subtitle && <p className="text-xs text-gray-500 truncate first-letter:uppercase">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 font-bold flex-shrink-0">×</button>
        </div>
        <div className="px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

function Segmented({ value, onChange, options, name }: { value: string; onChange: (v: string) => void; options: [string, string][]; name: string }) {
  return (
    <div className="flex gap-1" role="radiogroup" aria-label={name}>
      {options.map(([v, text]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className="flex-1 py-1.5 rounded-lg text-xs font-bold"
          style={{ background: value === v ? "#0b1f3a" : "#f1f5f9", color: value === v ? "#fff" : "#0b1f3a" }}>
          {text}
        </button>
      ))}
    </div>
  );
}

/** Durée au choix du garage, à 10 minutes près : heures et minutes séparées. */
function DurationPicker({ value, onChange, idPrefix }: { value: number; onChange: (min: number) => void; idPrefix: string }) {
  const h = Math.floor(value / 60);
  const m = value % 60;
  return (
    <div className="flex items-center gap-1">
      <select id={`${idPrefix}-h`} aria-label="Heures" className={input} value={h} onChange={(e) => onChange(Math.max(10, Number(e.target.value) * 60 + m))}>
        {Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i} h</option>)}
      </select>
      <select id={`${idPrefix}-m`} aria-label="Minutes" className={input} value={m} onChange={(e) => onChange(Math.max(10, h * 60 + Number(e.target.value)))}>
        {[0, 10, 20, 30, 40, 50].map((v) => <option key={v} value={v}>{String(v).padStart(2, "0")} min</option>)}
      </select>
    </div>
  );
}

const EMPTY_FORM = {
  customerName: "", customerPhone: "", customerEmail: "",
  vehicleYear: "", vehicleMake: "", vehicleModel: "",
  categoryId: "", serviceName: "", date: "", startTime: "09:00", durationMin: 60,
  contactChannel: "SMS", language: "fr", notes: "",
};

export default function GarageAgenda({
  appointments, services, availability, capacity, blocked, lang, onReload, updatedAt,
}: {
  appointments: AgendaAppointment[];
  services: AgendaService[];
  availability: WeekAvailability[];
  capacity: number;
  blocked: WeekBlock[];
  lang: string;
  /** Recharge les rendez-vous du tableau de bord après chaque changement. */
  onReload: () => Promise<void> | void;
  /** Heure du dernier chargement réussi (le tableau de bord se recharge tout seul). */
  updatedAt?: Date | null;
}) {
  const today = toDateStr(new Date());
  const [weekStart, setWeekStart] = useState(mondayOf(today));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  // Vue « semaine » (détail, demi-heure par demi-heure) ou « mois » (charge de chaque jour).
  const [view, setView] = useState<"week" | "month">("week");
  const [monthRef, setMonthRef] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 });
  const shiftMonth = (delta: number) => setMonthRef(({ year, month }) => {
    const d = new Date(year, month + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  function showWeekOf(date: string) {
    setWeekStart(mondayOf(date));
    setView("week");
  }
  function switchView(v: "week" | "month") {
    // On reste sur la même période en changeant de vue.
    if (v === "month") setMonthRef({ year: Number(days[3].slice(0, 4)), month: Number(days[3].slice(5, 7)) - 1 });
    setView(v);
  }

  const [form, setForm] = useState<typeof EMPTY_FORM | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const [openId, setOpenId] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "move" | "complete" | "cancel">("view");
  const [move, setMove] = useState({ date: "", startTime: "", durationMin: 60 });
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const open = openId ? appointments.find((a) => a.id === openId) ?? null : null;
  const weekAppts = appointments.filter((a) => a.date >= days[0] && a.date <= days[6]);
  const toCall = appointments
    .filter((a) => a.confirmationStatus === "NO_RESPONSE" && a.status === "CONFIRMED" && a.date >= today)
    .sort((x, y) => x.date.localeCompare(y.date) || x.startTime.localeCompare(y.startTime));

  const serviceName = (s: AgendaService) => s.categoryName ?? s.category?.name ?? s.name ?? "";

  function openForm(date: string, time: string) {
    setFormError("");
    setForm({ ...EMPTY_FORM, date, startTime: time });
  }

  function openAppointment(id: string) {
    setActionError("");
    setMode("view");
    setOpenId(id);
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setFormError("");
    try {
      const res = await gfetch("/api/garage/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, contactChannel: form.contactChannel || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFormError(d.error ?? "Impossible d'ajouter ce rendez-vous.");
        return;
      }
      setWeekStart(mondayOf(form.date));
      setForm(null);
      await onReload();
    } catch {
      setFormError("Erreur réseau. Réessayez.");
    } finally {
      setSaving(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>, closeAfter = true) {
    setBusy(true);
    setActionError("");
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setActionError(d.error ?? "Action impossible. Réessayez.");
        return;
      }
      await onReload();
      if (closeAfter) setOpenId(null); else setMode("view");
    } catch {
      setActionError("Erreur réseau. Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  const monthLabel = new Date(monthRef.year, monthRef.month, 1).toLocaleDateString("fr-CA", { month: "long", year: "numeric" });
  const weekLabel = `${new Date(days[0] + "T12:00:00").toLocaleDateString("fr-CA", { day: "numeric", month: "short" })} – ${new Date(days[6] + "T12:00:00").toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" })}`;
  const navBtn = "w-11 h-11 sm:w-8 sm:h-8 rounded-lg border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600 font-bold";
  const actionBtn = "px-3 py-2.5 min-h-[44px] sm:min-h-0 sm:py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50";
  const exportHref = (() => {
    const g = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("g");
    return g ? `/api/garage/appointments/export?g=${encodeURIComponent(g)}` : "/api/garage/appointments/export";
  })();

  return (
    <section id="agenda" className="space-y-2" aria-label="Agenda">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="font-bold text-gray-900">Agenda</h2>
          <div className="flex gap-1" role="group" aria-label="Affichage de l'agenda">
            {([["week", "Semaine"], ["month", "Mois"]] as const).map(([v, text]) => (
              <button key={v} type="button" onClick={() => switchView(v)} aria-pressed={view === v}
                className="px-3 min-h-[44px] sm:min-h-0 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold"
                style={{ background: view === v ? "#0b1f3a" : "#f1f5f9", color: view === v ? "#fff" : "#0b1f3a" }}>
                {text}
              </button>
            ))}
          </div>
          <button type="button" className={navBtn} aria-label={view === "week" ? "Semaine précédente" : "Mois précédent"}
            onClick={() => (view === "week" ? setWeekStart(addDays(weekStart, -7)) : shiftMonth(-1))}>‹</button>
          <span className="text-sm font-semibold text-gray-700 min-w-[150px] text-center first-letter:uppercase">{view === "week" ? weekLabel : monthLabel}</span>
          <button type="button" className={navBtn} aria-label={view === "week" ? "Semaine suivante" : "Mois suivant"}
            onClick={() => (view === "week" ? setWeekStart(addDays(weekStart, 7)) : shiftMonth(1))}>›</button>
          <button type="button" onClick={() => { setWeekStart(mondayOf(today)); setMonthRef({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 }); }}
            className="text-xs px-3 min-h-[44px] sm:min-h-0 sm:px-2.5 sm:py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold">Aujourd&apos;hui</button>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-xs text-gray-500" title="Le calendrier se met à jour tout seul toutes les 30 secondes">
              Mis à jour à {updatedAt.toLocaleTimeString("fr-CA", { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          <a href={exportHref} className="text-xs font-semibold underline text-gray-600 inline-flex items-center min-h-[44px] sm:min-h-0" title="Télécharger tous vos rendez-vous dans un fichier Excel">Exporter (Excel)</a>
          <button type="button" onClick={() => openForm(view === "month" || (today >= days[0] && today <= days[6]) ? today : days[0], "09:00")}
            className="text-white px-4 min-h-[44px] sm:min-h-0 sm:px-3 sm:py-1.5 rounded-lg text-sm font-semibold" style={{ background: "#f97316" }}>
            + Rendez-vous
          </button>
        </div>
      </div>

      {toCall.length > 0 && (
        <div className="rounded-xl px-3 py-2 flex items-center gap-2 flex-wrap" role="status" style={{ background: "#fff7ed", border: "1px solid #fdba74" }}>
          <span className="text-xs font-black" style={{ color: "#9a3412" }}>
            {toCall.length === 1 ? "1 client à appeler (sans réponse) :" : `${toCall.length} clients à appeler (sans réponse) :`}
          </span>
          {toCall.map((a) => (
            <button key={a.id} type="button" onClick={() => { setWeekStart(mondayOf(a.date)); openAppointment(a.id); }}
              className="text-xs font-semibold px-3 min-h-[44px] sm:min-h-0 sm:px-2 sm:py-1 rounded-lg bg-white border border-orange-200 text-gray-800">
              {a.customerName} · {new Date(a.date + "T12:00:00").toLocaleDateString("fr-CA", { weekday: "short", day: "numeric" })} {a.startTime}
            </button>
          ))}
        </div>
      )}

      {view === "week" ? (
        <AgendaWeekView
          days={days}
          appointments={weekAppts.map((a) => ({ ...a, serviceName: a.serviceName ?? undefined }))}
          availability={availability}
          capacity={capacity}
          blocked={blocked}
          lang={lang}
          rowHeight={22}
          onPickSlot={openForm}
          onPickAppointment={(a) => openAppointment(a.id)}
        />
      ) : (
        <AgendaMonthView
          year={monthRef.year}
          month={monthRef.month}
          appointments={appointments.map((a) => ({ ...a, serviceName: a.serviceName ?? undefined }))}
          availability={availability}
          capacity={capacity}
          blocked={blocked}
          lang={lang}
          onPickDay={showWeekOf}
          onPickAppointment={(a) => openAppointment(a.id)}
        />
      )}

      {/* ── Prise de rendez-vous ── */}
      {form && (
        <Dialog title="Nouveau rendez-vous" subtitle={form.date ? longDate(form.date) : undefined} onClose={() => setForm(null)} wide>
          <form onSubmit={submitForm} className="grid grid-cols-6 gap-x-2 gap-y-2">
            <div className="col-span-6 sm:col-span-2">
              <label className={label} htmlFor="rdv-name">Nom du client</label>
              <input id="rdv-name" required autoFocus autoComplete="off" className={input} value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} />
            </div>
            <div className="col-span-3 sm:col-span-2">
              <label className={label} htmlFor="rdv-phone">Téléphone</label>
              <input id="rdv-phone" required type="tel" inputMode="tel" autoComplete="off" className={input} value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} />
            </div>
            <div className="col-span-3 sm:col-span-2">
              <label className={label} htmlFor="rdv-email">Courriel{form.contactChannel === "EMAIL" ? "" : " (facultatif)"}</label>
              <input id="rdv-email" type="email" autoComplete="off" required={form.contactChannel === "EMAIL"} className={input} value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} />
            </div>

            <div className="col-span-3 sm:col-span-2">
              <label className={label} htmlFor="rdv-date">Date</label>
              <input id="rdv-date" required type="date" className={input} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
            </div>
            <div className="col-span-3 sm:col-span-1">
              <label className={label} htmlFor="rdv-time">Heure</label>
              <input id="rdv-time" required type="time" step={600} className={input} value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} />
            </div>
            <div className="col-span-6 sm:col-span-3">
              <label className={label} htmlFor="rdv-dur-h">Durée prévue <span className="font-normal text-gray-400">· fin à {toHHMM(Math.min(toMin(form.startTime || "00:00") + form.durationMin, 24 * 60 - 1))}</span></label>
              <DurationPicker idPrefix="rdv-dur" value={form.durationMin} onChange={(v) => setForm({ ...form, durationMin: v })} />
            </div>

            <div className="col-span-6 sm:col-span-3">
              <label className={label} htmlFor="rdv-service">Service</label>
              {services.length > 0 ? (
                <select id="rdv-service" className={input} value={form.categoryId}
                  onChange={(e) => {
                    const svc = services.find((s) => s.categoryId === e.target.value);
                    setForm({ ...form, categoryId: e.target.value, serviceName: svc ? serviceName(svc) : "", durationMin: svc?.durationMin ? Math.max(10, Math.round(svc.durationMin / 10) * 10) : form.durationMin });
                  }}>
                  <option value="">— Choisir —</option>
                  {services.map((s) => <option key={s.categoryId} value={s.categoryId}>{serviceName(s)}</option>)}
                </select>
              ) : (
                <input id="rdv-service" className={input} placeholder="ex. Changement de pneus" value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} />
              )}
            </div>
            <div className="col-span-6 sm:col-span-3">
              <span className={label}>Véhicule (facultatif)</span>
              <div className="grid grid-cols-3 gap-1">
                <input aria-label="Année" inputMode="numeric" placeholder="Année" className={input} value={form.vehicleYear} onChange={(e) => setForm({ ...form, vehicleYear: e.target.value })} />
                <input aria-label="Marque" placeholder="Marque" className={input} value={form.vehicleMake} onChange={(e) => setForm({ ...form, vehicleMake: e.target.value })} />
                <input aria-label="Modèle" placeholder="Modèle" className={input} value={form.vehicleModel} onChange={(e) => setForm({ ...form, vehicleModel: e.target.value })} />
              </div>
            </div>

            <div className="col-span-6 sm:col-span-4">
              <span className={label}>Demande de confirmation envoyée par</span>
              <Segmented name="Moyen d'envoi" value={form.contactChannel} onChange={(v) => setForm({ ...form, contactChannel: v })} options={[["SMS", "Texto"], ["EMAIL", "Courriel"], ["", "Aucun"]]} />
            </div>
            <div className="col-span-6 sm:col-span-2">
              <span className={label}>Langue du client</span>
              <Segmented name="Langue du client" value={form.language} onChange={(v) => setForm({ ...form, language: v })} options={[["fr", "Français"], ["en", "English"]]} />
            </div>

            <div className="col-span-6">
              <label className={label} htmlFor="rdv-notes">Notes (visibles seulement par vous)</label>
              <input id="rdv-notes" maxLength={1000} className={input} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            {formError && <p className="col-span-6 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">{formError}</p>}

            <div className="col-span-6 flex items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-gray-500">
                {form.contactChannel === ""
                  ? "Aucun message ne sera envoyé à ce client."
                  : `Le client reçoit un ${form.contactChannel === "SMS" ? "texto" : "courriel"} 48 h avant ; sans réponse 24 h avant, vous êtes prévenu pour l'appeler.`}
              </p>
              <button type="submit" disabled={saving} className="flex-shrink-0 text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-60" style={{ background: "#f97316" }}>
                {saving ? "…" : "Enregistrer"}
              </button>
            </div>
          </form>
        </Dialog>
      )}

      {/* ── Fiche d'un rendez-vous ── */}
      {open && (
        <Dialog title={open.customerName} subtitle={`${longDate(open.date)} · ${open.startTime} – ${open.endTime}`} onClose={() => setOpenId(null)}>
          <div className="space-y-2.5 text-sm">
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-700">{STATUS_LABEL[open.status] ?? open.status}</span>
              {(() => { const c = confirmationLabel(open); return c && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: c.bg, color: c.color }}>{c.label}</span>; })()}
              {open.source === "ONLINE" && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700">Réservé en ligne</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${open.customerPhone}`} className="px-3 py-1.5 rounded-lg font-semibold text-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d" }}>{open.customerPhone}</a>
              {open.customerEmail && <a href={`mailto:${open.customerEmail}`} className="px-3 py-1.5 rounded-lg font-semibold text-sm truncate max-w-full" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8" }}>{open.customerEmail}</a>}
            </div>
            {(open.serviceName || open.vehicleMake || open.vehicleYear) && (
              <p className="text-gray-700">{[open.serviceName, [open.vehicleYear, open.vehicleMake, open.vehicleModel].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}</p>
            )}
            {open.notes && <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2">{open.notes}</p>}

            {actionError && <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">{actionError}</p>}

            {mode === "view" && open.status !== "CANCELLED" && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {open.confirmTier === "MANUAL" && open.status === "CONFIRMED" && ["SCHEDULED", "AWAITING", "NO_RESPONSE"].includes(open.confirmationStatus ?? "") && (
                  <button type="button" disabled={busy} className={actionBtn} style={{ background: "#0f766e" }} onClick={() => patch(open.id, { phoneConfirmed: true }, false)}>Confirmé par téléphone</button>
                )}
                {open.status === "PENDING" && (
                  <button type="button" disabled={busy} className={actionBtn} style={{ background: "#2563eb" }} onClick={() => patch(open.id, { status: "CONFIRMED" }, false)}>Accepter</button>
                )}
                {(open.status === "PENDING" || open.status === "CONFIRMED") && (
                  <>
                    <button type="button" className={actionBtn} style={{ background: "#16a34a" }} onClick={() => { setNote(""); setMode("complete"); }}>Terminer</button>
                    <button type="button" className={actionBtn} style={{ background: "#7c3aed" }}
                      onClick={() => { setMove({ date: open.date, startTime: open.startTime, durationMin: Math.max(10, toMin(open.endTime) - toMin(open.startTime)) }); setMode("move"); }}>Déplacer</button>
                    {new Date(`${open.date}T${open.startTime}:00`).getTime() + 15 * 60 * 1000 <= new Date().getTime() && (
                      <button type="button" disabled={busy} className={actionBtn} style={{ background: "#b91c1c" }} onClick={() => patch(open.id, { status: "NO_SHOW" })}>Client absent</button>
                    )}
                    <button type="button" className={actionBtn} style={{ background: "#ef4444" }} onClick={() => setMode("cancel")}>Annuler</button>
                  </>
                )}
                {open.status === "NO_SHOW" && (
                  <button type="button" disabled={busy} className={actionBtn} style={{ background: "#64748b" }} onClick={() => patch(open.id, { status: "CONFIRMED" }, false)}>Annuler le statut « absent »</button>
                )}
              </div>
            )}

            {mode === "move" && (
              <form className="grid grid-cols-2 gap-2 pt-1" onSubmit={(e) => { e.preventDefault(); patch(open.id, { date: move.date, startTime: move.startTime, endTime: toHHMM(Math.min(toMin(move.startTime) + move.durationMin, 24 * 60 - 1)) }); }}>
                <div>
                  <label className={label} htmlFor="mv-date">Nouvelle date</label>
                  <input id="mv-date" required type="date" className={input} value={move.date} onChange={(e) => setMove({ ...move, date: e.target.value })} />
                </div>
                <div>
                  <label className={label} htmlFor="mv-time">Heure</label>
                  <input id="mv-time" required type="time" step={600} className={input} value={move.startTime} onChange={(e) => setMove({ ...move, startTime: e.target.value })} />
                </div>
                <div className="col-span-2">
                  <label className={label} htmlFor="mv-dur-h">Durée</label>
                  <DurationPicker idPrefix="mv-dur" value={move.durationMin} onChange={(v) => setMove({ ...move, durationMin: v })} />
                </div>
                <div className="col-span-2 flex gap-2 justify-end">
                  <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-600" onClick={() => setMode("view")}>Retour</button>
                  <button type="submit" disabled={busy} className={actionBtn} style={{ background: "#f97316" }}>{busy ? "…" : "Déplacer"}</button>
                </div>
              </form>
            )}

            {mode === "complete" && (
              <form className="space-y-2 pt-1" onSubmit={(e) => { e.preventDefault(); patch(open.id, { status: "COMPLETED", completionNote: note || null }); }}>
                <label className={label} htmlFor="done-note">Note pour le client (facultatif, envoyée par courriel)</label>
                <textarea id="done-note" rows={3} className={input} value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex gap-2 justify-end">
                  <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-600" onClick={() => setMode("view")}>Retour</button>
                  <button type="submit" disabled={busy} className={actionBtn} style={{ background: "#16a34a" }}>{busy ? "…" : "Terminer le rendez-vous"}</button>
                </div>
              </form>
            )}

            {mode === "cancel" && (
              <div className="rounded-lg p-3 space-y-2" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <p className="text-sm font-bold text-red-800">Annuler ce rendez-vous ? Le client sera prévenu.</p>
                <div className="flex gap-2 justify-end">
                  <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-600 bg-white" onClick={() => setMode("view")}>Non, garder</button>
                  <button type="button" disabled={busy} className={actionBtn} style={{ background: "#dc2626" }} onClick={() => patch(open.id, { status: "CANCELLED" })}>{busy ? "…" : "Oui, annuler"}</button>
                </div>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </section>
  );
}
