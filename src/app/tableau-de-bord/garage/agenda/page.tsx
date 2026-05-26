"use client";

/**
 * /tableau-de-bord/garage/agenda
 *
 * Page agenda mobile-first — iOS & Android.
 * Peut être épinglée sur l'écran d'accueil (PWA-ready via meta layout.tsx).
 *
 * Optimisations mobile :
 *   - touch-action: manipulation → pas de délai 300ms (iOS + Android)
 *   - font-size ≥ 16px sur les inputs → pas de zoom automatique (Android Chrome)
 *   - -webkit-tap-highlight-color: transparent → pas de flash gris (Android)
 *   - padding-bottom: env(safe-area-inset-bottom) → barre de navigation Android/iOS
 *   - overscroll-behavior: contain → pas de pull-to-refresh accidentel
 *   - Bouton flottant au-dessus de la barre système
 *   - inputmode="numeric" sur le champ année
 *   - autocomplete sur tous les champs → suggestions clavier natif
 */

import { useState, useEffect, useCallback } from "react";
import { useSession }   from "next-auth/react";
import { useRouter }    from "next/navigation";
import Link             from "next/link";
import { useLang }      from "@/contexts/LanguageContext";

// ── Types ─────────────────────────────────────────────────────────────────────

interface Appointment {
  id: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  vehicleYear?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  serviceName?: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  source: string;
  notes?: string;
}

// ── Utilitaires date ──────────────────────────────────────────────────────────

function toDateStr(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + n);
  return toDateStr(d);
}

function formatDateLabel(dateStr: string, lang: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString(lang === "fr" ? "fr-CA" : "en-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function isToday(dateStr: string): boolean {
  return dateStr === toDateStr(new Date());
}

// ── Statuts ───────────────────────────────────────────────────────────────────

function statusStyle(status: string) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    PENDING:   { bg: "bg-amber-50",  text: "text-amber-700",  border: "border-amber-200" },
    CONFIRMED: { bg: "bg-blue-50",   text: "text-blue-700",   border: "border-blue-200"  },
    COMPLETED: { bg: "bg-green-50",  text: "text-green-700",  border: "border-green-200" },
    CANCELLED: { bg: "bg-red-50",    text: "text-red-600",    border: "border-red-200"   },
  };
  return map[status] ?? map.PENDING;
}

// ── Composant principal ───────────────────────────────────────────────────────

