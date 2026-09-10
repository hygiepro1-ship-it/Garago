"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { BRANDS } from "@/lib/vehicleBrands";
import { getModelsForMake } from "@/lib/vehicleData";
import { SERVICE_CATEGORIES } from "@/lib/services";
import AddressAutocomplete, { type AddressResult } from "@/components/AddressAutocomplete";
import BrandLogo from "@/components/BrandLogo";
import ServiceIcon from "@/components/ServiceIcon";
import { useLang } from "@/contexts/LanguageContext";

/**
 * Un propriétaire peut gérer plusieurs garages. Le garage actif est passé aux
 * routes API via `?g=<id>` — lu depuis l'URL de la page (paramètre `g`).
 * Sans paramètre, les routes ciblent le garage principal du propriétaire.
 */
function selectedGarageId(): string | null {
  if (typeof window === "undefined") return null;
  return new URLSearchParams(window.location.search).get("g");
}
function gfetch(path: string, init?: RequestInit) {
  const g = selectedGarageId();
  if (!g) return fetch(path, init);
  const sep = path.includes("?") ? "&" : "?";
  return fetch(`${path}${sep}g=${encodeURIComponent(g)}`, init);
}

type Tab = "apercu" | "services" | "marques" | "horaires" | "profil" | "abonnement" | "ambassadeur";

// ─── Domain types ─────────────────────────────────────────────────────────────

interface GarageAvailability {
  dayOfWeek: number;
  openTime:  string;
  closeTime: string;
  isClosed:  boolean;
}

interface GarageService {
  categoryId:   string;
  categoryName: string;
  icon:         string;
  name:         string;
  priceMin:     string;
  priceMax:     string;
  durationMin:  string;
}

interface GarageBrand {
  brand:   string;
  accepts: boolean;
}

interface GarageBrandModel {
  brand: string;
  model: string;
}

interface GarageReview {
  id:          string;
  rating:      number;
  comment?:    string | null;
  ownerReply?: string | null;
  user?:       { name?: string | null };
}

interface Garage {
  id:                       string;
  parentId:                 string | null;
  slug:                     string;
  name:                     string;
  city:                     string | null;
  province:                 string | null;
  description:              string | null;
  descriptionDraft:         string | null;
  logoUrl:                  string | null;
  logoPosition:             string | null;
  coverUrl:                 string | null;
  coverPosition:            string | null;
  subscriptionStatus:       string | null;
  subscriptionEndAt:        string | null;
  pastDueSince:             string | null;
  cancelAtPeriodEnd?:       boolean;
  referralCode:             string | null;
  referralCount:            number;
  ambassadorTier:           number;
  ambassadorSince:          string | null;
  availability:             GarageAvailability[];
  services:                 GarageService[];
  brands:                   GarageBrand[];
  brandModels?:             GarageBrandModel[];
  reviews:                  GarageReview[];
  _count?:                  { reviews: number };
}

// ─── Colour utilities ────────────────────────────────────────────────────────
function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const k = (n: number) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => Math.round(255 * (l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1))))).toString(16).padStart(2, "0");
  return `#${f(0)}${f(8)}${f(4)}`;
}

const BG_PRESETS = [
  "#ffffff","#f8fafc","#f1f5f9","#e2e8f0","#94a3b8","#64748b","#334155","#1e293b","#0f172a","#000000",
  "#fef9c3","#fde047","#eab308","#ca8a04","#78350f",
  "#fecdd3","#f43f5e","#e11d48","#9f1239","#4c0519",
  "#bbf7d0","#4ade80","#16a34a","#166534","#052e16",
  "#bfdbfe","#60a5fa","#2563eb","#1e40af","#1e3a8a",
  "#e9d5ff","#a855f7","#7c3aed","#5b21b6","#2e1065",
  "#fed7aa","#f97316","#ea580c","#9a3412","#431407",
];

