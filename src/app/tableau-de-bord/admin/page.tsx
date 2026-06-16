"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type Tab = "alertes" | "descriptions" | "suggestions";

interface GarageAlert {
  id: string;
  type: string;
  message: string;
  avgRating: number | null;
  reviewCount: number | null;
  isRead: boolean;
  emailSent: boolean;
  createdAt: string;
  garage: { name: string; slug: string; city: string };
}

interface PendingGarage {
  id: string; name: string; slug: string; city: string;
  description: string | null; descriptionDraft: string | null;
  updatedAt: string;
  owner: { name: string | null; email: string | null };
}

interface Suggestion {
  id: string; content: string; authorName: string | null; authorEmail: string | null;
  status: string; adminNote: string | null; createdAt: string;
}

const STATUS_BADGE: Record<string, { label: string; bg: string; color: string }> = {
  PENDING: { label: "En attente", bg: "#fef3c7", color: "#92400e" },
  READ:    { label: "Lu",          bg: "#dbeafe", color: "#1e40af" },
  DONE:    { label: "Traité",      bg: "#dcfce7", color: "#166534" },
};

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [tab, setTab]               = useState<Tab>("alertes");
  const [garages, setGarages]       = useState<PendingGarage[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [alerts, setAlerts]         = useState<GarageAlert[]>([]);
  const [loading, setLoading]       = useState(true);
  const [actionId, setActionId]     = useState<string | null>(null);
  const [noteEdit, setNoteEdit]     = useState<Record<string, string>>({});
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  // Auth guard
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

  const loadAlerts = useCallback(async () => {
    const r = await fetch("/api/admin/alerts");
    if (r.ok) setAlerts(await r.json());
  }, []);

  useEffect(() => {
    if (status !== "authenticated") return;
    setLoading(true);
    Promise.all([loadDescriptions(), loadSuggestions(), loadAlerts()]).finally(() => setLoading(false));
  }, [status, loadDescriptions, loadSuggestions, loadAlerts]);

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

  async function updateSuggestion(id: string, update: Partial<{ status: string; adminNote: string }>) {
    setActionId(id);
    await fetch(`/api/admin/suggestions/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(update),
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

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Administration</h1>
          <p className="text-gray-500 text-sm">Modération des descriptions et des suggestions</p>
        </div>
        <Link href="/tableau-de-bord/garage"
          className="text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium">
          ← Tableau de bord
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 w-fit">
        {([
          { id: "alertes",      label: "Alertes qualité", icon: "🚨", count: alerts.filter(a => !a.isRead).length, urgent: true },
          { id: "descriptions", label: "Descriptions",    icon: "📝", count: garages.length, urgent: false },
          { id: "suggestions",  label: "Suggestions",     icon: "💡", count: suggestions.filter(s => s.status === "PENDING").length, urgent: false },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${tab === t.id ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>
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

      {/* ── ALERTES TAB ──────────────────────────────────────────────────── */}
      {tab === "alertes" && (() => {
        const TYPE_META: Record<string, { label: string; color: string; bg: string; border: string }> = {
          ONE_STAR:  { label: "Avis 1 étoile",              color: "#b91c1c", bg: "#fff1f2", border: "#fecdd3" },
          LOW_RATING:{ label: "Note moyenne sous 3/5",      color: "#92400e", bg: "#fffbeb", border: "#fde68a" },
          BAD_STREAK:{ label: "Série de mauvais avis",      color: "#7c2d12", bg: "#fff7ed", border: "#fdba74" },
        };
        const unread = alerts.filter(a => !a.isRead);
        const read   = alerts.filter(a => a.isRead);

        return (
          <div className="space-y-4">
            {/* Actions groupées */}
            {unread.length > 0 && (
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-700">
                  {unread.length} alerte{unread.length > 1 ? "s" : ""} non lue{unread.length > 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => markAlertsRead(unread.map(a => a.id))}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 font-medium"
                >
                  ✓ Tout marquer comme lu
                </button>
              </div>
            )}

            {alerts.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
                <div className="text-4xl mb-3">✅</div>
                <p className="font-semibold text-gray-900">Aucune alerte qualité</p>
                <p className="text-gray-400 text-sm mt-1">Tous les garages ont de bonnes notes.</p>
              </div>
            )}

            {/* Alertes non lues */}
            {unread.map(a => {
              const m = TYPE_META[a.type] ?? { label: a.type, color: "#374151", bg: "#f9fafb", border: "#e5e7eb" };
              return (
                <div key={a.id} className="rounded-2xl border-2 shadow-sm overflow-hidden"
                  style={{ borderColor: m.border, background: m.bg }}>
                  <div className="px-5 py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: m.color, color: "#fff" }}>{m.label}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(a.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </span>
                          {a.emailSent && <span className="text-xs text-gray-400">· ✉️ courriel envoyé</span>}
                        </div>
                        <p className="font-bold text-gray-900 text-sm">{a.garage.name}
                          <span className="font-normal text-gray-400 text-xs ml-2">{a.garage.city}</span>
                        </p>
                        <p className="text-sm text-gray-600 mt-0.5">{a.message}</p>
                        {a.avgRating != null && (
                          <div className="mt-2 flex items-center gap-3">
                            <span className="text-sm font-bold" style={{ color: m.color }}>
                              {"★".repeat(Math.round(a.avgRating))}{"☆".repeat(5 - Math.round(a.avgRating))}
                            </span>
                            <span className="text-xs text-gray-500">{a.avgRating.toFixed(1)}/5 · {a.reviewCount} avis</span>
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <Link href={`/garage/${a.garage.slug}`} target="_blank"
                          className="text-xs px-3 py-1.5 rounded-lg border font-semibold text-center"
                          style={{ borderColor: m.border, color: m.color }}>
                          Voir profil ↗
                        </Link>
                        <button onClick={() => markAlertsRead([a.id])}
                          className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-white font-medium">
                          ✓ Lu
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Alertes lues (section repliable) */}
            {read.length > 0 && (
              <details className="group">
                <summary className="cursor-pointer text-xs text-gray-400 font-medium py-2 select-none">
                  {read.length} alerte{read.length > 1 ? "s" : ""} archivée{read.length > 1 ? "s" : ""} ▾
                </summary>
                <div className="mt-2 space-y-2">
                  {read.map(a => {
                    const m = TYPE_META[a.type] ?? { label: a.type, color: "#374151", bg: "#f9fafb", border: "#e5e7eb" };
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
        );
      })()}

      {/* ── DESCRIPTIONS TAB ─────────────────────────────────────────────── */}
      {tab === "descriptions" && (
        <div className="space-y-4">
          {garages.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-12 text-center">
              <div className="text-4xl mb-3">✅</div>
              <p className="font-semibold text-gray-900">Aucune description en attente</p>
              <p className="text-gray-400 text-sm mt-1">Tout est à jour.</p>
            </div>
          ) : garages.map(g => (
            <div key={g.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              {/* Garage info */}
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-0.5">
                    <h2 className="font-bold text-gray-900">{g.name}</h2>
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full font-semibold">En attente</span>
                  </div>
                  <p className="text-xs text-gray-400">{g.city} · {g.owner.email}</p>
                </div>
                <Link href={`/garage/${g.slug}`} target="_blank"
                  className="text-xs text-orange-500 hover:underline flex-shrink-0">
                  Voir le profil ↗
                </Link>
              </div>

              {/* Side by side: current vs draft */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                <div className="rounded-xl p-4 bg-gray-50 border border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Description actuelle (approuvée)</p>
                  <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {g.description || <em className="text-gray-400">Aucune description approuvée</em>}
                  </p>
                </div>
                <div className="rounded-xl p-4 border-2 border-orange-200 bg-orange-50">
                  <p className="text-xs font-bold text-orange-600 uppercase tracking-wide mb-2">Nouvelle description (brouillon)</p>
                  <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
                    {g.descriptionDraft || <em className="text-gray-400">Vide</em>}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => handleDescription(g.id, "approve")}
                  disabled={actionId === g.id}
                  className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold text-white disabled:opacity-50 transition-opacity"
                  style={{ background: "#16a34a" }}>
                  ✓ Approuver
                </button>
                <button onClick={() => handleDescription(g.id, "reject")}
                  disabled={actionId === g.id}
                  className="flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-semibold border border-red-200 text-red-600 hover:bg-red-50 disabled:opacity-50">
                  ✗ Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── SUGGESTIONS TAB ──────────────────────────────────────────────── */}
      {tab === "suggestions" && (
        <div className="space-y-4">
          {/* Filter chips */}
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
          ) : filteredSuggestions.map(s => {
            const badge = STATUS_BADGE[s.status] ?? STATUS_BADGE.PENDING;
            const dateStr = new Date(s.createdAt).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });
            return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
                {/* Header */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs px-2.5 py-1 rounded-full font-semibold"
                      style={{ background: badge.bg, color: badge.color }}>
                      {badge.label}
                    </span>
                    <span className="text-xs text-gray-400">{dateStr}</span>
                    {s.authorName && <span className="text-xs font-medium text-gray-600">{s.authorName}</span>}
                    {s.authorEmail && <span className="text-xs text-gray-400">{s.authorEmail}</span>}
                  </div>
                  {/* Quick status buttons */}
                  <div className="flex gap-1 flex-shrink-0">
                    {s.status !== "READ" && (
                      <button onClick={() => updateSuggestion(s.id, { status: "READ" })}
                        disabled={actionId === s.id}
                        className="text-xs px-2.5 py-1 rounded-lg border border-blue-200 text-blue-600 hover:bg-blue-50 font-medium disabled:opacity-50">
                        Lu
                      </button>
                    )}
                    {s.status !== "DONE" && (
                      <button onClick={() => updateSuggestion(s.id, { status: "DONE" })}
                        disabled={actionId === s.id}
                        className="text-xs px-2.5 py-1 rounded-lg border border-green-200 text-green-600 hover:bg-green-50 font-medium disabled:opacity-50">
                        Traité
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap mb-4 bg-gray-50 rounded-xl p-4">
                  {s.content}
                </p>

                {/* Admin note */}
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-1">Note interne (optionnelle)</p>
                  <div className="flex gap-2">
                    <input type="text"
                      className="flex-1 text-xs border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:border-orange-400"
                      placeholder="Ajouter une note…"
                      value={noteEdit[s.id] ?? (s.adminNote || "")}
                      onChange={e => setNoteEdit(n => ({ ...n, [s.id]: e.target.value }))}
                    />
                    <button
                      onClick={() => updateSuggestion(s.id, { adminNote: noteEdit[s.id] ?? s.adminNote ?? "" })}
                      disabled={actionId === s.id}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50">
                      Sauvegarder
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
