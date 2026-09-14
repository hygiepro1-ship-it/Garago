"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = "apercu" | "garages" | "alertes" | "descriptions" | "verification" | "suggestions" | "maintenance";

interface GarageAlert {
  id: string; type: string; message: string;
  avgRating: number | null; reviewCount: number | null;
  isRead: boolean; emailSent: boolean; createdAt: string;
  garage: { name: string; slug: string; city: string };
}

interface PendingGarage {
  id: string; name: string; slug: string; city: string;
  description: string | null; descriptionDraft: string | null;
  updatedAt: string;
  owner: { name: string | null; email: string | null };
}

interface AdminStats {
  users: { totalDrivers: number; newDrivers30d: number };
  garages: {
    total: number; new30d: number;
    byStatus: Record<string, number>; byVerification: Record<string, number>;
    noServices: number; noReviews: number;
    byCity: { city: string; count: number }[];
  };
  revenue: { mrr: number; activeMonthly: number; activeAnnual: number; activeBranches: number; trialConversionRate: number | null };
  marketplace: {
    totalAppointments: number; appointments30d: number; appointmentsByStatus30d: Record<string, number>;
    totalReviews: number; avgRating: number | null;
    topGarages: { id: string; name: string; slug: string; city: string; subscriptionStatus: string; appointmentCount: number; reviewCount: number }[];
    leastActiveGarages: { id: string; name: string; slug: string; city: string; phone: string; subscriptionStatus: string; createdAt: string; ownerName: string | null; ownerEmail: string | null; appointmentCount: number; reviewCount: number }[];
  };
  referral: { totalAmbassadors: number; totalReferrals: number; totalCommission: number };
  traffic: { visitors30d: number; visitors7d: number; newSignups30d: number; visitorConversionRate: number | null };
  queues: { unreadAlerts: number; pendingVerifications: number; pendingDescriptions: number; pendingSuggestions: number };
}

interface AdminGarage {
  id: string; name: string; slug: string; city: string | null; province: string | null;
  subscriptionStatus: string; verificationStatus: string; createdAt: string; isAmbassador: boolean;
  owner: { name: string | null; email: string | null };
  appointmentCount: number; reviewCount: number; serviceCount: number; branchCount: number;
  avgRating: number | null;
}

interface PendingVerificationGarage {
  id: string; name: string; slug: string; neq: string | null;
  address: string; city: string; postalCode: string; phone: string;
  createdAt: string;
  owner: { name: string | null; email: string | null };
}

interface Suggestion {
  id: string; content: string; authorName: string | null; authorEmail: string | null;
  status: string; adminNote: string | null; createdAt: string;
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: "En attente", bg: "#fef3c7", color: "#92400e" },
  READ:    { label: "Lu",          bg: "#dbeafe", color: "#1e40af" },
  DONE:    { label: "Traité",      bg: "#dcfce7", color: "#166534" },
};

const ALERT_TYPE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
  ONE_STAR:   { label: "Avis 1 étoile",         color: "#b91c1c", bg: "#fff1f2", border: "#fecdd3" },
  LOW_RATING: { label: "Note moyenne sous 3/5",  color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
  BAD_STREAK: { label: "Série de mauvais avis",  color: "#7c2d12", bg: "#fff7ed", border: "#fdba74" },
};

const FALLBACK_META = { label: "", color: "#374151", bg: "#f9fafb", border: "#e5e7eb" };

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
      <p className="text-2xl font-black text-gray-900">{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </div>
  );
}