function BgColorPicker({ value, onChange, onClose }: {
  value: string | null;
  onChange: (c: string | null) => void;
  onClose: () => void;
}) {
  const [hex, setHex] = useState(value ?? "");
  const nativeRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setHex(value ?? ""); }, [value]);

  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-white shadow-lg space-y-3 z-10 relative">
      {/* Preset swatches */}
      <div>
        <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Couleurs rapides</p>
        <div className="grid grid-cols-10 gap-1">
          {BG_PRESETS.map(c => (
            <button key={c} type="button" title={c}
              onClick={() => { onChange(c); setHex(c); }}
              className={`w-6 h-6 rounded-md transition-all hover:scale-110 border-2 ${value === c ? "border-orange-500 scale-110" : "border-transparent hover:border-gray-300"}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      {/* Hue strip — click to pick */}
      <div>
        <p className="text-xs text-gray-400 mb-1.5 font-medium uppercase tracking-wide">Teinte personnalisée</p>
        <div
          className="h-7 rounded-lg cursor-crosshair border border-gray-200 select-none"
          style={{ background: "linear-gradient(to right,hsl(0,70%,55%),hsl(30,70%,55%),hsl(60,70%,55%),hsl(90,70%,55%),hsl(120,70%,55%),hsl(150,70%,55%),hsl(180,70%,55%),hsl(210,70%,55%),hsl(240,70%,55%),hsl(270,70%,55%),hsl(300,70%,55%),hsl(330,70%,55%),hsl(360,70%,55%))" }}
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const color = hslToHex(Math.round(ratio * 360), 70, 55);
            onChange(color); setHex(color);
          }}
        />
      </div>

      {/* Preview + hex + native fallback */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg border border-gray-200 flex-shrink-0 shadow-sm"
          style={{ background: value ?? "linear-gradient(135deg,#ccc 50%,#fff 50%)" }} />
        <input type="text" placeholder="#rrggbb"
          className="flex-1 text-xs font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-400"
          value={hex}
          onChange={e => { setHex(e.target.value); if (/^#[0-9a-fA-F]{6}$/.test(e.target.value)) onChange(e.target.value); }}
        />
        <input ref={nativeRef} type="color" className="hidden"
          value={value ?? "#000000"}
          onChange={e => { onChange(e.target.value); setHex(e.target.value); }} />
        <button type="button" title="Ouvrir la palette complète du système"
          onClick={() => nativeRef.current?.click()}
          className="text-xs px-2 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500 font-medium whitespace-nowrap">
          Palette…
        </button>
        <button type="button" onClick={onClose}
          className="text-gray-400 hover:text-gray-600 font-bold px-1">✕</button>
      </div>

      {/* Reset */}
      <button type="button" onClick={() => { onChange(null); setHex(""); onClose(); }}
        className="w-full text-xs py-1.5 rounded-lg border border-dashed border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600 transition-colors">
        ↺ Fond automatique (image floutée)
      </button>
    </div>
  );
}

// ─── Image position helper ───────────────────────────────────────────────────
function parseImgPos(raw: string | null | undefined): { tx: number; ty: number; zoom: number; color?: string } {
  const d = { tx: 0, ty: 0, zoom: 1 };
  if (!raw) return d;
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === "object") {
      const color = typeof p.color === "string" && p.color ? p.color : undefined;
      if ("tx" in p) return { tx: Number(p.tx) || 0, ty: Number(p.ty) || 0, zoom: Math.max(0.1, Number(p.zoom) || 1), color };
      if ("x"  in p) return { tx: (Number(p.x) || 50) - 50, ty: (Number(p.y) || 50) - 50, zoom: Math.max(0.1, Number(p.zoom) || 1), color };
    }
  } catch { /**/ }
  if (raw === "top")    return { tx: 0, ty: -20, zoom: 1 };
  if (raw === "bottom") return { tx: 0, ty:  20, zoom: 1 };
  return d;
}

// ─── Calendar helpers ────────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function getFirstDayOfWeek(year: number, month: number) {
  const d = new Date(year, month, 1).getDay();
  return d === 0 ? 6 : d - 1; // Mon=0 … Sun=6
}
const MONTH_NAMES_FR = [
  "Janvier","Février","Mars","Avril","Mai","Juin",
  "Juillet","Août","Septembre","Octobre","Novembre","Décembre",
];
const DAY_ABBR_FR = ["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"];

// ─── Component ──────────────────────────────────────────────────────────────
// ── Description verification section ────────────────────────────────────────
function DescriptionSection({
  garage, inputClass, onUpdated,
}: {
  garage: any;
  inputClass: string;
  onUpdated: (data: any) => void;
}) {
  const DESCRIPTION_MAX_PER_YEAR = 4;
  const [draft, setDraft] = useState(garage?.descriptionDraft ?? garage?.description ?? "");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [status, setStatus] = useState(garage?.descriptionStatus ?? "APPROVED");
  const [usedThisYear, setUsedThisYear] = useState<number>(() => {
    const thisYear = new Date().getFullYear();
    return garage?.descriptionChangesYear === thisYear ? (garage?.descriptionChanges ?? 0) : 0;
  });

  const isPending  = status === "PENDING";
  const isRejected = status === "REJECTED";
  const remaining  = DESCRIPTION_MAX_PER_YEAR - usedThisYear;

  async function handleSubmit() {
    setError(""); setSuccess("");
    if (!draft.trim()) { setError("La description ne peut pas être vide."); return; }
    setSubmitting(true);
    try {
      const res = await gfetch("/api/garage/description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: draft }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Erreur"); return; }
      setStatus("PENDING");
      setUsedThisYear(data.usedThisYear);
      setSuccess("Description soumise pour vérification. Vous recevrez une confirmation par courriel.");
      onUpdated({ descriptionDraft: draft.trim(), descriptionStatus: "PENDING", descriptionChanges: data.usedThisYear });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">Description du garage</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            Texte descriptif uniquement — pas de liens, courriels, numéros ou hashtags.
          </p>
        </div>
        {/* Status badge */}
        {isPending && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shrink-0"
            style={{ background: "#fef3c7", color: "#92400e" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
            En attente de validation
          </span>
        )}
        {isRejected && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shrink-0"
            style={{ background: "#fee2e2", color: "#991b1b" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            Description refusée
          </span>
        )}
        {status === "APPROVED" && garage?.description && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shrink-0"
            style={{ background: "#dcfce7", color: "#166534" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            Approuvée
          </span>
        )}
      </div>

      {/* Current approved description (read-only display) */}
      {garage?.description && (
        <div className="mb-4 rounded-xl p-3 text-sm text-gray-700" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">Description active</p>
          <p className="whitespace-pre-wrap">{garage.description}</p>
        </div>
      )}

      {/* Draft pending review */}
      {isPending && garage?.descriptionDraft && (
        <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#92400e" }}>Modification en cours de révision</p>
          <p className="text-gray-700 whitespace-pre-wrap">{garage.descriptionDraft}</p>
          <p className="text-xs mt-2" style={{ color: "#78350f" }}>
            Elle remplacera la description active une fois approuvée par notre équipe.
          </p>
        </div>
      )}

      {/* Rejection message */}
      {isRejected && (
        <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#991b1b" }}>
            Votre dernière description a été refusée.
          </p>
          <p className="text-gray-700 text-xs">
            Elle ne respectait pas nos conditions : description de l&apos;entreprise uniquement, sans promotion ni coordonnées. Soumettez une nouvelle version ci-dessous.
          </p>
        </div>
      )}

      {/* Edit area — hidden while PENDING */}
      {!isPending && (
        <div className="space-y-3">
          <textarea
            className={`${inputClass} min-h-[120px]`}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Décrivez votre garage, votre expertise, vos spécialités…"
            maxLength={400}
          />
          <p className="text-xs text-right" style={{ color: draft.length >= 380 ? "#dc2626" : "#9ca3af" }}>
            {draft.length} / 400 caractères
          </p>
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }}>
            Les modifications de la description doivent être soumises séparément via le bouton <strong>«&nbsp;Faire vérifier&nbsp;»</strong> — le bouton «&nbsp;Sauvegarder le profil&nbsp;» ne les enregistre pas.
          </p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs" style={{ color: remaining <= 1 ? "#dc2626" : "#6b7280" }}>
              {remaining <= 0
                ? "Limite atteinte — plus aucune modification autorisée cette année."
                : `${remaining} modification${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""} cette année (sur ${DESCRIPTION_MAX_PER_YEAR})`}
            </p>
            <button
              type="button"
              disabled={submitting || remaining <= 0}
              onClick={handleSubmit}
              className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "#f97316" }}>
              {submitting ? "Envoi en cours…" : "Faire vérifier"}
            </button>
          </div>
          {error   && <p className="text-xs font-medium" style={{ color: "#dc2626" }}>{error}</p>}
          {success && <p className="text-xs font-medium" style={{ color: "#16a34a" }}>{success}</p>}
        </div>
      )}

      {isPending && (
        <p className="text-xs text-gray-400 mt-2">
          La modification est en cours de révision. L&apos;édition sera réactivée une fois la décision rendue.
        </p>
      )}
    </div>
  );
}

// ─── Appointment status colours ─────────────────────────────────────────────

const STATUS_COLORS: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: "#fef3c7", color: "#92400e", label: "En attente" },
  CONFIRMED: { bg: "#d1fae5", color: "#065f46", label: "Confirmé"   },
  COMPLETED: { bg: "#ede9fe", color: "#5b21b6", label: "Terminé"    },
  CANCELLED: { bg: "#fee2e2", color: "#991b1b", label: "Annulé"     },
};

// ─── Ambassador overview card ─────────────────────────────────────────────────

const AMBASSADOR_PALIERS = [
  { seuil: 3,  label: "Statistiques avancées" },
  { seuil: 6,  label: "−10% sur votre prochaine facture" },
  { seuil: 10, label: "−20% sur votre prochaine facture" },
  { seuil: 15, label: "Priorité dans les résultats de recherche" },
  { seuil: 20, label: "Badge Certifié Ambassadeur" },
];

function AmbassadorOverviewCard({ tier, onViewDetails }: { tier: number; onViewDetails: () => void }) {
  return (
    <div className="rounded-2xl overflow-hidden shadow-sm bg-white"
      style={{ border: `2px solid ${tier >= 1 ? "#1f2e67" : "#e2e8f0"}` }}>
      <div className="flex items-center justify-between px-5 py-3"
        style={{ background: tier >= 1 ? "linear-gradient(135deg,#1f2e67,#f97316)" : "#f8fafc", borderBottom: "1px solid #f1f5f9" }}>
        <span className={`flex items-center gap-1.5 text-sm font-black ${tier >= 1 ? "text-white" : "text-gray-600"}`}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M12 12L8 21l4-2 4 2-4-9z"/></svg>
          Programme Ambassadeur{tier >= 1 ? ` — Palier ${tier}/5` : ""}
        </span>
        {tier >= 1 && (
          <button onClick={onViewDetails}
            className="text-xs font-semibold px-3 py-1 rounded-lg"
            style={{ background: "rgba(255,255,255,0.15)", color: "#fff" }}>
            Voir détails →
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
              <span className="text-xs font-semibold flex-1" style={{ color: done ? "#c2410c" : "#94a3b8" }}>{p.label}</span>
              <span className="text-xs flex-shrink-0" style={{ color: "#cbd5e1" }}>{p.seuil} réf.</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Multi-day summary ───────────────────────────────────────────────────────

function MultiDaySummary({ appointments, selectedDays, blockedSlots, onDeleteBlock }: {
  appointments: any[];
  selectedDays: string[];
  blockedSlots: any[];
  onDeleteBlock: (id: string) => void;
}) {
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
                const sc = STATUS_COLORS[a.status] ?? STATUS_COLORS.PENDING;
                const dFr = new Date(a.date + "T12:00:00").toLocaleDateString("fr-CA", { weekday: "short", day: "numeric", month: "short" });
                return (
                  <div key={a.id} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                    <div className="text-center min-w-[70px]">
                      <p className="text-xs text-gray-400 font-medium capitalize">{dFr}</p>
                      <p className="text-sm font-extrabold text-orange-500">{a.startTime}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm">{a.customerName}</p>
                      <p className="text-xs text-gray-500">{a.serviceName || "—"}</p>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                      style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      {multiBlocks.length > 0 && (
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Créneaux bloqués sur ces jours ({multiBlocks.length})</p>
          <div className="space-y-2">
            {multiBlocks
              .sort((a, b) => a.date.localeCompare(b.date))
              .map(s => {
                const dFr = new Date(s.date + "T12:00:00").toLocaleDateString("fr-CA", { weekday: "short", day: "numeric", month: "short" });
                return (
                  <div key={s.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#fef2f2", border: "1px solid #fca5a5" }}>
                    <svg className="w-4 h-4 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                    <div className="flex-1">
                      <p className="text-xs font-semibold text-red-800">{dFr} — {s.allDay ? "Journée entière" : `${s.startTime} – ${s.endTime}`}</p>
                      {s.reason && <p className="text-xs text-red-600">{s.reason}</p>}
                    </div>
                    <button onClick={() => onDeleteBlock(s.id)} className="text-xs text-red-400 hover:text-red-600 font-semibold px-2">Retirer</button>
                  </div>
                );
              })}
          </div>
        </div>
      )}
      {multiAppts.length === 0 && multiBlocks.length === 0 && (
        <p className="text-gray-400 text-sm text-center py-4">Aucun événement sur ces {selectedDays.length} jours.</p>
      )}
    </div>
  );
}

// ─── Ambassadeur tab ─────────────────────────────────────────────────────────

const AMBASSADEUR_PALIERS = [
  { seuil: 3,  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 17h7M17 14v7"/></svg>, label: "Statistiques avancées",                    desc: "Vues, rendez-vous, note et taux de conversion" },
  { seuil: 6,  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>, label: "−10% sur votre prochaine facture",          desc: "Appliqué automatiquement, une seule fois" },
  { seuil: 10, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>, label: "−20% sur votre prochaine facture",          desc: "−30% si abonnement annuel, une seule fois" },
  { seuil: 15, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, label: "Priorité dans les résultats de recherche",  desc: "Votre garage apparaît en tête — 30 jours" },
  { seuil: 20, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M12 12L8 21l4-2 4 2-4-9z"/></svg>,  label: "Badge Certifié Ambassadeur",                desc: "Affiché en permanence sur votre profil public" },
];

interface AmbassadeurStats {
  views:      { last30: number; trend30: number | null };
  appts:      { last30: number; trend30: number | null };
  rating:     { overall: number | null; last30: number | null; total: number };
  conversion: { last30: number; trend30: number | null };
  chart?:     { date: string; views: number }[];
}

function AmbassadeurTab({ tier, count, garage, stats, onCopyCode }: {
  tier: number;
  count: number;
  garage: Pick<Garage, "referralCode" | "ambassadorSince">;
  stats: AmbassadeurStats | null;
  onCopyCode: () => void;
}) {
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
                <p className="text-white font-black text-xl leading-tight">★ Certifié Ambassadeur Garago</p>
                <p className="text-sm font-medium mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>Niveau maximum atteint — merci pour votre engagement !</p>
              </>
            ) : (
              <>
                <p className="text-white font-black text-xl leading-tight">Programme Ambassadeur — Palier {tier}/5</p>
                <p className="text-sm font-medium mt-1" style={{ color: "rgba(255,255,255,0.65)" }}>
                  {count} garage{count > 1 ? "s" : ""} parrainé{count > 1 ? "s" : ""}
                  {nextPalier ? ` · encore ${nextPalier.seuil - count} pour le palier ${tier + 1}` : ""}
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
        <h3 className="font-bold text-gray-900 mb-1">Votre code de parrainage</h3>
        <p className="text-gray-500 text-sm mb-4">
          Partagez ce code. Le garage parrainé profite de <strong>60 jours d&apos;essai gratuit</strong> au lieu de 30.
        </p>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="bg-orange-50 border border-orange-200 text-orange-700 font-mono font-bold text-2xl px-5 py-2.5 rounded-xl tracking-widest select-all">
            {garage.referralCode ?? "—"}
          </span>
          {garage.referralCode && (
            <button type="button" onClick={onCopyCode}
              className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl transition-colors">
              Copier le code
            </button>
          )}
        </div>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="text-center p-3 rounded-xl" style={{ background: "rgba(249,115,22,0.06)" }}>
            <p className="text-2xl font-black" style={{ color: "#f97316" }}>{count}</p>
            <p className="text-xs text-gray-500 mt-0.5">Garages parrainés</p>
          </div>
          <div className="text-center p-3 rounded-xl" style={{ background: "rgba(249,115,22,0.06)" }}>
            <p className="text-2xl font-black" style={{ color: tier >= 5 ? "#f97316" : "#1f2e67" }}>
              {tier >= 5 ? "★" : Math.max(0, ([3,6,10,15,20].find(s => s > count) ?? 20) - count)}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{tier >= 5 ? "Certifié" : `Restants (palier ${tier + 1})`}</p>
          </div>
        </div>
      </div>

      {/* Progression des paliers */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
        <h3 className="font-bold text-gray-900 mb-4">Progression des paliers</h3>
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
                  style={done ? { background: "#f97316", color: "#fff" } : { background: "#e2e8f0", color: "#94a3b8" }}>
                  {done ? "✓" : palierNum}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-4 h-4 flex-shrink-0" style={{ color: done ? "#f97316" : "#94a3b8" }}>{p.icon}</span>
                    <span className="text-sm font-bold" style={{ color: done ? "#f97316" : "#475569" }}>{p.label}</span>
                    <span className="text-xs ml-auto font-medium" style={{ color: "#94a3b8" }}>{p.seuil} réf.</span>
                  </div>
                  <p className="text-xs mt-0.5" style={{ color: "#94a3b8" }}>{p.desc}</p>
                  {active && (
                    <div className="mt-2">
                      <div className="h-1.5 rounded-full" style={{ background: "#e2e8f0" }}>
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.round((count / p.seuil) * 100)}%`, background: "#1f2e67" }} />
                      </div>
                      <p className="text-xs mt-0.5 font-medium" style={{ color: "#1f2e67" }}>{count}/{p.seuil} garages parrainés</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {garage.ambassadorSince && (
          <p className="text-xs mt-4 pt-4" style={{ color: "#94a3b8", borderTop: "1px solid #f1f5f9" }}>
            Ambassadeur depuis {new Date(garage.ambassadorSince).toLocaleDateString("fr-CA", { month: "long", year: "numeric" })}
          </p>
        )}
      </div>

      {/* Statistiques avancées — palier 1+ */}
      {stats && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 flex items-center gap-2" style={{ borderBottom: "1px solid #f1f5f9", background: "linear-gradient(135deg,#1f2e67,#1a3a6b)" }}>
            <span className="text-white text-sm font-black">📊 Statistiques avancées</span>
            <span className="text-xs ml-auto" style={{ color: "rgba(255,255,255,0.5)" }}>30 derniers jours</span>
          </div>
          <div className="p-5 space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Vues du profil",      value: stats.views.last30,      trend: stats.views.trend30,      suffix: "" },
                { label: "Rendez-vous reçus",   value: stats.appts.last30,      trend: stats.appts.trend30,      suffix: "" },
                { label: "Note moyenne",         value: stats.rating.overall ?? "—", trend: null,                suffix: stats.rating.overall ? "/5" : "" },
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
                <p className="text-xs text-gray-400 mb-2">Vues du profil — 30 derniers jours</p>
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
              Total avis : {stats.rating.total} · Note 30j : {stats.rating.last30 ?? "—"}/5
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardGaragePage() {
  const { t } = useLang();
  const d = t.dash;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("apercu");
  const [garage, setGarage] = useState<Garage | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Garages du propriétaire (multi-garages) ─────────────────────────────
  type MyGarage = { id: string; name: string; city: string; parentId: string | null; subscriptionStatus: string | null };
  const [myGarages, setMyGarages] = useState<MyGarage[]>([]);
  function loadMyGarages() {
    gfetch("/api/garage/list").then(r => r.ok ? r.json() : []).then(d => Array.isArray(d) && setMyGarages(d)).catch(() => {});
  }
  useEffect(() => {
    if (status !== "authenticated") return;
    loadMyGarages();
  }, [status]);
  function switchGarage(id: string) {
    window.location.href = id ? `/tableau-de-bord/garage?g=${encodeURIComponent(id)}` : "/tableau-de-bord/garage";
  }

  // ── Ajouter / retirer une succursale ───────────────────────────────────
  const [showAddBranch, setShowAddBranch] = useState(false);
  const [branchForm, setBranchForm] = useState({ name: "", address: "", city: "", postalCode: "", phone: "", latitude: null as number | null, longitude: null as number | null });
  const [branchSaving, setBranchSaving] = useState(false);
  const [branchError, setBranchError] = useState("");
  const [removingBranch, setRemovingBranch] = useState<string | null>(null);

  async function submitBranch(e: React.FormEvent) {
    e.preventDefault();
    setBranchError(""); setBranchSaving(true);
    try {
      const res = await fetch("/api/garage/branch", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(branchForm),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setBranchError(data.error ?? "Une erreur est survenue."); setBranchSaving(false); return; }
      setShowAddBranch(false);
      setBranchForm({ name: "", address: "", city: "", postalCode: "", phone: "", latitude: null, longitude: null });
      loadMyGarages();
    } catch { setBranchError("Erreur réseau."); }
    finally { setBranchSaving(false); }
  }

  async function removeBranch(id: string) {
    setRemovingBranch(id);
    try {
      const res = await fetch(`/api/garage/branch/${id}`, { method: "DELETE" });
      if (res.ok) loadMyGarages();
      else { const d = await res.json().catch(() => ({})); alert(d.error ?? "Impossible de retirer ce garage."); }
    } finally { setRemovingBranch(null); }
  }
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // ── Suppression du compte ────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError("");
    const res = await fetch("/api/user/profile", { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? "Une erreur est survenue. Réessayez plus tard.");
      setDeleting(false);
      return;
    }
    await signOut({ callbackUrl: "/" });
  }

  // ── Annulation / réactivation de l'abonnement (sans supprimer le compte) ──
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState("");

  // ── Résumé de facturation (prochaine facture, moyen de paiement) ──
  type Billing = {
    hasSubscription: boolean;
    interval?: "month" | "year";
    currency?: string;
    nextAmount?: number | null;
    nextDate?: number | null;
    cancelAtPeriodEnd?: boolean;
    paymentMethod?: { type: string; brand?: string; last4?: string } | null;
  };
  const [billing, setBilling] = useState<Billing | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);
  useEffect(() => {
    if (activeTab !== "abonnement") return;
    fetch("/api/stripe/billing").then(r => r.ok ? r.json() : null).then(setBilling).catch(() => {});
  }, [activeTab]);

  async function openBillingPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch("/api/stripe/billing", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.url) { window.location.href = data.url; return; }
      alert(data.error ?? "Impossible d'ouvrir le portail de facturation.");
    } finally { setPortalLoading(false); }
  }

  async function cancelSubscription(resume: boolean) {
    setCancelLoading(true);
    setCancelError("");
    const res = await fetch("/api/stripe/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCancelError(data.error ?? "Une erreur est survenue. Réessayez plus tard.");
      setCancelLoading(false);
      return;
    }
    setGarage((g: any) => g ? { ...g, cancelAtPeriodEnd: data.cancelAtPeriodEnd } : g);
    setShowCancelConfirm(false);
    setCancelLoading(false);
  }

  async function startCheckout(plan: "monthly" | "annual" = "monthly") {
    setCheckoutLoading(true);
    const res = await fetch("/api/stripe/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setCheckoutLoading(false);
  }

  // ── Appointments + blocked slots state ──────────────────────────────────
  const [appointments, setAppointments] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [rdvLoaded, setRdvLoaded] = useState(false);

  // ── Reschedule modal state ─────────────────────────────────────────────
  const [rescheduleAppt, setRescheduleAppt] = useState<any>(null);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [rescheduleSlot, setRescheduleSlot] = useState("");
  const [slotsLoading, setSlotsLoading]     = useState(false);
  const [slotsClosed, setSlotsClosed]       = useState(false);
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  // Calendar nav
  const today = new Date();
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-based
  const [selectedDays, setSelectedDays] = useState<string[]>([]); // "YYYY-MM-DD"[]
  const lastClickedDay = useRef<string | null>(null);

  // Manual RDV form
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualFormDate, setManualFormDate] = useState(""); // pre-fill from calendar click
  const [manualForm, setManualForm] = useState({
    customerName: "", customerPhone: "", customerEmail: "",
    vehicleYear: "", vehicleMake: "", vehicleModel: "",
    serviceName: "", date: "", startTime: "", notes: "",
  });
  const [savingRdv, setSavingRdv] = useState(false);

  // Block slot form
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockForm, setBlockForm] = useState({
    date: "", startTime: "08:00", endTime: "17:00", reason: "", allDay: false,
  });
  const [savingBlock, setSavingBlock] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/connexion"); return; }
    if (status === "authenticated") {
      gfetch("/api/garage/profile").then(r => r.json()).then(d => { setGarage(d); setLoading(false); });
    }
  }, [status, router]);

  // ── Stats avancées (palier 1+) ────────────────────────────────────────────
  const [stats, setStats] = useState<any>(null);
  useEffect(() => {
    if ((garage?.ambassadorTier ?? 0) >= 1) {
      gfetch("/api/garage/stats").then(r => r.json()).then(s => { if (!s.error) setStats(s); });
    }
  }, [garage?.ambassadorTier, garage?.id]);

  // ── Services state ────────────────────────────────────────────────────────
  const [services, setServices] = useState<GarageService[]>([]);
  useEffect(() => { if (garage?.services) setServices(garage.services); }, [garage]);

  function toggleService(catId: string, cat: any) {
    const existing = services.find((s) => s.categoryId === catId);
    if (existing) {
      setServices(services.filter((s) => s.categoryId !== catId));
    } else {
      setServices([...services, {
        categoryId: catId, categoryName: cat.name, icon: cat.icon,
        name: cat.name, priceMin: "", priceMax: "", durationMin: "",
      }]);
    }
  }

  async function saveServices() {
    setSaving(true);
    await gfetch("/api/garage/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ services }),
    });
    setSaving(false);
    setSuccess("Services sauvegardés ✓");
    setTimeout(() => setSuccess(""), 3000);
  }

  // ── Brands state ──────────────────────────────────────────────────────────
  const [brands, setBrands] = useState<GarageBrand[]>([]);
  useEffect(() => { if (garage?.brands) setBrands(garage.brands); }, [garage]);

  // ── Modèles précis par marque acceptée ──────────────────────────────────────
  // Absence d'entrée pour une marque = tous les modèles sont traités (défaut).
  const [brandModels, setBrandModels] = useState<Record<string, string[]>>({});
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  useEffect(() => {
    if (garage?.brandModels) {
      const grouped: Record<string, string[]> = {};
      for (const bm of garage.brandModels) {
        (grouped[bm.brand] ??= []).push(bm.model);
      }
      setBrandModels(grouped);
    }
  }, [garage]);

  function toggleBrandModel(brand: string, model: string) {
    setBrandModels((prev) => {
      const current = prev[brand] ?? [];
      const next = current.includes(model) ? current.filter((m) => m !== model) : [...current, model];
      return { ...prev, [brand]: next };
    });
  }

  function toggleBrand(brand: string, accepts: boolean) {
    const existing = brands.find((b) => b.brand === brand);
    if (existing) {
      if (existing.accepts === accepts) {
        setBrands(brands.filter((b) => b.brand !== brand));
        setBrandModels((prev) => { const { [brand]: _, ...rest } = prev; return rest; });
      } else setBrands(brands.map((b) => b.brand === brand ? { ...b, accepts } : b));
    } else {
      setBrands([...brands, { brand, accepts }]);
    }
  }
  function getBrandStatus(brand: string) {
    const b = brands.find((b) => b.brand === brand);
    if (!b) return "none";
    return b.accepts ? "accepts" : "refuses";
  }
  async function saveBrands() {
    setSaving(true);
    await gfetch("/api/garage/brands", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brands, brandModels }),
    });
    setSaving(false);
    setSuccess("Marques sauvegardées ✓");
    setTimeout(() => setSuccess(""), 3000);
  }

  // ── Horaires state ────────────────────────────────────────────────────────
  const DAYS = ["Dimanche","Lundi","Mardi","Mercredi","Jeudi","Vendredi","Samedi"];
  const [horaires, setHoraires] = useState<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }[]>(
    DAYS.map((_, i) => ({ dayOfWeek: i, openTime: "08:00", closeTime: "17:00", isClosed: i === 0 }))
  );
  useEffect(() => {
    if ((garage?.availability?.length ?? 0) > 0) {
      setHoraires(DAYS.map((_, i) => {
        const a = garage!.availability.find((x) => x.dayOfWeek === i);
        return a
          ? { dayOfWeek: i, openTime: a.openTime ?? "08:00", closeTime: a.closeTime ?? "17:00", isClosed: !!a.isClosed }
          : { dayOfWeek: i, openTime: "08:00", closeTime: "17:00", isClosed: i === 0 };
      }));
    }
  }, [garage]);

  function setHoraireField(dayIndex: number, field: string, value: string | boolean) {
    setHoraires((prev) => prev.map((h) => h.dayOfWeek === dayIndex ? { ...h, [field]: value } : h));
  }
  async function saveHoraires() {
    setSaving(true);
    await gfetch("/api/garage/availability", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ horaires }),
    });
    setSaving(false);
    setSuccess("Horaires sauvegardés ✓");
    setTimeout(() => setSuccess(""), 3000);
  }

  // ── Profile state ─────────────────────────────────────────────────────────
  const [profileData, setProfileData] = useState<any>({});
  useEffect(() => { if (garage) setProfileData({ ...garage }); }, [garage]);

  // ── Image position/zoom state ──────────────────────────────────────────────
  const [coverPos, setCoverPos]         = useState({ tx: 0, ty: 0, zoom: 1 });
  const [logoPos,  setLogoPos]          = useState({ tx: 0, ty: 0, zoom: 1 });
  // null = auto (blurred image); string = custom hex/rgb color
  const [coverBgColor, setCoverBgColor]         = useState<string | null>(null);
  const [logoBgColor,  setLogoBgColor]          = useState<string | null>(null);
  const [showCoverColorPicker, setShowCoverColorPicker] = useState(false);
  const [showLogoColorPicker,  setShowLogoColorPicker]  = useState(false);
  useEffect(() => {
    if (garage) {
      const cp = parseImgPos(garage.coverPosition);
      const lp = parseImgPos(garage.logoPosition);
      setCoverPos(cp);
      setLogoPos(lp);
      setCoverBgColor(cp.color ?? null);
      setLogoBgColor(lp.color ?? null);
    }
  }, [garage]);
  // Drag refs — hold mutable state without triggering re-renders
  const coverDrag = useRef<{ active: boolean; startX: number; startY: number; otx: number; oty: number } | null>(null);
  const logoDrag  = useRef<{ active: boolean; startX: number; startY: number; otx: number; oty: number } | null>(null);

  function handleAddressSelect(r: AddressResult) {
    setProfileData((prev: any) => ({
      ...prev, address: r.streetAddress, city: r.city,
      postalCode: r.postalCode, latitude: r.lat, longitude: r.lng,
    }));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await gfetch("/api/garage/profile", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profileData,
        coverPosition: JSON.stringify({ zoom: coverPos.zoom, tx: coverPos.tx, ty: coverPos.ty, ...(coverBgColor ? { color: coverBgColor } : {}) }),
        logoPosition:  JSON.stringify({ zoom: logoPos.zoom,  tx: logoPos.tx,  ty: logoPos.ty,  ...(logoBgColor  ? { color: logoBgColor  } : {}) }),
      }),
    });
    setSaving(false);
    setSuccess("Profil sauvegardé ✓");
    setTimeout(() => setSuccess(""), 3000);
  }

  // ── Upload logo / cover ───────────────────────────────────────────────────
  const logoInputRef  = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [uploadingLogo,  setUploadingLogo]  = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  async function handleUpload(file: File, type: "logo" | "cover") {
    if (type === "logo") setUploadingLogo(true);
    else setUploadingCover(true);

    const fd = new FormData();
    fd.append("file", file);
    fd.append("type", type);
    const res = await gfetch("/api/garage/upload", { method: "POST", body: fd });
    const data = await res.json();
    if (data.url) {
      setGarage((g: any) => ({ ...g, [type === "logo" ? "logoUrl" : "coverUrl"]: data.url }));
      setProfileData((p: any) => ({ ...p, [type === "logo" ? "logoUrl" : "coverUrl"]: data.url }));
      setSuccess(`${type === "logo" ? "Logo" : "Image de couverture"} mis à jour ✓`);
      setTimeout(() => setSuccess(""), 3000);
    }
    if (type === "logo") setUploadingLogo(false);
    else setUploadingCover(false);
  }

  // ── Reviews state (Aperçu tab) ─────────────────────────────────────────
  const [reviews, setReviews] = useState<GarageReview[]>([]);
  useEffect(() => { if (garage?.reviews) setReviews(garage.reviews); }, [garage]);

  const [replyingTo, setReplyingTo] = useState<string | null>(null); // reviewId
  const [replyText, setReplyText]   = useState("");
  const [savingReply, setSavingReply] = useState(false);
  const [reportingId, setReportingId]   = useState<string | null>(null); // reviewId en cours de signalement
  const [reportReason, setReportReason] = useState("");
  const [sendingReport, setSendingReport] = useState(false);
  const [reportSent, setReportSent]     = useState<string | null>(null); // reviewId dont le signalement est envoyé

  async function saveReply(reviewId: string) {
    setSavingReply(true);
    const res = await fetch(`/api/reviews/${reviewId}/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reply: replyText }),
    });
    if (res.ok) {
      const updated = await res.json();
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, ownerReply: updated.ownerReply } : r));
      setReplyingTo(null);
      setReplyText("");
    }
    setSavingReply(false);
  }

  async function submitReport(reviewId: string) {
    setSendingReport(true);
    await fetch(`/api/reviews/${reviewId}/report`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reason: reportReason }),
    });
    setSendingReport(false);
    setReportSent(reviewId);
    setReportingId(null);
    setReportReason("");
  }

  // ── RDV / Calendar ─────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "apercu" && !rdvLoaded && garage) {
      const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
      Promise.all([
        gfetch("/api/garage/appointments").then(r => r.json()),
        gfetch(`/api/blocked-slots?month=${monthStr}`).then(r => r.json()),
      ]).then(([appts, blocks]) => {
        setAppointments(Array.isArray(appts) ? appts : []);
        setBlockedSlots(Array.isArray(blocks) ? blocks : []);
        setRdvLoaded(true);
      });
    }
  }, [activeTab, rdvLoaded, garage]);

  async function loadCalendarData() {
    if (!garage) return;
    const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
    const [appts, blocks] = await Promise.all([
      gfetch("/api/garage/appointments").then(r => r.json()),
      gfetch(`/api/blocked-slots?month=${monthStr}`).then(r => r.json()),
    ]);
    setAppointments(Array.isArray(appts) ? appts : []);
    setBlockedSlots(Array.isArray(blocks) ? blocks : []);
  }

  function changeMonth(delta: number) {
    let m = calMonth + delta;
    let y = calYear;
    if (m > 11) { m = 0; y++; }
    if (m < 0)  { m = 11; y--; }
    setCalMonth(m);
    setCalYear(y);
    setSelectedDays([]);
    setRdvLoaded(false); // reload data for new month
  }

  if (loading || !garage) {
    return <div className="flex items-center justify-center py-20 text-gray-500">{d.loading}</div>;
  }

  async function updateApptStatus(id: string, newStatus: string) {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  }

  async function saveManualRdv(e: React.FormEvent) {
    e.preventDefault();
    setSavingRdv(true);
    // Ensure selectedDays[0] is used as date if manualForm.date not set
    const formData = { ...manualForm, date: manualForm.date || selectedDays[0] || "" };
    const res = await gfetch("/api/garage/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });
    if (res.ok) {
      const appt = await res.json();
      setAppointments(prev => [appt, ...prev]);
      setShowManualForm(false);
      setManualForm({ customerName:"", customerPhone:"", customerEmail:"", vehicleYear:"", vehicleMake:"", vehicleModel:"", serviceName:"", date:"", startTime:"", notes:"" });
      setSuccess("Rendez-vous ajouté ✓");
      setTimeout(() => setSuccess(""), 3000);
    }
    setSavingRdv(false);
  }

  async function saveBlockSlot(e: React.FormEvent) {
    e.preventDefault();
    setSavingBlock(true);
    const res = await gfetch("/api/blocked-slots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(blockForm),
    });
    if (res.ok) {
      const slot = await res.json();
      setBlockedSlots(prev => [...prev, slot]);
      setShowBlockForm(false);
      setBlockForm({ date: "", startTime: "08:00", endTime: "17:00", reason: "", allDay: false });
      setSuccess("Créneau bloqué ✓");
      setTimeout(() => setSuccess(""), 3000);
    }
    setSavingBlock(false);
  }

  async function deleteBlockSlot(id: string) {
    const res = await fetch(`/api/blocked-slots/${id}`, { method: "DELETE" });
    if (res.ok) setBlockedSlots(prev => prev.filter(s => s.id !== id));
  }

  // ── Multi-day selection helpers ───────────────────────────────────────────
  function getAllDaysInRange(from: string, to: string): string[] {
    const a = new Date(from + "T12:00:00");
    const b = new Date(to   + "T12:00:00");
    const [start, end] = a <= b ? [a, b] : [b, a];
    const days: string[] = [];
    const cur = new Date(start);
    while (cur <= end) {
      days.push(cur.toISOString().slice(0, 10));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }

  function toggleDay(dayStr: string, e: React.MouseEvent) {
    if (e.shiftKey && lastClickedDay.current) {
      // Maj+clic: sélectionner une plage de jours
      const range = getAllDaysInRange(lastClickedDay.current, dayStr);
      setSelectedDays(prev => {
        const set = new Set(prev);
        range.forEach(d => set.add(d));
        return Array.from(set).sort();
      });
    } else {
      // Clic simple : toggle (ajoute si absent, retire si présent)
      setSelectedDays(prev =>
        prev.includes(dayStr)
          ? prev.filter(d => d !== dayStr)
          : [...prev, dayStr].sort()
      );
    }
    lastClickedDay.current = dayStr;
  }

  async function saveBulkBlock(e: React.FormEvent) {
    e.preventDefault();
    setSavingBlock(true);
    for (const date of selectedDays) {
      const res = await gfetch("/api/blocked-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...blockForm, date }),
      });
      if (res.ok) {
        const slot = await res.json();
        setBlockedSlots(prev => [...prev, slot]);
      }
    }
    setShowBlockForm(false);
    setBlockForm({ date: "", startTime: "08:00", endTime: "17:00", reason: "", allDay: false });
    setSavingBlock(false);
    setSuccess(`Créneaux bloqués pour ${selectedDays.length} jour${selectedDays.length > 1 ? "s" : ""} ✓`);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function saveBulkManualRdv(e: React.FormEvent) {
    e.preventDefault();
    setSavingRdv(true);
    for (const date of selectedDays) {
      const res = await gfetch("/api/garage/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...manualForm, date }),
      });
      if (res.ok) {
        const appt = await res.json();
        setAppointments(prev => [appt, ...prev]);
      }
    }
    setShowManualForm(false);
    setManualForm({ customerName:"", customerPhone:"", customerEmail:"", vehicleYear:"", vehicleMake:"", vehicleModel:"", serviceName:"", date:"", startTime:"", notes:"" });
    setSavingRdv(false);
    setSuccess(`Rendez-vous ajoutés pour ${selectedDays.length} jour${selectedDays.length > 1 ? "s" : ""} ✓`);
    setTimeout(() => setSuccess(""), 3000);
  }

  async function fetchGarageSlots(date: string, excludeId: string) {
    if (!garage?.slug || !date) return;
    setSlotsLoading(true);
    setRescheduleSlots([]);
    setRescheduleSlot("");
    setSlotsClosed(false);
    const res = await fetch(`/api/garages/${garage.slug}/slots?date=${date}&excludeId=${excludeId}`);
    const data = await res.json();
    setSlotsLoading(false);
    if (data.closed) { setSlotsClosed(true); return; }
    setRescheduleSlots(data.slots ?? []);
  }

  async function submitReschedule() {
    if (!rescheduleAppt || !rescheduleSlot || !rescheduleDate) return;
    setRescheduleLoading(true);
    const [h, m] = rescheduleSlot.split(":").map(Number);
    const totalEnd = h * 60 + m + 60;
    const endTime = `${String(Math.floor(totalEnd / 60)).padStart(2, "0")}:${String(totalEnd % 60).padStart(2, "0")}`;
    const res = await fetch(`/api/appointments/${rescheduleAppt.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: rescheduleDate, startTime: rescheduleSlot, endTime }),
    });
    if (res.ok) {
      setAppointments(prev => prev.map(a => a.id === rescheduleAppt.id
        ? { ...a, date: rescheduleDate, startTime: rescheduleSlot, endTime }
        : a
      ));
      setSuccess("Rendez-vous déplacé ✓");
      setTimeout(() => setSuccess(""), 3000);
    }
    setRescheduleAppt(null);
    setRescheduleDate("");
    setRescheduleSlot("");
    setRescheduleLoading(false);
  }

  // ── Calendar helpers ────────────────────────────────────────────────────
  const daysInMonth  = getDaysInMonth(calYear, calMonth);
  const firstDayOfWeek = getFirstDayOfWeek(calYear, calMonth); // Mon=0

  function toDateStr(day: number) {
    return `${calYear}-${String(calMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }

  function apptCountForDay(dayStr: string) {
    return appointments.filter(a => a.date === dayStr).length;
  }
  function blockCountForDay(dayStr: string) {
    return blockedSlots.filter(s => s.date === dayStr).length;
  }

  // Single-day helpers (used when exactly 1 day is selected)
  const selectedDay  = selectedDays.length === 1 ? selectedDays[0] : null;
  const selectedDayAppts  = selectedDay ? appointments.filter(a => a.date === selectedDay) : [];
  const selectedDayBlocks = selectedDay ? blockedSlots.filter(s => s.date === selectedDay) : [];
  const isMultiSelect = selectedDays.length > 1;

  // ── Computed values ─────────────────────────────────────────────────────
  const avgRating = garage.reviews?.length > 0
    ? (garage.reviews.reduce((s: number, r: any) => s + r.rating, 0) / garage.reviews.length).toFixed(1)
    : null;

  const isTrialExpiring = garage.subscriptionStatus === "TRIAL" && garage.subscriptionEndAt
    && new Date(garage.subscriptionEndAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  // Date limite de la période de grâce après un paiement échoué (7 jours)
  const pastDueDeadline = garage.pastDueSince
    ? new Date(new Date(garage.pastDueSince).getTime() + 7 * 24 * 60 * 60 * 1000)
        .toLocaleDateString("fr-CA", { day: "numeric", month: "long" })
    : null;

  const tabIcons: Record<Tab, ReactNode> = {
    apercu:      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 17h7M17 14v7"/></svg>,
    services:    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    marques:     <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h5l3 3v4h-8V8zM5 7V3m6 4V3M5 17v4m6-4v4"/><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/></svg>,
    horaires:    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    profil:      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    abonnement:  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
    ambassadeur: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M12 12L8 21l4-2 4 2-4-9z"/></svg>,
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "apercu",   label: d.overview  },
    { id: "services", label: d.services  },
    { id: "marques",  label: d.brands    },
    { id: "horaires", label: d.hours     },
    { id: "profil",   label: d.profile   },
    { id: "abonnement", label: "Abonnement" },
    ...(garage.subscriptionStatus === "ACTIVE" && garage.ambassadorTier >= 1
      ? [{ id: "ambassadeur" as Tab, label: "Ambassadeur" }] : []),
  ];

  // Le programme de parrainage / ambassadeur est réservé aux garages abonnés
  const referralUnlocked = garage.subscriptionStatus === "ACTIVE";

  const inputClass = "block w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-white rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8"
        style={{ background: "linear-gradient(135deg, #071428 0%, #0b1f3a 100%)", border: "1px solid rgba(249,115,22,0.2)" }}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold">{garage.name}</h1>
            <p className="mt-1 text-sm flex items-center gap-1.5" style={{ color: "rgba(255,255,255,0.5)" }}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {garage.city}, {garage.province}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {garage.subscriptionStatus === "TRIAL" && (
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                Essai {garage.subscriptionEndAt ? `— expire ${new Date(garage.subscriptionEndAt).toLocaleDateString("fr-CA", { day: "numeric", month: "short" })}` : "gratuit"}
              </span>
            )}
            {garage.subscriptionStatus === "ACTIVE" && (
              <span className="bg-green-400 text-green-900 text-xs font-bold px-2 py-1 rounded-full">Actif ✓</span>
            )}
            {garage.subscriptionStatus === "PAST_DUE" && (
              <span className="bg-red-400 text-red-900 text-xs font-bold px-2 py-1 rounded-full">Paiement échoué</span>
            )}
            {garage.subscriptionStatus === "EXPIRED" && (
              <span className="bg-red-400 text-red-900 text-xs font-bold px-2 py-1 rounded-full">Expiré</span>
            )}
            <Link href={`/garage/${garage.slug}?from=dashboard`}
              className="bg-white/20 border border-white/30 text-white text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl hover:bg-white/30 transition-colors whitespace-nowrap">
              Voir mon profil →
            </Link>
          </div>
        </div>
      </div>

      {/* Sélecteur de garage (propriétaires multi-garages) */}
      {myGarages.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 mb-6 flex items-center gap-3 flex-wrap shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Vous gérez</span>
          <select
            value={selectedGarageId() ?? (myGarages.find(g => g.parentId === null)?.id ?? "")}
            onChange={(e) => switchGarage(e.target.value)}
            className="flex-1 min-w-[220px] border border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400">
            {myGarages.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} · {g.city}{g.parentId === null ? " (principal)" : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {isTrialExpiring && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#a16207" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p className="font-bold text-yellow-900">Votre essai expire bientôt!</p>
              <p className="text-yellow-700 text-sm">Activez votre abonnement pour continuer à apparaître dans les résultats.</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button onClick={() => startCheckout("monthly")} disabled={checkoutLoading}
              className="bg-yellow-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-yellow-600 text-sm whitespace-nowrap disabled:opacity-60">
              {checkoutLoading ? "Chargement…" : "Activer mon abonnement"}
            </button>
            <button onClick={() => startCheckout("annual")} disabled={checkoutLoading}
              className="text-xs font-semibold text-yellow-800 underline hover:no-underline disabled:opacity-60">
              ou payer annuellement (−20 %)
            </button>
          </div>
        </div>
      )}

      {garage.subscriptionStatus === "PAST_DUE" && (
        <div className="bg-red-50 border border-red-300 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p className="font-bold text-red-900">Votre dernier paiement a échoué</p>
              <p className="text-red-700 text-sm">
                Mettez à jour votre carte {pastDueDeadline ? `avant le ${pastDueDeadline}` : "rapidement"} pour éviter que votre garage soit retiré des résultats de recherche.
              </p>
            </div>
          </div>
          <button onClick={openBillingPortal} disabled={portalLoading}
            className="bg-red-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-red-700 text-sm whitespace-nowrap disabled:opacity-60">
            {portalLoading ? "Ouverture…" : "Mettre à jour ma carte"}
          </button>
        </div>
      )}

      {garage.subscriptionStatus === "EXPIRED" && (
        <div className="bg-red-50 border border-red-300 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p className="font-bold text-red-900">Votre abonnement est expiré</p>
              <p className="text-red-700 text-sm">Votre garage n'apparaît plus dans les résultats de recherche. Activez votre abonnement pour redevenir visible.</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button onClick={() => startCheckout("monthly")} disabled={checkoutLoading}
              className="bg-red-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-red-700 text-sm whitespace-nowrap disabled:opacity-60">
              {checkoutLoading ? "Chargement…" : "Activer mon abonnement"}
            </button>
            <button onClick={() => startCheckout("annual")} disabled={checkoutLoading}
              className="text-xs font-semibold text-red-700 underline hover:no-underline disabled:opacity-60">
              ou payer annuellement (−20 %)
            </button>
          </div>
        </div>
      )}

      {garage.subscriptionStatus === "TRIAL" && !isTrialExpiring && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/>
            </svg>
            <div>
              <p className="font-bold text-gray-900">Vous êtes actuellement en période d'essai gratuit</p>
              <p className="text-gray-500 text-sm">Vous pouvez activer votre abonnement dès maintenant, sans attendre la fin de l'essai.</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button onClick={() => startCheckout("monthly")} disabled={checkoutLoading}
              className="text-white px-5 py-2 rounded-xl font-bold text-sm whitespace-nowrap disabled:opacity-60"
              style={{ background: "#f97316" }}>
              {checkoutLoading ? "Chargement…" : "Activer mon abonnement maintenant"}
            </button>
            <button onClick={() => startCheckout("annual")} disabled={checkoutLoading}
              className="text-xs font-semibold underline hover:no-underline disabled:opacity-60"
              style={{ color: "#f97316" }}>
              ou payer annuellement (−20 %)
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium">{success}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? "text-white" : "bg-white border border-gray-200 text-gray-600"}`}
            style={activeTab === tab.id ? { background: "#f97316" } : {}}>
            {tabIcons[tab.id]}{tab.label}
          </button>
        ))}
      </div>

      {/* ══ APERÇU ══════════════════════════════════════════════════════════ */}
      {activeTab === "apercu" && (
        <div className="space-y-6">
          {/* Stats grid */}
          {(() => {
            const todayStr = new Date().toISOString().slice(0, 10);
            const confirmedToday = appointments.filter(a => a.date === todayStr && (a.status === "CONFIRMED" || a.status === "PENDING")).length;
            const totalThisMonth = appointments.filter(a => a.date?.startsWith(new Date().toISOString().slice(0, 7))).length;
            const confirmedThisMonth = appointments.filter(a => a.date?.startsWith(new Date().toISOString().slice(0, 7)) && a.status === "CONFIRMED").length;
            const tauxRdv = totalThisMonth > 0 ? Math.round((confirmedThisMonth / totalThisMonth) * 100) : 0;
            const tauxRemplissage = rdvLoaded && appointments.length > 0 ? Math.min(100, Math.round((appointments.filter(a => a.status !== "CANCELLED").length / Math.max(appointments.length, 1)) * 100)) : null;

            // Sparkline: group appointments by day for last 14 days
            const spark: { day: string; count: number }[] = [];
            for (let i = 13; i >= 0; i--) {
              const d = new Date(); d.setDate(d.getDate() - i);
              const ds = d.toISOString().slice(0, 10);
              spark.push({ day: ds, count: appointments.filter(a => a.date === ds).length });
            }
            const maxSpark = Math.max(...spark.map(s => s.count), 1);

            // Vue du jour
            const todayAppts = appointments.filter(a => a.date === todayStr).sort((a, b) => a.startTime.localeCompare(b.startTime));

            return (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Note moyenne */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Note moyenne</span>
                    </div>
                    <p className="text-3xl font-black mt-1" style={{ color: "#0b1f3a" }}>{avgRating ? `${avgRating}` : "—"}<span className="text-base font-semibold text-gray-400">{avgRating ? "/5" : ""}</span></p>
                    <p className="text-xs text-gray-400 mt-1">{garage._count?.reviews ?? 0} avis</p>
                  </div>

                  {/* Taux de confirmation RDV */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#0b1f3a" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Taux de RDV</span>
                    </div>
                    <p className="text-3xl font-black mt-1" style={{ color: "#0b1f3a" }}>{rdvLoaded ? `${tauxRdv}` : "—"}<span className="text-base font-semibold text-gray-400">{rdvLoaded ? "%" : ""}</span></p>
                    <p className="text-xs text-gray-400 mt-1">confirmés ce mois</p>
                  </div>

                  {/* Taux de remplissage */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Taux de remplissage</span>
                    </div>
                    <p className="text-3xl font-black mt-1" style={{ color: "#0b1f3a" }}>{tauxRemplissage !== null ? `${tauxRemplissage}` : "—"}<span className="text-base font-semibold text-gray-400">{tauxRemplissage !== null ? "%" : ""}</span></p>
                    {tauxRemplissage !== null && (
                      <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${tauxRemplissage}%`, background: tauxRemplissage > 70 ? "#f97316" : "#0b1f3a" }} />
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">créneaux non-annulés</p>
                  </div>
                </div>

                {/* Sparkline activité */}
                {rdvLoaded && (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-bold text-gray-700">Activité — 14 derniers jours</p>
                      <span className="text-xs text-gray-400">{appointments.length} RDV total</span>
                    </div>
                    <div className="flex items-end gap-1 h-14">
                      {spark.map((s, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                          <div className="w-full rounded-sm transition-all"
                            title={`${s.day} : ${s.count} RDV`}
                            style={{ height: `${Math.max(4, Math.round((s.count / maxSpark) * 48))}px`, background: s.count > 0 ? "#f97316" : "#e2e8f0", opacity: s.day === todayStr ? 1 : 0.7 }} />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between mt-1">
                      <span className="text-xs text-gray-300">il y a 14j</span>
                      <span className="text-xs font-semibold" style={{ color: "#f97316" }}>Aujourd'hui : {confirmedToday} RDV</span>
                    </div>
                  </div>
                )}

                {/* Vue du jour */}
                <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900">Vue du jour</h3>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: confirmedToday > 0 ? "rgba(249,115,22,0.1)" : "#f1f5f9", color: confirmedToday > 0 ? "#f97316" : "#94a3b8" }}>
                      {confirmedToday} rendez-vous
                    </span>
                  </div>
                  {!rdvLoaded ? (
                    <p className="text-gray-400 text-sm text-center py-4">Chargement…</p>
                  ) : todayAppts.length === 0 ? (
                    <div className="text-center py-6 text-gray-400">
                      <svg className="w-8 h-8 mx-auto mb-2 opacity-30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
                      <p className="text-sm">Aucun rendez-vous aujourd'hui</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {todayAppts.map(a => {
                        const sc = STATUS_COLORS[a.status] ?? STATUS_COLORS.PENDING;
                        return (
                          <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl"
                            style={{ background: "#f8fafc", border: "1px solid #f1f5f9" }}>
                            <div className="text-center min-w-[48px]">
                              <p className="text-sm font-black" style={{ color: "#f97316" }}>{a.startTime}</p>
                              <p className="text-xs text-gray-400">{a.endTime}</p>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 text-sm truncate">{a.customerName}</p>
                              <p className="text-xs text-gray-400 truncate">{a.serviceName || "—"}{a.vehicleMake ? ` · ${a.vehicleMake} ${a.vehicleModel ?? ""}` : ""}</p>
                            </div>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0"
                              style={{ background: sc.bg, color: sc.color }}>{sc.label}</span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </>
            );
          })()}

          {/* Bloc 1 — Code de parrainage (réservé aux abonnés) */}
          {referralUnlocked ? (
            <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: "#fed7aa" }}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Code de parrainage</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-orange-50 border border-orange-200 text-orange-700 font-mono font-bold text-lg px-4 py-2 rounded-xl tracking-widest select-all">
                  {garage.referralCode ?? "—"}
                </span>
                {garage.referralCode && (
                  <button type="button"
                    onClick={() => { navigator.clipboard.writeText(garage.referralCode!); setSuccess("Code copié ✓"); setTimeout(() => setSuccess(""), 3000); }}
                    className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                    Copier
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-3">Partagez ce code — le garage parrainé bénéficie de <strong>60 jours d&apos;essai gratuit</strong> au lieu de 30.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Programme de parrainage</p>
              <p className="text-sm text-gray-600 mb-3">
                Activez votre abonnement pour débloquer votre code de parrainage : le garage que vous parrainez obtient <strong>60 jours d&apos;essai gratuit</strong> au lieu de 30, et vous accédez au programme Ambassadeur (réductions sur votre facture, priorité dans la recherche, badge Certifié).
              </p>
              <button type="button" onClick={() => setActiveTab("abonnement")}
                className="text-sm font-bold text-white rounded-xl px-4 py-2" style={{ background: "#f97316" }}>
                Voir l&apos;abonnement
              </button>
            </div>
          )}

          {/* Bloc 2 — Programme Ambassadeur (réservé aux abonnés) */}
          {referralUnlocked && (
            <AmbassadorOverviewCard
              tier={garage.ambassadorTier ?? 0}
              onViewDetails={() => setActiveTab("ambassadeur")}
            />
          )}

          {/* Suggestion link */}
          <Link
            href="/suggestions"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl border-2 text-sm font-semibold transition-all hover:opacity-80"
            style={{ borderColor: "#f97316", color: "#f97316", background: "rgba(249,115,22,0.05)" }}
          >
            {d.suggestionLink}
          </Link>

          {/* ── Calendrier & Rendez-vous ─────────────────────────────────── */}
          {/* Calendar header */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">
                  {MONTH_NAMES_FR[calMonth]} {calYear}
                </h2>
                <p className="hidden sm:block text-gray-500 text-sm">Cliquez pour sélectionner · recliquez pour désélectionner · <kbd className="bg-gray-100 px-1 rounded text-xs">Maj</kbd>+clic pour une plage</p>
                <p className="sm:hidden text-gray-500 text-xs">Touchez un jour pour le sélectionner</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => changeMonth(-1)}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600">
                  ←
                </button>
                <button onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); setSelectedDays([]); setRdvLoaded(false); }}
                  className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium">
                  Aujourd'hui
                </button>
                <button onClick={() => changeMonth(1)}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600">
                  →
                </button>
              </div>
            </div>
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 text-center" style={{ borderBottom: "1px solid #f1f5f9" }}>
              {DAY_ABBR_FR.map((d) => (
                <div key={d} className="py-2 text-xs font-bold text-gray-400">{d}</div>
              ))}
            </div>
            {/* Calendar grid */}
            <div className="grid grid-cols-7">
              {Array.from({ length: firstDayOfWeek }).map((_, i) => (
                <div key={`empty-${i}`} className="h-16 border-r border-b border-gray-50" />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dayStr = toDateStr(day);
                const isToday = dayStr === `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
                const isSelected = selectedDays.includes(dayStr);
                const apptCount  = apptCountForDay(dayStr);
                const blockCount = blockCountForDay(dayStr);
                const colIndex = (firstDayOfWeek + i) % 7;
                return (
                  <button key={day}
                    onClick={(e) => toggleDay(dayStr, e)}
                    title="Clic = sélectionner · Ctrl+clic = ajouter · Maj+clic = plage"
                    className={`h-16 flex flex-col items-start p-1.5 text-left transition-colors border-b border-gray-100 ${colIndex < 6 ? "border-r" : ""} ${isSelected ? "bg-orange-50" : "hover:bg-gray-50"}`}
                  >
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-0.5 ${isToday ? "text-white" : isSelected ? "text-white" : "text-gray-700"}`}
                      style={isToday && !isSelected ? { background: "#f97316" } : isSelected ? { background: "#f97316", outline: "2px solid #ea580c", outlineOffset: "1px" } : {}}>
                      {day}
                    </span>
                    <div className="flex flex-wrap gap-0.5">
                      {apptCount > 0 && (
                        <span className="text-xs px-1 rounded font-bold leading-tight"
                          style={{ background: "#fef3c7", color: "#92400e" }}>
                          {apptCount} RDV
                        </span>
                      )}
                      {blockCount > 0 && (
                        <span className="flex items-center gap-0.5 text-xs px-1 rounded font-bold leading-tight"
                          style={{ background: "#fee2e2", color: "#991b1b" }}>
                          <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                          {blockCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-full font-semibold" style={{ background: "#fef3c7", color: "#92400e" }}>RDV — rendez-vous</span>
            <span className="px-2.5 py-1 rounded-full font-semibold" style={{ background: "#fee2e2", color: "#991b1b" }}>créneau bloqué</span>
            {selectedDays.length > 0 && (
              <button onClick={() => setSelectedDays([])}
                className="ml-auto text-gray-400 hover:text-gray-600 font-semibold underline">
                Tout désélectionner ({selectedDays.length})
              </button>
            )}
          </div>

          {/* Selected day(s) detail */}
          {selectedDays.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                {isMultiSelect ? (
                  <div>
                    <h3 className="font-bold text-gray-900">
                      {selectedDays.length} jours sélectionnés
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedDays.map(d => new Date(d + "T12:00:00").toLocaleDateString("fr-CA", { day: "numeric", month: "short" })).join(" · ")}
                    </p>
                  </div>
                ) : (
                  <h3 className="font-bold text-gray-900">
                    {new Date(selectedDay! + "T12:00:00").toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" })}
                  </h3>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => { setManualForm(f => ({ ...f, date: isMultiSelect ? "" : selectedDay! })); setShowManualForm(true); setShowBlockForm(false); }}
                    className="text-white text-sm px-4 py-2 rounded-xl font-semibold"
                    style={{ background: "#f97316" }}>
                    {isMultiSelect ? `+ RDV sur ${selectedDays.length} jours` : "+ Nouveau RDV"}
                  </button>
                  <button
                    onClick={() => { setBlockForm(f => ({ ...f, date: isMultiSelect ? "" : selectedDay! })); setShowBlockForm(true); setShowManualForm(false); }}
                    className="text-sm px-4 py-2 rounded-xl font-semibold border"
                    style={{ background: "#fef2f2", borderColor: "#fca5a5", color: "#dc2626" }}>
                    {isMultiSelect ? `Bloquer ${selectedDays.length} jours` : "Bloquer ce créneau"}
                  </button>
                </div>
              </div>

              {/* Manual RDV form */}
              {showManualForm && (
                <div className="rounded-xl p-4 mb-4" style={{ background: "#fff4ed", border: "1px solid #fed7aa" }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-sm">Nouveau rendez-vous</h4>
                    <button onClick={() => setShowManualForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                  </div>
                  <form onSubmit={isMultiSelect ? saveBulkManualRdv : saveManualRdv} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Nom du client *</label>
                        <input className={inputClass} required value={manualForm.customerName} onChange={e=>setManualForm(f=>({...f,customerName:e.target.value}))} placeholder="Jean Tremblay" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Téléphone *</label>
                        <input className={inputClass} required type="tel" value={manualForm.customerPhone} onChange={e=>setManualForm(f=>({...f,customerPhone:e.target.value}))} placeholder="514 555-0100" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Courriel</label>
                        <input className={inputClass} type="email" value={manualForm.customerEmail} onChange={e=>setManualForm(f=>({...f,customerEmail:e.target.value}))} placeholder="jean@exemple.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Service</label>
                        <input className={inputClass} value={manualForm.serviceName} onChange={e=>setManualForm(f=>({...f,serviceName:e.target.value}))} placeholder="Vidange" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Heure *</label>
                        <input className={inputClass} required type="time" value={manualForm.startTime} onChange={e=>setManualForm(f=>({...f,startTime:e.target.value}))} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Marque</label>
                        <input className={inputClass} value={manualForm.vehicleMake} onChange={e=>setManualForm(f=>({...f,vehicleMake:e.target.value}))} placeholder="Toyota" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Modèle</label>
                        <input className={inputClass} value={manualForm.vehicleModel} onChange={e=>setManualForm(f=>({...f,vehicleModel:e.target.value}))} placeholder="Camry" />
                      </div>
                    </div>
                    <div className="flex gap-2 pt-1">
                      <button type="submit" disabled={savingRdv} className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "#f97316" }}>
                        {savingRdv ? "Ajout…" : "Ajouter"}
                      </button>
                      <button type="button" onClick={() => setShowManualForm(false)} className="border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">Annuler</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Block slot form */}
              {showBlockForm && (
                <div className="rounded-xl p-4 mb-4" style={{ background: "#fef2f2", border: "1px solid #fca5a5" }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-sm">Bloquer un créneau</h4>
                    <button onClick={() => setShowBlockForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                  </div>
                  <form onSubmit={isMultiSelect ? saveBulkBlock : saveBlockSlot} className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={blockForm.allDay}
                        onChange={e => setBlockForm(f => ({ ...f, allDay: e.target.checked }))}
                        className="accent-red-500 w-4 h-4" />
                      Journée entière
                    </label>
                    {!blockForm.allDay && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Heure début</label>
                          <input className={inputClass} type="time" value={blockForm.startTime} onChange={e=>setBlockForm(f=>({...f,startTime:e.target.value}))} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Heure fin</label>
                          <input className={inputClass} type="time" value={blockForm.endTime} onChange={e=>setBlockForm(f=>({...f,endTime:e.target.value}))} />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Raison (optionnel)</label>
                      <input className={inputClass} value={blockForm.reason} onChange={e=>setBlockForm(f=>({...f,reason:e.target.value}))} placeholder="Congé, formation, fermeture exceptionnelle…" />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={savingBlock}
                        className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                        style={{ background: "#dc2626" }}>
                        {savingBlock ? "Blocage…" : isMultiSelect ? `Bloquer ${selectedDays.length} jours` : "Bloquer le créneau"}
                      </button>
                      <button type="button" onClick={() => setShowBlockForm(false)} className="border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">Annuler</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Multi-day summary */}
              {isMultiSelect && !showManualForm && !showBlockForm && (
                <MultiDaySummary
                  appointments={appointments}
                  selectedDays={selectedDays}
                  blockedSlots={blockedSlots}
                  onDeleteBlock={deleteBlockSlot}
                />
              )}

              {/* Single-day: appointments */}
              {!isMultiSelect && selectedDayAppts.length > 0 && (
                <div className="space-y-3 mb-4">
                  <p className="text-sm font-semibold text-gray-700">Rendez-vous ({selectedDayAppts.length})</p>
                  {selectedDayAppts.map(a => {
                    const sc = STATUS_COLORS[a.status] ?? STATUS_COLORS.PENDING;
                    return (
                      <div key={a.id} className="flex items-start gap-3 bg-gray-50 rounded-xl p-3 border border-gray-100">
                        <div className="text-center min-w-[50px]">
                          <p className="text-lg font-extrabold text-orange-500 leading-none">{a.startTime}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-bold text-gray-900 text-sm">{a.customerName}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
                          </div>
                          <p className="text-xs text-gray-500">{a.customerPhone}{a.serviceName ? ` · ${a.serviceName}` : ""}</p>
                          {(a as any).notes && (
                            <p className="text-xs mt-1 px-2 py-1 rounded-lg" style={{ background: "#fef9f0", color: "#92400e", border: "1px solid #fde68a" }}>
                              💬 {(a as any).notes}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {a.status === "PENDING" && <>
                              <button onClick={() => updateApptStatus(a.id, "CONFIRMED")} className="text-xs px-2.5 py-0.5 rounded-lg bg-green-50 text-green-700 border border-green-200 font-semibold">✓ Confirmer</button>
                              <button onClick={() => updateApptStatus(a.id, "CANCELLED")} className="text-xs px-2.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200 font-semibold">✗ Refuser</button>
                            </>}
                            {a.status === "CONFIRMED" && <>
                              <button onClick={() => updateApptStatus(a.id, "COMPLETED")} className="text-xs px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-semibold">✓ Terminé</button>
                              <button onClick={() => updateApptStatus(a.id, "CANCELLED")} className="text-xs px-2.5 py-0.5 rounded-lg bg-gray-50 text-gray-500 border border-gray-200 font-semibold">Annuler</button>
                            </>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Single-day: blocked slots */}
              {!isMultiSelect && selectedDayBlocks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Créneaux bloqués</p>
                  {selectedDayBlocks.map(s => (
                    <div key={s.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#fef2f2", border: "1px solid #fca5a5" }}>
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-800">
                          {s.allDay ? "Journée entière" : `${s.startTime} – ${s.endTime}`}
                        </p>
                        {s.reason && <p className="text-xs text-red-600">{s.reason}</p>}
                      </div>
                      <button onClick={() => deleteBlockSlot(s.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-semibold px-2">
                        Retirer
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!isMultiSelect && selectedDayAppts.length === 0 && selectedDayBlocks.length === 0 && !showManualForm && !showBlockForm && (
                <p className="text-gray-400 text-sm text-center py-4">Aucun événement ce jour.</p>
              )}
            </div>
          )}

          {/* Upcoming appointments list */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Prochains rendez-vous</h3>
            {!rdvLoaded ? (
              <div className="text-gray-400 text-sm text-center py-8">Chargement…</div>
            ) : appointments.filter(a => a.status !== "CANCELLED" && a.status !== "COMPLETED").length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">Aucun rendez-vous à venir.</p>
            ) : (
              <div className="space-y-2">
                {appointments
                  .filter(a => a.status !== "CANCELLED" && a.status !== "COMPLETED")
                  .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                  .slice(0, 10)
                  .map(a => {
                    const sc = STATUS_COLORS[a.status] ?? STATUS_COLORS.PENDING;
                    const dateObj = new Date(a.date + "T12:00:00");
                    const dateFr = dateObj.toLocaleDateString("fr-CA", { weekday: "short", day: "numeric", month: "short" });
                    return (
                      <div key={a.id} className="p-3 rounded-xl border border-gray-100 hover:bg-gray-50 space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="text-center bg-gray-50 rounded-xl px-2.5 py-1.5 border border-gray-100 min-w-[64px] flex-shrink-0">
                            <p className="text-xs text-gray-400 font-medium capitalize">{dateFr.split(" ")[0]}</p>
                            <p className="text-base font-extrabold text-gray-900 leading-none">{dateObj.getDate()}</p>
                            <p className="text-xs font-bold text-orange-500">{a.startTime}</p>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-bold text-gray-900 text-sm">{a.customerName}</p>
                            <p className="text-xs text-gray-500">{a.customerPhone}{a.serviceName ? ` · ${a.serviceName}` : ""}</p>
                            {(a.vehicleMake || a.vehicleModel) && (
                              <p className="text-xs text-gray-400">{[a.vehicleYear, a.vehicleMake, a.vehicleModel].filter(Boolean).join(" ")}</p>
                            )}
                            {(a as any).notes && (
                              <p className="text-xs mt-0.5 px-2 py-0.5 rounded-lg" style={{ background: "#fef9f0", color: "#92400e", border: "1px solid #fde68a" }}>
                                💬 {(a as any).notes}
                              </p>
                            )}
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0" style={{ backgroundColor: sc.bg, color: sc.color }}>
                            {sc.label}
                          </span>
                        </div>
                        {/* Actions */}
                        <div className="flex flex-wrap gap-1.5 pl-[76px]">
                          {a.status === "PENDING" && (
                            <button onClick={() => updateApptStatus(a.id, "CONFIRMED")}
                              className="text-xs px-2.5 py-0.5 rounded-lg bg-green-50 text-green-700 border border-green-200 font-semibold hover:bg-green-100 transition-colors">
                              ✓ Confirmer
                            </button>
                          )}
                          {a.status === "CONFIRMED" && (
                            <button onClick={() => updateApptStatus(a.id, "COMPLETED")}
                              className="text-xs px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-semibold hover:bg-purple-100 transition-colors">
                              ✓ Terminé
                            </button>
                          )}
                          {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                            <button onClick={() => {
                              setRescheduleAppt(a);
                              setRescheduleDate(a.date);
                              fetchGarageSlots(a.date, a.id);
                            }}
                              className="text-xs px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold hover:bg-blue-100 transition-colors">
                              📅 Déplacer
                            </button>
                          )}
                          {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                            <button onClick={async () => {
                              if (!window.confirm("Annuler ce rendez-vous ?")) return;
                              await updateApptStatus(a.id, "CANCELLED");
                            }}
                              className="text-xs px-2.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200 font-semibold hover:bg-red-100 transition-colors">
                              ✗ Annuler
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Reviews with reply + moderation */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">Avis clients</h3>
              <span className="text-sm text-gray-400">{reviews.length} avis</span>
            </div>

            {reviews.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun avis pour l'instant. Encouragez vos clients à laisser un avis!</p>
            ) : (
              <div className="space-y-4">
                {reviews.map((r: any) => (
                  <div key={r.id} className="rounded-xl border p-4 transition-all bg-white border-gray-200">
                    {/* Review header */}
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
                          style={{ background: "#fff4ed", color: "#f97316" }}>
                          {(r.user?.name ?? "?")[0].toUpperCase()}
                        </div>
                        <div>
                          <span className="font-semibold text-sm text-gray-900">{r.user?.name ?? "Anonyme"}</span>
                          <div className="flex items-center gap-1">
                            <span className="text-yellow-400 text-xs">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {reportSent === r.id ? (
                          <span className="text-xs px-2.5 py-1 rounded-lg font-medium bg-green-50 text-green-700 border border-green-200">✓ Signalement envoyé</span>
                        ) : (
                          <button
                            onClick={() => { setReportingId(reportingId === r.id ? null : r.id); setReportReason(""); }}
                            className="text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors"
                            style={{ background: reportingId === r.id ? "#fef2f2" : undefined, borderColor: "#fca5a5", color: "#dc2626" }}>
                            🚩 Signaler
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (replyingTo === r.id) { setReplyingTo(null); setReplyText(""); }
                            else { setReplyingTo(r.id); setReplyText(r.ownerReply ?? ""); }
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors"
                          style={{ background: "#fff4ed", borderColor: "#fed7aa", color: "#c2410c" }}>
                          {r.ownerReply ? "✏️ Modifier" : "💬 Répondre"}
                        </button>
                      </div>
                    </div>

                    {r.title && <p className="text-sm font-semibold text-gray-800 mb-1">{r.title}</p>}
                    {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}

                    {/* Formulaire de signalement */}
                    {reportingId === r.id && (
                      <div className="mt-3 rounded-xl p-4 space-y-3" style={{ background: "#fef2f2", border: "1px solid #fca5a5" }}>
                        <p className="text-xs font-bold text-red-700">Signaler cet avis à l&apos;équipe Garago</p>
                        <p className="text-xs text-red-600">Décrivez pourquoi vous souhaitez signaler cet avis. Notre équipe examinera votre demande et décidera s&apos;il doit être retiré.</p>
                        <textarea
                          className={`${inputClass} min-h-[80px]`}
                          value={reportReason}
                          onChange={e => setReportReason(e.target.value)}
                          placeholder="Ex : avis diffamatoire, faux client, contenu inapproprié…"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitReport(r.id)}
                            disabled={sendingReport || !reportReason.trim()}
                            className="text-white text-xs px-4 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                            style={{ background: "#dc2626" }}>
                            {sendingReport ? "Envoi…" : "Confirmer le signalement"}
                          </button>
                          <button
                            onClick={() => { setReportingId(null); setReportReason(""); }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Existing reply */}
                    {r.ownerReply && replyingTo !== r.id && (
                      <div className="mt-3 rounded-lg p-3 text-sm" style={{ background: "#fff4ed", borderLeft: "3px solid #f97316" }}>
                        <p className="text-xs font-bold text-orange-600 mb-1">Votre réponse :</p>
                        <p className="text-gray-700">{r.ownerReply}</p>
                      </div>
                    )}

                    {/* Reply form */}
                    {replyingTo === r.id && (
                      <div className="mt-3 space-y-2">
                        <textarea
                          className={`${inputClass} min-h-[80px]`}
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="Rédigez votre réponse publique…"
                        />
                        <div className="flex gap-2">
                          <button onClick={() => saveReply(r.id)} disabled={savingReply}
                            className="text-white text-xs px-4 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                            style={{ background: "#f97316" }}>
                            {savingReply ? "Envoi…" : "Publier la réponse"}
                          </button>
                          {r.ownerReply && (
                            <button onClick={() => { setReplyText(""); saveReply(r.id); }}
                              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                              Supprimer la réponse
                            </button>
                          )}
                          <button onClick={() => { setReplyingTo(null); setReplyText(""); }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ SERVICES ════════════════════════════════════════════════════════ */}
      {activeTab === "services" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{d.services}</h2>
              <p className="text-gray-500 text-sm">Cochez les services que vous offrez et ajoutez vos prix</p>
            </div>
            <button onClick={saveServices} disabled={saving} className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "#f97316" }}>
              {saving ? d.saving : t.common.save}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SERVICE_CATEGORIES.map((cat) => {
              const active = services.find((s) => s.categoryId === cat.id);
              return (
                <div key={cat.id} className="border rounded-xl p-4 transition-all"
                  style={active ? { borderColor: "#fdba74", background: "#fff4ed" } : { borderColor: "#e5e7eb" }}>
                  <div className="flex items-center gap-3 mb-3">
                    <input type="checkbox" id={cat.id} checked={!!active} onChange={() => toggleService(cat.id, cat)} className="w-4 h-4 accent-orange-500" />
                    <label htmlFor={cat.id} className="flex items-center gap-2 cursor-pointer font-semibold text-gray-900 text-sm">
                      <ServiceIcon id={cat.id} size={18} className="text-gray-500" />{cat.name}
                    </label>
                  </div>
                  {active && (
                    <div className="grid grid-cols-1 gap-2 pl-7">
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Durée (min)</label>
                        <input type="number" className={inputClass} placeholder="Ex: 45" value={active.durationMin}
                          onChange={(e) => setServices(services.map((s) => s.categoryId === cat.id ? { ...s, durationMin: e.target.value } : s))} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ MARQUES ═════════════════════════════════════════════════════════ */}
      {activeTab === "marques" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{d.brands}</h2>
              <p className="text-gray-500 text-sm mt-0.5">Cliquez ✓ pour accepter, ✗ pour refuser.</p>
            </div>
            <button onClick={saveBrands} disabled={saving}
              className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 flex-shrink-0" style={{ background: "#f97316" }}>
              {saving ? d.saving : t.common.save}
            </button>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-5 pb-4 border-b border-gray-100">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-green-500 inline-flex items-center justify-center text-white font-bold text-xs">✓</span>Acceptée
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-red-500 inline-flex items-center justify-center text-white font-bold text-xs">✗</span>Refusée
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-gray-200 inline-block" />Non configurée
            </span>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {BRANDS.map(({ name: brand }) => {
              const status = getBrandStatus(brand);
              const isAccepted = status === "accepts";
              const isRefused  = status === "refuses";
              return (
                <div key={brand} className="relative flex flex-col items-center rounded-2xl border-2 transition-all duration-150 overflow-hidden"
                  style={isAccepted ? { borderColor: "#22c55e", backgroundColor: "#f0fdf4" } :
                         isRefused  ? { borderColor: "#ef4444", backgroundColor: "#fef2f2" } :
                         { borderColor: "#e2e8f0", backgroundColor: "#fafafa" }}>
                  {isAccepted && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm"><span className="text-white text-xs font-bold">✓</span></div>}
                  {isRefused  && <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow-sm"><span className="text-white text-xs font-bold">✗</span></div>}
                  <div className="w-full flex items-center justify-center pt-4 pb-2 px-3">
                    <div className="w-14 h-14 rounded-xl bg-white flex items-center justify-center" style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.10)", padding: 6 }}>
                      <BrandLogo brand={brand} size={44} />
                    </div>
                  </div>
                  <p className="text-center font-semibold text-gray-800 px-2 pb-2 leading-tight" style={{ fontSize: 11 }}>{brand}</p>
                  <div className="flex w-full border-t border-gray-100">
                    <button onClick={() => toggleBrand(brand, true)} title="Accepter"
                      className="flex-1 py-2 text-xs font-bold transition-colors"
                      style={isAccepted ? { backgroundColor: "#22c55e", color: "white" } : { backgroundColor: "transparent", color: "#6b7280" }}>✓</button>
                    <div className="w-px bg-gray-100" />
                    <button onClick={() => toggleBrand(brand, false)} title="Refuser"
                      className="flex-1 py-2 text-xs font-bold transition-colors"
                      style={isRefused ? { backgroundColor: "#ef4444", color: "white" } : { backgroundColor: "transparent", color: "#6b7280" }}>✗</button>
                  </div>
                  {isAccepted && getModelsForMake(brand).length > 0 && (
                    <button onClick={() => setExpandedBrand(brand)}
                      className="w-full py-1.5 text-xs font-semibold border-t border-gray-100 hover:bg-green-100 transition-colors"
                      style={{ color: "#166534" }}>
                      {brandModels[brand]?.length ? `${brandModels[brand].length} modèle${brandModels[brand].length > 1 ? "s" : ""}` : "Tous les modèles"}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ MODAL — modèles précis pour une marque ═══════════════════════════ */}
      {expandedBrand && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(11,31,58,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setExpandedBrand(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <h3 className="font-bold text-gray-900">Modèles {expandedBrand}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {brandModels[expandedBrand]?.length ? "Modèles sélectionnés uniquement" : "Aucune restriction — tous les modèles sont traités"}
                </p>
              </div>
              <button onClick={() => setExpandedBrand(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg">×</button>
            </div>
            <div className="p-4 overflow-y-auto">
              {brandModels[expandedBrand]?.length > 0 && (
                <button onClick={() => setBrandModels((prev) => ({ ...prev, [expandedBrand]: [] }))}
                  className="text-xs font-semibold mb-3" style={{ color: "#f97316" }}>
                  Retirer toutes les restrictions (tous les modèles)
                </button>
              )}
              <div className="grid grid-cols-2 gap-2">
                {getModelsForMake(expandedBrand).map((model) => {
                  const checked = brandModels[expandedBrand]?.includes(model) ?? false;
                  return (
                    <label key={model} className="flex items-center gap-2 text-sm px-2 py-1.5 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input type="checkbox" checked={checked} onChange={() => toggleBrandModel(expandedBrand, model)}
                        className="w-4 h-4 rounded" style={{ accentColor: "#f97316" }} />
                      <span className="text-gray-700">{model}</span>
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="px-6 py-4" style={{ borderTop: "1px solid #f1f5f9" }}>
              <button onClick={() => setExpandedBrand(null)} className="w-full text-white py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#f97316" }}>
                Terminé
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ HORAIRES ════════════════════════════════════════════════════════ */}
      {activeTab === "horaires" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">{d.hours}</h2>
              <p className="text-gray-500 text-sm">Configurez vos heures d'ouverture pour chaque jour</p>
            </div>
            <button onClick={saveHoraires} disabled={saving} className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "#f97316" }}>
              {saving ? d.saving : t.common.save}
            </button>
          </div>
          <div className="space-y-3 mt-5">
            {DAYS.map((day, i) => {
              const h = horaires[i];
              return (
                <div key={day} className={`flex items-center gap-4 p-3 rounded-xl border ${h.isClosed ? "border-gray-100 bg-gray-50" : "border-gray-200"}`}>
                  <span className="w-24 text-sm font-semibold text-gray-700">{day}</span>
                  <input type="time" value={h.openTime} onChange={(e) => setHoraireField(i, "openTime", e.target.value)}
                    disabled={h.isClosed} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm disabled:opacity-40" />
                  <span className="text-gray-400 text-sm">—</span>
                  <input type="time" value={h.closeTime} onChange={(e) => setHoraireField(i, "closeTime", e.target.value)}
                    disabled={h.isClosed} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm disabled:opacity-40" />
                  <label className="flex items-center gap-2 text-sm text-gray-600 ml-auto cursor-pointer">
                    <input type="checkbox" checked={h.isClosed} onChange={(e) => setHoraireField(i, "isClosed", e.target.checked)} className="accent-red-500" />
                    Fermé
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ MODAL RESCHEDULE ════════════════════════════════════════════════ */}
      {rescheduleAppt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(11,31,58,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setRescheduleAppt(null); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 flex items-center justify-between"
              style={{ borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <h3 className="font-bold text-gray-900">Déplacer le rendez-vous</h3>
                <p className="text-xs text-gray-500 mt-0.5">{rescheduleAppt.customerName} · {rescheduleAppt.serviceName || "—"}</p>
              </div>
              <button onClick={() => setRescheduleAppt(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg">
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Date picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Nouvelle date</label>
                <input
                  type="date"
                  className="block w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400"
                  value={rescheduleDate}
                  min={new Date().toISOString().slice(0, 10)}
                  onChange={e => {
                    setRescheduleDate(e.target.value);
                    if (e.target.value) fetchGarageSlots(e.target.value, rescheduleAppt.id);
                  }}
                />
              </div>

              {/* Slots */}
              {rescheduleDate && (
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Créneau disponible</label>
                  {slotsLoading ? (
                    <p className="text-sm text-gray-400 text-center py-3">Chargement des disponibilités…</p>
                  ) : slotsClosed ? (
                    <div className="text-center py-4 rounded-xl" style={{ background: "#fef2f2" }}>
                      <p className="text-sm font-semibold text-red-700">Fermé ce jour</p>
                      <p className="text-xs text-red-500 mt-1">Choisissez une autre date</p>
                    </div>
                  ) : rescheduleSlots.length === 0 ? (
                    <div className="text-center py-4 rounded-xl bg-gray-50">
                      <p className="text-sm text-gray-500">Aucun créneau disponible ce jour</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {rescheduleSlots.map(slot => (
                        <button key={slot} type="button"
                          onClick={() => setRescheduleSlot(slot === rescheduleSlot ? "" : slot)}
                          className="py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                          style={slot === rescheduleSlot
                            ? { background: "#f97316", borderColor: "#f97316", color: "#fff" }
                            : { background: "#fff4ed", borderColor: "#fed7aa", color: "#c2410c" }}>
                          {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button type="button" onClick={() => setRescheduleAppt(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                Annuler
              </button>
              <button type="button"
                disabled={!rescheduleSlot || !rescheduleDate || rescheduleLoading}
                onClick={submitReschedule}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                style={{ background: "linear-gradient(135deg, #f97316, #ea6c0a)" }}>
                {rescheduleLoading ? "Déplacement…" : "Confirmer le déplacement"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ PROFIL ══════════════════════════════════════════════════════════ */}
      {activeTab === "profil" && (
        <div className="space-y-6">
          {/* Media uploads */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-5">Images du profil public</h2>

            {/* Cover image */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-2">Image de couverture</label>

              {/* Draggable preview */}
              <div
                className={`relative h-36 rounded-xl overflow-hidden border-2 border-dashed mb-3 transition-colors group select-none ${garage.coverUrl ? "border-orange-300 cursor-grab active:cursor-grabbing" : "border-gray-300 hover:border-orange-400 cursor-pointer"}`}
                onClick={!garage.coverUrl ? () => coverInputRef.current?.click() : undefined}
                onPointerDown={garage.coverUrl ? (e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                  coverDrag.current = { active: true, startX: e.clientX, startY: e.clientY, otx: coverPos.tx, oty: coverPos.ty };
                } : undefined}
                onPointerMove={garage.coverUrl ? (e) => {
                  if (!coverDrag.current?.active) return;
                  const rect = e.currentTarget.getBoundingClientRect();
                  const dx = (e.clientX - coverDrag.current.startX) / rect.width  * 100;
                  const dy = (e.clientY - coverDrag.current.startY) / rect.height * 100;
                  setCoverPos(p => ({
                    ...p,
                    tx: coverDrag.current!.otx + dx,
                    ty: coverDrag.current!.oty + dy,
                  }));
                } : undefined}
                onPointerUp={() => { if (coverDrag.current) coverDrag.current.active = false; }}
                onPointerCancel={() => { if (coverDrag.current) coverDrag.current.active = false; }}
              >
                {garage.coverUrl ? (
                  <>
                    {/* Background layer — blurred or solid */}
                    {coverBgColor === null ? (
                      <div style={{
                        position: "absolute", inset: "-20px",
                        backgroundImage: `url(${garage.coverUrl})`,
                        backgroundSize: "cover", backgroundPosition: "center",
                        filter: "blur(18px) brightness(0.85)",
                      }} />
                    ) : (
                      <div style={{ position: "absolute", inset: 0, background: coverBgColor }} />
                    )}
                    <img
                      src={garage.coverUrl}
                      alt="Cover"
                      draggable={false}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        transform: `translate(${coverPos.tx}%, ${coverPos.ty}%) scale(${coverPos.zoom})`,
                        transformOrigin: "center center",
                        userSelect: "none",
                        pointerEvents: "none",
                      }}
                    />
                    <div className="absolute inset-0 flex items-end justify-between p-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-lg font-medium">✋ Glisser pour repositionner</span>
                      <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-lg font-mono">{Math.round(coverPos.tx)}% / {Math.round(coverPos.ty)}%</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center"
                    style={{ background: "linear-gradient(90deg, #071428 0%, #0b1f3a 60%, #f97316 100%)" }}>
                    <span className="text-white/60 text-sm">Cliquez pour télécharger une image de couverture</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              {garage.coverUrl && (
                <div className="space-y-2">
                  {/* Zoom slider */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16 flex-shrink-0">🔍 Zoom</span>
                    <input
                      type="range" min="0.2" max="3" step="0.01"
                      value={coverPos.zoom}
                      onChange={e => setCoverPos(p => ({ ...p, zoom: parseFloat(e.target.value) }))}
                      className="flex-1 accent-orange-500 h-2 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 w-10 text-right font-mono">{Math.round(coverPos.zoom * 100)}%</span>
                  </div>
                  {/* Background color toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500 w-16 flex-shrink-0">🖼 Fond</span>
                    <button type="button"
                      onClick={() => setShowCoverColorPicker(v => !v)}
                      className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600 font-medium">
                      <div className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                        style={{ background: coverBgColor ?? "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)" }} />
                      {coverBgColor ?? "Auto"}
                    </button>
                    {coverBgColor && (
                      <button type="button" onClick={() => { setCoverBgColor(null); setShowCoverColorPicker(false); }}
                        className="text-xs text-gray-400 hover:text-gray-600 font-bold">✕</button>
                    )}
                    <button type="button" title="Pipette — choisir une couleur à l'écran"
                      onClick={async () => {
                        if (!("EyeDropper" in window)) { alert("Pipette non disponible sur ce navigateur (Chrome/Edge requis)."); return; }
                        try { const { sRGBHex } = await (new (window as any).EyeDropper()).open(); setCoverBgColor(sRGBHex); setShowCoverColorPicker(false); } catch { /**/ }
                      }}
                      className="text-xs px-2.5 py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium">
                      🔬 Pipette
                    </button>
                  </div>
                  {showCoverColorPicker && (
                    <BgColorPicker
                      value={coverBgColor}
                      onChange={setCoverBgColor}
                      onClose={() => setShowCoverColorPicker(false)}
                    />
                  )}
                  <div className="flex items-center gap-2">
                    <button type="button"
                      onClick={() => coverInputRef.current?.click()}
                      className="text-xs px-3 py-1.5 rounded-lg font-semibold border"
                      style={{ background: "#fff4ed", borderColor: "#fed7aa", color: "#c2410c" }}>
                      {uploadingCover ? "Téléchargement…" : "📷 Changer l'image"}
                    </button>
                    <button type="button"
                      onClick={() => setCoverPos({ tx: 0, ty: 0, zoom: 1 })}
                      className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50">
                      Réinitialiser
                    </button>
                    <span className="text-xs text-gray-400 ml-1">Sauvegardez pour appliquer</span>
                  </div>
                </div>
              )}
              {!garage.coverUrl && (
                <button type="button" onClick={() => coverInputRef.current?.click()}
                  className="text-sm px-4 py-2 rounded-xl font-semibold border"
                  style={{ background: "#fff4ed", borderColor: "#fed7aa", color: "#c2410c" }}>
                  {uploadingCover ? "Téléchargement…" : "📷 Télécharger une couverture"}
                </button>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, "cover"); e.target.value = ""; }} />
              <p className="text-xs text-gray-400 mt-2">Recommandé : 1200×400 px, JPG ou PNG.</p>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Logo du garage</label>
              <div className="flex items-start gap-4">
                {/* Draggable Preview */}
                <div className="flex-shrink-0">
                  <div
                    className={`relative w-24 h-24 rounded-2xl overflow-hidden border-2 border-dashed transition-colors group select-none ${garage.logoUrl ? "border-orange-300 cursor-grab active:cursor-grabbing" : "border-gray-300 hover:border-orange-400 cursor-pointer"}`}
                    onClick={!garage.logoUrl ? () => logoInputRef.current?.click() : undefined}
                    onPointerDown={garage.logoUrl ? (e) => {
                      e.currentTarget.setPointerCapture(e.pointerId);
                      logoDrag.current = { active: true, startX: e.clientX, startY: e.clientY, otx: logoPos.tx, oty: logoPos.ty };
                    } : undefined}
                    onPointerMove={garage.logoUrl ? (e) => {
                      if (!logoDrag.current?.active) return;
                      const rect = e.currentTarget.getBoundingClientRect();
                      const dx = (e.clientX - logoDrag.current.startX) / rect.width  * 100;
                      const dy = (e.clientY - logoDrag.current.startY) / rect.height * 100;
                      setLogoPos(p => ({
                        ...p,
                        tx: logoDrag.current!.otx + dx,
                        ty: logoDrag.current!.oty + dy,
                      }));
                    } : undefined}
                    onPointerUp={() => { if (logoDrag.current) logoDrag.current.active = false; }}
                    onPointerCancel={() => { if (logoDrag.current) logoDrag.current.active = false; }}
                  >
                    {garage.logoUrl ? (
                      <>
                        {/* Background layer — blurred or solid */}
                        {logoBgColor === null ? (
                          <div style={{
                            position: "absolute", inset: "-10px",
                            backgroundImage: `url(${garage.logoUrl})`,
                            backgroundSize: "cover", backgroundPosition: "center",
                            filter: "blur(12px)",
                          }} />
                        ) : (
                          <div style={{ position: "absolute", inset: 0, background: logoBgColor }} />
                        )}
                        <img
                          src={garage.logoUrl}
                          alt="Logo"
                          draggable={false}
                          style={{
                            position: "absolute",
                            inset: 0,
                            width: "100%",
                            height: "100%",
                            objectFit: "contain",
                            transform: `translate(${logoPos.tx}%, ${logoPos.ty}%) scale(${logoPos.zoom})`,
                            transformOrigin: "center center",
                            userSelect: "none",
                            pointerEvents: "none",
                          }}
                        />
                      </>
                    ) : (
                      <div className="w-full h-full bg-gray-50 flex items-center justify-center text-3xl">🔧</div>
                    )}
                  </div>

                  {/* Zoom slider for logo */}
                  {garage.logoUrl && (
                    <div className="mt-2 w-24 space-y-1.5 relative">
                      <input
                        type="range" min="0.2" max="3" step="0.01"
                        value={logoPos.zoom}
                        onChange={e => setLogoPos(p => ({ ...p, zoom: parseFloat(e.target.value) }))}
                        className="w-full accent-orange-500 cursor-pointer"
                      />
                      <p className="text-xs text-gray-400 text-center font-mono">{Math.round(logoPos.zoom * 100)}%</p>
                      {/* Background colour toggle */}
                      <div className="flex items-center gap-1 pt-0.5">
                        <button type="button"
                          onClick={() => setShowLogoColorPicker(v => !v)}
                          className="flex items-center gap-1 text-xs px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-500 flex-1 justify-center">
                          <div className="w-3.5 h-3.5 rounded border border-gray-300 flex-shrink-0"
                            style={{ background: logoBgColor ?? "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)" }} />
                          🖼
                        </button>
                        {logoBgColor && (
                          <button type="button" onClick={() => { setLogoBgColor(null); setShowLogoColorPicker(false); }}
                            className="text-xs text-gray-400 hover:text-gray-600 font-bold">✕</button>
                        )}
                        <button type="button" title="Pipette"
                          onClick={async () => {
                            if (!("EyeDropper" in window)) { alert("Pipette non disponible."); return; }
                            try { const { sRGBHex } = await (new (window as any).EyeDropper()).open(); setLogoBgColor(sRGBHex); setShowLogoColorPicker(false); } catch { /**/ }
                          }}
                          className="text-xs px-1.5 py-0.5 rounded border border-gray-200 hover:bg-gray-50 text-gray-500">
                          🔬
                        </button>
                      </div>
                      {showLogoColorPicker && (
                        <div className="absolute left-0 top-full mt-1 z-20 w-72">
                          <BgColorPicker
                            value={logoBgColor}
                            onChange={setLogoBgColor}
                            onClose={() => setShowLogoColorPicker(false)}
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-3">Votre logo apparaît sur votre profil public à côté de votre nom.</p>
                  {garage.logoUrl && (
                    <p className="text-xs text-gray-500 mb-2">
                      ✋ <strong>Glisser</strong> le logo pour le repositionner<br />
                      🔍 <strong>Curseur</strong> pour zoomer / dézoomer
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => logoInputRef.current?.click()}
                      className="text-sm px-4 py-2 rounded-xl font-semibold border"
                      style={{ background: "#fff4ed", borderColor: "#fed7aa", color: "#c2410c" }}>
                      {uploadingLogo ? "Téléchargement…" : "📷 Changer le logo"}
                    </button>
                    {garage.logoUrl && (
                      <button type="button" onClick={() => setLogoPos({ tx: 0, ty: 0, zoom: 1 })}
                        className="text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">
                        Réinitialiser
                      </button>
                    )}
                  </div>
                  {garage.logoUrl && (
                    <p className="text-xs text-gray-400 mt-2">Cliquez sur <strong>Sauvegarder le profil</strong> pour appliquer.</p>
                  )}
                </div>
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, "logo"); e.target.value = ""; }} />
            </div>
          </div>

          {/* Profile info form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-5">Informations du garage</h2>
            <form onSubmit={saveProfile} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom du garage</label>
                  <input type="text" className={inputClass} value={profileData.name ?? ""} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone</label>
                  <input type="tel" className={inputClass} value={profileData.phone ?? ""} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Adresse</label>
                <AddressAutocomplete onSelect={handleAddressSelect} initialValue={profileData.address ?? ""} inputClass={inputClass} />
                {profileData.latitude && profileData.longitude && (
                  <p className="text-xs text-green-600 mt-1 font-medium">✓ Coordonnées enregistrées — les clients proches vous trouveront en priorité</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Courriel public</label>
                <input type="email" className={inputClass} value={profileData.email ?? ""} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={profileData.acceptsWalkIn ?? true} onChange={(e) => setProfileData({ ...profileData, acceptsWalkIn: e.target.checked })} className="accent-orange-500 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">Accepte sans rendez-vous</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={profileData.appointmentOnly ?? false} onChange={(e) => setProfileData({ ...profileData, appointmentOnly: e.target.checked })} className="accent-orange-500 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">Sur rendez-vous seulement</span>
                </label>
              </div>

              {/* Visibilité du courriel */}
              <div className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={profileData.emailPublic ?? false} onChange={(e) => setProfileData({ ...profileData, emailPublic: e.target.checked })} className="accent-orange-500 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">Afficher mon adresse courriel sur mon profil public</span>
                </label>
                <p className="text-xs text-gray-400 mt-1 ml-6">Si désactivé, votre courriel reste visible uniquement pour vous.</p>
              </div>

              <button type="submit" disabled={saving} className="text-white px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50" style={{ background: "#f97316" }}>
                {saving ? d.saving : d.save}
              </button>
            </form>
          </div>

          {/* ── Description section ─────────────────────────────────────────── */}
          <DescriptionSection garage={garage} inputClass={inputClass} onUpdated={(data) => setGarage((g: any) => ({ ...g, ...data }))} />

        </div>
      )}

      {/* ══ ABONNEMENT ══════════════════════════════════════════════════════ */}
      {activeTab === "abonnement" && (
        <div className="space-y-6">

          {/* ── Mes garages (visible depuis le garage principal) ── */}
          {garage.parentId === null && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-1">Mes garages</h2>
              <p className="text-sm text-gray-500 mb-4">
                Un seul abonnement couvre tous vos garages. 1<sup>er</sup> garage 109,99 $/mois, chaque garage supplémentaire +49,99 $/mois (−20 % en annuel). Chaque garage garde son profil, ses horaires et son agenda.
              </p>
              <div className="divide-y divide-gray-100">
                {myGarages.map((g) => {
                  const isCurrent = (selectedGarageId() ?? myGarages.find(x => x.parentId === null)?.id) === g.id;
                  return (
                    <div key={g.id} className="flex items-center gap-3 py-3">
                      <div className="w-9 h-9 rounded-lg bg-gray-900 text-white grid place-items-center text-xs font-bold flex-shrink-0">
                        {g.name.replace(/[^A-Za-zÀ-ÿ ]/g, "").split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-gray-900 truncate">{g.name}</p>
                        <p className="text-xs text-gray-400">
                          {g.city}{g.parentId === null ? " · garage principal" : " · +49,99 $/mois"}
                        </p>
                      </div>
                      {!isCurrent && (
                        <button onClick={() => switchGarage(g.id)}
                          className="text-xs font-bold text-orange-600 hover:underline flex-shrink-0">
                          Gérer →
                        </button>
                      )}
                      {g.parentId !== null && (
                        <button onClick={() => { if (window.confirm(`Retirer « ${g.name} » ? Le profil est masqué immédiatement et votre facture baisse de 49,99 $/mois.`)) removeBranch(g.id); }}
                          disabled={removingBranch === g.id}
                          className="text-xs font-semibold text-gray-400 hover:text-red-600 flex-shrink-0 disabled:opacity-50">
                          {removingBranch === g.id ? "…" : "Retirer"}
                        </button>
                      )}
                      {isCurrent && <span className="text-xs font-semibold text-gray-300 flex-shrink-0">affiché</span>}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => { setBranchError(""); setShowAddBranch(true); }}
                className="mt-4 w-full flex items-center justify-center gap-2 border-[1.5px] border-dashed border-gray-300 rounded-xl py-3 text-sm font-bold text-gray-600 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Ajouter une succursale
              </button>
            </div>
          )}

          {/* Modale — ajouter une succursale */}
          {showAddBranch && (
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-10" style={{ background: "rgba(11,31,58,0.5)" }}
              onClick={() => !branchSaving && setShowAddBranch(false)}>
              <form onSubmit={submitBranch} onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-black text-gray-900 mb-1">Ajouter une succursale</h3>
                <p className="text-sm text-gray-500 mb-4">Ce garage aura son propre profil, ses horaires et son agenda.</p>
                {branchError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{branchError}</p>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Nom du garage</label>
                    <input type="text" required className={inputClass} placeholder="Garage Tremblay — Brossard"
                      value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Adresse</label>
                    <AddressAutocomplete
                      initialValue={branchForm.address}
                      inputClass={inputClass}
                      onSelect={(r: AddressResult) => setBranchForm((f) => ({
                        ...f, address: r.streetAddress, city: r.city,
                        postalCode: r.postalCode, latitude: r.lat, longitude: r.lng,
                      }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">Téléphone</label>
                    <input type="tel" className={inputClass} placeholder="(450) 555-1234"
                      value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} />
                  </div>
                </div>
                <div className="rounded-xl p-3 mt-4" style={{ background: "#fff4ed", border: "1px solid #fed7aa" }}>
                  <p className="text-sm font-bold" style={{ color: "#ea6c0a" }}>+ 49,99 $/mois</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9a3412" }}>
                    {garage.subscriptionStatus === "ACTIVE"
                      ? "Facturé au prorata dès aujourd'hui, puis à chaque cycle. Le garage principal porte la facture."
                      : "Gratuit pendant votre essai. Facturé quand vous activerez votre abonnement."}
                  </p>
                </div>
                <div className="flex gap-2 mt-5">
                  <button type="button" onClick={() => setShowAddBranch(false)} disabled={branchSaving}
                    className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    Annuler
                  </button>
                  <button type="submit" disabled={branchSaving}
                    className="flex-1 text-white rounded-xl py-2.5 text-sm font-black disabled:opacity-50" style={{ background: "#f97316" }}>
                    {branchSaving ? "Ajout…" : "Ajouter la succursale"}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Succursale : l'abonnement est géré depuis le garage principal */}
          {garage.parentId !== null && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-1">Statut</h2>
              <p className="text-sm text-gray-500 mb-4">
                Cette succursale est couverte par l'abonnement de votre garage principal.
                La facturation, l'activation et la résiliation se gèrent depuis celui-ci.
              </p>
              <button
                onClick={() => { const p = myGarages.find(g => g.parentId === null); if (p) switchGarage(p.id); }}
                className="text-sm font-bold text-white rounded-xl px-4 py-2" style={{ background: "#f97316" }}>
                Aller au garage principal →
              </button>
            </div>
          )}

          {/* ── Statut de l'abonnement (garage principal) ── */}
          {garage.parentId === null && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-4">Statut</h2>

            {garage.subscriptionStatus === "TRIAL" && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                    Essai gratuit
                  </span>
                  {garage.subscriptionEndAt && (
                    <span className="text-sm text-gray-500">
                      jusqu'au {new Date(garage.subscriptionEndAt).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Votre garage est visible dans les résultats. Activez votre abonnement dès maintenant pour éviter toute coupure à la fin de l'essai.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => startCheckout("monthly")} disabled={checkoutLoading}
                    className="text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60" style={{ background: "#f97316" }}>
                    {checkoutLoading ? "Chargement…" : "Activer — 109,99 $/mois"}
                  </button>
                  <button onClick={() => startCheckout("annual")} disabled={checkoutLoading}
                    className="text-sm font-semibold underline hover:no-underline disabled:opacity-60" style={{ color: "#f97316" }}>
                    ou payer annuellement (88,00 $/mois, −20 %)
                  </button>
                </div>
              </>
            )}

            {garage.subscriptionStatus === "ACTIVE" && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#ecfdf5", color: "#047857", border: "1px solid #6ee7b7" }}>
                    Actif
                  </span>
                  {garage.subscriptionEndAt && (
                    <span className="text-sm text-gray-500">
                      {garage.cancelAtPeriodEnd ? "se termine le" : "prochain renouvellement le"}{" "}
                      {new Date(garage.subscriptionEndAt).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {garage.cancelAtPeriodEnd
                    ? "Votre abonnement ne se renouvellera pas. Vous gardez l'accès complet jusqu'à la date ci-dessus."
                    : "Votre garage apparaît dans les résultats de recherche et reçoit les réservations en ligne."}
                </p>
              </>
            )}

            {garage.subscriptionStatus === "PAST_DUE" && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
                    Paiement échoué
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Votre dernier prélèvement n'a pas abouti. {pastDueDeadline
                    ? `Mettez votre moyen de paiement à jour avant le ${pastDueDeadline} pour rester visible dans la recherche.`
                    : "Mettez votre moyen de paiement à jour pour rester visible dans la recherche."}
                </p>
                <button onClick={openBillingPortal} disabled={portalLoading}
                  className="text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60" style={{ background: "#f97316" }}>
                  {portalLoading ? "Ouverture…" : "Mettre à jour ma carte"}
                </button>
              </>
            )}

            {garage.subscriptionStatus === "EXPIRED" && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
                    Expiré
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Votre garage n'apparaît plus dans les résultats de recherche. Activez votre abonnement pour redevenir visible.
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => startCheckout("monthly")} disabled={checkoutLoading}
                    className="text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60" style={{ background: "#f97316" }}>
                    {checkoutLoading ? "Chargement…" : "Activer — 109,99 $/mois"}
                  </button>
                  <button onClick={() => startCheckout("annual")} disabled={checkoutLoading}
                    className="text-sm font-semibold underline hover:no-underline disabled:opacity-60" style={{ color: "#f97316" }}>
                    ou payer annuellement (88,00 $/mois, −20 %)
                  </button>
                </div>
              </>
            )}
          </div>
          )}

          {/* ── Prochaine facture + moyen de paiement (garage principal, abonné) ── */}
          {garage.parentId === null && garage.subscriptionStatus === "ACTIVE" && billing?.hasSubscription && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">Facturation</h2>

              <div className="flex items-baseline justify-between gap-3 pb-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">
                  {billing.cancelAtPeriodEnd
                    ? "Dernière facture avant résiliation"
                    : billing.interval === "year" ? "Prochaine facture annuelle" : "Prochaine facture mensuelle"}
                </span>
                <span className="text-xl font-black text-gray-900" style={{ fontVariantNumeric: "tabular-nums" }}>
                  {billing.nextAmount != null
                    ? `${(billing.nextAmount / 100).toLocaleString("fr-CA", { minimumFractionDigits: 2 })} ${billing.currency ?? "CAD"}`
                    : "—"}
                </span>
              </div>
              <div className="flex items-baseline justify-between gap-3 py-3 border-b border-gray-100">
                <span className="text-sm text-gray-500">
                  {billing.cancelAtPeriodEnd ? "Échéance" : "Date de prélèvement"}
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {billing.nextDate
                    ? new Date(billing.nextDate).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })
                    : "—"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 pt-3">
                <span className="text-sm text-gray-500">Moyen de paiement</span>
                <span className="text-sm font-bold text-gray-900">
                  {billing.paymentMethod?.type === "card"
                    ? `${(billing.paymentMethod.brand ?? "carte").replace(/^\w/, c => c.toUpperCase())} •••• ${billing.paymentMethod.last4}`
                    : billing.paymentMethod?.type === "acss_debit"
                    ? `Compte bancaire •••• ${billing.paymentMethod.last4 ?? ""}`
                    : billing.paymentMethod?.type ?? "—"}
                </span>
              </div>

              <button onClick={openBillingPortal} disabled={portalLoading}
                className="mt-4 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50">
                {portalLoading ? "Ouverture…" : "Modifier le moyen de paiement"}
              </button>
              <p className="text-xs text-gray-400 mt-2">
                Vous serez redirigé vers la page sécurisée de Stripe pour mettre à jour votre carte ou vos coordonnées bancaires et consulter vos factures.
              </p>
            </div>
          )}

          {/* ── Annulation / réactivation (abonnement actif, garage principal) ── */}
          {garage.parentId === null && garage.subscriptionStatus === "ACTIVE" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-1">Renouvellement</h2>
              {garage.cancelAtPeriodEnd ? (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Le renouvellement automatique est désactivé
                    {garage.subscriptionEndAt ? ` — votre accès reste complet jusqu'au ${new Date(garage.subscriptionEndAt).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}` : ""}.
                  </p>
                  {cancelError && <p className="text-xs text-red-600 mb-3">{cancelError}</p>}
                  <button onClick={() => cancelSubscription(true)} disabled={cancelLoading}
                    className="text-sm font-bold text-white rounded-xl px-4 py-2 disabled:opacity-50"
                    style={{ background: "#f97316" }}>
                    {cancelLoading ? "Chargement…" : "Réactiver le renouvellement"}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    Vous pouvez annuler à tout moment — vous garderez l'accès complet jusqu'à la fin de votre période déjà payée, sans renouvellement après.
                  </p>
                  {!showCancelConfirm ? (
                    <button onClick={() => setShowCancelConfirm(true)}
                      className="text-sm font-semibold text-gray-600 border border-gray-300 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors">
                      Annuler mon abonnement
                    </button>
                  ) : (
                    <div className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <p className="text-sm font-semibold text-gray-800 mb-3">
                        Confirmer l'annulation ? Vous garderez l'accès jusqu'à la fin de la période déjà payée, sans renouvellement ensuite.
                      </p>
                      {cancelError && <p className="text-xs text-red-600 mb-3">{cancelError}</p>}
                      <div className="flex gap-3">
                        <button onClick={() => cancelSubscription(false)} disabled={cancelLoading}
                          className="text-sm font-bold text-white bg-gray-800 rounded-xl px-4 py-2 hover:bg-gray-900 disabled:opacity-50">
                          {cancelLoading ? "Chargement…" : "Oui, annuler"}
                        </button>
                        <button onClick={() => setShowCancelConfirm(false)} disabled={cancelLoading}
                          className="text-sm font-semibold text-gray-600 rounded-xl px-4 py-2 hover:bg-gray-100">
                          Retour
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── Zone de suppression du compte ── */}
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
            <h2 className="font-bold text-red-700 text-lg mb-1">Supprimer mon compte</h2>
            <p className="text-sm text-gray-500 mb-4">
              Cette action est définitive. Votre abonnement sera annulé automatiquement, votre fiche garage sera retirée des résultats de recherche, et toutes vos données (services, avis, rendez-vous, statistiques) seront effacées — impossible à annuler.
            </p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)}
                className="text-sm font-bold text-red-600 border border-red-300 rounded-xl px-4 py-2 hover:bg-red-50 transition-colors">
                Supprimer définitivement mon compte
              </button>
            ) : (
              <div className="rounded-xl p-4" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <p className="text-sm font-semibold text-red-800 mb-3">Êtes-vous certain(e) ? Cette action est irréversible et annule votre abonnement.</p>
                {deleteError && <p className="text-xs text-red-600 mb-3">{deleteError}</p>}
                <div className="flex gap-3">
                  <button onClick={deleteAccount} disabled={deleting}
                    className="text-sm font-bold text-white bg-red-600 rounded-xl px-4 py-2 hover:bg-red-700 disabled:opacity-50">
                    {deleting ? "Suppression…" : "Oui, tout supprimer"}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                    className="text-sm font-semibold text-gray-600 rounded-xl px-4 py-2 hover:bg-gray-100">
                    Annuler
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══ AMBASSADEUR ══════════════════════════════════════════════════════ */}
      {activeTab === "ambassadeur" && referralUnlocked && garage.ambassadorTier >= 1 && (
        <AmbassadeurTab
          tier={garage.ambassadorTier ?? 0}
          count={garage.referralCount ?? 0}
          garage={garage}
          stats={stats}
          onCopyCode={() => { navigator.clipboard.writeText(garage.referralCode!); setSuccess("Code copié ✓"); setTimeout(() => setSuccess(""), 3000); }}
        />
      )}
    </div>
  );
}
