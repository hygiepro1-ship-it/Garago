"use client";

/**
 * /tableau-de-bord/garage/agenda
 *
 * Page agenda mobile-first pour les garagistes.
 * Optimisée pour être utilisée depuis un téléphone.
 * Peut être ajoutée à l'écran d'accueil (PWA-ready).
 *
 * Fonctionnalités :
 *   - Navigation jour par jour (← aujourd'hui →)
 *   - Timeline des RDV du jour sélectionné
 *   - Bouton flottant "+ Nouveau RDV"
 *   - Formulaire rapide en slide-up
 *   - Tap sur un RDV → actions (confirmer / compléter / annuler / appel direct)
 */

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

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

function formatDateLabel(dateStr: string): string {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("fr-CA", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function isToday(dateStr: string): boolean {
  return dateStr === toDateStr(new Date());
}

// ── Couleurs statut ───────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  PENDING:   { bg: "bg-yellow-100",  text: "text-yellow-800",  label: "En attente" },
  CONFIRMED: { bg: "bg-blue-100",    text: "text-blue-800",    label: "Confirmé"   },
  COMPLETED: { bg: "bg-green-100",   text: "text-green-800",   label: "Complété"   },
  CANCELLED: { bg: "bg-red-100",     text: "text-red-700",     label: "Annulé"     },
};

// ── Composant principal ───────────────────────────────────────────────────────

export default function AgendaPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Formulaire ajout rapide
  const emptyForm = {
    customerName: "", customerPhone: "", customerEmail: "",
    vehicleMake: "", vehicleModel: "", vehicleYear: "",
    serviceName: "", startTime: "09:00", notes: "",
  };
  const [form, setForm] = useState(emptyForm);

  // Auth
  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion");
  }, [status, router]);

  // Charger les RDV du jour sélectionné
  const loadAppointments = useCallback(async (date: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/garage/appointments?from=${date}&to=${date}`);
      const data = await res.json();
      setAppointments(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") loadAppointments(selectedDate);
  }, [selectedDate, status, loadAppointments]);

  // Naviguer d'un jour
  function navigate(delta: number) {
    setExpandedId(null);
    setSelectedDate(prev => addDays(prev, delta));
  }

  // Aller à aujourd'hui
  function goToday() {
    setExpandedId(null);
    setSelectedDate(toDateStr(new Date()));
  }

  // Changer statut
  async function changeStatus(id: string, newStatus: string) {
    setActionLoading(id + newStatus);
    try {
      await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      setAppointments(prev =>
        prev.map(a => a.id === id ? { ...a, status: newStatus } : a)
      );
      if (newStatus === "CANCELLED") setExpandedId(null);
    } finally {
      setActionLoading(null);
    }
  }

  // Ajouter un RDV manuel
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
          [...prev, newAppt].sort((a, b) => a.startTime.localeCompare(b.startTime))
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-400 text-sm">Chargement...</div>
      </div>
    );
  }

  const today = isToday(selectedDate);
  const active = appointments.filter(a => a.status !== "CANCELLED");
  const cancelled = appointments.filter(a => a.status === "CANCELLED");

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#f8fafc", maxWidth: 600, margin: "0 auto" }}>

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
        {/* Barre du haut */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <Link href="/tableau-de-bord/garage" className="text-gray-400 hover:text-gray-700 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Agenda</span>
          <button
            onClick={goToday}
            className={`text-xs font-bold px-2.5 py-1 rounded-lg transition-colors ${
              today ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            Auj.
          </button>
        </div>

        {/* Navigation date */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
          >
            ‹
          </button>
          <div className="text-center">
            <p className="font-black text-gray-900 capitalize text-base leading-tight">
              {formatDateLabel(selectedDate)}
            </p>
            {today && (
              <span className="text-xs font-bold text-orange-500">Aujourd'hui</span>
            )}
          </div>
          <button
            onClick={() => navigate(1)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 hover:bg-gray-200 transition-colors text-gray-600"
          >
            ›
          </button>
        </div>

        {/* Compteur */}
        <div className="px-4 pb-2 flex items-center gap-3">
          <span className="text-xs text-gray-500">
            <span className="font-black text-gray-900">{active.length}</span> rendez-vous
          </span>
          {cancelled.length > 0 && (
            <span className="text-xs text-red-400">{cancelled.length} annulé{cancelled.length > 1 ? "s" : ""}</span>
          )}
        </div>
      </div>

      {/* ── Liste des RDV ───────────────────────────────────────────────────── */}
      <div className="flex-1 px-4 py-4 space-y-3 pb-28">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400 text-sm">
            Chargement...
          </div>
        ) : active.length === 0 && cancelled.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <span className="text-5xl mb-4">🎉</span>
            <p className="font-bold text-gray-700">Aucun rendez-vous ce jour</p>
            <p className="text-sm text-gray-400 mt-1">Profitez-en ou ajoutez un client ci-dessous.</p>
          </div>
        ) : (
          <>
            {active.map(appt => (
              <AppointmentCard
                key={appt.id}
                appt={appt}
                expanded={expandedId === appt.id}
                onToggle={() => setExpandedId(expandedId === appt.id ? null : appt.id)}
                onStatus={changeStatus}
                actionLoading={actionLoading}
              />
            ))}
            {cancelled.length > 0 && (
              <>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest pt-2">Annulés</p>
                {cancelled.map(appt => (
                  <AppointmentCard
                    key={appt.id}
                    appt={appt}
                    expanded={expandedId === appt.id}
                    onToggle={() => setExpandedId(expandedId === appt.id ? null : appt.id)}
                    onStatus={changeStatus}
                    actionLoading={actionLoading}
                  />
                ))}
              </>
            )}
          </>
        )}
      </div>

      {/* ── Bouton flottant ─────────────────────────────────────────────────── */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30" style={{ maxWidth: 560, width: "calc(100% - 32px)" }}>
        <button
          onClick={() => { setShowForm(true); setForm(emptyForm); }}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-black text-white text-base shadow-xl transition-all active:scale-95"
          style={{ backgroundColor: "#f97316", boxShadow: "0 4px 24px rgba(249,115,22,0.4)" }}
        >
          <span className="text-xl leading-none">+</span>
          Nouveau rendez-vous
        </button>
      </div>

      {/* ── Slide-up formulaire ──────────────────────────────────────────────── */}
      {showForm && (
        <div className="fixed inset-0 z-40 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setShowForm(false)}
          />
          {/* Sheet */}
          <div className="relative bg-white rounded-t-3xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
              <div>
                <h2 className="font-black text-gray-900 text-base">Nouveau RDV</h2>
                <p className="text-xs text-gray-400 capitalize">{formatDateLabel(selectedDate)}</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-600 text-lg font-bold">
                ×
              </button>
            </div>

            <form onSubmit={submitForm} className="p-5 space-y-4 pb-8">
              {/* Client */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Client</p>
                <div className="space-y-2">
                  <input
                    required
                    className="block w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Nom complet *"
                    value={form.customerName}
                    onChange={e => setForm({ ...form, customerName: e.target.value })}
                  />
                  <div className="flex items-center gap-2">
                    <input
                      required
                      type="tel"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      placeholder="Téléphone *"
                      value={form.customerPhone}
                      onChange={e => setForm({ ...form, customerPhone: e.target.value })}
                    />
                    {form.customerPhone && (
                      <a
                        href={`tel:${form.customerPhone}`}
                        className="flex-shrink-0 w-11 h-11 flex items-center justify-center bg-green-50 border border-green-200 rounded-xl text-green-700"
                      >
                        📞
                      </a>
                    )}
                  </div>
                  <input
                    type="email"
                    className="block w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Courriel (optionnel)"
                    value={form.customerEmail}
                    onChange={e => setForm({ ...form, customerEmail: e.target.value })}
                  />
                </div>
              </div>

              {/* Véhicule */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Véhicule</p>
                <div className="grid grid-cols-3 gap-2">
                  <input
                    type="number"
                    className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Année"
                    value={form.vehicleYear}
                    onChange={e => setForm({ ...form, vehicleYear: e.target.value })}
                  />
                  <input
                    className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Marque"
                    value={form.vehicleMake}
                    onChange={e => setForm({ ...form, vehicleMake: e.target.value })}
                  />
                  <input
                    className="border border-gray-200 rounded-xl px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Modèle"
                    value={form.vehicleModel}
                    onChange={e => setForm({ ...form, vehicleModel: e.target.value })}
                  />
                </div>
              </div>

              {/* Service + heure */}
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Service & heure</p>
                <div className="space-y-2">
                  <input
                    className="block w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                    placeholder="Service (ex: Vidange, Freins...)"
                    value={form.serviceName}
                    onChange={e => setForm({ ...form, serviceName: e.target.value })}
                  />
                  <div className="flex items-center gap-3">
                    <label className="text-sm text-gray-600 font-medium flex-shrink-0">Heure *</label>
                    <input
                      required
                      type="time"
                      className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                      value={form.startTime}
                      onChange={e => setForm({ ...form, startTime: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Notes */}
              <div>
                <textarea
                  rows={2}
                  className="block w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400 resize-none"
                  placeholder="Notes internes (optionnel)"
                  value={form.notes}
                  onChange={e => setForm({ ...form, notes: e.target.value })}
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-4 rounded-2xl font-black text-white text-base transition-all active:scale-95 disabled:opacity-60"
                style={{ backgroundColor: "#f97316" }}
              >
                {saving ? "Sauvegarde..." : "Confirmer le rendez-vous"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Carte RDV ─────────────────────────────────────────────────────────────────

function AppointmentCard({
  appt,
  expanded,
  onToggle,
  onStatus,
  actionLoading,
}: {
  appt: Appointment;
  expanded: boolean;
  onToggle: () => void;
  onStatus: (id: string, status: string) => Promise<void>;
  actionLoading: string | null;
}) {
  const style = STATUS_STYLES[appt.status] ?? STATUS_STYLES.PENDING;
  const cancelled = appt.status === "CANCELLED";

  return (
    <div
      className={`bg-white rounded-2xl border transition-all ${
        expanded ? "border-orange-300 shadow-md" : "border-gray-200 shadow-sm"
      } ${cancelled ? "opacity-60" : ""}`}
    >
      {/* Ligne principale — tap pour expand */}
      <button onClick={onToggle} className="w-full text-left p-4">
        <div className="flex items-start gap-3">
          {/* Heure */}
          <div className="flex-shrink-0 text-center pt-0.5">
            <p className="font-black text-gray-900 text-lg leading-none">{appt.startTime}</p>
            <p className="text-xs text-gray-400 mt-0.5">{appt.endTime}</p>
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-bold text-gray-900 text-sm">{appt.customerName}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${style.bg} ${style.text}`}>
                {style.label}
              </span>
              {appt.source === "ONLINE" && (
                <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 font-semibold">
                  En ligne
                </span>
              )}
            </div>
            {(appt.vehicleMake || appt.serviceName) && (
              <p className="text-xs text-gray-500 mt-0.5 truncate">
                {[appt.vehicleYear, appt.vehicleMake, appt.vehicleModel].filter(Boolean).join(" ")}
                {appt.vehicleMake && appt.serviceName ? " · " : ""}
                {appt.serviceName}
              </p>
            )}
          </div>

          {/* Chevron */}
          <span className={`text-gray-400 transition-transform flex-shrink-0 ${expanded ? "rotate-180" : ""}`}>
            ▾
          </span>
        </div>
      </button>

      {/* Détails expandés */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-3">
          {/* Contact */}
          <div className="flex items-center gap-2 flex-wrap">
            <a
              href={`tel:${appt.customerPhone}`}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-50 border border-green-200 text-green-700 font-semibold text-sm active:bg-green-100"
            >
              📞 {appt.customerPhone}
            </a>
            {appt.customerEmail && (
              <a
                href={`mailto:${appt.customerEmail}`}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-700 font-semibold text-sm truncate max-w-[180px]"
              >
                ✉️ {appt.customerEmail}
              </a>
            )}
          </div>

          {/* Notes */}
          {appt.notes && (
            <p className="text-xs text-gray-600 bg-gray-50 rounded-xl px-3 py-2 border border-gray-100">
              📝 {appt.notes}
            </p>
          )}

          {/* Actions */}
          {!cancelled && (
            <div className="flex gap-2 flex-wrap pt-1">
              {appt.status === "PENDING" && (
                <ActionBtn
                  label="✓ Confirmer"
                  color="blue"
                  loading={actionLoading === appt.id + "CONFIRMED"}
                  onClick={() => onStatus(appt.id, "CONFIRMED")}
                />
              )}
              {(appt.status === "PENDING" || appt.status === "CONFIRMED") && (
                <ActionBtn
                  label="✓ Complété"
                  color="green"
                  loading={actionLoading === appt.id + "COMPLETED"}
                  onClick={() => onStatus(appt.id, "COMPLETED")}
                />
              )}
              {appt.status !== "COMPLETED" && (
                <ActionBtn
                  label="Annuler"
                  color="red"
                  loading={actionLoading === appt.id + "CANCELLED"}
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

function ActionBtn({
  label,
  color,
  loading,
  onClick,
}: {
  label: string;
  color: "blue" | "green" | "red";
  loading: boolean;
  onClick: () => void;
}) {
  const colors = {
    blue:  "bg-blue-600 hover:bg-blue-700 active:bg-blue-800",
    green: "bg-green-600 hover:bg-green-700 active:bg-green-800",
    red:   "bg-red-500 hover:bg-red-600 active:bg-red-700",
  };
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-colors disabled:opacity-50 ${colors[color]}`}
    >
      {loading ? "..." : label}
    </button>
  );
}