export default function AgendaPage() {
  const { data: session, status } = useSession();
  const router  = useRouter();
  const { lang, t } = useLang();
  const a = t.agenda;

  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showForm,     setShowForm]     = useState(false);
  const [expandedId,   setExpandedId]   = useState<string | null>(null);
  const [saving,       setSaving]       = useState(false);
  const [actionId,     setActionId]     = useState<string | null>(null);

  const emptyForm = {
    customerName: "", customerPhone: "", customerEmail: "",
    vehicleMake: "", vehicleModel: "", vehicleYear: "",
    serviceName: "", startTime: "09:00", notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  // Auth guard
  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion");
  }, [status, router]);

  // Chargement RDV
  const loadAppointments = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res  = await fetch(`/api/garage/appointments?from=${date}&to=${date}`);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadAppointments(selectedDate);
  }, [selectedDate, status, loadAppointments]);

  function navigate(delta: number) {
    setExpandedId(null);
    setSelectedDate(prev => addDays(prev, delta));
  }

  async function changeStatus(id: string, newStatus: string) {
    setActionId(id + newStatus);
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setAppointments(prev =>
        prev.map(ap => ap.id === id ? { ...ap, status: newStatus } : ap)
      );
      if (newStatus === "CANCELLED") setExpandedId(null);
    } finally {
      setActionId(null);
    }
  }

  async function submitForm(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch("/api/garage/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, date: selectedDate }),
      });
      if (res.ok) {
        const newAppt = await res.json();
        setAppointments(prev =>
          [...prev, newAppt].sort((x, y) => x.startTime.localeCompare(y.startTime))
        );
        setForm(emptyForm);
        setShowForm(false);
      }
    } finally {
      setSaving(false);
    }
  }

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <p className="text-gray-400 text-sm">{a.loading}</p>
      </div>
    );
  }

  const active    = appointments.filter(ap => ap.status !== "CANCELLED");
  const cancelled = appointments.filter(ap => ap.status === "CANCELLED");
  const today     = isToday(selectedDate);

  // Styles inline réutilisables — évitent les classes Tailwind manquantes
  const inputStyle: React.CSSProperties = {
    display: "block", width: "100%",
    border: "1px solid #e5e7eb", borderRadius: 12,
    padding: "12px 16px", fontSize: 16,         // ≥16px : pas de zoom Android/iOS
    outline: "none", backgroundColor: "white",
    WebkitTapHighlightColor: "transparent",
  };

  return (
    <>
      {/* ── CSS global pour cette page ──────────────────────────────────── */}
      <style>{`
        * { -webkit-tap-highlight-color: transparent; }
        input, textarea, select { font-size: 16px !important; }
        .agenda-scroll { overscroll-behavior: contain; }
      `}</style>

      <div
        className="min-h-screen flex flex-col agenda-scroll"
        style={{
          backgroundColor: "#f8fafc",
          maxWidth: 600,
          margin: "0 auto",
          // Safe area bottom (Android nav bar / iOS home indicator)
          paddingBottom: "env(safe-area-inset-bottom)",
        }}
      >

        {/* ── Header sticky ──────────────────────────────────────────────── */}
        <div
          className="sticky top-0 z-20 bg-white border-b border-gray-200"
          style={{
            boxShadow: "0 1px 8px rgba(0,0,0,0.08)",
            paddingTop: "env(safe-area-inset-top)",
          }}
        >
          {/* Barre du haut */}
          <div className="flex items-center justify-between px-4 pt-3 pb-1">
            <Link
              href="/tableau-de-bord/garage"
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-gray-100 text-gray-600 text-xl font-bold"
              style={{ touchAction: "manipulation" }}
            >
              ‹
            </Link>
            <span className="text-xs font-black text-gray-400 uppercase tracking-widest">{a.title}</span>
            <button
              onClick={() => { setExpandedId(null); setSelectedDate(toDateStr(new Date())); }}
              className={`text-xs font-black px-3 py-1.5 rounded-lg transition-colors ${
                today
                  ? "text-orange-700 bg-orange-100"
                  : "text-gray-600 bg-gray-100"
              }`}
              style={{ touchAction: "manipulation" }}
            >
              {a.todayBtn}
            </button>
          </div>

          {/* Navigation date */}
          <div className="flex items-center justify-between px-4 pb-3 pt-1">
            <button
              onClick={() => navigate(-1)}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 text-gray-700 text-2xl font-bold active:bg-gray-200"
              style={{ touchAction: "manipulation" }}
            >
              ‹
            </button>
            <div className="text-center flex-1 px-2">
              <p className="font-black text-gray-900 capitalize text-base leading-tight">
                {formatDateLabel(selectedDate, lang)}
              </p>
              {today && (
                <span className="text-xs font-semibold text-orange-500">{a.today}</span>
              )}
            </div>
            <button
              onClick={() => navigate(1)}
              className="w-11 h-11 flex items-center justify-center rounded-xl bg-gray-100 text-gray-700 text-2xl font-bold active:bg-gray-200"
              style={{ touchAction: "manipulation" }}
            >
              ›
            </button>
          </div>

          {/* Compteur */}
          <div className="px-4 pb-3 flex items-center gap-3">
            <span className="text-xs text-gray-500">
              <span className="font-black text-gray-900 text-base">{active.length}</span>{" "}
              {a.appointments}
            </span>
            {cancelled.length > 0 && (
              <span className="text-xs text-red-400">
                {cancelled.length} {cancelled.length === 1 ? a.cancelled_one : a.cancelled_many}
              </span>
            )}
          </div>
        </div>

        {/* ── Liste des RDV ───────────────────────────────────────────────── */}
        <div className="flex-1 px-4 py-4 space-y-3 pb-32">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-gray-400 text-sm">{a.loading}</p>
            </div>
          ) : active.length === 0 && cancelled.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center px-6">
              <span className="text-6xl mb-4">🎉</span>
              <p className="font-black text-gray-800 text-lg">{a.noAppts}</p>
              <p className="text-sm text-gray-400 mt-1">{a.noApptsSub}</p>
            </div>
          ) : (
            <>
              {active.map(ap => (
                <ApptCard
                  key={ap.id}
                  appt={ap}
                  expanded={expandedId === ap.id}
                  onToggle={() => setExpandedId(expandedId === ap.id ? null : ap.id)}
                  onStatus={changeStatus}
                  actionId={actionId}
                  a={a}
                />
              ))}
              {cancelled.length > 0 && (
                <>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest pt-2 pb-1">
                    {a.cancelled}
                  </p>
                  {cancelled.map(ap => (
                    <ApptCard
                      key={ap.id}
                      appt={ap}
                      expanded={expandedId === ap.id}
                      onToggle={() => setExpandedId(expandedId === ap.id ? null : ap.id)}
                      onStatus={changeStatus}
                      actionId={actionId}
                      a={a}
                    />
                  ))}
                </>
              )}
            </>
          )}
        </div>

        {/* ── Bouton flottant ─────────────────────────────────────────────── */}
        <div
          className="fixed z-30"
          style={{
            bottom: `calc(16px + env(safe-area-inset-bottom))`,
            left: "50%", transform: "translateX(-50%)",
            maxWidth: 568, width: "calc(100% - 32px)",
          }}
        >
          <button
            onClick={() => { setForm(emptyForm); setShowForm(true); }}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-base active:scale-95 transition-transform"
            style={{
              backgroundColor: "#f97316",
              boxShadow: "0 4px 24px rgba(249,115,22,0.45)",
              touchAction: "manipulation",
            }}
          >
            <span className="text-xl leading-none">+</span>
            {a.newAppt}
          </button>
        </div>

        {/* ── Formulaire slide-up ──────────────────────────────────────────── */}
        {showForm && (
          <div className="fixed inset-0 z-40 flex flex-col justify-end">
            {/* Backdrop */}
            <div
              className="absolute inset-0"
              style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
              onClick={() => setShowForm(false)}
            />

            {/* Sheet — max 90vh, scrollable */}
            <div
              className="relative bg-white rounded-t-3xl"
              style={{
                maxHeight: "92dvh",     // dvh : prend en compte le clavier virtuel Android
                overflowY: "auto",
                boxShadow: "0 -4px 40px rgba(0,0,0,0.2)",
                paddingBottom: "env(safe-area-inset-bottom)",
              }}
            >
              {/* Poignée */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* Titre */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
                <div>
                  <h2 className="font-black text-gray-900 text-lg">{a.formTitle}</h2>
                  <p className="text-xs text-gray-400 capitalize">{formatDateLabel(selectedDate, lang)}</p>
                </div>
                <button
                  onClick={() => setShowForm(false)}
                  className="w-9 h-9 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 text-lg font-bold active:bg-gray-200"
                  style={{ touchAction: "manipulation" }}
                >
                  ×
                </button>
              </div>

              <form onSubmit={submitForm} className="px-5 py-4 space-y-5 pb-6">
                {/* Client */}
                <section>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{a.client}</p>
                  <div className="space-y-2.5">
                    <input
                      required
                      autoComplete="name"
                      style={inputStyle}
                      placeholder={a.fullName}
                      value={form.customerName}
                      onChange={e => setForm({ ...form, customerName: e.target.value })}
                    />
                    <div className="flex gap-2">
                      <input
                        required
                        type="tel"
                        autoComplete="tel"
                        inputMode="tel"
                        style={{ ...inputStyle, flex: 1 }}
                        placeholder={a.phone}
                        value={form.customerPhone}
                        onChange={e => setForm({ ...form, customerPhone: e.target.value })}
                      />
                      {form.customerPhone && (
                        <a
                          href={`tel:${form.customerPhone}`}
                          className="flex-shrink-0 w-12 h-12 flex items-center justify-center rounded-xl text-xl active:bg-green-100"
                          style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}
                        >
                          📞
                        </a>
                      )}
                    </div>
                    <input
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      style={inputStyle}
                      placeholder={a.email}
                      value={form.customerEmail}
                      onChange={e => setForm({ ...form, customerEmail: e.target.value })}
                    />
                  </div>
                </section>

                {/* Véhicule */}
                <section>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{a.vehicle}</p>
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      inputMode="numeric"
                      style={inputStyle}
                      placeholder={a.year}
                      value={form.vehicleYear}
                      onChange={e => setForm({ ...form, vehicleYear: e.target.value })}
                    />
                    <input
                      autoComplete="off"
                      style={inputStyle}
                      placeholder={a.make}
                      value={form.vehicleMake}
                      onChange={e => setForm({ ...form, vehicleMake: e.target.value })}
                    />
                    <input
                      autoComplete="off"
                      style={inputStyle}
                      placeholder={a.model}
                      value={form.vehicleModel}
                      onChange={e => setForm({ ...form, vehicleModel: e.target.value })}
                    />
                  </div>
                </section>

                {/* Service & heure */}
                <section>
                  <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">{a.serviceTime}</p>
                  <div className="space-y-2.5">
                    <input
                      autoComplete="off"
                      style={inputStyle}
                      placeholder={a.servicePlaceholder}
                      value={form.serviceName}
                      onChange={e => setForm({ ...form, serviceName: e.target.value })}
                    />
                    <div className="flex items-center gap-3">
                      <label className="text-sm font-semibold text-gray-600 flex-shrink-0">{a.time}</label>
                      <input
                        required
                        type="time"
                        style={{ ...inputStyle, flex: 1 }}
                        value={form.startTime}
                        onChange={e => setForm({ ...form, startTime: e.target.value })}
                      />
                    </div>
                  </div>
                </section>

                {/* Notes */}
                <textarea
                  rows={2}
                  style={{ ...inputStyle, resize: "none" } as React.CSSProperties}
                  placeholder={a.notes}
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />

                {/* Submit */}
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full py-4 rounded-2xl font-black text-white text-base active:scale-95 transition-transform disabled:opacity-60"
                  style={{ backgroundColor: "#f97316", touchAction: "manipulation" }}
                >
                  {saving ? a.saving : a.saveBtn}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

// ── Carte RDV ─────────────────────────────────────────────────────────────────

function ApptCard({
  appt, expanded, onToggle, onStatus, actionId, a,
}: {
  appt: Appointment;
  expanded: boolean;
  onToggle: () => void;
  onStatus: (id: string, s: string) => Promise<void>;
  actionId: string | null;
  a: ReturnType<typeof useLang>["t"]["agenda"];
}) {
  const ss         = statusStyle(appt.status);
  const isCancelled = appt.status === "CANCELLED";

  // Libellé statut traduit
  const statusLabel: Record<string, string> = {
    PENDING:   a.pending,
    CONFIRMED: a.confirmed,
    COMPLETED: a.completed,
    CANCELLED: a.cancelledStatus,
  };

  return (
    <div
      className={`bg-white rounded-2xl border transition-all ${
        expanded ? "border-orange-300" : "border-gray-200"
      } ${isCancelled ? "opacity-55" : ""}`}
      style={{
        boxShadow: expanded
          ? "0 4px 20px rgba(249,115,22,0.12)"
          : "0 1px 6px rgba(0,0,0,0.05)",
      }}
    >
      {/* Ligne principale — tap pour expand */}
      <button
        onClick={onToggle}
        className="w-full text-left p-4"
        style={{ touchAction: "manipulation", WebkitTapHighlightColor: "transparent" } as React.CSSProperties}
      >
        <div className="flex items-start gap-3">
          {/* Heure */}
          <div className="flex-shrink-0 text-center w-14">
            <p className="font-black text-gray-900 text-xl leading-none tabular-nums">{appt.startTime}</p>
            <p className="text-xs text-gray-400 tabular-nums mt-0.5">{appt.endTime}</p>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900 text-sm">{appt.customerName}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${ss.bg} ${ss.text} ${ss.border}`}>
                {statusLabel[appt.status] ?? appt.status}
              </span>
              {appt.source === "ONLINE" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 font-semibold border border-violet-200">
                  {a.sourceOnline}
                </span>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-0.5 truncate">
              {[appt.vehicleYear, appt.vehicleMake, appt.vehicleModel].filter(Boolean).join(" ")}
              {(appt.vehicleMake || appt.vehicleYear) && appt.serviceName ? " · " : ""}
              {appt.serviceName}
            </p>
          </div>

          {/* Chevron */}
          <span
            className={`text-gray-400 flex-shrink-0 transition-transform text-lg ${expanded ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </div>
      </button>

      {/* Détails */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          {/* Contacts */}
          <div className="flex flex-wrap gap-2">
            <a
              href={`tel:${appt.customerPhone}`}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                color: "#15803d",
                touchAction: "manipulation",
              }}
            >
              📞 {appt.customerPhone}
            </a>
            {appt.customerEmail && (
              <a
                href={`mailto:${appt.customerEmail}`}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-sm active:scale-95 transition-transform"
                style={{
                  backgroundColor: "#eff6ff",
                  border: "1px solid #bfdbfe",
                  color: "#1d4ed8",
                  touchAction: "manipulation",
                }}
              >
                ✉️ {appt.customerEmail}
              </a>
            )}
          </div>

          {/* Notes */}
          {appt.notes && (
            <p className="text-xs text-gray-600 bg-gray-50 border border-gray-100 rounded-xl px-3 py-2.5">
              📝 {appt.notes}
            </p>
          )}

          {/* Actions */}
          {!isCancelled && (
            <div className="flex gap-2 flex-wrap pt-1">
              {appt.status === "PENDING" && (
                <TapBtn
                  label={a.confirm}
                  bg="#2563eb" active="#1d4ed8"
                  loading={actionId === appt.id + "CONFIRMED"}
                  onClick={() => onStatus(appt.id, "CONFIRMED")}
                />
              )}
              {(appt.status === "PENDING" || appt.status === "CONFIRMED") && (
                <TapBtn
                  label={a.complete}
                  bg="#16a34a" active="#15803d"
                  loading={actionId === appt.id + "COMPLETED"}
                  onClick={() => onStatus(appt.id, "COMPLETED")}
                />
              )}
              {appt.status !== "COMPLETED" && (
                <TapBtn
                  label={a.cancel}
                  bg="#ef4444" active="#dc2626"
                  loading={actionId === appt.id + "CANCELLED"}
                  onClick={() => onStatus(appt.id, "CANCELLED")}
                />
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TapBtn({
  label, bg, active, loading, onClick,
}: {
  label: string; bg: string; active: string;
  loading: boolean; onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="px-4 py-2.5 rounded-xl font-bold text-sm text-white active:scale-95 transition-transform disabled:opacity-50"
      style={{ backgroundColor: bg, touchAction: "manipulation" }}
      onMouseDown={e => (e.currentTarget.style.backgroundColor = active)}
      onMouseUp={e => (e.currentTarget.style.backgroundColor = bg)}
    >
      {loading ? "…" : label}
    </button>
  );
}