function AlertCard({ alert, onMarkRead }: { alert: GarageAlert; onMarkRead: (id: string) => void }) {
  const m = ALERT_TYPE_META[alert.type] ?? { ...FALLBACK_META, label: alert.type };
  return (
    <div className="rounded-2xl border-2 shadow-sm overflow-hidden" style={{ borderColor: m.border, background: m.bg }}>
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                style={{ background: m.color, color: "#fff" }}>{m.label}</span>
              <span className="text-xs text-gray-400">
                {new Date(alert.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
              </span>
              {alert.emailSent && <span className="text-xs text-gray-400">· ✉️ courriel envoyé</span>}
            </div>
            <p className="font-bold text-gray-900 text-sm">
              {alert.garage.name}
              <span className="font-normal text-gray-400 text-xs ml-2">{alert.garage.city}</span>
            </p>
            <p className="text-sm text-gray-600 mt-0.5">{alert.message}</p>
            {alert.avgRating != null && (
              <div className="mt-2 flex items-center gap-3">
                <span className="text-sm font-bold" style={{ color: m.color }}>
                  {"★".repeat(Math.round(alert.avgRating))}{"☆".repeat(5 - Math.round(alert.avgRating))}
                </span>
                <span className="text-xs text-gray-500">{alert.avgRating.toFixed(1)}/5 · {alert.reviewCount} avis</span>
              </div>
            )}
          </div>
          <div className="flex flex-col gap-2 flex-shrink-0">
            <Link href={`/garage/${alert.garage.slug}`} target="_blank"
              className="text-xs px-3 py-1.5 rounded-lg border font-semibold text-center"
              style={{ borderColor: m.border, color: m.color }}>
              Voir profil ↗
            </Link>
            <button onClick={() => onMarkRead(alert.id)}
              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white font-medium">
              ✓ Lu
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DescriptionCard({
  garage, actionId, onAction,
}: {
  garage: PendingGarage;
  actionId: string | null;
  onAction: (id: string, action: "approve" | "reject") => void;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="font-bold text-gray-900">{garage.name}</h2>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">En attente</span>
          </div>
          <p className="text-xs text-gray-400">{garage.city} · {garage.owner.email}</p>
        </div>
        <Link href={`/garage/${garage.slug}`} target="_blank"
          className="text-xs text-orange-500 hover:underline flex-shrink-0">
          Voir le profil ↗
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description actuelle (approuvée)</p>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {garage.description || <em className="text-gray-400">Aucune description approuvée</em>}
          </p>
        </div>
        <div className="rounded-xl p-4 border-2 border-orange-200 bg-orange-50">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-2">Nouvelle description (brouillon)</p>
          <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
            {garage.descriptionDraft || <em className="text-gray-400">Vide</em>}
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => onAction(garage.id, "approve")} disabled={actionId === garage.id}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold text-white disabled:opacity-50 transition-opacity"
          style={{ background: "#16a34a" }}>
          ✓ Approuver
        </button>
        <button onClick={() => onAction(garage.id, "reject")} disabled={actionId === garage.id}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
          ✗ Refuser
        </button>
      </div>
    </div>
  );
}

function VerificationCard({
  garage, actionId, onAction,
}: {
  garage: PendingVerificationGarage;
  actionId: string | null;
  onAction: (id: string, action: "approve" | "reject") => void;
}) {
  const reqUrl = "https://www.registreentreprises.gouv.qc.ca/fr/consulter/rechercher/default.aspx";
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="font-bold text-gray-900">{garage.name}</h2>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">En attente</span>
          </div>
          <p className="text-xs text-gray-400">{garage.owner.name} · {garage.owner.email}</p>
        </div>
        <Link href={`/garage/${garage.slug}`} target="_blank"
          className="text-xs text-orange-500 hover:underline flex-shrink-0">
          Voir le profil ↗
        </Link>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Adresse</p>
          <p className="text-sm text-gray-700 leading-relaxed">
            {garage.address}, {garage.city} {garage.postalCode}<br />{garage.phone}
          </p>
        </div>
        <div className="rounded-xl p-4 border-2 border-orange-200 bg-orange-50">
          <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-2">NEQ</p>
          <p className="text-lg font-mono font-bold text-gray-900 mb-2 select-all">{garage.neq}</p>
          <a href={reqUrl} target="_blank" rel="noopener noreferrer"
            className="text-xs text-orange-600 hover:underline font-semibold">
            Rechercher au Registre des entreprises ↗
          </a>
        </div>
      </div>

      <div className="flex gap-2">
        <button onClick={() => onAction(garage.id, "approve")} disabled={actionId === garage.id}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold text-white disabled:opacity-50 transition-opacity"
          style={{ background: "#16a34a" }}>
          ✓ Approuver
        </button>
        <button onClick={() => onAction(garage.id, "reject")} disabled={actionId === garage.id}
          className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
          ✗ Refuser
        </button>
      </div>
    </div>
  );
}

function SuggestionCard({
  suggestion, actionId, noteEdit, onNoteChange, onUpdate,
}: {
  suggestion: Suggestion;
  actionId:   string | null;
  noteEdit:   Record<string, string>;
  onNoteChange: (id: string, val: string) => void;
  onUpdate: (id: string, patch: Partial<{ status: string; adminNote: string }>) => void;
}) {
  const badge   = STATUS_BADGE[suggestion.status] ?? STATUS_BADGE.PENDING;
  const dateStr = new Date(suggestion.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
            style={{ background: badge.bg, color: badge.color }}>{badge.label}</span>
          <span className="text-xs text-gray-400">{dateStr}</span>
          {suggestion.authorName  && <span className="text-xs font-medium text-gray-600">{suggestion.authorName}</span>}
          {suggestion.authorEmail && <span className="text-xs text-gray-400">{suggestion.authorEmail}</span>}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {suggestion.status !== "READ" && (
            <button onClick={() => onUpdate(suggestion.id, { status: "READ" })} disabled={actionId === suggestion.id}
              className="text-xs px-2.5 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium disabled:opacity-50">
              Lu
            </button>
          )}
          {suggestion.status !== "DONE" && (
            <button onClick={() => onUpdate(suggestion.id, { status: "DONE" })} disabled={actionId === suggestion.id}
              className="text-xs px-2.5 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 font-medium disabled:opacity-50">
              Traité
            </button>
          )}
        </div>
      </div>

      <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-4 bg-gray-50 rounded-xl p-4">
        {suggestion.content}
      </p>

      <div>
        <p className="text-xs font-semibold text-gray-500 mb-1">Note interne (optionnelle)</p>
        <div className="flex gap-2">
          <input type="text"
            className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-orange-400"
            placeholder="Ajouter une note…"
            value={noteEdit[suggestion.id] ?? (suggestion.adminNote || "")}
            onChange={e => onNoteChange(suggestion.id, e.target.value)}
          />
          <button
            onClick={() => onUpdate(suggestion.id, { adminNote: noteEdit[suggestion.id] ?? suggestion.adminNote ?? "" })}
            disabled={actionId === suggestion.id}
            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [tab,           setTab]           = useState<Tab>("apercu");
  const [garages,       setGarages]       = useState<PendingGarage[]>([]);
  const [verifications, setVerifications] = useState<PendingVerificationGarage[]>([]);
  const [suggestions,  setSuggestions]  = useState<Suggestion[]>([]);
  const [alerts,       setAlerts]       = useState<GarageAlert[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [actionId,     setActionId]     = useState<string | null>(null);
  const [noteEdit,     setNoteEdit]     = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // ── Vue d'ensemble + liste complète des garages ───────────────────────────
  const [stats,        setStats]        = useState<AdminStats | null>(null);
  const [allGarages,   setAllGarages]   = useState<AdminGarage[]>([]);
  const [garageFilter, setGarageFilter] = useState<string>("ALL");
  const [garageSearch, setGarageSearch] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState("");

  async function handleDeleteGarage(id: string) {
    setDeletingId(id);
    setDeleteError("");
    const res = await fetch(`/api/admin/garages/${id}`, { method: "DELETE" });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setDeleteError(data.error ?? "Erreur lors de la suppression.");
      setDeletingId(null);
      return;
    }
    setAllGarages(prev => prev.filter(g => g.id !== id));
    setConfirmDeleteId(null);
    setDeletingId(null);
  }

  // ── Mode maintenance ──────────────────────────────────────────────────────
  const [maintMode,    setMaintMode]    = useState(false);
  const [maintMessage, setMaintMessage] = useState("");
  const [maintUntil,   setMaintUntil]   = useState(""); // datetime-local
  const [maintSaving,  setMaintSaving]  = useState(false);
  const [maintSaved,   setMaintSaved]   = useState(false);
  const [maintLoaded,  setMaintLoaded]  = useState(false);

  const loadMaintenance = useCallback(async () => {
    const r = await fetch("/api/admin/maintenance");
    if (r.ok) {
      const d = await r.json();
      setMaintMode(!!d.maintenanceMode);
      setMaintMessage(d.maintenanceMessage ?? "");
      setMaintUntil(d.maintenanceUntil ? new Date(d.maintenanceUntil).toISOString().slice(0, 16) : "");
    }
    setMaintLoaded(true);
  }, []);

  async function saveMaintenance(next: { maintenanceMode: boolean }) {
    setMaintSaving(true);
    setMaintSaved(false);
    const res = await fetch("/api/admin/maintenance", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        maintenanceMode: next.maintenanceMode,
        maintenanceMessage: maintMessage,
        maintenanceUntil: maintUntil || null,
      }),
    });
    if (res.ok) {
      setMaintMode(next.maintenanceMode);
      setMaintSaved(true);
      setTimeout(() => setMaintSaved(false), 3000);
    }
    setMaintSaving(false);
  }

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/connexion");
    else if (status === "authenticated" && (session?.user as any)?.role !== "ADMIN")
      router.replace("/tableau-de-bord");
  }, [status, session, router]);

  const loadDescriptions = useCallback(async () => {
    const r = await fetch("/api/admin/descriptions");
    if (r.ok) setGarages(await r.json());
  }, []);

  const loadSuggestions = useCallback(async () => {
    const r = await fetch("/api/admin/suggestions");
    if (r.ok) setSuggestions(await r.json());
  }, []);

  const loadVerifications = useCallback(async () => {
    const r = await fetch("/api/admin/garages/pending");
    if (r.ok) setVerifications(await r.json());
  }, []);

  const loadStats = useCallback(async () => {
    const r = await fetch("/api/admin/stats");
    if (r.ok) setStats(await r.json());
  }, []);

  const loadAllGarages = useCallback(async () => {
    const r = await fetch("/api/admin/garages");
    if (r.ok) setAllGarages(await r.json());
  }, []);

  const loadAlerts = useCallback(async () => {
    const r = await fetch("/api/admin/alerts");
    if (r.ok) setAlerts(await r.json());
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    Promise.all([loadStats(), loadAllGarages(), loadDescriptions(), loadVerifications(), loadSuggestions(), loadAlerts(), loadMaintenance()]).finally(() => setLoading(false));
  }, [status, loadStats, loadAllGarages, loadDescriptions, loadVerifications, loadSuggestions, loadAlerts, loadMaintenance]);

  async function markAlertsRead(ids: string[]) {
    await fetch("/api/admin/alerts", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids, isRead: true }),
    });
    setAlerts(prev => prev.map(a => ids.includes(a.id) ? { ...a, isRead: true } : a));
  }

  async function handleDescription(garageId: string, action: "approve" | "reject") {
    setActionId(garageId);
    await fetch(`/api/admin/descriptions/${garageId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await loadDescriptions();
    setActionId(null);
  }

  async function handleVerification(garageId: string, action: "approve" | "reject") {
    setActionId(garageId);
    await fetch(`/api/admin/garages/${garageId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    await loadVerifications();
    setActionId(null);
  }

  async function updateSuggestion(id: string, patch: Partial<{ status: string; adminNote: string }>) {
    setActionId(id);
    await fetch(`/api/admin/suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
    await loadSuggestions();
    setActionId(null);
  }

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#f8fafc" }}>
        <svg className="w-6 h-6 animate-spin text-orange-400" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
        </svg>
      </div>
    );
  }

  const filteredSuggestions = filterStatus === "ALL"
    ? suggestions
    : suggestions.filter(s => s.status === filterStatus);

  const unreadAlerts = alerts.filter(a => !a.isRead);
  const readAlerts   = alerts.filter(a =>  a.isRead);

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 py-4 sm:py-8">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-4 sm:mb-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">Administration</h1>
          <p className="text-gray-500 text-xs sm:text-sm">Modération des descriptions et des suggestions</p>
        </div>
        <Link href="/tableau-de-bord/garage"
          className="text-xs sm:text-sm px-3 sm:px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium flex-shrink-0">
          ← Tableau de bord
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-4 sm:mb-6 overflow-x-auto">
        {([
          { id: "apercu",       label: "Vue d'ensemble",  icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/></svg>, count: 0,                                                    urgent: false },
          { id: "garages",      label: "Garages",         icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M3 21V8l9-5 9 5v13"/><path d="M9 21v-6h6v6"/></svg>, count: allGarages.length,                                     urgent: false },
          { id: "alertes",      label: "Alertes qualité", icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>, count: unreadAlerts.length,                                 urgent: true  },
          { id: "descriptions", label: "Descriptions",    icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="8" y1="7" x2="16" y2="7"/><line x1="8" y1="11" x2="16" y2="11"/><line x1="8" y1="15" x2="12" y2="15"/></svg>, count: garages.length,                                      urgent: false },
          { id: "verification", label: "Vérifications",   icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/></svg>, count: verifications.length,                                  urgent: true  },
          { id: "suggestions",  label: "Suggestions",     icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M9 18h6M10 22h4M12 2a7 7 0 00-4 12.9V17a2 2 0 002 2h4a2 2 0 002-2v-2.1A7 7 0 0012 2z"/></svg>, count: suggestions.filter(s => s.status === "PENDING").length, urgent: false },
          { id: "maintenance",  label: "Maintenance",     icon: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>, count: maintMode ? 1 : 0,                                    urgent: true  },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors whitespace-nowrap flex-shrink-0 ${tab === t.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
            {t.icon} {t.label}
            {t.count > 0 && (
              <span className="text-xs px-1.5 py-0.5 rounded-full font-bold text-white"
                style={{ background: t.urgent ? "#b91c1c" : "#f97316" }}>
                {t.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── VUE D'ENSEMBLE ── */}
      {tab === "apercu" && stats && (
        <div className="space-y-6">
          {/* KPI principaux */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Conducteurs inscrits" value={stats.users.totalDrivers} sub={`+${stats.users.newDrivers30d} (30j)`} />
            <StatCard label="Garages inscrits" value={stats.garages.total} sub={`+${stats.garages.new30d} (30j)`} />
            <StatCard label="Visiteurs (30j)" value={stats.traffic.visitors30d} sub={`${stats.traffic.visitors7d} cette semaine`} />
            <StatCard label="Revenu récurrent estimé" value={`${stats.revenue.mrr.toLocaleString("fr-CA", { minimumFractionDigits: 0 })} $/mois`} sub="MRR" />
          </div>

          {/* Entonnoir d'acquisition */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 mb-1">Entonnoir d'acquisition (30 derniers jours)</h2>
            <p className="text-xs text-gray-400 mb-4">Visiteurs anonymes qui naviguent le site vs ceux qui créent un compte.</p>
            <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center sm:gap-6">
              <div>
                <p className="text-2xl sm:text-3xl font-black text-gray-900">{stats.traffic.visitors30d}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide font-semibold">Visiteurs</p>
              </div>
              <div className="hidden sm:block text-gray-300 text-2xl">→</div>
              <div>
                <p className="text-2xl sm:text-3xl font-black text-gray-900">{stats.traffic.newSignups30d}</p>
                <p className="text-[10px] sm:text-xs text-gray-400 uppercase tracking-wide font-semibold">Inscriptions</p>
              </div>
              <div className="hidden sm:block text-gray-300 text-2xl">=</div>
              <div>
                <p className="text-2xl sm:text-3xl font-black" style={{ color: "#f97316" }}>
                  {stats.traffic.visitorConversionRate !== null ? `${stats.traffic.visitorConversionRate.toFixed(1)}%` : "—"}
                </p>
                <p className="text-xs text-gray-400 uppercase tracking-wide font-semibold">Taux de conversion</p>
              </div>
            </div>
            {stats.traffic.visitors30d === 0 && (
              <p className="text-xs text-gray-400 mt-3">Le suivi des visiteurs vient d'être activé — ces chiffres se rempliront au fil des prochains jours.</p>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Statut des garages */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Garages par statut</h2>
              <div className="space-y-2">
                {[
                  { key: "TRIAL", label: "Essai", color: "#1d4ed8", bg: "#eff6ff" },
                  { key: "ACTIVE", label: "Actif", color: "#047857", bg: "#ecfdf5" },
                  { key: "PAST_DUE", label: "Paiement échoué", color: "#b91c1c", bg: "#fef2f2" },
                  { key: "EXPIRED", label: "Expiré", color: "#6b7280", bg: "#f9fafb" },
                ].map(s => (
                  <div key={s.key} className="flex items-center justify-between text-sm">
                    <span className="px-2.5 py-1 rounded-full font-semibold text-xs" style={{ background: s.bg, color: s.color }}>{s.label}</span>
                    <span className="font-bold text-gray-900">{stats.garages.byStatus[s.key] ?? 0}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between text-sm">
                <span className="text-gray-500">Taux de conversion essai → payant</span>
                <span className="font-bold text-gray-900">
                  {stats.revenue.trialConversionRate !== null ? `${stats.revenue.trialConversionRate.toFixed(0)}%` : "—"}
                </span>
              </div>
            </div>

            {/* Revenu détaillé */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Revenu récurrent (estimation)</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-gray-500">Abonnements mensuels actifs</span><span className="font-bold text-gray-900">{stats.revenue.activeMonthly}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Abonnements annuels actifs</span><span className="font-bold text-gray-900">{stats.revenue.activeAnnual}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Succursales facturées</span><span className="font-bold text-gray-900">{stats.revenue.activeBranches}</span></div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">Total estimé</span>
                <span className="text-xl font-black" style={{ color: "#f97316" }}>{stats.revenue.mrr.toLocaleString("fr-CA")} $/mois</span>
              </div>
              <p className="text-xs text-gray-400 mt-2">Basé sur les tarifs publics — le montant réel facturé vit dans Stripe.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Santé du marché */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Santé de la place de marché</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-gray-500">Rendez-vous (30 derniers jours)</span><span className="font-bold text-gray-900">{stats.marketplace.appointments30d}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Rendez-vous — total</span><span className="font-bold text-gray-900">{stats.marketplace.totalAppointments}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Avis clients — total</span><span className="font-bold text-gray-900">{stats.marketplace.totalReviews}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Note moyenne globale</span><span className="font-bold text-gray-900">{stats.marketplace.avgRating ? stats.marketplace.avgRating.toFixed(1) : "—"}/5</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Garages sans aucun service configuré</span><span className="font-bold text-red-600">{stats.garages.noServices}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Garages sans aucun avis</span><span className="font-bold text-gray-900">{stats.garages.noReviews}</span></div>
              </div>
            </div>

            {/* Garages par ville — utile pour cibler des campagnes */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-1">Garages par ville</h2>
              <p className="text-xs text-gray-400 mb-4">Repérez les villes sous-desservies pour cibler l'acquisition de garages, ou sur-desservies pour cibler des campagnes conducteurs.</p>
              {stats.garages.byCity.length === 0 ? (
                <p className="text-sm text-gray-400">Aucune donnée pour l'instant.</p>
              ) : (
                <div className="space-y-1.5">
                  {stats.garages.byCity.map(c => (
                    <div key={c.city} className="flex items-center gap-3 text-sm">
                      <span className="w-28 truncate text-gray-600">{c.city}</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                        <div className="h-2 rounded-full" style={{ width: `${(c.count / stats.garages.byCity[0].count) * 100}%`, background: "#f97316" }} />
                      </div>
                      <span className="w-6 text-right font-bold text-gray-900">{c.count}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Top garages */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Garages les plus actifs</h2>
              <div className="space-y-2">
                {stats.marketplace.topGarages.map((g, i) => (
                  <Link key={g.id} href={`/garage/${g.slug}`} target="_blank"
                    className="flex items-center justify-between text-sm rounded-xl px-3 py-2 hover:bg-gray-50">
                    <span className="flex items-center gap-2 min-w-0">
                      <span className="text-gray-300 font-bold w-4">{i + 1}</span>
                      <span className="font-semibold text-gray-800 truncate">{g.name}</span>
                      <span className="text-gray-400 text-xs flex-shrink-0">{g.city}</span>
                    </span>
                    <span className="font-bold text-gray-900 flex-shrink-0">{g.appointmentCount} RDV</span>
                  </Link>
                ))}
                {stats.marketplace.topGarages.length === 0 && <p className="text-sm text-gray-400">Aucun rendez-vous enregistré pour l'instant.</p>}
              </div>
            </div>

            {/* Garages les moins actifs — à recontacter */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-1">Garages les moins actifs</h2>
              <p className="text-xs text-gray-400 mb-4">Inscrits depuis 14 jours ou plus, encore en essai ou actifs, avec le moins de rendez-vous — à recontacter au besoin.</p>
              <div className="space-y-2">
                {stats.marketplace.leastActiveGarages.map(g => (
                  <div key={g.id} className="flex items-center justify-between text-sm rounded-xl px-3 py-2 hover:bg-gray-50 gap-2">
                    <Link href={`/garage/${g.slug}`} target="_blank" className="min-w-0">
                      <span className="font-semibold text-gray-800 truncate block">{g.name}</span>
                      <span className="text-gray-400 text-xs">{g.city} · {g.appointmentCount} RDV · inscrit le {new Date(g.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}</span>
                    </Link>
                    {g.ownerEmail && (
                      <a href={`mailto:${g.ownerEmail}`} className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-100 font-medium flex-shrink-0">
                        Contacter
                      </a>
                    )}
                  </div>
                ))}
                {stats.marketplace.leastActiveGarages.length === 0 && <p className="text-sm text-gray-400">Aucun garage établi depuis 14 jours ou plus pour l'instant.</p>}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Parrainage / Ambassadeurs */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 mb-4">Programme de parrainage</h2>
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between"><span className="text-gray-500">Garages ambassadeurs (palier 5)</span><span className="font-bold text-gray-900">{stats.referral.totalAmbassadors}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Total de parrainages réussis</span><span className="font-bold text-gray-900">{stats.referral.totalReferrals}</span></div>
                <div className="flex items-center justify-between"><span className="text-gray-500">Commissions cumulées</span><span className="font-bold text-gray-900">{stats.referral.totalCommission.toLocaleString("fr-CA")} $</span></div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-100">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">À traiter</p>
                <div className="flex flex-wrap gap-2">
                  {stats.queues.pendingVerifications > 0 && <button onClick={() => setTab("verification")} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#fef3c7", color: "#92400e" }}>{stats.queues.pendingVerifications} vérification(s)</button>}
                  {stats.queues.pendingDescriptions > 0 && <button onClick={() => setTab("descriptions")} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#fef3c7", color: "#92400e" }}>{stats.queues.pendingDescriptions} description(s)</button>}
                  {stats.queues.unreadAlerts > 0 && <button onClick={() => setTab("alertes")} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#fef2f2", color: "#b91c1c" }}>{stats.queues.unreadAlerts} alerte(s)</button>}
                  {stats.queues.pendingSuggestions > 0 && <button onClick={() => setTab("suggestions")} className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ background: "#eff6ff", color: "#1d4ed8" }}>{stats.queues.pendingSuggestions} suggestion(s)</button>}
                  {stats.queues.pendingVerifications + stats.queues.pendingDescriptions + stats.queues.unreadAlerts + stats.queues.pendingSuggestions === 0 && (
                    <span className="text-xs text-gray-400">Rien en attente — tout est à jour ✓</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── GARAGES (liste complète) ── */}
      {tab === "garages" && (
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-4">
            <input
              type="text" placeholder="Rechercher un garage, une ville…"
              value={garageSearch} onChange={(e) => setGarageSearch(e.target.value)}
              className="flex-1 min-w-[200px] border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-orange-400"
            />
            <select value={garageFilter} onChange={(e) => setGarageFilter(e.target.value)}
              className="border border-gray-200 rounded-xl px-3 py-2 text-sm bg-white">
              <option value="ALL">Tous les statuts</option>
              <option value="TRIAL">Essai</option>
              <option value="ACTIVE">Actif</option>
              <option value="PAST_DUE">Paiement échoué</option>
              <option value="EXPIRED">Expiré</option>
            </select>
          </div>

          {deleteError && (
            <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">{deleteError}</div>
          )}

          {(() => {
            const statusMeta: Record<string, { label: string; color: string; bg: string }> = {
              TRIAL:     { label: "Essai",            color: "#1d4ed8", bg: "#eff6ff" },
              ACTIVE:    { label: "Actif",            color: "#047857", bg: "#ecfdf5" },
              PAST_DUE:  { label: "Paiement échoué",  color: "#b91c1c", bg: "#fef2f2" },
              EXPIRED:   { label: "Expiré",           color: "#6b7280", bg: "#f9fafb" },
            };
            const vMeta: Record<string, { label: string; color: string; bg: string }> = {
              APPROVED: { label: "Vérifié",    color: "#047857", bg: "#ecfdf5" },
              PENDING:  { label: "En attente", color: "#92400e", bg: "#fef3c7" },
              REJECTED: { label: "Refusé",     color: "#b91c1c", bg: "#fef2f2" },
            };
            const filtered = allGarages
              .filter(g => garageFilter === "ALL" || g.subscriptionStatus === garageFilter)
              .filter(g => !garageSearch || `${g.name} ${g.city}`.toLowerCase().includes(garageSearch.toLowerCase()));

            return (
              <>
                {/* Mobile — cartes empilées */}
                <div className="sm:hidden space-y-3">
                  {filtered.map(g => {
                    const sm = statusMeta[g.subscriptionStatus] ?? { label: g.subscriptionStatus, color: "#374151", bg: "#f9fafb" };
                    const vm = vMeta[g.verificationStatus] ?? vMeta.PENDING;
                    return (
                      <div key={g.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Link href={`/garage/${g.slug}`} target="_blank" className="min-w-0">
                            <p className="font-bold text-gray-900 truncate">{g.name}{g.isAmbassador && " ★"}</p>
                            <p className="text-xs text-gray-400 truncate">{g.city} · {g.owner.email}</p>
                          </Link>
                        </div>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                          <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: vm.bg, color: vm.color }}>{vm.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                          <span>{g.avgRating ? `${g.avgRating}/5` : "—"} ({g.reviewCount} avis) · {g.appointmentCount} RDV</span>
                          <span>{new Date(g.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" })}</span>
                        </div>
                        {confirmDeleteId === g.id ? (
                          <div className="flex gap-2">
                            <button onClick={() => handleDeleteGarage(g.id)} disabled={deletingId === g.id}
                              className="flex-1 text-xs px-3 py-1.5 rounded-lg font-semibold text-white disabled:opacity-50" style={{ background: "#dc2626" }}>
                              {deletingId === g.id ? "Suppression…" : "Confirmer la suppression"}
                            </button>
                            <button onClick={() => setConfirmDeleteId(null)} disabled={deletingId === g.id}
                              className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 font-medium">
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button onClick={() => setConfirmDeleteId(g.id)}
                            className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium">
                            Supprimer
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-12">Aucun garage inscrit.</p>}
                </div>

                {/* Desktop — tableau */}
                <div className="hidden sm:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                          <th className="px-4 py-3 font-semibold">Garage</th>
                          <th className="px-4 py-3 font-semibold">Ville</th>
                          <th className="px-4 py-3 font-semibold">Statut</th>
                          <th className="px-4 py-3 font-semibold">Vérification</th>
                          <th className="px-4 py-3 font-semibold">Note</th>
                          <th className="px-4 py-3 font-semibold">RDV</th>
                          <th className="px-4 py-3 font-semibold">Inscrit</th>
                          <th className="px-4 py-3 font-semibold"></th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map(g => {
                          const sm = statusMeta[g.subscriptionStatus] ?? { label: g.subscriptionStatus, color: "#374151", bg: "#f9fafb" };
                          const vm = vMeta[g.verificationStatus] ?? vMeta.PENDING;
                          return (
                            <tr key={g.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="px-4 py-3">
                                <Link href={`/garage/${g.slug}`} target="_blank" className="font-semibold text-gray-900 hover:text-orange-500">
                                  {g.name}{g.isAmbassador && " ★"}
                                </Link>
                                <p className="text-xs text-gray-400">{g.owner.email}</p>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{g.city}</td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: sm.bg, color: sm.color }}>{sm.label}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className="px-2 py-0.5 rounded-full text-xs font-semibold" style={{ background: vm.bg, color: vm.color }}>{vm.label}</span>
                              </td>
                              <td className="px-4 py-3 text-gray-600">{g.avgRating ? `${g.avgRating}/5` : "—"} <span className="text-gray-300">({g.reviewCount})</span></td>
                              <td className="px-4 py-3 text-gray-600">{g.appointmentCount}</td>
                              <td className="px-4 py-3 text-gray-400 text-xs">{new Date(g.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "short", year: "numeric" })}</td>
                              <td className="px-4 py-3 text-right whitespace-nowrap">
                                {confirmDeleteId === g.id ? (
                                  <div className="flex items-center gap-1.5 justify-end">
                                    <button onClick={() => handleDeleteGarage(g.id)} disabled={deletingId === g.id}
                                      className="text-xs px-2.5 py-1 rounded-lg font-semibold text-white disabled:opacity-50" style={{ background: "#dc2626" }}>
                                      {deletingId === g.id ? "…" : "Confirmer"}
                                    </button>
                                    <button onClick={() => setConfirmDeleteId(null)} disabled={deletingId === g.id}
                                      className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 text-gray-600 font-medium">
                                      Annuler
                                    </button>
                                  </div>
                                ) : (
                                  <button onClick={() => setConfirmDeleteId(g.id)}
                                    className="text-xs px-2.5 py-1 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 font-medium">
                                    Supprimer
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {filtered.length === 0 && <p className="text-sm text-gray-400 text-center py-12">Aucun garage inscrit.</p>}
                </div>
              </>
            );
          })()}
        </div>
      )}

      {/* ── ALERTES ── */}
      {tab === "alertes" && (
        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4 text-xs text-blue-800 leading-relaxed">
            <p className="font-semibold mb-1">Quand une alerte se déclenche</p>
            <p><strong>Avis 1 étoile</strong> — dès qu'un garage reçoit un avis noté 1/5.</p>
            <p><strong>Note moyenne sous 3/5</strong> — une fois qu'un garage a au moins 5 avis, si sa moyenne passe sous 3,0/5.</p>
            <p><strong>Série de mauvais avis</strong> — 3 avis notés 2/5 ou moins reçus en moins de 30 jours.</p>
          </div>

          {unreadAlerts.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">
                {unreadAlerts.length} alerte{unreadAlerts.length > 1 ? "s" : ""} non lue{unreadAlerts.length > 1 ? "s" : ""}
              </p>
              <button onClick={() => markAlertsRead(unreadAlerts.map(a => a.id))}
                className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium">
                ✓ Tout marquer comme lu
              </button>
            </div>
          )}

          {alerts.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
              <svg className="w-10 h-10 mx-auto mb-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l2.5 2.5L16 9"/></svg>
              <p className="font-semibold text-gray-900">Aucune alerte qualité</p>
              <p className="text-gray-400 text-sm mt-1">Tous les garages ont de bonnes notes.</p>
            </div>
          )}

          {unreadAlerts.map(a => (
            <AlertCard key={a.id} alert={a} onMarkRead={(id) => markAlertsRead([id])} />
          ))}

          {readAlerts.length > 0 && (
            <details className="group">
              <summary className="cursor-pointer text-xs text-gray-400 font-medium py-2 select-none">
                {readAlerts.length} alerte{readAlerts.length > 1 ? "s" : ""} archivée{readAlerts.length > 1 ? "s" : ""} ▾
              </summary>
              <div className="mt-2 space-y-2">
                {readAlerts.map(a => {
                  const m = ALERT_TYPE_META[a.type] ?? { ...FALLBACK_META, label: a.type };
                  return (
                    <div key={a.id} className="rounded-xl border border-gray-200 bg-white px-4 py-3 opacity-60">
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <span className="text-xs font-semibold text-gray-500">{m.label} · </span>
                          <span className="text-xs font-bold text-gray-700">{a.garage.name}</span>
                          <span className="text-xs text-gray-400 ml-2">
                            {new Date(a.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}
                          </span>
                        </div>
                        {a.avgRating != null && (
                          <span className="text-xs text-gray-500">{a.avgRating.toFixed(1)}/5</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </details>
          )}
        </div>
      )}

      {/* ── DESCRIPTIONS ── */}
      {tab === "descriptions" && (
        <div className="space-y-4">
          {garages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
              <svg className="w-10 h-10 mx-auto mb-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l2.5 2.5L16 9"/></svg>
              <p className="font-semibold text-gray-900">Aucune description en attente</p>
              <p className="text-gray-400 text-sm mt-1">Tout est à jour.</p>
            </div>
          ) : garages.map(g => (
            <DescriptionCard key={g.id} garage={g} actionId={actionId} onAction={handleDescription} />
          ))}
        </div>
      )}

      {/* ── VÉRIFICATIONS ── */}
      {tab === "verification" && (
        <div className="space-y-4">
          {verifications.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
              <svg className="w-10 h-10 mx-auto mb-3 text-green-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 12l2.5 2.5L16 9"/></svg>
              <p className="font-semibold text-gray-900">Aucun garage en attente de vérification</p>
              <p className="text-gray-400 text-sm mt-1">Tout est à jour.</p>
            </div>
          ) : verifications.map(g => (
            <VerificationCard key={g.id} garage={g} actionId={actionId} onAction={handleVerification} />
          ))}
        </div>
      )}

      {/* ── SUGGESTIONS ── */}
      {tab === "suggestions" && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {["ALL", "PENDING", "READ", "DONE"].map(s => (
              <button key={s} onClick={() => setFilterStatus(s)}
                className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-colors ${filterStatus === s ? "text-orange-600 border-orange-300 bg-orange-50" : "text-gray-500 border-gray-200 hover:bg-gray-50"}`}>
                {s === "ALL" ? `Toutes (${suggestions.length})` : `${STATUS_BADGE[s]?.label} (${suggestions.filter(x => x.status === s).length})`}
              </button>
            ))}
          </div>

          {filteredSuggestions.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="text-4xl mb-3">💡</div>
              <p className="font-semibold text-gray-900">Aucune suggestion</p>
              <p className="text-gray-400 text-sm mt-1">Rien à afficher pour ce filtre.</p>
            </div>
          ) : filteredSuggestions.map(s => (
            <SuggestionCard key={s.id} suggestion={s} actionId={actionId}
              noteEdit={noteEdit}
              onNoteChange={(id, val) => setNoteEdit(n => ({ ...n, [id]: val }))}
              onUpdate={updateSuggestion}
            />
          ))}
        </div>
      )}

      {/* ── MAINTENANCE ── */}
      {tab === "maintenance" && (
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border shadow-sm p-6" style={{ borderColor: maintMode ? "#fecaca" : "#e5e7eb" }}>
            <div className="flex items-center justify-between gap-4 mb-1">
              <h2 className="font-bold text-gray-900 text-lg">Mode maintenance</h2>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={
                maintMode ? { background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }
                          : { background: "#ecfdf5", color: "#047857", border: "1px solid #6ee7b7" }
              }>
                {maintMode ? "En maintenance" : "Site en ligne"}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-5">
              Quand il est activé, tous les visiteurs (conducteurs et garages) voient une page de maintenance.
              Vous restez capable de vous connecter et d'accéder à cette page pour le désactiver.
            </p>

            <div className="space-y-4 max-w-xl">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Message affiché aux visiteurs</label>
                <textarea rows={3}
                  className="block w-full border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  placeholder="Le site est actuellement en maintenance. Nous serons de retour très bientôt."
                  value={maintMessage} onChange={(e) => setMaintMessage(e.target.value)} maxLength={500} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Retour prévu (optionnel)</label>
                <input type="datetime-local" value={maintUntil} onChange={(e) => setMaintUntil(e.target.value)}
                  className="border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400" />
              </div>

              <div className="flex items-center gap-3 pt-2">
                {maintMode ? (
                  <button onClick={() => saveMaintenance({ maintenanceMode: false })} disabled={maintSaving || !maintLoaded}
                    className="text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50" style={{ background: "#059669" }}>
                    {maintSaving ? "…" : "Désactiver la maintenance"}
                  </button>
                ) : (
                  <button onClick={() => saveMaintenance({ maintenanceMode: true })} disabled={maintSaving || !maintLoaded}
                    className="text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-50" style={{ background: "#b91c1c" }}>
                    {maintSaving ? "…" : "Activer la maintenance"}
                  </button>
                )}
                <button onClick={() => saveMaintenance({ maintenanceMode: maintMode })} disabled={maintSaving || !maintLoaded}
                  className="text-sm font-semibold text-gray-600 border border-gray-300 rounded-xl px-4 py-2.5 hover:bg-gray-50 disabled:opacity-50">
                  Enregistrer le message
                </button>
                {maintSaved && <span className="text-sm font-semibold text-green-600">Enregistré ✓</span>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
