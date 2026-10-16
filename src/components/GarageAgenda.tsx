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
import AgendaDayView, { assignPosts } from "@/components/AgendaDayView";
import AgendaMonthView from "@/components/AgendaMonthView";
import { findNextFreeStart } from "@/lib/availability";
import type { CustomerMatch } from "@/lib/customers";
import { emailSuggestions, emailTypoFix, formatPhone, PHONE_PATTERN } from "@/lib/contact-format";
import { useTr } from "@/lib/dashboard-en";
import { translateServiceName } from "@/lib/services";
import VehicleFields from "@/components/VehicleFields";

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
  /** Poste de travail attribué (1..capacité), s'il y en a un. */
  bay?: number | null;
}

interface AgendaService { categoryId: string; categoryName?: string; name?: string; category?: { name?: string }; durationMin?: number | null }

/** Choix du poste : « Automatique », ou un poste précis. Un poste déjà pris à cette heure ne peut pas être choisi. */
function BaySelect({ id, value, capacity, taken, en, autoLabel, onChange }: {
  id: string; value: string; capacity: number; taken: Set<number>; en: boolean; autoLabel: string; onChange: (v: string) => void;
}) {
  return (
    <select id={id} className={input} value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{autoLabel}</option>
      {Array.from({ length: capacity }, (_, i) => i + 1).map((n) => (
        <option key={n} value={n} disabled={taken.has(n)}>
          {en ? `Bay ${n}` : `Porte ${n}`}{taken.has(n) ? (en ? " (taken)" : " (occupée)") : ""}
        </option>
      ))}
    </select>
  );
}

export function gfetch(path: string, init?: RequestInit) {
  const g = typeof window === "undefined" ? null : new URLSearchParams(window.location.search).get("g");
  if (!g) return fetch(path, init);
  return fetch(`${path}${path.includes("?") ? "&" : "?"}g=${encodeURIComponent(g)}`, init);
}

const toDateStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const addDays = (date: string, n: number) => { const d = new Date(date + "T12:00:00"); d.setDate(d.getDate() + n); return toDateStr(d); };
const mondayOf = (date: string) => { const d = new Date(date + "T12:00:00"); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return toDateStr(d); };
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const toHHMM = (min: number) => `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
const shortDate = (date: string, lang = "fr") => new Date(date + "T12:00:00").toLocaleDateString(lang === "en" ? "en-CA" : "fr-CA", { day: "numeric", month: "long", year: "numeric" });
const longDate = (date: string, lang = "fr") => new Date(date + "T12:00:00").toLocaleDateString(lang === "en" ? "en-CA" : "fr-CA", { weekday: "long", day: "numeric", month: "long" });

const STATUS_LABEL: Record<string, string> = { PENDING: "En attente", CONFIRMED: "Prévu", COMPLETED: "Terminé", CANCELLED: "Annulé", NO_SHOW: "Client absent" };

function confirmationLabel(a: AgendaAppointment, tr: (fr: string) => string, en: boolean): { label: string; color: string; bg: string } | null {
  const via = a.contactChannel === "SMS" ? (en ? "text" : "texto") : (en ? "email" : "courriel");
  switch (a.confirmationStatus) {
    case "NO_RESPONSE": return { label: tr("À appeler : sans réponse"), color: "#b91c1c", bg: "#fef2f2" };
    case "AWAITING":    return { label: en ? `Waiting for a reply (${via})` : `En attente de réponse (${via})`, color: "#b45309", bg: "#fffbeb" };
    case "SCHEDULED":   return { label: a.confirmTier === "MANUAL" ? (en ? `Confirmation by ${via} 48 h before` : `Confirmation par ${via} 48 h avant`) : tr("Confirmation demandée 48 h avant"), color: "#475569", bg: "#f1f5f9" };
    case "CONFIRMED":   return { label: a.confirmedVia === "PHONE" ? tr("Confirmé par téléphone") : tr("Confirmé par le client"), color: "#15803d", bg: "#f0fdf4" };
    default: return null;
  }
}

const input = "w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm bg-white focus:outline-none focus:border-orange-400";
const label = "block text-[11px] font-semibold text-gray-500 mb-0.5";

export function Dialog({ title, subtitle, onClose, children, wide }: { title: string; subtitle?: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const tr = useTr();
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
          <button type="button" onClick={onClose} aria-label={tr("Fermer")} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 font-bold flex-shrink-0">×</button>
        </div>
        <div className="px-4 py-3">{children}</div>
      </div>
    </div>
  );
}

export function Segmented({ value, onChange, options, name }: { value: string; onChange: (v: string) => void; options: [string, string][]; name: string }) {
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
  const tr = useTr();
  const h = Math.floor(value / 60);
  const m = value % 60;
  return (
    <div className="flex items-center gap-1">
      <select id={`${idPrefix}-h`} aria-label={tr("Heures")} className={input} value={h} onChange={(e) => onChange(Math.max(10, Number(e.target.value) * 60 + m))}>
        {Array.from({ length: 11 }, (_, i) => <option key={i} value={i}>{i} h</option>)}
      </select>
      <select id={`${idPrefix}-m`} aria-label={tr("Minutes")} className={input} value={m} onChange={(e) => onChange(Math.max(10, h * 60 + Number(e.target.value)))}>
        {[0, 10, 20, 30, 40, 50].map((v) => <option key={v} value={v}>{String(v).padStart(2, "0")} min</option>)}
      </select>
    </div>
  );
}

const EMPTY_FORM = {
  customerId: "", // fiche choisie dans le carnet de clients du garage, s'il y en a une
  customerName: "", customerPhone: "", customerEmail: "",
  vehicleYear: "", vehicleMake: "", vehicleModel: "",
  categoryId: "", serviceName: "", date: "", startTime: "09:00", durationMin: 60,
  bay: "", // "" = automatique
  contactChannel: "SMS", language: "fr", notes: "",
};

export default function GarageAgenda({
  appointments, services, availability, capacity, blocked, lang, onReload, updatedAt, editRef,
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
  /** Reçoit la fonction qui ouvre un rendez-vous en modification (bouton « Modifier » d'une liste hors de l'agenda). */
  editRef?: React.RefObject<((id: string) => void) | null>;
}) {
  const tr = useTr();
  const today = toDateStr(new Date());
  const [weekStart, setWeekStart] = useState(mondayOf(today));
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  // Vue « jour » (une colonne par poste), « semaine » (demi-heure par demi-heure) ou « mois » (charge de chaque jour).
  const [view, setView] = useState<"day" | "week" | "month">("week");
  const [dayRef, setDayRef] = useState(today);
  // À partir de trois postes, des rendez-vous côte à côte dans une colonne de la semaine
  // deviennent illisibles : la semaine montre alors les postes pris, et le détail se lit au jour.
  const byLoad = capacity >= 3;
  function showDay(date: string) {
    setDayRef(date);
    setWeekStart(mondayOf(date));
    setView("day");
  }
  const [monthRef, setMonthRef] = useState({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 });
  const shiftMonth = (delta: number) => setMonthRef(({ year, month }) => {
    const d = new Date(year, month + delta, 1);
    return { year: d.getFullYear(), month: d.getMonth() };
  });
  function showWeekOf(date: string) {
    setWeekStart(mondayOf(date));
    setView("week");
  }
  function switchView(v: "day" | "week" | "month") {
    // On reste sur la même période en changeant de vue.
    const ref = view === "day" ? dayRef : days[3];
    if (v === "month") setMonthRef({ year: Number(ref.slice(0, 4)), month: Number(ref.slice(5, 7)) - 1 });
    if (v === "week" && view === "day") setWeekStart(mondayOf(dayRef));
    if (v === "day" && view === "week") setDayRef(today >= days[0] && today <= days[6] ? today : days[0]);
    if (v === "day" && view === "month") {
      const first = `${monthRef.year}-${String(monthRef.month + 1).padStart(2, "0")}-01`;
      setDayRef(today.slice(0, 7) === first.slice(0, 7) ? today : first);
    }
    setView(v);
  }
  const shift = (delta: number) => {
    if (view === "day") setDayRef(addDays(dayRef, delta));
    else if (view === "week") setWeekStart(addDays(weekStart, delta * 7));
    else shiftMonth(delta);
  };
  const en = lang === "en";
  const locale = en ? "en-CA" : "fr-CA";
  const vehicleLabels = { year: tr("Année"), make: tr("Marque"), model: tr("Modèle"), pickMakeFirst: tr("Choisissez d'abord la marque pour voir ses modèles") };

  const [form, setForm] = useState<typeof EMPTY_FORM | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  // L'heure proposée suit la date tant que le garage ne l'a pas choisie lui-même.
  const [timeTouched, setTimeTouched] = useState(false);

  // Carnet de clients : dès que le garage tape un nom, ses clients déjà venus sont proposés.
  const [matches, setMatches] = useState<CustomerMatch[]>([]);
  const [matchIdx, setMatchIdx] = useState(-1);
  const [nameFocused, setNameFocused] = useState(false);
  const [known, setKnown] = useState<CustomerMatch | null>(null);
  const nameQuery = form && !known ? form.customerName.trim() : "";
  useEffect(() => {
    if (nameQuery.length < 2) return;
    let stale = false;
    const timer = setTimeout(async () => {
      try {
        const res = await gfetch("/api/garage/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ q: nameQuery }) });
        const found = res.ok ? await res.json() : [];
        if (stale) return;
        setMatches(Array.isArray(found) ? found : []);
        setMatchIdx(-1);
      } catch { /* sans carnet, le formulaire se remplit à la main comme avant */ }
    }, 180);
    return () => { stale = true; clearTimeout(timer); };
  }, [nameQuery]);
  const showMatches = nameFocused && nameQuery.length >= 2 && matches.length > 0;

  // Demi-heure cliquée dans la semaine affichée par portes : ses rendez-vous, et de quoi en ajouter un.
  const [slotPick, setSlotPick] = useState<{ date: string; time: string } | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit" | "complete" | "cancel">("view");
  // Modification complète d'un rendez-vous : client, plage, porte, service, véhicule, notes.
  const [edit, setEdit] = useState({
    customerName: "", customerPhone: "", customerEmail: "", serviceName: "",
    vehicleYear: "", vehicleMake: "", vehicleModel: "",
    date: "", startTime: "", durationMin: 60, bay: "", notes: "",
  });
  const [note, setNote] = useState("");
  // Menu « Plus d'actions » de la fiche d'un rendez-vous
  const [moreOpen, setMoreOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState("");

  const open = openId ? appointments.find((a) => a.id === openId) ?? null : null;
  // Le tableau de bord garde cette fonction pour ouvrir un rendez-vous en modification depuis sa liste.
  useEffect(() => {
    if (!editRef) return;
    editRef.current = (id: string) => {
      const a = appointments.find((x) => x.id === id);
      if (!a) return;
      setWeekStart(mondayOf(a.date));
      setDayRef(a.date);
      openAppointment(a.id);
    };
  });
  const weekAppts = appointments.filter((a) => a.date >= days[0] && a.date <= days[6]);
  const toCall = appointments
    .filter((a) => a.confirmationStatus === "NO_RESPONSE" && a.status === "CONFIRMED" && a.date >= today)
    .sort((x, y) => x.date.localeCompare(y.date) || x.startTime.localeCompare(y.startTime));

  const serviceName = (s: AgendaService) => s.categoryName ?? s.category?.name ?? s.name ?? "";

  /** Prochaine heure réellement libre à partir de `fromDate` (ou ce jour-là seulement). */
  function nextFree(fromDate: string, durationMin: number, sameDayOnly = false) {
    const now = new Date();
    return findNextFreeStart(
      availability, blocked,
      appointments.filter((a) => a.status !== "CANCELLED" && a.status !== "NO_SHOW"),
      { fromDate, today, nowMin: now.getHours() * 60 + now.getMinutes(), durationMin, capacity, daysAhead: sameDayOnly ? 0 : 60 },
    );
  }

  function resetForm(date: string, time: string, touched: boolean, bay?: number) {
    setFormError("");
    setKnown(null);
    setMatches([]);
    setTimeTouched(touched);
    setForm({ ...EMPTY_FORM, date, startTime: time, bay: bay ? String(bay) : "" });
  }

  /** Clic sur une plage du calendrier : le garage a choisi lui-même la date et l'heure (et le poste, en vue « jour »). */
  function openForm(date: string, time: string, bay?: number) {
    resetForm(date, time, true, bay);
  }

  /** Postes déjà pris sur une plage (par un autre rendez-vous que `exceptId`). */
  function takenBays(date: string, startTime: string, durationMin: number, exceptId?: string) {
    const start = toMin(startTime || "00:00");
    const end = start + durationMin;
    return new Set(appointments
      .filter((a) => a.date === date && a.id !== exceptId && a.status !== "CANCELLED" && a.status !== "NO_SHOW" && a.bay && toMin(a.startTime) < end && toMin(a.endTime) > start)
      .map((a) => a.bay as number));
  }

  /** Bouton « + Rendez-vous » : le formulaire s'ouvre sur la prochaine disponibilité (ex. demain à l'ouverture). */
  function openFormAtNextFree(fromDate: string) {
    const slot = nextFree(fromDate, EMPTY_FORM.durationMin);
    resetForm(slot?.date ?? fromDate, slot?.time ?? EMPTY_FORM.startTime, false);
  }

  function pickCustomer(c: CustomerMatch) {
    if (!form) return;
    const v = c.vehicles[0];
    setKnown(c);
    setMatches([]);
    setForm({
      ...form,
      customerId: c.id, customerName: c.name, customerPhone: formatPhone(c.phone), customerEmail: c.email ?? "",
      language: c.language === "en" ? "en" : "fr",
      contactChannel: c.contactChannel === "NONE" ? "" : c.contactChannel === "SMS" || c.contactChannel === "EMAIL" ? c.contactChannel : form.contactChannel,
      vehicleYear: v?.year ? String(v.year) : "", vehicleMake: v?.make ?? "", vehicleModel: v?.model ?? "",
    });
  }

  /** Clic sur un rendez-vous : à venir, il s'ouvre directement en modification ; terminé, annulé ou absent, en lecture. */
  function openAppointment(id: string) {
    setActionError("");
    setMoreOpen(false);
    const a = appointments.find((x) => x.id === id);
    setOpenId(id);
    if (a && (a.status === "PENDING" || a.status === "CONFIRMED")) startEdit(a);
    else setMode("view");
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
        body: JSON.stringify({ ...form, bay: form.bay ? Number(form.bay) : null, contactChannel: form.contactChannel || null }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setFormError(d.error ?? tr("Impossible d'ajouter ce rendez-vous."));
        return;
      }
      setWeekStart(mondayOf(form.date));
      setDayRef(form.date);
      setForm(null);
      await onReload();
    } catch {
      setFormError(tr("Erreur réseau. Réessayez."));
    } finally {
      setSaving(false);
    }
  }

  function startEdit(a: AgendaAppointment) {
    setActionError("");
    setEdit({
      customerName: a.customerName, customerPhone: formatPhone(a.customerPhone), customerEmail: a.customerEmail ?? "",
      serviceName: a.serviceName ?? "",
      vehicleYear: a.vehicleYear ? String(a.vehicleYear) : "", vehicleMake: a.vehicleMake ?? "", vehicleModel: a.vehicleModel ?? "",
      date: a.date, startTime: a.startTime, durationMin: Math.max(10, toMin(a.endTime) - toMin(a.startTime)),
      bay: a.bay ? String(a.bay) : "", notes: a.notes ?? "",
    });
    setMode("edit");
  }

  /** Heure de fermeture (en minutes) ce jour-là, ou null si le garage est fermé ou la date vide. */
  function closingOf(date: string): number | null {
    if (!date) return null;
    const h = availability.find((x) => x.dayOfWeek === new Date(date + "T12:00:00").getDay());
    return h && !h.isClosed ? toMin(h.closeTime) : null;
  }

  /**
   * Porte de chaque rendez-vous d'une journée, telle que la vue Jour la montre : la porte
   * enregistrée, sinon la première porte libre (anciens rendez-vous, pris avant les portes).
   */
  function lanesOf(date: string) {
    const lanes = new Map<string, number>();
    const day = appointments
      .filter((a) => a.date === date && a.status !== "CANCELLED" && a.status !== "NO_SHOW")
      .map((a) => ({ ...a, serviceName: a.serviceName ?? undefined }));
    assignPosts(day, capacity).forEach((list, i) => { if (i < capacity) for (const a of list) lanes.set(a.id, i + 1); });
    return lanes;
  }

  /**
   * Rendez-vous suivants, à la même porte, que la nouvelle plage repousse. Chacun glisse
   * juste assez pour commencer à la fin du précédent, en gardant sa durée.
   */
  function shiftsFor(appt: AgendaAppointment, date: string, startTime: string, durationMin: number, bay: string) {
    if (!date || !startTime) return [];
    const lanes = lanesOf(date);
    const lane = bay ? Number(bay) : date === appt.date ? lanes.get(appt.id) ?? null : null;
    if (!lane) return [];
    const start = toMin(startTime);
    let cursor = start + durationMin;
    const out: { appt: AgendaAppointment; start: string; end: string; lane: number; pastMidnight: boolean }[] = [];
    const followers = appointments
      .filter((a) => a.id !== appt.id && a.date === date && (a.status === "CONFIRMED" || a.status === "PENDING")
        && lanes.get(a.id) === lane && toMin(a.startTime) >= start)
      .sort((x, y) => x.startTime.localeCompare(y.startTime));
    for (const a of followers) {
      const s0 = toMin(a.startTime), e0 = toMin(a.endTime);
      if (s0 < cursor) {
        const e1 = cursor + (e0 - s0);
        out.push({ appt: a, start: toHHMM(cursor), end: toHHMM(Math.min(e1, 24 * 60 - 1)), lane, pastMidnight: e1 > 24 * 60 - 1 });
        cursor = e1;
      } else cursor = Math.max(cursor, e0);
    }
    return out;
  }

  async function submitEdit(e: React.FormEvent) {
    e.preventDefault();
    if (!open) return;
    const send = (id: string, body: Record<string, unknown>) =>
      fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const shifts = shiftsFor(open, edit.date, edit.startTime, edit.durationMin, edit.bay);
    if (toMin(edit.startTime) + edit.durationMin > 24 * 60 - 1 || shifts.some((x) => x.pastMidnight)) {
      setActionError(en ? "This would run past midnight: shorten the duration." : "Cela dépasserait minuit : réduisez la durée.");
      return;
    }
    setBusy(true);
    setActionError("");
    try {
      // Seuls les champs changés partent : un rendez-vous dont l'heure ne bouge pas ne déclenche aucun message au client.
      const body: Record<string, unknown> = {};
      const end = toHHMM(toMin(edit.startTime) + edit.durationMin);
      const moved = edit.date !== open.date || edit.startTime !== open.startTime;
      if (moved) { body.date = edit.date; body.startTime = edit.startTime; }
      if (moved || end !== open.endTime) body.endTime = end;
      const bay = edit.bay ? Number(edit.bay) : null;
      if (capacity > 1 && bay !== (open.bay ?? null)) body.bay = bay;
      // Les rendez-vous repoussés partent avec celui-ci : le serveur enregistre tout d'un coup, ou rien.
      if (shifts.length > 0) {
        body.shifts = shifts.map((x) => ({ id: x.appt.id, startTime: x.start, bay: x.lane }));
        if (capacity > 1 && body.bay === undefined && !open.bay) body.bay = shifts[0].lane;
      }
      const changed = (next: string, prev: string | null | undefined) => next.trim() !== (prev ?? "").trim();
      if (changed(edit.customerName, open.customerName)) body.customerName = edit.customerName.trim();
      if (changed(edit.customerPhone, formatPhone(open.customerPhone))) body.customerPhone = edit.customerPhone.trim();
      if (changed(edit.customerEmail, open.customerEmail)) body.customerEmail = edit.customerEmail.trim();
      if (changed(edit.serviceName, open.serviceName)) body.serviceName = edit.serviceName.trim();
      if (changed(edit.vehicleYear, open.vehicleYear ? String(open.vehicleYear) : "")) body.vehicleYear = edit.vehicleYear.trim();
      if (changed(edit.vehicleMake, open.vehicleMake)) body.vehicleMake = edit.vehicleMake.trim();
      if (changed(edit.vehicleModel, open.vehicleModel)) body.vehicleModel = edit.vehicleModel.trim();
      if (changed(edit.notes, open.notes)) body.notes = edit.notes.trim() || null;
      if (Object.keys(body).length > 0) {
        const res = await send(open.id, body);
        if (!res.ok) {
          const d = await res.json().catch(() => ({}));
          setActionError(d.error ?? tr("Action impossible. Réessayez."));
          await onReload();
          return;
        }
      }
      await onReload();
      if (moved) { setWeekStart(mondayOf(edit.date)); setDayRef(edit.date); }
      setOpenId(null);
    } catch {
      setActionError(tr("Erreur réseau. Réessayez."));
    } finally {
      setBusy(false);
    }
  }

  async function patch(id: string, body: Record<string, unknown>, closeAfter = true) {
    setBusy(true);
    setActionError("");
    try {
      const res = await fetch(`/api/appointments/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setActionError(d.error ?? tr("Action impossible. Réessayez."));
        return;
      }
      await onReload();
      setMoreOpen(false);
      if (closeAfter) setOpenId(null); else setMode("edit");
    } catch {
      setActionError(tr("Erreur réseau. Réessayez."));
    } finally {
      setBusy(false);
    }
  }

  const monthLabel = new Date(monthRef.year, monthRef.month, 1).toLocaleDateString(locale, { month: "long", year: "numeric" });
  const weekLabel = `${new Date(days[0] + "T12:00:00").toLocaleDateString(locale, { day: "numeric", month: "short" })} – ${new Date(days[6] + "T12:00:00").toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })}`;
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
          <div className="flex gap-1" role="group" aria-label={tr("Affichage de l'agenda")}>
            {([["day", tr("Jour")], ["week", tr("Semaine")], ["month", tr("Mois")]] as const).map(([v, text]) => (
              <button key={v} type="button" onClick={() => switchView(v)} aria-pressed={view === v}
                className="px-3 min-h-[44px] sm:min-h-0 sm:px-2.5 sm:py-1.5 rounded-lg text-xs font-bold"
                style={{ background: view === v ? "#0b1f3a" : "#f1f5f9", color: view === v ? "#fff" : "#0b1f3a" }}>
                {text}
              </button>
            ))}
          </div>
          <button type="button" className={navBtn} aria-label={en ? `Previous ${view}` : view === "day" ? "Jour précédent" : view === "week" ? tr("Semaine précédente") : tr("Mois précédent")}
            onClick={() => shift(-1)}>‹</button>
          <span className="text-sm font-semibold text-gray-700 min-w-[150px] text-center first-letter:uppercase">{view === "day" ? longDate(dayRef, lang) : view === "week" ? weekLabel : monthLabel}</span>
          <button type="button" className={navBtn} aria-label={en ? `Next ${view}` : view === "day" ? "Jour suivant" : view === "week" ? tr("Semaine suivante") : tr("Mois suivant")}
            onClick={() => shift(1)}>›</button>
          <button type="button" onClick={() => { setDayRef(today); setWeekStart(mondayOf(today)); setMonthRef({ year: Number(today.slice(0, 4)), month: Number(today.slice(5, 7)) - 1 }); }}
            className="text-xs px-3 min-h-[44px] sm:min-h-0 sm:px-2.5 sm:py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-semibold">{tr("Aujourd'hui")}</button>
        </div>
        <div className="flex items-center gap-3">
          {updatedAt && (
            <span className="text-xs text-gray-500" title={tr("Le calendrier se met à jour tout seul toutes les 30 secondes")}>
              {en ? "Updated at" : "Mis à jour à"} {updatedAt.toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" })}
            </span>
          )}
          <a href={exportHref} className="text-xs font-semibold underline text-gray-600 inline-flex items-center min-h-[44px] sm:min-h-0" title={tr("Télécharger tous vos rendez-vous dans un fichier Excel")}>{tr("Exporter (Excel)")}</a>
          <button type="button" onClick={() => openFormAtNextFree(view === "day" ? dayRef : view === "month" || (today >= days[0] && today <= days[6]) ? today : days[0])}
            className="text-white px-4 min-h-[44px] sm:min-h-0 sm:px-3 sm:py-1.5 rounded-lg text-sm font-semibold" style={{ background: "#e0600c" }}>
            {tr("+ Rendez-vous")}
          </button>
        </div>
      </div>

      {toCall.length > 0 && (
        <div className="rounded-xl px-3 py-2 flex items-center gap-2 flex-wrap" role="status" style={{ background: "#fff7ed", border: "1px solid #fdba74" }}>
          <span className="text-xs font-black" style={{ color: "#9a3412" }}>
            {en ? (toCall.length === 1 ? "1 customer to call (no reply):" : `${toCall.length} customers to call (no reply):`) : toCall.length === 1 ? "1 client à appeler (sans réponse) :" : `${toCall.length} clients à appeler (sans réponse) :`}
          </span>
          {toCall.map((a) => (
            <button key={a.id} type="button" onClick={() => { setWeekStart(mondayOf(a.date)); setDayRef(a.date); openAppointment(a.id); }}
              className="text-xs font-semibold px-3 min-h-[44px] sm:min-h-0 sm:px-2 sm:py-1 rounded-lg bg-white border border-orange-200 text-gray-800">
              {a.customerName} · {new Date(a.date + "T12:00:00").toLocaleDateString(locale, { weekday: "short", day: "numeric" })} {a.startTime}
            </button>
          ))}
        </div>
      )}

      {view === "day" ? (
        <AgendaDayView
          date={dayRef}
          appointments={appointments.filter((a) => a.date === dayRef).map((a) => ({ ...a, serviceName: a.serviceName ?? undefined }))}
          availability={availability}
          capacity={capacity}
          blocked={blocked}
          lang={lang}
          onPickSlot={openForm}
          onPickAppointment={(a) => openAppointment(a.id)}
        />
      ) : view === "week" ? (
        <AgendaWeekView
          days={days}
          appointments={weekAppts.map((a) => ({ ...a, serviceName: a.serviceName ?? undefined }))}
          availability={availability}
          capacity={capacity}
          blocked={blocked}
          lang={lang}
          rowHeight={22}
          byLoad={byLoad}
          onPickDay={showDay}
          onPickSlot={openForm}
          onPickBusySlot={(date, time) => setSlotPick({ date, time })}
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

      {/* ── Rendez-vous d'une demi-heure (semaine affichée par portes) ── */}
      {slotPick && (() => {
        const start = toMin(slotPick.time), end = start + 30;
        const here = appointments
          .filter((a) => a.date === slotPick.date && a.status !== "CANCELLED" && toMin(a.startTime) < end && toMin(a.endTime) > start)
          .sort((x, y) => x.startTime.localeCompare(y.startTime) || x.customerName.localeCompare(y.customerName));
        const holding = here.filter((a) => a.status !== "NO_SHOW").length;
        const now = new Date();
        const past = slotPick.date < today || (slotPick.date === today && start < now.getHours() * 60 + now.getMinutes());
        const hours = availability.find((h) => h.dayOfWeek === new Date(slotPick.date + "T12:00:00").getDay());
        const open = !!hours && !hours.isClosed && start >= toMin(hours.openTime) && end <= toMin(hours.closeTime);
        const canAdd = open && !past && holding < capacity;
        return (
          <Dialog title={`${slotPick.time} · ${longDate(slotPick.date, lang)}`}
            subtitle={en ? `${holding} of ${capacity} bays taken` : `${holding} ${holding > 1 ? "portes prises" : "porte prise"} sur ${capacity}`}
            onClose={() => setSlotPick(null)}>
            <ul className="space-y-1.5">
              {here.map((a) => {
                const c = confirmationLabel(a, tr, en);
                return (
                  <li key={a.id}>
                    <button type="button" onClick={() => { setSlotPick(null); openAppointment(a.id); }}
                      className="w-full text-left flex items-center gap-3 rounded-lg border border-gray-200 px-3 py-2 hover:bg-gray-50">
                      <span className="text-sm font-black tabular-nums text-gray-900 w-[88px] flex-shrink-0">{a.startTime}–{a.endTime}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-sm font-bold text-gray-900 truncate">{a.customerName}</span>
                        <span className="block text-xs text-gray-500 truncate">
                          {[a.serviceName ? translateServiceName(a.serviceName, lang) : "", capacity > 1 && a.bay ? (en ? `Bay ${a.bay}` : `Porte ${a.bay}`) : "", a.status === "NO_SHOW" ? tr("Client absent") : c?.label ?? ""].filter(Boolean).join(" · ")}
                        </span>
                      </span>
                      <span aria-hidden="true" className="text-gray-400 text-lg">›</span>
                    </button>
                  </li>
                );
              })}
            </ul>
            <div className="flex flex-wrap gap-2 justify-end pt-3">
              <button type="button" onClick={() => { const d = slotPick.date; setSlotPick(null); showDay(d); }}
                className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-700">{en ? "See the day bay by bay" : "Voir la journée porte par porte"}</button>
              {canAdd && (
                <button type="button" onClick={() => { const { date, time } = slotPick; setSlotPick(null); openForm(date, time); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-white" style={{ background: "#e0600c" }}>
                  {en ? `+ Appointment at ${slotPick.time}` : `+ Rendez-vous à ${slotPick.time}`}
                </button>
              )}
            </div>
          </Dialog>
        );
      })()}

      {/* ── Prise de rendez-vous ── */}
      {form && (
        <Dialog title={tr("Nouveau rendez-vous")} subtitle={form.date ? longDate(form.date, lang) : undefined} onClose={() => setForm(null)} wide>
          <form onSubmit={submitForm} className="grid grid-cols-6 gap-x-2 gap-y-2">
            <div className="col-span-6 sm:col-span-2 relative">
              <label className={label} htmlFor="rdv-name">{tr("Nom du client")}</label>
              <input id="rdv-name" required autoFocus autoComplete="off" className={input} value={form.customerName}
                role="combobox" aria-autocomplete="list" aria-expanded={showMatches} aria-controls="rdv-name-matches"
                aria-activedescendant={showMatches && matchIdx >= 0 ? `rdv-match-${matchIdx}` : undefined}
                onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)}
                onChange={(e) => {
                  // Le nom change : ce n'est plus (forcément) le client choisi dans le carnet.
                  setKnown(null);
                  if (e.target.value.trim().length < 2) setMatches([]);
                  setForm({ ...form, customerName: e.target.value, customerId: "" });
                }}
                onKeyDown={(e) => {
                  if (!showMatches) return;
                  if (e.key === "ArrowDown") { e.preventDefault(); setMatchIdx((i) => (i + 1) % matches.length); }
                  else if (e.key === "ArrowUp") { e.preventDefault(); setMatchIdx((i) => (i <= 0 ? matches.length - 1 : i - 1)); }
                  else if (e.key === "Enter" && matchIdx >= 0) { e.preventDefault(); pickCustomer(matches[matchIdx]); }
                  else if (e.key === "Escape") { e.stopPropagation(); setMatches([]); }
                }} />
              {showMatches && (
                <ul id="rdv-name-matches" role="listbox" aria-label={tr("Clients déjà venus")}
                  className="absolute z-10 left-0 top-full mt-1 w-[min(22rem,calc(100vw-3.5rem))] bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden">
                  {matches.map((c, i) => {
                    const v = c.vehicles[0];
                    const car = v ? [v.year, v.make, v.model].filter(Boolean).join(" ") : "";
                    return (
                      <li key={c.id} id={`rdv-match-${i}`} role="option" aria-selected={i === matchIdx}
                        // mousedown : avant que le champ ne perde le focus et que la liste ne se referme
                        onMouseDown={(e) => { e.preventDefault(); pickCustomer(c); }} onMouseEnter={() => setMatchIdx(i)}
                        className="px-2.5 py-2 cursor-pointer border-b border-gray-100 last:border-b-0"
                        style={{ background: i === matchIdx ? "#fff7ed" : undefined }}>
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="text-sm font-bold text-gray-900 truncate">{c.name}</span>
                          <span className="text-xs text-gray-600 tabular-nums flex-shrink-0">{c.phone}</span>
                        </span>
                        <span className="block text-[11px] text-gray-500 truncate">
                          {[car, c.lastDate ? `${en ? "last appointment on" : "dernier rendez-vous le"} ${shortDate(c.lastDate, lang)}` : ""].filter(Boolean).join(" · ") || tr("Aucun rendez-vous encore")}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
              {known && (
                <p className="text-[11px] font-semibold mt-0.5" style={{ color: "#15803d" }}>
                  Déjà client{known.lastDate ? ` · ${en ? "last appointment on" : "dernier rendez-vous le"} ${shortDate(known.lastDate, lang)}` : ""}
                </p>
              )}
            </div>
            <div className="col-span-3 sm:col-span-2">
              <label className={label} htmlFor="rdv-phone">{tr("Téléphone")}</label>
              {/* Un seul format, mis en forme au fil de la frappe : seuls les chiffres comptent. */}
              <input id="rdv-phone" required type="tel" inputMode="tel" autoComplete="off" className={`${input} tabular-nums`}
                placeholder="(514) 555-0123" pattern={PHONE_PATTERN} title={tr("10 chiffres, sous la forme (514) 555-0123")}
                value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: formatPhone(e.target.value) })} />
            </div>
            <div className="col-span-3 sm:col-span-2">
              <label className={label} htmlFor="rdv-email">{tr("Courriel")}{form.contactChannel === "EMAIL" ? "" : en ? " (optional)" : " (facultatif)"}</label>
              <input id="rdv-email" type="email" inputMode="email" autoComplete="off" autoCapitalize="none" spellCheck={false} list="rdv-email-domains"
                required={form.contactChannel === "EMAIL"} className={input} placeholder={tr("nom@gmail.com")}
                value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value.replace(/\s/g, "") })} />
              {/* Fins d'adresse connues, proposées pendant la frappe (gmail.com, hotmail.com, videotron.ca…) */}
              <datalist id="rdv-email-domains">
                {emailSuggestions(form.customerEmail).map((address) => <option key={address} value={address} />)}
              </datalist>
              {(() => {
                const fix = emailTypoFix(form.customerEmail);
                return fix && (
                  <button type="button" onClick={() => setForm({ ...form, customerEmail: fix })}
                    className="block text-left text-[11px] font-semibold mt-0.5 underline" style={{ color: "#b45309" }}>
                    Vouliez-vous dire {fix} ?
                  </button>
                );
              })()}
            </div>

            <div className="col-span-3 sm:col-span-2">
              <label className={label} htmlFor="rdv-date">Date</label>
              <input id="rdv-date" required type="date" className={input} value={form.date}
                onChange={(e) => {
                  // Nouvelle date : l'heure passe à la première plage libre de ce jour-là, sauf si le garage l'a déjà choisie.
                  const date = e.target.value;
                  const slot = !timeTouched && date >= today ? nextFree(date, form.durationMin, true) : null;
                  setForm({ ...form, date, startTime: slot?.time ?? form.startTime });
                }} />
            </div>
            <div className="col-span-3 sm:col-span-1">
              <label className={label} htmlFor="rdv-time">{tr("Heure")}</label>
              <input id="rdv-time" required type="time" step={600} className={input} value={form.startTime} onChange={(e) => { setTimeTouched(true); setForm({ ...form, startTime: e.target.value }); }} />
            </div>
            <div className="col-span-6 sm:col-span-3">
              <label className={label} htmlFor="rdv-dur-h">{tr("Durée prévue")} <span className="font-normal text-gray-400">· {en ? "ends at" : "fin à"} {toHHMM(Math.min(toMin(form.startTime || "00:00") + form.durationMin, 24 * 60 - 1))}</span></label>
              <DurationPicker idPrefix="rdv-dur" value={form.durationMin} onChange={(v) => setForm({ ...form, durationMin: v })} />
            </div>

            {capacity > 1 && (() => {
              const taken = takenBays(form.date, form.startTime, form.durationMin);
              return (
                <div className="col-span-6 sm:col-span-3">
                  <label className={label} htmlFor="rdv-bay">{en ? "Bay" : "Porte"}</label>
                  <BaySelect id="rdv-bay" value={taken.has(Number(form.bay)) ? "" : form.bay} capacity={capacity} taken={taken} en={en}
                    autoLabel={tr("Automatique (la porte qui convient le mieux)")} onChange={(v) => setForm({ ...form, bay: v })} />
                </div>
              );
            })()}

            <div className="col-span-6 sm:col-span-3">
              <label className={label} htmlFor="rdv-service">Service</label>
              {services.length > 0 ? (
                <select id="rdv-service" className={input} value={form.categoryId}
                  onChange={(e) => {
                    const svc = services.find((s) => s.categoryId === e.target.value);
                    setForm({ ...form, categoryId: e.target.value, serviceName: svc ? serviceName(svc) : "", durationMin: svc?.durationMin ? Math.max(10, Math.round(svc.durationMin / 10) * 10) : form.durationMin });
                  }}>
                  <option value="">{tr("— Choisir —")}</option>
                  {services.map((s) => <option key={s.categoryId} value={s.categoryId}>{translateServiceName(serviceName(s), lang)}</option>)}
                </select>
              ) : (
                <input id="rdv-service" className={input} placeholder={tr("ex. Changement de pneus")} value={form.serviceName} onChange={(e) => setForm({ ...form, serviceName: e.target.value })} />
              )}
            </div>
            <div className="col-span-6 sm:col-span-3">
              <span className={label}>{tr("Véhicule (facultatif)")}</span>
              <VehicleFields year={form.vehicleYear} make={form.vehicleMake} model={form.vehicleModel} inputClass={input} labels={vehicleLabels}
                onChange={(v) => setForm({ ...form, ...v })} />
              {known && known.vehicles.length > 1 && (
                <div className="flex flex-wrap gap-1 mt-1" role="group" aria-label={tr("Véhicules de ce client")}>
                  {known.vehicles.map((v, i) => {
                    const text = [v.year, v.make, v.model].filter(Boolean).join(" ");
                    const on = form.vehicleYear === (v.year ? String(v.year) : "") && form.vehicleMake === (v.make ?? "") && form.vehicleModel === (v.model ?? "");
                    return (
                      <button key={i} type="button" aria-pressed={on}
                        onClick={() => setForm({ ...form, vehicleYear: v.year ? String(v.year) : "", vehicleMake: v.make ?? "", vehicleModel: v.model ?? "" })}
                        className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                        style={{ background: on ? "#0b1f3a" : "#f1f5f9", color: on ? "#fff" : "#0b1f3a" }}>
                        {text}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="col-span-6 sm:col-span-4">
              <span className={label}>{tr("Demande de confirmation envoyée par")}</span>
              <Segmented name={tr("Moyen d'envoi")} value={form.contactChannel} onChange={(v) => setForm({ ...form, contactChannel: v })} options={[["SMS", tr("Texto")], ["EMAIL", tr("Courriel")], ["", tr("Aucun")]]} />
            </div>
            <div className="col-span-6 sm:col-span-2">
              <span className={label}>{tr("Langue du client")}</span>
              <Segmented name={tr("Langue du client")} value={form.language} onChange={(v) => setForm({ ...form, language: v })} options={[["fr", tr("Français")], ["en", tr("English")]]} />
            </div>

            <div className="col-span-6">
              <label className={label} htmlFor="rdv-notes">{tr("Notes (visibles seulement par vous)")}</label>
              <input id="rdv-notes" maxLength={1000} className={input} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>

            {formError && <p className="col-span-6 text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">{formError}</p>}

            <div className="col-span-6 flex items-center justify-between gap-3 pt-1">
              <p className="text-[11px] text-gray-500">
                {form.contactChannel === ""
                  ? "Aucun message ne sera envoyé à ce client."
                  : en
                    ? `The customer gets ${form.contactChannel === "SMS" ? "a text" : "an email"} 48 h before; with no reply 24 h before, you are told to call them.`
                    : `Le client reçoit un ${form.contactChannel === "SMS" ? "texto" : "courriel"} 48 h avant ; sans réponse 24 h avant, vous êtes prévenu pour l'appeler.`}
              </p>
              <button type="submit" disabled={saving} className="flex-shrink-0 text-white px-5 py-2 rounded-lg text-sm font-bold disabled:opacity-60" style={{ background: "#e0600c" }}>
                {saving ? "…" : tr("Enregistrer")}
              </button>
            </div>
          </form>
        </Dialog>
      )}

      {/* ── Fiche d'un rendez-vous ── */}
      {open && (
        <Dialog title={open.customerName} subtitle={`${longDate(open.date, lang)} · ${open.startTime} – ${open.endTime}`} onClose={() => setOpenId(null)}>
          <div className="space-y-2.5 text-sm">
            <div className="flex flex-wrap gap-1.5">
              <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-100 text-gray-700">{tr(STATUS_LABEL[open.status] ?? open.status)}</span>
              {(() => { const c = confirmationLabel(open, tr, lang === "en"); return c && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: c.bg, color: c.color }}>{c.label}</span>; })()}
              {open.source === "ONLINE" && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-violet-100 text-violet-700">{tr("Réservé en ligne")}</span>}
              {capacity > 1 && open.bay && <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ background: "#e0e7ff", color: "#1e3a8a" }}>{en ? `Bay ${open.bay}` : `Porte ${open.bay}`}</span>}
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${open.customerPhone}`} className="px-3 py-1.5 rounded-lg font-semibold text-sm" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#15803d" }}>{open.customerPhone}</a>
              {open.customerEmail && <a href={`mailto:${open.customerEmail}`} className="px-3 py-1.5 rounded-lg font-semibold text-sm truncate max-w-full" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1d4ed8" }}>{open.customerEmail}</a>}
            </div>
            {mode !== "edit" && (open.serviceName || open.vehicleMake || open.vehicleYear) && (
              <p className="text-gray-700">{[translateServiceName(open.serviceName, lang), [open.vehicleYear, open.vehicleMake, open.vehicleModel].filter(Boolean).join(" ")].filter(Boolean).join(" · ")}</p>
            )}
            {mode !== "edit" && open.notes && <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-2">{open.notes}</p>}
            {open.status === "PENDING" && mode === "edit" && (
              <div className="flex items-center justify-between gap-2 rounded-lg px-3 py-2" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                <p className="text-xs text-blue-900">{en ? "Online booking request: accept it to confirm it to the customer." : "Demande réservée en ligne : acceptez-la pour la confirmer au client."}</p>
                <button type="button" disabled={busy} className={actionBtn} style={{ background: "#2563eb" }} onClick={() => patch(open.id, { status: "CONFIRMED" }, false)}>{tr("Accepter")}</button>
              </div>
            )}

            {actionError && <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2" role="alert">{actionError}</p>}

            {mode === "view" && open.status === "NO_SHOW" && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                <button type="button" disabled={busy} className={actionBtn} style={{ background: "#64748b" }} onClick={() => patch(open.id, { status: "CONFIRMED" }, false)}>{tr("Annuler le statut « absent »")}</button>
              </div>
            )}

            {mode === "edit" && (() => {
              const shifts = shiftsFor(open, edit.date, edit.startTime, edit.durationMin, edit.bay);
              const close = closingOf(edit.date);
              const endMin = toMin(edit.startTime || "00:00") + edit.durationMin;
              const late = close === null ? [] : [
                ...(endMin > close ? [en ? `This appointment will end at ${toHHMM(Math.min(endMin, 24 * 60 - 1))}.` : `Ce rendez-vous finira à ${toHHMM(Math.min(endMin, 24 * 60 - 1))}.`] : []),
                ...shifts.filter((x) => toMin(x.end) > close).map((x) => (en ? `${x.appt.customerName} will end at ${x.end}.` : `${x.appt.customerName} finira à ${x.end}.`)),
              ];
              const taken = takenBays(edit.date, edit.startTime, edit.durationMin, open.id);
              for (const x of shifts) if (x.appt.bay) taken.delete(x.appt.bay); // ceux-là vont glisser : leur porte se libère
              return (
                <form className="grid grid-cols-2 gap-2 pt-1" onSubmit={submitEdit}>
                  <div className="col-span-2">
                    <label className={label} htmlFor="ed-name">{tr("Nom du client")}</label>
                    <input id="ed-name" required minLength={2} maxLength={80} className={input} value={edit.customerName} onChange={(e) => setEdit({ ...edit, customerName: e.target.value })} />
                  </div>
                  <div>
                    <label className={label} htmlFor="ed-phone">{tr("Téléphone")}</label>
                    <input id="ed-phone" required type="tel" inputMode="tel" autoComplete="off" className={input} value={edit.customerPhone}
                      onChange={(e) => setEdit({ ...edit, customerPhone: formatPhone(e.target.value) })} />
                  </div>
                  <div>
                    <label className={label} htmlFor="ed-email">{tr("Courriel")}</label>
                    <input id="ed-email" type="email" autoComplete="off" className={input} value={edit.customerEmail} onChange={(e) => setEdit({ ...edit, customerEmail: e.target.value })} />
                  </div>
                  <div>
                    <label className={label} htmlFor="ed-date">Date</label>
                    <input id="ed-date" required type="date" className={input} value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} />
                  </div>
                  <div>
                    <label className={label} htmlFor="ed-time">{tr("Heure")}</label>
                    <input id="ed-time" required type="time" step={600} className={input} value={edit.startTime} onChange={(e) => setEdit({ ...edit, startTime: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <label className={label} htmlFor="ed-dur-h">{tr("Durée prévue")} <span className="font-normal text-gray-400">· {en ? "ends at" : "fin à"} {toHHMM(Math.min(endMin, 24 * 60 - 1))}</span></label>
                    <DurationPicker idPrefix="ed-dur" value={edit.durationMin} onChange={(v) => setEdit({ ...edit, durationMin: v })} />
                  </div>
                  {capacity > 1 && (
                    <div className="col-span-2">
                      <label className={label} htmlFor="ed-bay">{en ? "Bay" : "Porte"}</label>
                      <BaySelect id="ed-bay" value={taken.has(Number(edit.bay)) ? "" : edit.bay} capacity={capacity} taken={taken} en={en}
                        autoLabel={tr("Automatique (la porte qui convient le mieux)")} onChange={(v) => setEdit({ ...edit, bay: v })} />
                    </div>
                  )}
                  <div className="col-span-2">
                    <label className={label} htmlFor="ed-service">Service</label>
                    <input id="ed-service" maxLength={120} className={input} value={edit.serviceName} onChange={(e) => setEdit({ ...edit, serviceName: e.target.value })} />
                  </div>
                  <div className="col-span-2">
                    <span className={label}>{tr("Véhicule (facultatif)")}</span>
                    <VehicleFields year={edit.vehicleYear} make={edit.vehicleMake} model={edit.vehicleModel} inputClass={input} labels={vehicleLabels}
                      onChange={(v) => setEdit({ ...edit, ...v })} />
                  </div>
                  <div className="col-span-2">
                    <label className={label} htmlFor="ed-notes">{tr("Notes (visibles seulement par vous)")}</label>
                    <textarea id="ed-notes" rows={2} maxLength={1000} className={input} value={edit.notes} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} />
                  </div>

                  {shifts.length > 0 && (
                    <div className="col-span-2 text-xs rounded-lg px-3 py-2" style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e3a8a" }}>
                      <p className="font-bold">{en ? "These appointments will be moved later, and their customers notified:" : "Ces rendez-vous seront décalés, et leurs clients avertis :"}</p>
                      <ul className="mt-1 space-y-0.5">
                        {shifts.map((x) => <li key={x.appt.id}>{x.appt.customerName} : {x.appt.startTime} → <b>{x.start}</b></li>)}
                      </ul>
                    </div>
                  )}
                  {late.length > 0 && close !== null && (
                    <div className="col-span-2 text-xs rounded-lg px-3 py-2" role="alert" style={{ background: "#fffbeb", border: "1px solid #fcd34d", color: "#92400e" }}>
                      <p className="font-bold">{en ? `After closing time (${toHHMM(close)}):` : `Après l'heure de fermeture (${toHHMM(close)}) :`}</p>
                      <ul className="mt-1 space-y-0.5">{late.map((m) => <li key={m}>{m}</li>)}</ul>
                      <p className="mt-1">{en ? "You can still save." : "Vous pouvez quand même enregistrer."}</p>
                    </div>
                  )}

                  <div className="col-span-2 flex gap-2 justify-between items-center pt-1">
                    <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen(!moreOpen)}
                      className="px-3 py-2.5 min-h-[44px] sm:min-h-0 sm:py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-700 bg-white">
                      {en ? "More actions" : "Plus d'actions"} {moreOpen ? "▴" : "▾"}
                    </button>
                    <button type="submit" disabled={busy} className={actionBtn} style={{ background: "#e0600c" }}>{busy ? "…" : tr("Enregistrer")}</button>
                  </div>
                  {moreOpen && (() => {
                    const startAt = new Date(`${open.date}T${open.startTime}:00`).getTime();
                    const started = startAt <= Date.now();
                    const absentOk = startAt + 15 * 60 * 1000 <= Date.now();
                    const awaiting = open.confirmTier === "MANUAL" && open.status === "CONFIRMED" && ["SCHEDULED", "AWAITING", "NO_RESPONSE"].includes(open.confirmationStatus ?? "");
                    const item = "w-full text-left px-3 py-2.5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 disabled:opacity-50 disabled:hover:bg-white disabled:cursor-not-allowed";
                    const hint = "block text-[11px] text-gray-500 font-normal mt-0.5";
                    const startLabel = `${open.startTime} ${en ? "on" : "le"} ${shortDate(open.date, lang)}`;
                    return (
                      <div className="col-span-2 rounded-xl border border-gray-200 overflow-hidden" role="group" aria-label={en ? "More actions" : "Plus d'actions"}>
                        {awaiting && (
                          <button type="button" disabled={busy} className={item} onClick={() => patch(open.id, { phoneConfirmed: true }, false)}>
                            <span className="block text-sm font-bold" style={{ color: "#0f766e" }}>{en ? "The customer confirmed by phone" : "Le client m'a confirmé au téléphone"}</span>
                            <span className={hint}>{en ? "The appointment turns green and Garago stops sending reminders." : "Le rendez-vous passe au vert et Garago arrête de le relancer."}</span>
                          </button>
                        )}
                        <button type="button" disabled={!started} className={item} onClick={() => { setNote(""); setMoreOpen(false); setMode("complete"); }}>
                          <span className="block text-sm font-bold" style={{ color: "#15803d" }}>{en ? "The customer came, work done" : "Le client est venu, travail fait"}</span>
                          <span className={hint}>{started ? (en ? "The appointment is marked as completed." : "Le rendez-vous est classé « terminé ».") : (en ? `Available from ${startLabel}.` : `Disponible à partir de ${startLabel}.`)}</span>
                        </button>
                        <button type="button" disabled={busy || !absentOk} className={item} onClick={() => patch(open.id, { status: "NO_SHOW" })}>
                          <span className="block text-sm font-bold" style={{ color: "#b91c1c" }}>{en ? "The customer didn't show up" : "Le client n'est pas venu"}</span>
                          <span className={hint}>{absentOk ? (en ? "Counted in your no-shows." : "Compté dans vos absences.") : (en ? "Available 15 minutes after the start time." : "Disponible 15 minutes après l'heure du rendez-vous.")}</span>
                        </button>
                        <button type="button" className={item} onClick={() => { setMoreOpen(false); setMode("cancel"); }}>
                          <span className="block text-sm font-bold text-red-700">{en ? "Cancel the appointment" : "Annuler le rendez-vous"}</span>
                          <span className={hint}>{en ? "The slot opens up in the calendar, and the customer is notified." : "Le créneau se libère dans l'agenda, et le client est prévenu."}</span>
                        </button>
                      </div>
                    );
                  })()}
                </form>
              );
            })()}

            {mode === "complete" && (
              <form className="space-y-2 pt-1" onSubmit={(e) => { e.preventDefault(); patch(open.id, { status: "COMPLETED", completionNote: note || null }); }}>
                <label className={label} htmlFor="done-note">{tr("Note pour le client (facultatif, envoyée par courriel)")}</label>
                <textarea id="done-note" rows={3} className={input} value={note} onChange={(e) => setNote(e.target.value)} />
                <div className="flex gap-2 justify-end">
                  <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-600" onClick={() => setMode("edit")}>{tr("Retour")}</button>
                  <button type="submit" disabled={busy} className={actionBtn} style={{ background: "#16a34a" }}>{busy ? "…" : (en ? "Mark as completed" : "Classer « terminé »")}</button>
                </div>
              </form>
            )}

            {mode === "cancel" && (
              <div className="rounded-lg p-3 space-y-2" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <p className="text-sm font-bold text-red-800">{tr("Annuler ce rendez-vous ? Le client sera prévenu.")}</p>
                <div className="flex gap-2 justify-end">
                  <button type="button" className="px-3 py-1.5 rounded-lg text-xs font-bold border border-gray-200 text-gray-600 bg-white" onClick={() => setMode("edit")}>{tr("Non, garder")}</button>
                  <button type="button" disabled={busy} className={actionBtn} style={{ background: "#dc2626" }} onClick={() => patch(open.id, { status: "CANCELLED" })}>{busy ? "…" : tr("Oui, annuler")}</button>
                </div>
              </div>
            )}
          </div>
        </Dialog>
      )}
    </section>
  );
}
