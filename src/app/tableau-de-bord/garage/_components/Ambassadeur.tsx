"use client";

// Extrait de src/app/tableau-de-bord/garage/page.tsx (découpage du tableau de bord du garage).

import { useTr } from "@/lib/dashboard-en";
import { Garage } from "../_lib/dashboard";

export const AMBASSADOR_PALIERS = [
  { seuil: 3,  label: "Statistiques avancées" },
  { seuil: 6,  label: "−10% sur votre prochaine facture" },
  { seuil: 10, label: "−20% sur votre prochaine facture" },
  { seuil: 15, label: "Priorité dans les résultats de recherche" },
  { seuil: 20, label: "Badge Certifié Ambassadeur" },
];

export function AmbassadorOverviewCard({ tier, onViewDetails }: { tier: number; onViewDetails: () => void }) {
  const tr = useTr();
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm bg-white"
      style={{ border: `2px solid ${tier >= 1 ? "#1f2e67" : "#e2e8f0"}` }}>
      <div className="flex items-center justify-between px-5 py-3"
        style={{ background: tier >= 1 ? "linear-gradient(135deg,#1f2e67,#f97316)" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
        <span className={`flex items-center gap-1.5 text-sm font-black ${tier >= 1 ? "text-white" : "text-gray-600"}`}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M12 12L8 21l4-2 4 2-4-9z"/></svg>
          Programme Ambassadeur{tier >= 1 ? `, palier ${tier}/5` : ""}
        </span>
        {tier >= 1 && (
          <button onClick={onViewDetails}
            className="text-xs font-semibold px-3 py-1 rounded-lg"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
            {tr("Voir détails")}
          </button>
        )}
      </div>
      <div className="p-4 space-y-1.5">
        {AMBASSADOR_PALIERS.map((p, i) => {
          const done = tier >= i + 1;
          return (
            <div key={i} className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl"
              style={done
                ? { background: "rgba(249,115,22,0.07)", border: "1px solid rgba(249,115,22,0.15)" }
                : { background: "#f8fafc", border: "1px solid #f1f5f9" }}>
              <span className="flex-shrink-0 w-4 h-4" style={{ color: done ? "#16a34a" : "#94a3b8" }}>
                {done ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                )}
              </span>
              <span className="text-xs font-semibold flex-1" style={{ color: done ? "#c2410c" : "#94a3b8" }}>{tr(p.label)}</span>
              <span className="text-xs flex-shrink-0" style={{ color: "#cbd5e1" }}>{p.seuil} {tr.en ? "ref." : "réf."}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Multi-day summary ───────────────────────────────────────────────────────

export const AMBASSADEUR_PALIERS = [
  { seuil: 3,  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 17h7M17 14v7"/></svg>, label: "Statistiques avancées",                    desc: "Vues, rendez-vous, note et taux de conversion" },
  { seuil: 6,  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>, label: "−10% sur votre prochaine facture",          desc: "Appliqué automatiquement, une seule fois" },
  { seuil: 10, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>, label: "−20% sur votre prochaine facture",          desc: "−30% si abonnement annuel, une seule fois" },
  { seuil: 15, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, label: "Priorité dans les résultats de recherche",  desc: "Votre garage apparaît en tête pendant 30 jours" },
  { seuil: 20, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M12 12L8 21l4-2 4 2-4-9z"/></svg>,  label: "Badge Certifié Ambassadeur",                desc: "Affiché en permanence sur votre profil public" },
];

export interface AmbassadeurStats {
  views:      { last30: number; trend30: number | null };
  appts:      { last30: number; trend30: number | null };
  rating:     { overall: number | null; last30: number | null; total: number };
  conversion: { last30: number; trend30: number | null };
  chart?:     { date: string; views: number }[];
}

export function AmbassadeurTab({ tier, count, garage, stats, onCopyCode }: {
  tier: number;
  count: number;
  garage: Pick<Garage, "referralCode" | "ambassadorSince">;
  stats: AmbassadeurStats | null;
  onCopyCode: () => void;
}) {
  const tr = useTr();
  const nextPalier = AMBASSADEUR_PALIERS.find((_, i) => i + 1 > tier);
  const maxChartV  = (stats?.chart?.length ?? 0) > 0 ? Math.max(...stats!.chart!.map((c) => c.views), 1) : 1;
  return (
    <div className="space-y-6">
      {/* Header hero */}
      <div className="rounded-2xl overflow-hidden"
        style={tier >= 5
          ? { background: "linear-gradient(145deg,#0b1f3a,#1a2f50)", border: "1px solid rgba(249,115,22,0.3)" }
          : { background: "linear-gradient(135deg,#1f2e67,#f97316)" }}>
        <div className="p-6 flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(255,255,255,0.15)" }}>
            <svg className="w-7 h-7 text-white" viewBox="0 0 24 24" fill={tier >= 5 ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              {tier >= 5
                ? <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                : <><circle cx="12" cy="8" r="4"/><path d="M12 12L8 21l4-2 4 2-4-9z"/></>
              }
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            {tier >= 5 ? (
              <>
                <p className="text-white font-black text-xl leading-tight">{tr("★ Certifié Ambassadeur Garago")}</p>
                <p className="text-sm font-medium mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>{tr("Niveau maximum atteint, merci pour votre engagement !")}</p>
              </>
            ) : (
              <>
                <p className="text-white font-black text-xl leading-tight">Programme Ambassadeur, palier {tier}/5</p>
                <p className="text-sm font-medium mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {tr.en ? `${count} referred garage${count > 1 ? "s" : ""}` : `${count} garage${count > 1 ? "s" : ""} parrainé${count > 1 ? "s" : ""}`}
                  {nextPalier ? (tr.en ? ` · ${nextPalier.seuil - count} more for tier ${tier + 1}` : ` · encore ${nextPalier.seuil - count} pour le palier ${tier + 1}`) : ""}
                </p>
              </>
            )}
          </div>
        </div>
        {tier < 5 && nextPalier && (
          <div className="px-6 pb-5">
            <div className="h-2 rounded-full" style={{ background: "rgba(255,255,255,0.15)" }}>
              <div className="h-2 rounded-full transition-all"
                style={{ width: `${Math.min(100, Math.round((count / nextPalier.seuil) * 100))}%`, background: "rgba(255,255,255,0.85)" }} />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>{count} parrainages</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>Objectif : {nextPalier.seuil}</span>
            </div>
          </div>
        )}
      </div>

      {/* Code de parrainage */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-1">{tr("Votre code de parrainage")}</h3>
        <p className="text-gray-500 text-sm mb-4">
          {tr.en ? "Share this code. The referred garage gets" : "Partagez ce code. Le garage parrainé profite de"} <strong>{tr("60 jours d'essai gratuit")}</strong> {tr("au lieu de 30.")}
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="bg-orange-50 border border-orange-200 text-orange-700 font-mono font-bold text-2xl px-5 py-2.5 rounded-xl tracking-widest select-all">
            {garage.referralCode ?? "—"}
          </span>
          {garage.referralCode && (
            <button type="button" onClick={onCopyCode}
              className="bg-[#e0600c] hover:bg-[#c45305] text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              {tr("Copier le code")}
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="text-center p-3 rounded-xl" style={{ background: "rgba(249,115,22,0.06)" }}>
            <p className="text-2xl font-black" style={{ color: "#f97316" }}>{count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{tr("Garages parrainés")}</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: "rgba(249,115,22,0.06)" }}>
            <p className="text-2xl font-black" style={{ color: tier >= 5 ? "#f97316" : "#1f2e67" }}>
              {tier >= 5 ? "★" : Math.max(0, ([3,6,10,15,20].find(s => s > count) ?? 20) - count)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{tier >= 5 ? tr("Certifié") : `Restants (palier ${tier + 1})`}</p>
          </div>
        </div>
      </div>

      {/* Progression des paliers */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">{tr("Progression des paliers")}</h3>
        <div className="space-y-2">
          {AMBASSADEUR_PALIERS.map((p, i) => {
            const palierNum = i + 1;
            const done   = tier >= palierNum;
            const active = tier === palierNum - 1 && count > 0;
            return (
              <div key={i} className="flex items-start gap-3 py-2.5 px-4 rounded-xl transition-colors"
                style={done
                  ? { background: "rgba(249,115,22,0.08)", border: "1px solid rgba(249,115,22,0.2)" }
                  : active
                  ? { background: "rgba(31,46,103,0.05)", border: "1px dashed rgba(31,46,103,0.2)" }
                  : { background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center mt-0.5 text-sm font-black"
                  style={done ? { background: "#e0600c", color: "#fff" } : { background: "#e2e8f0", color: "#94a3b8" }}>
                  {done ? "✓" : palierNum}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 flex-shrink-0" style={{ color: done ? "#f97316" : "#94a3b8" }}>{p.icon}</span>
                    <span className="text-sm font-bold" style={{ color: done ? "#f97316" : "#475569" }}>{tr(p.label)}</span>
                    <span className="text-xs ml-auto font-medium" style={{ color: "#94a3b8" }}>{p.seuil} {tr.en ? "ref." : "réf."}</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{tr(p.desc)}</p>
                  {active && (
                    <div className="mt-2">
                      <div className="h-1.5 rounded-full" style={{ background: "#e2e8f0" }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.round((count / p.seuil) * 100)}%`, background: "#1f2e67" }} />
                      </div>
                      <p className="text-xs mt-0.5 font-medium" style={{ color: "#1f2e67" }}>{count}/{p.seuil} {tr.en ? "referred garages" : "garages parrainés"}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {garage.ambassadorSince && (
          <p className="text-xs mt-4 pt-4" style={{ color: "#94a3b8", borderTop: "1px solid #f1f5f9" }}>
            {tr.en ? "Ambassador since" : "Ambassadeur depuis"} {new Date(garage.ambassadorSince).toLocaleDateString(tr.locale, { month: "long", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Statistiques avancées — palier 1+ */}
      {stats && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg,#1f2e67,#1a3a6b)" }}>
            <span className="text-white text-sm font-black">{tr("Statistiques avancées")}</span>
            <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.5)" }}>{tr("30 derniers jours")}</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: tr("Vues du profil"),      value: stats.views.last30,      trend: stats.views.trend30,      suffix: "" },
                { label: tr("Rendez-vous reçus"),   value: stats.appts.last30,      trend: stats.appts.trend30,      suffix: "" },
                { label: tr("Note moyenne"),         value: stats.rating.overall ?? "—", trend: null,                suffix: stats.rating.overall ? "/5" : "" },
                { label: "Taux de conversion",  value: stats.conversion.last30, trend: stats.conversion.trend30, suffix: "%" },
              ].map(({ label, value, trend, suffix }) => (
                <div key={label} className="p-4 rounded-xl" style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                  <p className="text-xs text-gray-400 mb-1">{label}</p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-2xl font-black" style={{ color: "#0b1f3a" }}>{value}{suffix}</span>
                    {trend !== null && trend !== undefined && (
                      <span className="text-xs font-bold mb-0.5" style={{ color: trend >= 0 ? "#16a34a" : "#dc2626" }}>
                        {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
            {(stats.chart?.length ?? 0) > 0 && (
              <div>
                <p className="text-xs text-gray-400 mb-2">{tr("Vues du profil, 30 derniers jours")}</p>
                <div className="flex items-end gap-px h-20">
                  {stats.chart!.map((c, i: number) => (
                    <div key={i} className="flex-1 rounded-sm transition-all"
                      title={`${c.date} : ${c.views} vue${c.views !== 1 ? "s" : ""}`}
                      style={{ height: `${Math.max(4, Math.round((c.views / maxChartV) * 100))}%`, background: c.views > 0 ? "#1f2e67" : "#e2e8f0" }} />
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs" style={{ color: "#94a3b8" }}>
              {tr.en ? "Total reviews:" : "Total avis :"} {stats.rating.total} · {tr.en ? "30-day rating:" : "Note 30j :"} {stats.rating.last30 ?? "—"}/5
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
