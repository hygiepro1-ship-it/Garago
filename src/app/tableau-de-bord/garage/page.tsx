"use client";

import { useSession, signOut } from "next-auth/react";
import PasswordChangeCard from "@/components/PasswordChangeCard";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { BRANDS } from "@/lib/vehicleBrands";
import { getModelsForMake } from "@/lib/vehicleData";
import { SERVICE_CATEGORIES, serviceLabel, translateServiceName } from "@/lib/services";
import { isCardRequired } from "@/lib/trial-card";
import AddressAutocomplete, { type AddressResult } from "@/components/AddressAutocomplete";
import BrandLogo from "@/components/BrandLogo";
import { GARAGE_LANGUAGES, parseLanguages } from "@/lib/languages";
import ServiceIcon from "@/components/ServiceIcon";
import { useLang } from "@/contexts/LanguageContext";
import GarageAgenda from "@/components/GarageAgenda";
import GarageCustomers from "@/components/GarageCustomers";
import { useTr } from "@/lib/dashboard-en";

/**
 * Un propriétaire peut gérer plusieurs garages. Le garage actif est passé aux
 * routes API via `?g=<id>` — lu depuis l'URL de la page (paramètre `g`).
 * Sans paramètre, les routes ciblent le garage principal du propriétaire.
 */
function quebecTodayStr(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Toronto" }).format(new Date());
}
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

type Tab = "apercu" | "clients" | "services" | "marques" | "horaires" | "profil" | "abonnement" | "ambassadeur";

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
  /** Portes où ce service se fait — vide ou absent = tous les postes. */
  bays?:        number[];
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
  address?:                 string | null;
  city:                     string | null;
  postalCode?:              string | null;
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
  stripeCustomerId?:        string | null;
  stripePriceId?:           string | null;
  verificationStatus?:      string | null;
  createdAt?:               string;
  referralCode:             string | null;
  referralCount:            number;
  ambassadorTier:           number;
  ambassadorSince:          string | null;
  capacity?:                number;
  requireConfirmation?:     boolean;
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

function hexToHue(hex: string | null): number {
  const m = /^#([0-9a-f]{6})$/i.exec(hex ?? "");
  if (!m) return 0;
  const n = parseInt(m[1], 16);
  const r = (n >> 16) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  if (d === 0) return 0;
  const h = max === r ? ((g - b) / d) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return Math.round(((h * 60) + 360) % 360);
}

// La pipette (EyeDropper) n'existe que sur Chrome/Edge de bureau : on ne montre pas un bouton qui ne marche pas.
function useEyeDropper(): boolean {
  const [ok, setOk] = useState(false);
  useEffect(() => { setOk("EyeDropper" in window); }, []);
  return ok;
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
  const tr = useTr();
  const [hex, setHex] = useState(value ?? "");
  const nativeRef = useRef<HTMLInputElement>(null);
  useEffect(() => { setHex(value ?? ""); }, [value]);

  return (
    <div className="border border-gray-200 rounded-xl p-3 bg-white shadow-lg space-y-3 z-10 relative">
      {/* Preset swatches */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">{tr("Couleurs rapides")}</p>
        <div className="grid grid-cols-8 sm:grid-cols-10 gap-1.5 sm:gap-1">
          {BG_PRESETS.map(c => (
            <button key={c} type="button" title={c} aria-label={c} aria-pressed={value === c}
              onClick={() => { onChange(c); setHex(c); }}
              className={`w-full min-h-[36px] sm:w-6 sm:h-6 sm:min-h-0 rounded-md transition-all hover:scale-110 border-2 ${value === c ? "border-orange-500 scale-110" : "border-gray-200 sm:border-transparent hover:border-gray-300"}`}
              style={{ background: c }}
            />
          ))}
        </div>
      </div>

      {/* Hue strip — click to pick */}
      <div>
        <p className="text-xs text-gray-500 mb-1.5 font-medium uppercase tracking-wide">{tr("Teinte personnalisée")}</p>
        <div
          role="slider" tabIndex={0} aria-label={tr("Teinte personnalisée")}
          aria-valuemin={0} aria-valuemax={360} aria-valuenow={hexToHue(value)}
          className="h-11 sm:h-7 rounded-lg cursor-crosshair border border-gray-200 select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-400"
          onKeyDown={(e) => {
            const step = e.key === "ArrowRight" || e.key === "ArrowUp" ? 5 : e.key === "ArrowLeft" || e.key === "ArrowDown" ? -5 : 0;
            if (!step) return;
            e.preventDefault();
            const color = hslToHex((hexToHue(value) + step + 360) % 360, 70, 55);
            onChange(color); setHex(color);
          }}
          onPointerDown={(e) => {
            e.currentTarget.setPointerCapture(e.pointerId);
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const color = hslToHex(Math.round(ratio * 360), 70, 55);
            onChange(color); setHex(color);
          }}
          onPointerMove={(e) => {
            if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;
            const rect = e.currentTarget.getBoundingClientRect();
            const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
            const color = hslToHex(Math.round(ratio * 360), 70, 55);
            onChange(color); setHex(color);
          }}
          style={{ touchAction: "none", background: "linear-gradient(to right,hsl(0,70%,55%),hsl(30,70%,55%),hsl(60,70%,55%),hsl(90,70%,55%),hsl(120,70%,55%),hsl(150,70%,55%),hsl(180,70%,55%),hsl(210,70%,55%),hsl(240,70%,55%),hsl(270,70%,55%),hsl(300,70%,55%),hsl(330,70%,55%),hsl(360,70%,55%))" }}
        />
      </div>

      {/* Preview + hex + native fallback */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg border border-gray-200 flex-shrink-0 shadow-sm"
          style={{ background: value ?? "linear-gradient(135deg,#ccc 50%,#fff 50%)" }} />
        <input type="text" placeholder="#rrggbb" aria-label={tr("Code couleur hexadécimal")}
          className="flex-1 min-w-0 min-h-[44px] sm:min-h-0 text-base sm:text-xs font-mono border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-orange-400"
          value={hex} maxLength={7} autoCapitalize="none" spellCheck={false}
          onChange={e => {
            const v = e.target.value.trim();
            setHex(v);
            // « ff7a00 » sans dièse est accepté : on le complète.
            const full = /^[0-9a-fA-F]{6}$/.test(v) ? `#${v}` : v;
            if (/^#[0-9a-fA-F]{6}$/.test(full)) onChange(full.toLowerCase());
          }}
        />
        <input ref={nativeRef} type="color" className="hidden"
          value={value ?? "#000000"}
          onChange={e => { onChange(e.target.value); setHex(e.target.value); }} />
        <button type="button" title={tr("Ouvrir la palette complète du système")}
          onClick={() => nativeRef.current?.click()}
          className="text-xs px-3 min-h-[44px] sm:min-h-0 py-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium whitespace-nowrap">
          {tr("Palette…")}
        </button>
        <button type="button" onClick={onClose} aria-label={tr("Fermer")}
          className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-gray-500 hover:text-gray-700 font-bold px-1">✕</button>
      </div>

      {/* Reset */}
      <button type="button" onClick={() => { onChange(null); setHex(""); onClose(); }}
        className="w-full text-xs py-1.5 min-h-[44px] sm:min-h-0 rounded-lg border border-dashed border-gray-300 text-gray-600 hover:bg-gray-50 hover:text-gray-800 transition-colors">
        {tr("↺ Fond automatique (image floutée)")}
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
  const tr = useTr();
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
    if (!draft.trim()) { setError(tr("La description ne peut pas être vide.")); return; }
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
      setSuccess(tr("Description soumise pour vérification. Vous recevrez une confirmation par courriel."));
      onUpdated({ descriptionDraft: draft.trim(), descriptionStatus: "PENDING", descriptionChanges: data.usedThisYear });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-4 gap-4 flex-wrap">
        <div>
          <h2 className="font-bold text-gray-900 text-lg">{tr("Description du garage")}</h2>
          <p className="text-xs text-gray-400 mt-0.5">
            {tr("Texte descriptif uniquement : pas de liens, courriels, numéros ou hashtags.")}
          </p>
        </div>
        {/* Status badge */}
        {isPending && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shrink-0"
            style={{ background: "#fef3c7", color: "#92400e" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 inline-block" />
            {tr("En attente de validation")}
          </span>
        )}
        {isRejected && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shrink-0"
            style={{ background: "#fee2e2", color: "#991b1b" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            {tr("Description refusée")}
          </span>
        )}
        {status === "APPROVED" && garage?.description && (
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full shrink-0"
            style={{ background: "#dcfce7", color: "#166534" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />
            {tr("Approuvée")}
          </span>
        )}
      </div>

      {/* Current approved description (read-only display) */}
      {garage?.description && (
        <div className="mb-4 rounded-xl p-3 text-sm text-gray-700" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
          <p className="text-xs font-semibold text-gray-400 mb-1 uppercase tracking-wide">{tr("Description active")}</p>
          <p className="whitespace-pre-wrap">{garage.description}</p>
        </div>
      )}

      {/* Draft pending review */}
      {isPending && garage?.descriptionDraft && (
        <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: "#fffbeb", border: "1px solid #fde68a" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#92400e" }}>{tr("Modification en cours de révision")}</p>
          <p className="text-gray-700 whitespace-pre-wrap">{garage.descriptionDraft}</p>
          <p className="text-xs mt-2" style={{ color: "#78350f" }}>
            {tr("Elle remplacera la description active une fois approuvée par notre équipe.")}
          </p>
        </div>
      )}

      {/* Rejection message */}
      {isRejected && (
        <div className="mb-4 rounded-xl p-3 text-sm" style={{ background: "#fee2e2", border: "1px solid #fca5a5" }}>
          <p className="text-xs font-semibold mb-1" style={{ color: "#991b1b" }}>
            {tr("Votre dernière description a été refusée.")}
          </p>
          <p className="text-gray-700 text-xs">
            {tr("Elle ne respectait pas nos conditions : description de l'entreprise uniquement, sans promotion ni coordonnées. Soumettez une nouvelle version ci-dessous.")}
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
            placeholder={tr("Décrivez votre garage, votre expertise, vos spécialités…")}
            maxLength={400}
          />
          <p className="text-xs text-right" style={{ color: draft.length >= 380 ? "#dc2626" : "#9ca3af" }}>
            {draft.length} / 400 {tr.en ? "characters" : "caractères"}
          </p>
          <p className="text-xs rounded-lg px-3 py-2" style={{ background: "#fff7ed", color: "#9a3412", border: "1px solid #fed7aa" }}>
            {tr.en
              ? <>Changes to the description must be submitted separately with the <strong>&quot;Submit for review&quot;</strong> button. The &quot;Save profile&quot; button does not save them.</>
              : <>Les modifications de la description doivent être soumises séparément via le bouton <strong>«&nbsp;Faire vérifier&nbsp;»</strong>. Le bouton «&nbsp;Sauvegarder le profil&nbsp;» ne les enregistre pas.</>}
          </p>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-xs" style={{ color: remaining <= 1 ? "#dc2626" : "#6b7280" }}>
              {remaining <= 0
                ? "Limite atteinte : plus aucune modification autorisée cette année."
                : tr.en
                  ? `${remaining} change${remaining > 1 ? "s" : ""} left this year (out of ${DESCRIPTION_MAX_PER_YEAR})`
                  : `${remaining} modification${remaining > 1 ? "s" : ""} restante${remaining > 1 ? "s" : ""} cette année (sur ${DESCRIPTION_MAX_PER_YEAR})`}
            </p>
            <button
              type="button"
              disabled={submitting || remaining <= 0}
              onClick={handleSubmit}
              className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
              style={{ background: "#e0600c" }}>
              {submitting ? tr("Envoi en cours…") : tr("Faire vérifier")}
            </button>
          </div>
          {error   && <p className="text-xs font-medium" style={{ color: "#dc2626" }}>{error}</p>}
          {success && <p className="text-xs font-medium" style={{ color: "#16a34a" }}>{success}</p>}
        </div>
      )}

      {isPending && (
        <p className="text-xs text-gray-400 mt-2">
          {tr("La modification est en cours de révision. L'édition sera réactivée une fois la décision rendue.")}
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
  NO_SHOW:   { bg: "#fee2e2", color: "#991b1b", label: "Absent"     },
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

function MultiDaySummary({ appointments, selectedDays, blockedSlots, onDeleteBlock }: {
  appointments: any[];
  selectedDays: string[];
  blockedSlots: any[];
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
                const sc = STATUS_COLORS[a.status] ?? STATUS_COLORS.PENDING;
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

const AMBASSADEUR_PALIERS = [
  { seuil: 3,  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 17h7M17 14v7"/></svg>, label: "Statistiques avancées",                    desc: "Vues, rendez-vous, note et taux de conversion" },
  { seuil: 6,  icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>, label: "−10% sur votre prochaine facture",          desc: "Appliqué automatiquement, une seule fois" },
  { seuil: 10, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/></svg>, label: "−20% sur votre prochaine facture",          desc: "−30% si abonnement annuel, une seule fois" },
  { seuil: 15, icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>, label: "Priorité dans les résultats de recherche",  desc: "Votre garage apparaît en tête pendant 30 jours" },
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

export default function DashboardGaragePage() {
  const tr = useTr();
  const { t, lang } = useLang();
  const d = t.dash;
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("apercu");
  // Ouvre un rendez-vous en modification dans l'agenda (bouton « Modifier » de la liste).
  const agendaEdit = useRef<((id: string) => void) | null>(null);
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
    } catch { setBranchError(tr("Erreur réseau.")); }
    finally { setBranchSaving(false); }
  }

  async function removeBranch(id: string) {
    setRemovingBranch(id);
    try {
      const res = await fetch(`/api/garage/branch/${id}`, { method: "DELETE" });
      if (res.ok) loadMyGarages();
      else { const d = await res.json().catch(() => ({})); alert(d.error ?? tr("Impossible de retirer ce garage.")); }
    } finally { setRemovingBranch(null); }
  }
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // ── Suppression du compte ────────────────────────────────────────────────
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [deletePwd, setDeletePwd] = useState("");

  async function deleteAccount() {
    setDeleting(true);
    setDeleteError("");
    // Mot de passe redemandé : une session ouverte ne doit pas suffire à effacer un compte (comptes Google exemptés).
    const res = await fetch("/api/user/profile", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: deletePwd }) });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? tr("Une erreur est survenue. Réessayez plus tard."));
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

  const [portalError, setPortalError] = useState("");
  async function openBillingPortal() {
    setPortalLoading(true);
    setPortalError("");
    try {
      const res = await fetch("/api/stripe/billing", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (data.url) { window.location.href = data.url; return; }
      setPortalError(data.error ?? tr("Impossible d'ouvrir le portail de facturation."));
    } catch {
      setPortalError(tr("Erreur réseau."));
    } finally { setPortalLoading(false); }
  }

  async function cancelSubscription(resume: boolean) {
    setCancelLoading(true);
    setCancelError("");
    const res = await fetch("/api/stripe/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ resume }),
    }).catch(() => null);
    if (!res) {
      setCancelError(tr("Erreur réseau."));
      setCancelLoading(false);
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setCancelError(data.error ?? tr("Une erreur est survenue. Réessayez plus tard."));
      setCancelLoading(false);
      return;
    }
    setGarage((g: any) => g ? { ...g, cancelAtPeriodEnd: data.cancelAtPeriodEnd } : g);
    setShowCancelConfirm(false);
    setCancelLoading(false);
  }

  const [payError, setPayError] = useState("");
  async function startCheckout(plan: "monthly" | "annual" = "monthly") {
    setCheckoutLoading(true);
    setPayError("");
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) { window.location.href = data.url; return; }
      setPayError(data.error ?? tr("Impossible d'ouvrir la page de paiement. Réessayez dans un instant."));
    } catch {
      setPayError(tr("Erreur réseau."));
    }
    setCheckoutLoading(false);
  }

  // Ajoute une carte sans quitter l'essai en cours — Stripe ne facture qu'à la
  // fin des jours d'essai restants (voir /api/stripe/start-trial).
  const [addCardLoading, setAddCardLoading] = useState(false);
  async function addTrialCard(plan: "monthly" | "annual" = "monthly") {
    setAddCardLoading(true);
    try {
      const res = await fetch("/api/stripe/start-trial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.url) { window.location.href = data.url; return; }
      setPayError(data.error ?? tr("Impossible d'ouvrir la page de paiement. Réessayez dans un instant."));
    } catch {
      setPayError(tr("Erreur réseau."));
    }
    setAddCardLoading(false);
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
  const [showAddRdv, setShowAddRdv] = useState(false); // ajout depuis « Prochains rendez-vous »
  const [manualError, setManualError] = useState("");
  const [manualFormDate, setManualFormDate] = useState(""); // pre-fill from calendar click
  const [manualForm, setManualForm] = useState({
    customerName: "", customerPhone: "", customerEmail: "",
    vehicleYear: "", vehicleMake: "", vehicleModel: "",
    serviceName: "", categoryId: "", date: "", startTime: "", notes: "",
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
      // Retour de Stripe Checkout : force la synchro avant de charger le garage —
      // le webhook peut ne pas encore être traité, ce qui bloquerait à tort
      // l'accès juste après l'ajout réussi d'une carte (voir cardRequired plus bas).
      const isTrialReturn = new URLSearchParams(window.location.search).get("trial") === "started";
      const sync = isTrialReturn
        ? fetch("/api/stripe/sync-subscription", { method: "POST" }).catch(() => {})
        : Promise.resolve();
      sync.then(() => {
        gfetch("/api/garage/profile").then(r => r.json()).then(d => { setGarage(d); setLoading(false); });
      });
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

  // Capacité de l'atelier (véhicules pris en charge en même temps) — réglée
  // ici, avec les durées de services, puisque les deux ensemble déterminent
  // ce qui remplit l'agenda. Chaîne pour permettre un champ temporairement vide.
  const [capacity, setCapacity] = useState("1");
  useEffect(() => { if (garage) setCapacity(String(garage.capacity ?? 1)); }, [garage]);

  // Confirmation obligatoire du client (courriel à −48 h, créneau libéré sans réponse)
  const [requireConfirmation, setRequireConfirmation] = useState(true);
  useEffect(() => { if (garage) setRequireConfirmation(garage.requireConfirmation ?? true); }, [garage]);

  const [priceTried, setPriceTried] = useState(false);

  async function saveServices() {
    // Chaque service coché doit avoir un prix « à partir de » : c'est le prix minimum que le client voit.
    const missing = services.filter((s) => !(parseFloat(String(s.priceMin ?? "").replace(",", ".")) > 0));
    if (missing.length > 0) {
      setPriceTried(true);
      setSuccess(`${tr.en ? "Enter the \"from\" price for:" : "Indiquez le prix « à partir de » pour :"} ${missing.map((s) => translateServiceName(s.categoryName, tr.en ? "en" : "fr")).join(", ")}`);
      setTimeout(() => setSuccess(""), 6000);
      return;
    }
    setSaving(true);
    const cap = Math.min(50, Math.max(1, parseInt(capacity, 10) || 1));
    const res = await gfetch("/api/garage/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ services, capacity: cap, requireConfirmation, requirePrices: true }),
    });
    if (res.ok) {
      setCapacity(String(cap));
      setGarage((g: any) => g ? { ...g, capacity: cap, requireConfirmation } : g);
    }
    setSaving(false);
    setSuccess(res.ok ? tr("Services sauvegardés ✓") : tr("Erreur lors de la sauvegarde"));
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
    setSuccess(tr("Marques sauvegardées ✓"));
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

  // Force l'onglet Horaires tant qu'aucun horaire n'a jamais été enregistré —
  // voir hoursConfigured plus bas, qui verrouille aussi la navigation.
  useEffect(() => {
    if (garage && (garage.availability?.length ?? 0) === 0) setActiveTab("horaires");
  }, [garage]);

  function setHoraireField(dayIndex: number, field: string, value: string | boolean) {
    setHoraires((prev) => prev.map((h) => h.dayOfWeek === dayIndex ? { ...h, [field]: value } : h));
  }

  async function saveHoraires() {
    setSaving(true);
    const res = await gfetch("/api/garage/availability", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ horaires }),
    });
    if (res.ok) {
      // Débloque immédiatement le reste du tableau de bord (voir hoursConfigured)
      // sans attendre un rechargement complet de la page.
      setGarage((g: any) => g ? { ...g, availability: horaires.map((h) => ({ ...h })) } : g);
    }
    setSaving(false);
    setSuccess(tr("Horaires sauvegardés ✓"));
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
  const hasEyeDropper = useEyeDropper();
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
    setSuccess(tr("Profil sauvegardé ✓"));
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
      setSuccess(tr.en ? `${type === "logo" ? "Logo" : "Cover image"} updated ✓` : `${type === "logo" ? "Logo" : "Image de couverture"} mis à jour ✓`);
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
      Promise.all([
        gfetch("/api/garage/appointments").then(r => r.json()),
        // Tous les blocages, pas seulement ceux du mois affiché : l'agenda navigue de semaine en semaine.
        gfetch("/api/blocked-slots").then(r => r.json()),
      ]).then(([appts, blocks]) => {
        setAppointments(Array.isArray(appts) ? appts : []);
        setBlockedSlots(Array.isArray(blocks) ? blocks : []);
        setRdvLoaded(true);
        setRdvUpdatedAt(new Date());
      });
    }
  }, [activeTab, rdvLoaded, garage]);

  // Plusieurs personnes peuvent prendre des rendez-vous sur le même tableau de bord :
  // le calendrier se recharge toutes les 30 secondes et dès qu'on revient sur l'onglet,
  // pour voir ce qu'un collègue vient de saisir. Un rechargement raté garde ce qui est
  // affiché (jamais d'agenda vidé par une coupure de réseau).
  const [rdvUpdatedAt, setRdvUpdatedAt] = useState<Date | null>(null);
  const garageLoadedId = garage?.id;
  useEffect(() => {
    if (activeTab !== "apercu" || !rdvLoaded || !garageLoadedId) return;
    let busy = false;
    let last = Date.now();
    const refresh = async () => {
      if (busy || document.visibilityState !== "visible") return;
      busy = true;
      try {
        const [appts, blocks] = await Promise.all([
          gfetch("/api/garage/appointments").then(r => (r.ok ? r.json() : null)),
          gfetch("/api/blocked-slots").then(r => (r.ok ? r.json() : null)),
        ]);
        if (Array.isArray(appts)) { setAppointments(appts); setRdvUpdatedAt(new Date()); }
        if (Array.isArray(blocks)) setBlockedSlots(blocks);
      } catch { /* réseau coupé : on réessaie au prochain passage */ }
      last = Date.now();
      busy = false;
    };
    const onReturn = () => { if (Date.now() - last > 5000) refresh(); };
    const timer = setInterval(refresh, 30000);
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
    };
  }, [activeTab, rdvLoaded, garageLoadedId]);

  async function loadCalendarData() {
    if (!garage) return;
    const [appts, blocks] = await Promise.all([
      gfetch("/api/garage/appointments").then(r => r.json()),
      gfetch("/api/blocked-slots").then(r => r.json()),
    ]);
    setAppointments(Array.isArray(appts) ? appts : []);
    setBlockedSlots(Array.isArray(blocks) ? blocks : []);
    setRdvUpdatedAt(new Date());
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

  if (isCardRequired(garage)) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16 text-center">
        <div className="w-14 h-14 mx-auto mb-5 rounded-2xl flex items-center justify-center" style={{ background: "#fff7ed" }}>
          <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
          </svg>
        </div>
        <h1 className="text-xl font-black text-gray-900 mb-2">{tr("Ajoutez votre carte pour continuer")}</h1>
        <p className="text-gray-500 text-sm mb-6">
          {tr("Votre essai gratuit de 30 jours est prêt, mais aucun moyen de paiement n'a été enregistré.")}{" "}
          {tr("Ajoutez une carte pour accéder à votre tableau de bord. Aucun montant n'est prélevé avant la fin de l'essai.")}
        </p>
        <button onClick={() => addTrialCard("monthly")} disabled={addCardLoading}
          className="text-white px-6 py-3 rounded-xl font-bold text-sm disabled:opacity-60"
          style={{ background: "#e0600c" }}>
          {addCardLoading ? tr("Redirection…") : tr("Ajouter ma carte")}
        </button>
        <p className="mt-6 text-sm text-gray-500 flex flex-wrap items-center justify-center gap-x-5">
          <button onClick={() => signOut({ callbackUrl: "/" })} className="underline hover:no-underline min-h-[44px]">{tr("Se déconnecter")}</button>
          {!showDeleteConfirm && (
            <button onClick={() => setShowDeleteConfirm(true)} className="underline hover:no-underline min-h-[44px] text-red-600">
              {tr("Supprimer mon compte")}
            </button>
          )}
        </p>
        {/* Un garage qui vient de s'inscrire peut toujours supprimer son compte, même sans carte ni vérification terminée. */}
        {showDeleteConfirm && (
          <div className="mt-4 rounded-xl p-4 text-left" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
            <p className="text-sm font-semibold text-red-800 mb-3">{tr("Êtes-vous certain(e) ? Cette action est irréversible et annule votre abonnement.")}</p>
            <div className="mb-3">
              <label htmlFor="del-pwd-card" className="block text-xs font-semibold text-red-800 mb-1">{tr("Entrez votre mot de passe pour confirmer (laissez vide si vous vous connectez avec Google)")}</label>
              <input id="del-pwd-card" type="password" autoComplete="current-password" className="w-full border border-red-300 rounded-xl px-3 py-2 text-base bg-white" value={deletePwd} onChange={(e) => setDeletePwd(e.target.value)} />
            </div>
            {deleteError && <p className="text-xs text-red-600 mb-3" role="alert">{deleteError}</p>}
            <div className="flex gap-3">
              <button onClick={deleteAccount} disabled={deleting}
                className="text-sm font-bold text-white bg-red-600 rounded-xl px-4 py-2 min-h-[44px] hover:bg-red-700 disabled:opacity-50">
                {deleting ? tr("Suppression…") : tr("Oui, tout supprimer")}
              </button>
              <button onClick={() => { setShowDeleteConfirm(false); setDeletePwd(""); setDeleteError(""); }} disabled={deleting}
                className="text-sm font-semibold text-gray-600 rounded-xl px-4 py-2 min-h-[44px] hover:bg-gray-100">
                {tr("Retour")}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  }

  async function updateApptStatus(id: string, newStatus: string) {
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    }).catch(() => null);
    // L'écran ne change que si le serveur a réellement enregistré : sinon la
    // modification « disparaîtrait » au rechargement de la page.
    if (!res || !res.ok) {
      const d = res ? await res.json().catch(() => ({})) : {};
      window.alert(d.error ?? tr("Le changement n'a pas pu être enregistré. Réessayez."));
      return;
    }
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus } : a));
  }

  function openAddRdv() {
    const d = new Date();
    const todayStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    setManualError("");
    setManualForm({ customerName:"", customerPhone:"", customerEmail:"", vehicleYear:"", vehicleMake:"", vehicleModel:"", serviceName:"", categoryId:"", date: todayStr, startTime:"", notes:"" });
    setShowAddRdv(true);
  }

  async function saveManualRdvModal(e: React.FormEvent) {
    e.preventDefault();
    setSavingRdv(true);
    setManualError("");
    const res = await gfetch("/api/garage/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(manualForm),
    });
    if (res.ok) {
      const appt = await res.json();
      setAppointments(prev => [appt, ...prev]);
      setShowAddRdv(false);
      setSuccess(tr("Rendez-vous ajouté ✓"));
      setTimeout(() => setSuccess(""), 3000);
    } else {
      const d = await res.json().catch(() => ({}));
      setManualError(d.error ?? tr("Impossible d'ajouter ce rendez-vous."));
    }
    setSavingRdv(false);
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
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      setManualError(d.error ?? tr("Impossible d'ajouter ce rendez-vous."));
      setSavingRdv(false);
      return;
    }
    if (res.ok) {
      setManualError("");
      const appt = await res.json();
      setAppointments(prev => [appt, ...prev]);
      setShowManualForm(false);
      setManualForm({ customerName:"", customerPhone:"", customerEmail:"", vehicleYear:"", vehicleMake:"", vehicleModel:"", serviceName:"", categoryId:"", date:"", startTime:"", notes:"" });
      setSuccess(tr("Rendez-vous ajouté ✓"));
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
      const clash = Number(slot.conflicts) || 0;
      if (clash > 0) {
        window.alert(tr.en
          ? `Slot blocked. Note: ${clash} appointment${clash > 1 ? "s are" : " is"} already booked in this period. Blocking does not cancel them: contact ${clash > 1 ? "those customers" : "that customer"} if needed.`
          : `Créneau bloqué. Attention : ${clash} rendez-vous ${clash > 1 ? "sont déjà prévus" : "est déjà prévu"} sur cette période. Bloquer ne les annule pas : prévenez ${clash > 1 ? "ces clients" : "ce client"} au besoin.`);
      }
      setSuccess(tr("Créneau bloqué ✓"));
      setTimeout(() => setSuccess(""), 3000);
    } else {
      const d = await res.json().catch(() => ({}));
      window.alert(d.error ?? tr("Impossible de bloquer ce créneau."));
    }
    setSavingBlock(false);
  }

  async function deleteBlockSlot(id: string) {
    const res = await fetch(`/api/blocked-slots/${id}`, { method: "DELETE" });
    if (res.ok) setBlockedSlots(prev => prev.filter(s => s.id !== id));
    else window.alert(tr("Ce blocage n'a pas pu être retiré. Réessayez."));
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
    let saved = 0;
    let clashes = 0;
    let failure = "";
    for (const date of selectedDays) {
      const res = await gfetch("/api/blocked-slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...blockForm, date }),
      });
      if (res.ok) {
        const slot = await res.json();
        setBlockedSlots(prev => [...prev, slot]);
        saved++;
        clashes += Number(slot.conflicts) || 0;
      } else {
        const d = await res.json().catch(() => ({}));
        failure = d.error ?? tr("Impossible de bloquer ces journées.");
      }
    }
    setSavingBlock(false);
    if (saved === 0) { window.alert(failure); return; }
    setShowBlockForm(false);
    setBlockForm({ date: "", startTime: "08:00", endTime: "17:00", reason: "", allDay: false });
    if (clashes > 0) {
      window.alert(tr.en
        ? `Slots blocked. Note: ${clashes} appointment${clashes > 1 ? "s are" : " is"} already booked in these periods. Blocking does not cancel them: contact the customers if needed.`
        : `Créneaux bloqués. Attention : ${clashes} rendez-vous ${clashes > 1 ? "sont déjà prévus" : "est déjà prévu"} sur ces périodes. Bloquer ne les annule pas : prévenez les clients au besoin.`);
    }
    setSuccess(tr.en ? `Slots blocked for ${saved} day${saved > 1 ? "s" : ""} ✓` : `Créneaux bloqués pour ${saved} jour${saved > 1 ? "s" : ""} ✓`);
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
    setManualForm({ customerName:"", customerPhone:"", customerEmail:"", vehicleYear:"", vehicleMake:"", vehicleModel:"", serviceName:"", categoryId:"", date:"", startTime:"", notes:"" });
    setSavingRdv(false);
    setSuccess(tr.en ? `Appointments added for ${selectedDays.length} day${selectedDays.length > 1 ? "s" : ""} ✓` : `Rendez-vous ajoutés pour ${selectedDays.length} jour${selectedDays.length > 1 ? "s" : ""} ✓`);
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
    // Conserve la durée d'origine du RDV (définie par la prestation) plutôt
    // qu'un bloc fixe de 60 minutes.
    const [oh, om] = rescheduleAppt.startTime.split(":").map(Number);
    const [eh, em] = rescheduleAppt.endTime.split(":").map(Number);
    const durationMin = (eh * 60 + em) - (oh * 60 + om);
    const [h, m] = rescheduleSlot.split(":").map(Number);
    const totalEnd = h * 60 + m + (durationMin > 0 ? durationMin : 60);
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
      setSuccess(tr("Rendez-vous déplacé ✓"));
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
        .toLocaleDateString(tr.locale, { day: "numeric", month: "long" })
    : null;

  const tabIcons: Record<Tab, ReactNode> = {
    apercu:      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><path d="M14 17h7M17 14v7"/></svg>,
    services:    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z"/></svg>,
    marques:     <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h5l3 3v4h-8V8zM5 7V3m6 4V3M5 17v4m6-4v4"/><circle cx="5.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/></svg>,
    horaires:    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
    profil:      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z"/></svg>,
    abonnement:  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/></svg>,
    clients: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><circle cx="17.5" cy="9" r="2.5"/><path d="M17 14.2c2.7.3 4.5 2.3 4.5 5"/></svg>,
    ambassadeur: <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M12 12L8 21l4-2 4 2-4-9z"/></svg>,
  };

  const tabs: { id: Tab; label: string }[] = [
    { id: "apercu",   label: d.overview  },
    { id: "clients",  label: "Clients"   },
    { id: "services", label: d.services  },
    { id: "marques",  label: d.brands    },
    { id: "horaires", label: d.hours     },
    { id: "profil",   label: d.profile   },
    { id: "abonnement", label: tr("Abonnement") },
    ...(garage.subscriptionStatus === "ACTIVE" && garage.ambassadorTier >= 1
      ? [{ id: "ambassadeur" as Tab, label: "Ambassadeur" }] : []),
  ];

  // Le programme de parrainage / ambassadeur est réservé aux garages abonnés
  const referralUnlocked = garage.subscriptionStatus === "ACTIVE";

  // Un garage sans horaires enregistrés (même une seule fois) n'a aucun créneau
  // réservable — /api/garages/[slug]/slots le traite comme fermé tous les jours.
  // On force donc la configuration des horaires avant de débloquer le reste du
  // tableau de bord, plutôt que de laisser un garage "actif" mais invisible.
  const hoursConfigured = (garage.availability?.length ?? 0) > 0;

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
              {[garage.address, garage.city, [garage.province, garage.postalCode].filter(Boolean).join(" ")].filter(Boolean).join(", ")}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {garage.subscriptionStatus === "TRIAL" && (
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full">
                {tr.en ? "Trial" : "Essai"} {garage.subscriptionEndAt ? `— ${tr.en ? "expires" : "expire"} ${new Date(garage.subscriptionEndAt).toLocaleDateString(tr.locale, { day: "numeric", month: "short" })}` : tr("gratuit")}
              </span>
            )}
            {garage.subscriptionStatus === "ACTIVE" && (
              <span className="bg-green-400 text-green-900 text-xs font-bold px-2 py-1 rounded-full">{tr("Actif ✓")}</span>
            )}
            {garage.subscriptionStatus === "PAST_DUE" && (
              <span className="bg-red-400 text-red-900 text-xs font-bold px-2 py-1 rounded-full">{tr("Paiement échoué")}</span>
            )}
            {garage.subscriptionStatus === "EXPIRED" && (
              <span className="bg-red-400 text-red-900 text-xs font-bold px-2 py-1 rounded-full">{tr("Expiré")}</span>
            )}
            <Link href={`/garage/${garage.slug}?from=dashboard`}
              className="inline-flex items-center min-h-[44px] sm:min-h-0 bg-white/20 border border-white/30 text-white text-xs sm:text-sm px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl hover:bg-white/30 transition-colors whitespace-nowrap">
              {tr("Voir mon profil")}
            </Link>
          </div>
        </div>
      </div>

      {/* Sélecteur de garage (propriétaires multi-garages) */}
      {myGarages.length > 1 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 mb-6 flex items-center gap-3 flex-wrap shadow-sm">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">{tr("Vous gérez")}</span>
          <select
            value={selectedGarageId() ?? (myGarages.find(g => g.parentId === null)?.id ?? "")}
            onChange={(e) => switchGarage(e.target.value)}
            className="flex-1 min-w-[220px] border border-gray-300 rounded-xl px-3 py-2 text-sm font-semibold text-gray-900 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-orange-400">
            {myGarages.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name} · {g.city}{g.parentId === null ? (tr.en ? " (main)" : " (principal)") : ""}
              </option>
            ))}
          </select>
        </div>
      )}

      {garage.parentId === null && garage.verificationStatus === "PENDING" && (
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#1d4ed8" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="10"/>
          </svg>
          <div>
            <p className="font-bold text-blue-900">{tr("Vérification en cours")}</p>
            <p className="text-blue-700 text-sm">{tr("Votre profil est en cours de vérification et n'apparaît pas encore dans les résultats de recherche. Vous recevrez un courriel dès que ce sera fait.")}</p>
          </div>
        </div>
      )}

      {garage.parentId === null && garage.verificationStatus === "REJECTED" && (
        <div className="bg-red-50 border border-red-300 rounded-2xl p-4 mb-6 flex items-center gap-3">
          <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#b91c1c" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
          <div>
            <p className="font-bold text-red-900">{tr("Vérification refusée")}</p>
            <p className="text-red-700 text-sm">{tr("Nous n'avons pas pu vérifier votre profil. Contactez-nous à info.garago@gmail.com pour résoudre la situation.")}</p>
          </div>
        </div>
      )}

      {garage.subscriptionStatus === "TRIAL" && !garage.stripePriceId && (
        <div className={`rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap ${isTrialExpiring ? "bg-red-50 border border-red-300" : "bg-orange-50 border border-orange-200"}`}>
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke={isTrialExpiring ? "#b91c1c" : "#f97316"} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <div>
              <p className={`font-bold ${isTrialExpiring ? "text-red-900" : "text-gray-900"}`}>{tr("Aucun moyen de paiement enregistré")}</p>
              <p className={`text-sm ${isTrialExpiring ? "text-red-700" : "text-gray-500"}`}>
                {isTrialExpiring
                  ? "Ajoutez une carte avant la fin de votre essai pour ne pas perdre votre visibilité. Aucun montant n'est prélevé avant l'expiration de l'essai."
                  : tr("Ajoutez une carte pour que votre abonnement démarre automatiquement à la fin de l'essai, sans interruption. Aucun montant prélevé avant cette date.")}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button onClick={() => addTrialCard("monthly")} disabled={addCardLoading}
              className={`text-white px-5 py-2 rounded-xl font-bold text-sm whitespace-nowrap disabled:opacity-60 ${isTrialExpiring ? "bg-red-600 hover:bg-red-700" : ""}`}
              style={isTrialExpiring ? undefined : { background: "#e0600c" }}>
              {addCardLoading ? tr("Redirection…") : tr("Ajouter ma carte")}
            </button>
          </div>
        </div>
      )}

      {isTrialExpiring && garage.stripePriceId && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#a16207" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            <div>
              <p className="font-bold text-yellow-900">{tr("Votre essai expire bientôt!")}</p>
              <p className="text-yellow-700 text-sm">{tr("Activez votre abonnement pour continuer à apparaître dans les résultats.")}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button onClick={() => startCheckout("annual")} disabled={checkoutLoading}
              className="bg-yellow-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-yellow-600 text-sm whitespace-nowrap disabled:opacity-60">
              {checkoutLoading ? tr("Chargement…") : tr("Activer mon abonnement annuel (−20 %)")}
            </button>
            <button onClick={() => startCheckout("monthly")} disabled={checkoutLoading}
              className="text-xs font-semibold text-yellow-800 underline hover:no-underline disabled:opacity-60">
              {tr("ou payer mensuellement")}
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
              <p className="font-bold text-red-900">{tr("Votre dernier paiement a échoué")}</p>
              <p className="text-red-700 text-sm">
                {tr.en
                  ? `Update your card ${pastDueDeadline ? `before ${pastDueDeadline}` : "soon"} so your garage is not removed from search results.`
                  : `Mettez à jour votre carte ${pastDueDeadline ? `avant le ${pastDueDeadline}` : "rapidement"} pour éviter que votre garage soit retiré des résultats de recherche.`}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button onClick={openBillingPortal} disabled={portalLoading}
              className="bg-red-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-red-700 text-sm whitespace-nowrap disabled:opacity-60">
              {portalLoading ? tr("Ouverture…") : tr("Mettre à jour ma carte")}
            </button>
            {portalError && <p className="text-xs text-red-700 max-w-[220px] text-right">{portalError}</p>}
          </div>
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
              <p className="font-bold text-red-900">{tr("Votre abonnement est expiré")}</p>
              <p className="text-red-700 text-sm">{tr("Votre garage n'apparaît plus dans les résultats de recherche. Activez votre abonnement pour redevenir visible.")}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button onClick={() => startCheckout("annual")} disabled={checkoutLoading}
              className="bg-red-600 text-white px-5 py-2 rounded-xl font-bold hover:bg-red-700 text-sm whitespace-nowrap disabled:opacity-60">
              {checkoutLoading ? tr("Chargement…") : tr("Activer mon abonnement annuel (−20 %)")}
            </button>
            <button onClick={() => startCheckout("monthly")} disabled={checkoutLoading}
              className="text-xs font-semibold text-red-700 underline hover:no-underline disabled:opacity-60">
              {tr("ou payer mensuellement")}
            </button>
          </div>
        </div>
      )}

      {garage.subscriptionStatus === "TRIAL" && !isTrialExpiring && garage.stripePriceId && (
        <div className="bg-white border border-gray-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 015.83 1c0 2-3 3-3 3M12 17h.01"/>
            </svg>
            <div>
              <p className="font-bold text-gray-900">{tr("Vous êtes actuellement en période d'essai gratuit")}</p>
              <p className="text-gray-500 text-sm">{tr("Vous pouvez activer votre abonnement dès maintenant, sans attendre la fin de l'essai.")}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1">
            <button onClick={() => startCheckout("annual")} disabled={checkoutLoading}
              className="text-white px-5 py-2 rounded-xl font-bold text-sm whitespace-nowrap disabled:opacity-60"
              style={{ background: "#e0600c" }}>
              {checkoutLoading ? tr("Chargement…") : tr("Activer mon abonnement annuel maintenant (−20 %)")}
            </button>
            <button onClick={() => startCheckout("monthly")} disabled={checkoutLoading}
              className="text-xs font-semibold underline hover:no-underline disabled:opacity-60"
              style={{ color: "#f97316" }}>
              {tr("ou payer mensuellement")}
            </button>
          </div>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium">{success}</div>
      )}

      {!hoursConfigured && (
        <div className="rounded-2xl p-4 mb-6 flex items-start gap-3" style={{ background: "#fff7ed", border: "1px solid #fed7aa" }}>
          <svg className="w-5 h-5 flex-shrink-0 mt-0.5" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
          <div>
            <p className="font-bold text-sm" style={{ color: "#9a3412" }}>{tr("Configurez vos heures d'ouverture pour activer votre tableau de bord")}</p>
            <p className="text-sm mt-0.5" style={{ color: "#c2410c" }}>
              {tr("Tant qu'aucun horaire n'est enregistré, votre garage n'apparaît pas comme disponible pour les")}{" "}
              {tr("conducteurs et ne peut recevoir aucun rendez-vous. Enregistrez vos horaires ci-dessous pour")}{" "}
              {tr("débloquer le reste du tableau de bord.")}
            </p>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
        {tabs.map((tab) => {
          const locked = !hoursConfigured && tab.id !== "horaires";
          return (
            <button key={tab.id} onClick={() => { if (!locked) setActiveTab(tab.id); }} disabled={locked}
              title={locked ? "Enregistrez d'abord vos horaires" : undefined}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? "text-white" : "bg-white border border-gray-200 text-gray-600"} ${locked ? "opacity-40 cursor-not-allowed" : ""}`}
              style={activeTab === tab.id ? { background: "#e0600c" } : {}}>
              {tabIcons[tab.id]}{tr(tab.label)}
            </button>
          );
        })}
      </div>

      {/* ══ CLIENTS : carnet de clients du garage ═══════════════════════════ */}
      {activeTab === "clients" && <GarageCustomers key={garage.id} />}

      {/* ══ APERÇU ══════════════════════════════════════════════════════════ */}
      {activeTab === "apercu" && (
        <div className="space-y-6">
          {/* Stats grid */}
          {(() => {
            // Dates locales (pas toISOString, qui bascule en UTC le soir).
            const ymd = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
            const minutesOf = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
            const nowLocal = new Date();
            const thisMonth = ymd(nowLocal).slice(0, 7);

            // Taux de confirmation : parmi les rendez-vous du mois pour lesquels une confirmation a été
            // demandée et dont on connaît l'issue, part de ceux que le client a confirmés (lien ou téléphone).
            const asked = appointments.filter(a => a.date?.startsWith(thisMonth) && (
              ["CONFIRMED", "NO_RESPONSE", "EXPIRED"].includes(a.confirmationStatus) || (a.cancelledBy === "CLIENT" && a.confirmRequestedAt)
            ));
            const confirmedByClient = asked.filter(a => a.confirmationStatus === "CONFIRMED" && a.cancelledBy !== "CLIENT").length;
            const tauxConfirmation = rdvLoaded && asked.length > 0 ? Math.round((confirmedByClient / asked.length) * 100) : null;

            // Taux de remplissage : heures réservées cette semaine (lundi à dimanche) sur les heures
            // d'ouverture, journées et plages bloquées déduites, multipliées par le nombre de postes.
            const monday = new Date(nowLocal.getFullYear(), nowLocal.getMonth(), nowLocal.getDate() - ((nowLocal.getDay() + 6) % 7), 12);
            const weekDates = Array.from({ length: 7 }, (_, i) => { const x = new Date(monday); x.setDate(monday.getDate() + i); return x; });
            const posts = garage.capacity ?? 1;
            let openMin = 0;
            for (const day of weekDates) {
              const h = garage.availability.find(av => av.dayOfWeek === day.getDay());
              if (!h || h.isClosed) continue;
              const blocks = blockedSlots.filter(b => b.date === ymd(day));
              if (blocks.some(b => b.allDay || !b.startTime || !b.endTime)) continue;
              const open = minutesOf(h.openTime), close = minutesOf(h.closeTime);
              let free = close - open;
              for (const b of blocks) free -= Math.max(0, Math.min(close, minutesOf(b.endTime)) - Math.max(open, minutesOf(b.startTime)));
              openMin += Math.max(0, free) * posts;
            }
            const weekSet = new Set(weekDates.map(ymd));
            const bookedMin = appointments
              .filter(a => weekSet.has(a.date) && a.status !== "CANCELLED" && a.status !== "NO_SHOW")
              .reduce((sum, a) => sum + Math.max(0, minutesOf(a.endTime) - minutesOf(a.startTime)), 0);
            const tauxRemplissage = rdvLoaded && openMin > 0 ? Math.min(100, Math.round((bookedMin / openMin) * 100)) : null;
            const hoursLabel = (min: number) => `${Math.floor(min / 60)} h${min % 60 ? ` ${String(min % 60).padStart(2, "0")}` : ""}`;

            return (
              <>
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Note moyenne */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="#f59e0b" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{tr("Note moyenne")}</span>
                    </div>
                    <p className="text-3xl font-black mt-1" style={{ color: "#0b1f3a" }}>{avgRating ? `${avgRating}` : "—"}<span className="text-base font-semibold text-gray-400">{avgRating ? "/5" : ""}</span></p>
                    <p className="text-xs text-gray-400 mt-1">{garage._count?.reviews ?? 0} {tr.en ? "reviews" : "avis"}</p>
                  </div>

                  {/* Taux de confirmation RDV */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#0b1f3a" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{tr("Taux de confirmation")}</span>
                    </div>
                    <p className="text-3xl font-black mt-1" style={{ color: "#0b1f3a" }}>{tauxConfirmation !== null ? `${tauxConfirmation}` : "—"}<span className="text-base font-semibold text-gray-400">{tauxConfirmation !== null ? "%" : ""}</span></p>
                    <p className="text-xs text-gray-400 mt-1">
                      {asked.length > 0 ? (tr.en ? `${confirmedByClient} of ${asked.length} customer${asked.length > 1 ? "s" : ""} confirmed this month` : `${confirmedByClient} client${confirmedByClient > 1 ? "s" : ""} sur ${asked.length} ont confirmé ce mois`) : tr("aucune demande de confirmation ce mois")}
                    </p>
                  </div>

                  {/* Taux de remplissage */}
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 flex flex-col col-span-2 lg:col-span-1">
                    <div className="flex items-center gap-2 mb-1">
                      <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="#f97316" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/></svg>
                      <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{tr("Taux de remplissage")}</span>
                    </div>
                    <p className="text-3xl font-black mt-1" style={{ color: "#0b1f3a" }}>{tauxRemplissage !== null ? `${tauxRemplissage}` : "—"}<span className="text-base font-semibold text-gray-400">{tauxRemplissage !== null ? "%" : ""}</span></p>
                    {tauxRemplissage !== null && (
                      <div className="mt-2 h-1.5 rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full transition-all" style={{ width: `${tauxRemplissage}%`, background: tauxRemplissage > 70 ? "#f97316" : "#0b1f3a" }} />
                      </div>
                    )}
                    <p className="text-xs text-gray-400 mt-1">
                      {openMin > 0 ? (tr.en ? `${hoursLabel(bookedMin)} booked out of ${hoursLabel(openMin)} open this week` : `${hoursLabel(bookedMin)} réservées sur ${hoursLabel(openMin)} ouvertes cette semaine`) : tr("aucune heure d'ouverture cette semaine")}
                    </p>
                  </div>
                </div>
              </>
            );
          })()}

          {/* Upcoming appointments list */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-3 mb-4">
              <h3 className="font-bold text-gray-900">{tr("Prochains rendez-vous")}</h3>
              <a href="#agenda" className="inline-flex items-center min-h-[44px] sm:min-h-0 text-sm font-semibold underline text-gray-600 whitespace-nowrap">{tr("Voir le calendrier ↓")}</a>
            </div>
            {!rdvLoaded ? (
              <div className="text-gray-400 text-sm text-center py-8">{tr("Chargement…")}</div>
            ) : appointments.filter(a => a.status !== "CANCELLED" && a.status !== "COMPLETED" && a.status !== "NO_SHOW" && a.date >= quebecTodayStr()).length === 0 ? (
              <p className="text-gray-400 text-sm text-center py-6">{tr("Aucun rendez-vous à venir.")}</p>
            ) : (
              <div className="space-y-2">
                {appointments
                  .filter(a => a.status !== "CANCELLED" && a.status !== "COMPLETED" && a.status !== "NO_SHOW" && a.date >= quebecTodayStr())
                  .sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime))
                  .slice(0, 10)
                  .map(a => {
                    const sc = STATUS_COLORS[a.status] ?? STATUS_COLORS.PENDING;
                    const dateObj = new Date(a.date + "T12:00:00");
                    const dateFr = dateObj.toLocaleDateString(tr.locale, { weekday: "short", day: "numeric", month: "short" });
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
                            <p className="text-xs text-gray-500">{a.customerPhone}{a.serviceName ? ` · ${translateServiceName(a.serviceName, tr.en ? "en" : "fr")}` : ""}</p>
                            {(a.vehicleMake || a.vehicleModel) && (
                              <p className="text-xs text-gray-400">{[a.vehicleYear, a.vehicleMake, a.vehicleModel].filter(Boolean).join(" ")}</p>
                            )}
                            {(a as any).notes && (
                              <p className="text-xs mt-0.5 px-2 py-0.5 rounded-lg" style={{ background: "#fef9f0", color: "#92400e", border: "1px solid #fde68a" }}>
                                {(a as any).notes}
                              </p>
                            )}
                          </div>
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0" style={{ backgroundColor: sc.bg, color: sc.color }}>
                            {tr(sc.label)}
                          </span>
                        </div>
                        {/* Actions */}
                        <div className="flex flex-wrap gap-1.5 pl-[76px]">
                          {a.status === "PENDING" && (
                            <button onClick={() => updateApptStatus(a.id, "CONFIRMED")}
                              className="text-xs px-2.5 py-0.5 rounded-lg bg-green-50 text-green-700 border border-green-200 font-semibold hover:bg-green-100 transition-colors">
                              {tr("✓ Confirmer")}
                            </button>
                          )}
                          {a.status === "CONFIRMED" && (
                            <button onClick={() => updateApptStatus(a.id, "COMPLETED")}
                              className="text-xs px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-semibold hover:bg-purple-100 transition-colors">
                              {tr("✓ Terminé")}
                            </button>
                          )}
                          {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                            <button onClick={() => agendaEdit.current?.(a.id)}
                              className="text-xs px-2.5 py-0.5 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-semibold hover:bg-blue-100 transition-colors">
                              {tr("Modifier")}
                            </button>
                          )}
                          {(a.status === "PENDING" || a.status === "CONFIRMED") && (
                            <button onClick={async () => {
                              if (!window.confirm(tr("Annuler ce rendez-vous ?"))) return;
                              await updateApptStatus(a.id, "CANCELLED");
                            }}
                              className="text-xs px-2.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200 font-semibold hover:bg-red-100 transition-colors">
                              {tr("Annuler")}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>

          {/* Agenda : calendrier de la semaine — c'est d'ici que les rendez-vous se prennent */}
          <GarageAgenda
            appointments={appointments}
            services={garage.services as any[]}
            availability={garage.availability}
            capacity={garage.capacity ?? 1}
            blocked={blockedSlots}
            lang={lang}
            onReload={loadCalendarData}
            updatedAt={rdvUpdatedAt}
            editRef={agendaEdit}
          />

          {/* ── Calendrier & Rendez-vous ─────────────────────────────────── */}
          {/* Calendar header */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">
                  {tr.en ? "Availability and time off" : "Disponibilités et absences"} · {tr(MONTH_NAMES_FR[calMonth])} {calYear}
                </h2>
                <p className="hidden sm:block text-gray-500 text-sm">{tr("Cliquez pour sélectionner · recliquez pour désélectionner ·")} <kbd className="bg-gray-100 px-1 rounded text-xs">{tr("Maj")}</kbd>{tr("+clic pour une plage")}</p>
                <p className="sm:hidden text-gray-500 text-xs">{tr("Touchez un jour pour le sélectionner")}</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button onClick={() => changeMonth(-1)} aria-label={tr("Mois précédent")}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600">
                  ‹
                </button>
                <button onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); setSelectedDays([]); setRdvLoaded(false); }}
                  className="text-xs px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium">
                  {tr("Aujourd'hui")}
                </button>
                <button onClick={() => changeMonth(1)} aria-label={tr("Mois suivant")}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600">
                  ›
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
                    title={tr("Clic = sélectionner · Ctrl+clic = ajouter · Maj+clic = plage")}
                    className={`h-16 flex flex-col items-start p-1.5 text-left transition-colors border-b border-gray-100 ${colIndex < 6 ? "border-r" : ""} ${isSelected ? "bg-orange-50" : "hover:bg-gray-50"}`}
                  >
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-0.5 ${isToday ? "text-white" : isSelected ? "text-white" : "text-gray-700"}`}
                      style={isToday && !isSelected ? { background: "#e0600c" } : isSelected ? { background: "#e0600c", outline: "2px solid #ea580c", outlineOffset: "1px" } : {}}>
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
            <span className="px-2.5 py-1 rounded-full font-semibold" style={{ background: "#fef3c7", color: "#92400e" }}>{tr("RDV : rendez-vous")}</span>
            <span className="px-2.5 py-1 rounded-full font-semibold" style={{ background: "#fee2e2", color: "#991b1b" }}>{tr("créneau bloqué")}</span>
            {selectedDays.length > 0 && (
              <button onClick={() => setSelectedDays([])}
                className="ml-auto text-gray-400 hover:text-gray-600 font-semibold underline">
                {tr("Tout désélectionner")} ({selectedDays.length})
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
                      {selectedDays.length} {tr.en ? "days selected" : "jours sélectionnés"}
                    </h3>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selectedDays.map(d => new Date(d + "T12:00:00").toLocaleDateString(tr.locale, { day: "numeric", month: "short" })).join(" · ")}
                    </p>
                  </div>
                ) : (
                  <h3 className="font-bold text-gray-900">
                    {new Date(selectedDay! + "T12:00:00").toLocaleDateString(tr.locale, { weekday: "long", day: "numeric", month: "long" })}
                  </h3>
                )}
                <div className="flex gap-2 flex-wrap">
                  <button
                    onClick={() => { setBlockForm(f => ({ ...f, date: isMultiSelect ? "" : selectedDay! })); setShowBlockForm(true); setShowManualForm(false); }}
                    className="text-sm px-4 py-2 rounded-xl font-semibold border"
                    style={{ background: "#fef2f2", borderColor: "#fca5a5", color: "#dc2626" }}>
                    {isMultiSelect ? (tr.en ? `Block ${selectedDays.length} days` : `Bloquer ${selectedDays.length} jours`) : tr("Bloquer ce créneau")}
                  </button>
                </div>
              </div>

              {/* Manual RDV form */}
              {showManualForm && (
                <div className="rounded-xl p-4 mb-4" style={{ background: "#fff4ed", border: "1px solid #fed7aa" }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-sm">{tr("Nouveau rendez-vous")}</h4>
                    <button onClick={() => setShowManualForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                  </div>
                  <form onSubmit={isMultiSelect ? saveBulkManualRdv : saveManualRdv} className="space-y-3">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Nom du client *")}</label>
                        <input className={inputClass} required value={manualForm.customerName} onChange={e=>setManualForm(f=>({...f,customerName:e.target.value}))} placeholder="Jean Tremblay" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Téléphone *")}</label>
                        <input className={inputClass} required type="tel" value={manualForm.customerPhone} onChange={e=>setManualForm(f=>({...f,customerPhone:e.target.value}))} placeholder="514 555-0100" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Courriel")}</label>
                        <input className={inputClass} type="email" value={manualForm.customerEmail} onChange={e=>setManualForm(f=>({...f,customerEmail:e.target.value}))} placeholder="jean@exemple.com" />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">Service</label>
                        <select className={inputClass} value={manualForm.categoryId}
                          onChange={e => {
                            const cat = services.find(s => s.categoryId === e.target.value);
                            setManualForm(f => ({ ...f, categoryId: e.target.value, serviceName: cat?.categoryName ?? "" }));
                          }}>
                          <option value="">{tr("Autre / non précisé")}</option>
                          {services.map(s => (
                            <option key={s.categoryId} value={s.categoryId}>
                              {translateServiceName(s.categoryName, tr.en ? "en" : "fr")}{s.durationMin ? ` (${s.durationMin} min)` : ""}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Heure *")}</label>
                        <input className={inputClass} required type="time" value={manualForm.startTime} onChange={e=>setManualForm(f=>({...f,startTime:e.target.value}))} />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Marque")}</label>
                        <input className={inputClass} value={manualForm.vehicleMake} onChange={e=>setManualForm(f=>({...f,vehicleMake:e.target.value}))} placeholder="Toyota" />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Modèle")}</label>
                        <input className={inputClass} value={manualForm.vehicleModel} onChange={e=>setManualForm(f=>({...f,vehicleModel:e.target.value}))} placeholder="Camry" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">Notes <span className="font-normal text-gray-400">{tr("(visibles seulement par vous)")}</span></label>
                      <textarea className={inputClass} rows={3} maxLength={1000} style={{ resize: "none" }}
                        value={manualForm.notes ?? ""}
                        onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))}
                        placeholder={tr("Ex. : client déjà venu, apporte ses pneus, bruit au freinage…")} />
                    </div>
                    {manualError && <p className="text-sm font-semibold text-red-600">{manualError}</p>}
                    <div className="flex gap-2 pt-1">
                      <button type="submit" disabled={savingRdv} className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "#e0600c" }}>
                        {savingRdv ? tr("Ajout…") : tr("Ajouter")}
                      </button>
                      <button type="button" onClick={() => setShowManualForm(false)} className="border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">{tr("Annuler")}</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Block slot form */}
              {showBlockForm && (
                <div className="rounded-xl p-4 mb-4" style={{ background: "#fef2f2", border: "1px solid #fca5a5" }}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 text-sm">{tr("Bloquer un créneau")}</h4>
                    <button onClick={() => setShowBlockForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                  </div>
                  <form onSubmit={isMultiSelect ? saveBulkBlock : saveBlockSlot} className="space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-700 cursor-pointer">
                      <input type="checkbox" checked={blockForm.allDay}
                        onChange={e => setBlockForm(f => ({ ...f, allDay: e.target.checked }))}
                        className="accent-red-500 w-4 h-4" />
                      {tr("Journée entière")}
                    </label>
                    {!blockForm.allDay && (
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Heure début")}</label>
                          <input className={inputClass} type="time" value={blockForm.startTime} onChange={e=>setBlockForm(f=>({...f,startTime:e.target.value}))} />
                        </div>
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Heure fin")}</label>
                          <input className={inputClass} type="time" value={blockForm.endTime} onChange={e=>setBlockForm(f=>({...f,endTime:e.target.value}))} />
                        </div>
                      </div>
                    )}
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Raison (optionnel)")}</label>
                      <input className={inputClass} value={blockForm.reason} onChange={e=>setBlockForm(f=>({...f,reason:e.target.value}))} placeholder={tr("Congé, formation, fermeture exceptionnelle…")} />
                    </div>
                    <div className="flex gap-2">
                      <button type="submit" disabled={savingBlock}
                        className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50"
                        style={{ background: "#dc2626" }}>
                        {savingBlock ? tr("Blocage…") : isMultiSelect ? (tr.en ? `Block ${selectedDays.length} days` : `Bloquer ${selectedDays.length} jours`) : tr("Bloquer le créneau")}
                      </button>
                      <button type="button" onClick={() => setShowBlockForm(false)} className="border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">{tr("Annuler")}</button>
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
                            <span className="text-xs px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: sc.bg, color: sc.color }}>{tr(sc.label)}</span>
                          </div>
                          <p className="text-xs text-gray-500">{a.customerPhone}{a.serviceName ? ` · ${translateServiceName(a.serviceName, tr.en ? "en" : "fr")}` : ""}</p>
                          {(a as any).notes && (
                            <p className="text-xs mt-1 px-2 py-1 rounded-lg" style={{ background: "#fef9f0", color: "#92400e", border: "1px solid #fde68a" }}>
                              {(a as any).notes}
                            </p>
                          )}
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {a.status === "PENDING" && <>
                              <button onClick={() => updateApptStatus(a.id, "CONFIRMED")} className="text-xs px-2.5 py-0.5 rounded-lg bg-green-50 text-green-700 border border-green-200 font-semibold">{tr("✓ Confirmer")}</button>
                              <button onClick={() => updateApptStatus(a.id, "CANCELLED")} className="text-xs px-2.5 py-0.5 rounded-lg bg-red-50 text-red-600 border border-red-200 font-semibold">{tr("Refuser")}</button>
                            </>}
                            {a.status === "CONFIRMED" && <>
                              <button onClick={() => updateApptStatus(a.id, "COMPLETED")} className="text-xs px-2.5 py-0.5 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-semibold">{tr("✓ Terminé")}</button>
                              <button onClick={() => updateApptStatus(a.id, "CANCELLED")} className="text-xs px-2.5 py-0.5 rounded-lg bg-gray-50 text-gray-500 border border-gray-200 font-semibold">{tr("Annuler")}</button>
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
                  <p className="text-sm font-semibold text-gray-700">{tr("Créneaux bloqués")}</p>
                  {selectedDayBlocks.map(s => (
                    <div key={s.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#fef2f2", border: "1px solid #fca5a5" }}>
                      <svg className="w-5 h-5 text-red-500 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0110 0v4"/></svg>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-red-800">
                          {s.allDay ? tr("Journée entière") : `${s.startTime} – ${s.endTime}`}
                        </p>
                        {s.reason && <p className="text-xs text-red-600">{s.reason}</p>}
                      </div>
                      <button onClick={() => deleteBlockSlot(s.id)}
                        className="text-xs text-red-400 hover:text-red-600 font-semibold px-2">
                        {tr("Retirer")}
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!isMultiSelect && selectedDayAppts.length === 0 && selectedDayBlocks.length === 0 && !showManualForm && !showBlockForm && (
                <p className="text-gray-400 text-sm text-center py-4">{tr("Aucun événement ce jour.")}</p>
              )}
            </div>
          )}

          {/* Bloc 1 — Code de parrainage (réservé aux abonnés) */}
          {referralUnlocked ? (
            <div className="bg-white rounded-2xl border shadow-sm p-5" style={{ borderColor: "#fed7aa" }}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">{tr("Code de parrainage")}</p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="bg-orange-50 border border-orange-200 text-orange-700 font-mono font-bold text-lg px-4 py-2 rounded-xl tracking-widest select-all">
                  {garage.referralCode ?? "—"}
                </span>
                {garage.referralCode && (
                  <button type="button"
                    onClick={() => { navigator.clipboard.writeText(garage.referralCode!); setSuccess(tr("Code copié ✓")); setTimeout(() => setSuccess(""), 3000); }}
                    className="bg-[#e0600c] hover:bg-[#c45305] text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                    {tr("Copier")}
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-400 mt-3">{tr("Partagez ce code : le garage parrainé bénéficie de")} <strong>{tr("60 jours d'essai gratuit")}</strong> {tr("au lieu de 30.")}</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">{tr("Programme de parrainage")}</p>
              <p className="text-sm text-gray-600 mb-3">
                {tr.en
                  ? <>Activate your subscription to unlock your referral code: the garage you refer gets <strong>60 days of free trial</strong> instead of 30, and you join the Ambassador program (discounts on your invoice, priority in search, Certified badge).</>
                  : <>Activez votre abonnement pour débloquer votre code de parrainage : le garage que vous parrainez obtient <strong>60 jours d&apos;essai gratuit</strong> au lieu de 30, et vous accédez au programme Ambassadeur (réductions sur votre facture, priorité dans la recherche, badge Certifié).</>}
              </p>
              <button type="button" onClick={() => setActiveTab("abonnement")}
                className="text-sm font-bold text-white rounded-xl px-4 py-2" style={{ background: "#e0600c" }}>
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

          {/* Reviews with reply + moderation */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900 text-lg">{tr("Avis clients")}</h3>
              <span className="text-sm text-gray-400">{reviews.length} {tr.en ? "reviews" : "avis"}</span>
            </div>

            {reviews.length === 0 ? (
              <p className="text-gray-400 text-sm">{tr("Aucun avis pour l'instant. Encouragez vos clients à laisser un avis!")}</p>
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
                          <span className="text-xs px-2.5 py-1 rounded-lg font-medium bg-green-50 text-green-700 border border-green-200">{tr("✓ Signalement envoyé")}</span>
                        ) : (
                          <button
                            onClick={() => { setReportingId(reportingId === r.id ? null : r.id); setReportReason(""); }}
                            className="text-xs px-3 py-1 min-h-[44px] sm:min-h-0 rounded-lg border font-medium transition-colors"
                            style={{ background: reportingId === r.id ? "#fef2f2" : undefined, borderColor: "#fca5a5", color: "#dc2626" }}>
                            {tr("Signaler")}
                          </button>
                        )}
                        <button
                          onClick={() => {
                            if (replyingTo === r.id) { setReplyingTo(null); setReplyText(""); }
                            else { setReplyingTo(r.id); setReplyText(r.ownerReply ?? ""); }
                          }}
                          className="text-xs px-3 py-1 min-h-[44px] sm:min-h-0 rounded-lg border font-medium transition-colors"
                          style={{ background: "#fff4ed", borderColor: "#fed7aa", color: "#c2410c" }}>
                          {r.ownerReply ? tr("Modifier") : tr("Répondre")}
                        </button>
                      </div>
                    </div>

                    {r.title && <p className="text-sm font-semibold text-gray-800 mb-1">{r.title}</p>}
                    {r.comment && <p className="text-sm text-gray-600">{r.comment}</p>}

                    {/* Formulaire de signalement */}
                    {reportingId === r.id && (
                      <div className="mt-3 rounded-xl p-4 space-y-3" style={{ background: "#fef2f2", border: "1px solid #fca5a5" }}>
                        <p className="text-xs font-bold text-red-700">{tr("Signaler cet avis à l'équipe Garago")}</p>
                        <p className="text-xs text-red-600">{tr("Décrivez pourquoi vous souhaitez signaler cet avis. Notre équipe examinera votre demande et décidera s'il doit être retiré.")}</p>
                        <textarea
                          className={`${inputClass} min-h-[80px]`}
                          value={reportReason}
                          onChange={e => setReportReason(e.target.value)}
                          placeholder={tr("Ex : avis diffamatoire, faux client, contenu inapproprié…")}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => submitReport(r.id)}
                            disabled={sendingReport || !reportReason.trim()}
                            className="text-white text-xs px-4 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                            style={{ background: "#dc2626" }}>
                            {sendingReport ? tr("Envoi…") : tr("Confirmer le signalement")}
                          </button>
                          <button
                            onClick={() => { setReportingId(null); setReportReason(""); }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                            {tr("Annuler")}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Existing reply */}
                    {r.ownerReply && replyingTo !== r.id && (
                      <div className="mt-3 rounded-lg p-3 text-sm" style={{ background: "#fff4ed", borderLeft: "3px solid #f97316" }}>
                        <p className="text-xs font-bold text-orange-600 mb-1">{tr("Votre réponse :")}</p>
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
                          placeholder={tr("Rédigez votre réponse publique…")}
                        />
                        <div className="flex gap-2">
                          <button onClick={() => saveReply(r.id)} disabled={savingReply}
                            className="text-white text-xs px-4 py-1.5 rounded-lg font-semibold disabled:opacity-50"
                            style={{ background: "#e0600c" }}>
                            {savingReply ? tr("Envoi…") : tr("Publier la réponse")}
                          </button>
                          {r.ownerReply && (
                            <button onClick={() => { setReplyText(""); saveReply(r.id); }}
                              className="text-xs px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50">
                              {tr("Supprimer la réponse")}
                            </button>
                          )}
                          <button onClick={() => { setReplyingTo(null); setReplyText(""); }}
                            className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                            {tr("Annuler")}
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
              <p className="text-gray-500 text-sm">
                {tr("Cochez les services que vous offrez et indiquez, pour chacun, le prix « à partir de » : c'est le prix minimum que le client verra")}
              </p>
            </div>
            <button onClick={saveServices} disabled={saving} className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "#e0600c" }}>
              {saving ? d.saving : t.common.save}
            </button>
          </div>
          {/* Capacité de l'atelier */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <label htmlFor="garage-capacity" className="block text-sm font-bold text-gray-900 mb-1">
              {tr("Véhicules pris en charge en même temps")}
            </label>
            <div className="flex items-center gap-3">
              <input id="garage-capacity" type="number" inputMode="numeric" min={1} max={50}
                className={`${inputClass} max-w-[7rem]`}
                value={capacity}
                onChange={(e) => setCapacity(e.target.value)} />
              <span className="text-sm text-gray-500">{tr.en ? (parseInt(capacity, 10) > 1 ? "bays" : "bay") : parseInt(capacity, 10) > 1 ? "portes" : "porte"}</span>
            </div>
            <p className="text-xs text-gray-500 mt-2 leading-relaxed">
              {tr("Nombre de portes ou d'employés pouvant chacun s'occuper d'un véhicule en même temps. Un même")}{" "}
              {tr("créneau n'est complet que lorsque toutes vos portes sont occupées. Enregistrez pour appliquer.")}
            </p>
          </div>

          {/* Confirmation des rendez-vous */}
          <div className="rounded-xl p-4 mb-5" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
            <label htmlFor="garage-require-confirmation" className="flex items-start gap-3 cursor-pointer">
              <input id="garage-require-confirmation" type="checkbox" checked={requireConfirmation}
                onChange={(e) => setRequireConfirmation(e.target.checked)} className="w-4 h-4 mt-0.5 accent-orange-500" />
              <span>
                <span className="block text-sm font-bold text-gray-900">{tr("Demander aux clients de confirmer leur rendez-vous")}</span>
                <span className="block text-xs text-gray-500 mt-1 leading-relaxed">
                  {tr("Chaque client reçoit un courriel 48 h avant pour confirmer. Sans réponse, le créneau est remis à")}{" "}
                  {tr("disposition pour d'autres conducteurs (12 h avant le rendez-vous). Les rendez-vous pris moins de 24 h")}{" "}
                  {tr("à l'avance doivent être confirmés dans l'heure. Enregistrez pour appliquer.")}
                </span>
              </span>
            </label>
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
                      <ServiceIcon id={cat.id} size={18} className="text-gray-500" />{serviceLabel(cat, tr.en ? "en" : "fr")}
                    </label>
                  </div>
                  {active && (
                    <div className="grid grid-cols-1 gap-2 pl-7">
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">{tr("Durée")}</label>
                        {(() => {
                          const total = parseInt(String(active.durationMin), 10) || 0;
                          const setTotal = (t: number) =>
                            setServices(services.map((s) => s.categoryId === cat.id ? { ...s, durationMin: t > 0 ? String(t) : "" } : s));
                          const hours = Math.floor(total / 60);
                          const mins  = total % 60;
                          return (
                            <div className="flex items-center gap-2">
                              <input type="number" inputMode="numeric" min={0} aria-label={tr("Heures")} className={inputClass} style={{ width: 84 }} placeholder="0"
                                value={total > 0 ? hours : ""}
                                onChange={(e) => setTotal(Math.max(0, parseInt(e.target.value, 10) || 0) * 60 + mins)} />
                              <span className="text-sm text-gray-500">h</span>
                              <input type="number" inputMode="numeric" min={0} max={59} aria-label={tr("Minutes")} className={inputClass} style={{ width: 84 }} placeholder="45"
                                value={total > 0 ? mins : ""}
                                onChange={(e) => setTotal(hours * 60 + Math.min(59, Math.max(0, parseInt(e.target.value, 10) || 0)))} />
                              <span className="text-sm text-gray-500">min</span>
                            </div>
                          );
                        })()}
                      </div>
                      <div>
                        {(() => {
                          const invalid = priceTried && !(parseFloat(String(active.priceMin ?? "").replace(",", ".")) > 0);
                          return (
                            <>
                              <label htmlFor={`prix-${cat.id}`} className="block text-xs text-gray-500 mb-0.5">
                                {tr.en ? "Minimum price" : "Prix minimum"} <span className="text-red-600" aria-hidden="true">*</span>
                              </label>
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600">{tr("À partir de")}</span>
                                <input id={`prix-${cat.id}`} type="text" inputMode="decimal" pattern="[0-9]+([.,][0-9]{1,2})?" maxLength={9} required
                                  aria-label={tr.en ? `Starting price, in dollars, for ${cat.nameEn}` : `Prix à partir de, en dollars, pour ${cat.name}`} aria-invalid={invalid}
                                  className={inputClass} style={{ width: 110, ...(invalid ? { borderColor: "#dc2626" } : {}) }} placeholder="89"
                                  value={active.priceMin ?? ""}
                                  onChange={(e) => setServices(services.map((s) => s.categoryId === cat.id ? { ...s, priceMin: e.target.value } : s))} />
                                <span className="text-sm text-gray-600">$</span>
                              </div>
                              {invalid && <p className="text-xs mt-1" style={{ color: "#dc2626" }} role="alert">{tr("Indiquez le prix minimum de ce service.")}</p>}
                            </>
                          );
                        })()}
                      </div>
                      {/* Portes où ce service se fait : sert à placer les rendez-vous pris en ligne au bon poste */}
                      {(() => {
                        const posts = Math.min(50, Math.max(1, parseInt(capacity, 10) || 1));
                        if (posts < 2) return null;
                        const chosen = (active.bays ?? []).filter((b) => b >= 1 && b <= posts);
                        const setBays = (bays: number[]) => setServices(services.map((s) => s.categoryId === cat.id ? { ...s, bays } : s));
                        const chip = (on: boolean) => `px-3 py-1 min-h-[44px] sm:min-h-0 rounded-lg text-xs font-bold border ${on ? "text-white border-transparent" : "bg-white text-gray-600 border-gray-300"}`;
                        return (
                          <div role="group" aria-label={tr.en ? `Bays for ${cat.nameEn}` : `Portes pour ${cat.name}`}>
                            <span className="block text-xs text-gray-500 mb-1">{tr("Portes où ce service se fait")}</span>
                            <div className="flex flex-wrap gap-1.5">
                              <button type="button" aria-pressed={chosen.length === 0} className={chip(chosen.length === 0)} style={chosen.length === 0 ? { background: "#0b1f3a" } : {}}
                                onClick={() => setBays([])}>{tr("Tous")}</button>
                              {Array.from({ length: posts }, (_, i) => i + 1).map((n) => {
                                const on = chosen.includes(n);
                                return (
                                  <button key={n} type="button" aria-pressed={on} aria-label={tr.en ? `Bay ${n}` : `Porte ${n}`} className={chip(on)} style={on ? { background: "#0b1f3a" } : {}}
                                    onClick={() => setBays(on ? chosen.filter((b) => b !== n) : [...chosen, n].sort((x, y) => x - y))}>{n}</button>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })()}
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
              <p className="text-gray-500 text-sm mt-0.5">{tr("Cliquez ✓ pour accepter, pour refuser.")}</p>
            </div>
            <button onClick={saveBrands} disabled={saving}
              className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 flex-shrink-0" style={{ background: "#e0600c" }}>
              {saving ? d.saving : t.common.save}
            </button>
          </div>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-5 pb-4 border-b border-gray-100">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-green-500 inline-flex items-center justify-center text-white font-bold text-xs">✓</span>{tr("Acceptée")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-red-500 inline-flex items-center justify-center text-white font-bold text-xs">✗</span>{tr("Refusée")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-gray-200 inline-block" />{tr("Non configurée")}
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
                    <button onClick={() => toggleBrand(brand, true)} title={tr("Accepter")}
                      className="flex-1 py-2 text-xs font-bold transition-colors"
                      style={isAccepted ? { backgroundColor: "#22c55e", color: "white" } : { backgroundColor: "transparent", color: "#6b7280" }}>✓</button>
                    <div className="w-px bg-gray-100" />
                    <button onClick={() => toggleBrand(brand, false)} title={tr("Refuser")}
                      className="flex-1 py-2 text-xs font-bold transition-colors"
                      style={isRefused ? { backgroundColor: "#ef4444", color: "white" } : { backgroundColor: "transparent", color: "#6b7280" }}>✗</button>
                  </div>
                  {isAccepted && getModelsForMake(brand).length > 0 && (
                    <button onClick={() => setExpandedBrand(brand)}
                      className="w-full py-1.5 text-xs font-semibold border-t border-gray-100 hover:bg-green-100 transition-colors"
                      style={{ color: "#166534" }}>
                      {brandModels[brand]?.length ? `${brandModels[brand].length} ${tr.en ? "model" : "modèle"}${brandModels[brand].length > 1 ? "s" : ""}` : tr("Tous les modèles")}
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
                <h3 className="font-bold text-gray-900">{tr.en ? `${expandedBrand} models` : `Modèles ${expandedBrand}`}</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  {brandModels[expandedBrand]?.length ? tr("Modèles sélectionnés uniquement") : tr("Aucune restriction : tous les modèles sont traités")}
                </p>
              </div>
              <button onClick={() => setExpandedBrand(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg">×</button>
            </div>
            <div className="p-4 overflow-y-auto">
              {brandModels[expandedBrand]?.length > 0 && (
                <button onClick={() => setBrandModels((prev) => ({ ...prev, [expandedBrand]: [] }))}
                  className="text-xs font-semibold mb-3" style={{ color: "#f97316" }}>
                  {tr("Retirer toutes les restrictions (tous les modèles)")}
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
              <button onClick={() => setExpandedBrand(null)} className="w-full text-white py-2.5 rounded-xl text-sm font-semibold" style={{ background: "#e0600c" }}>
                {tr("Terminé")}
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
              <p className="text-gray-500 text-sm">{tr("Configurez vos heures d'ouverture pour chaque jour")}</p>
            </div>
            <button onClick={saveHoraires} disabled={saving} className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "#e0600c" }}>
              {saving ? d.saving : t.common.save}
            </button>
          </div>
          <div className="space-y-3 mt-5">
            {DAYS.map((day, i) => {
              const h = horaires[i];
              return (
                <div key={day} className={`flex flex-wrap items-center gap-x-4 gap-y-2 p-3 rounded-xl border ${h.isClosed ? "border-gray-100 bg-gray-50" : "border-gray-200"}`}>
                  <span className="w-24 text-sm font-semibold text-gray-700">{day}</span>
                  <input type="time" aria-label={`${day} : ${tr("Ouverture")}`} value={h.openTime} onChange={(e) => setHoraireField(i, "openTime", e.target.value)}
                    disabled={h.isClosed} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm disabled:opacity-40" />
                  <span className="text-gray-400 text-sm">—</span>
                  <input type="time" aria-label={`${day} : ${tr("Fermeture")}`} value={h.closeTime} onChange={(e) => setHoraireField(i, "closeTime", e.target.value)}
                    disabled={h.isClosed} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm disabled:opacity-40" />
                  <label className="flex items-center gap-2 min-h-[44px] sm:min-h-0 text-sm text-gray-600 ml-auto cursor-pointer">
                    <input type="checkbox" checked={h.isClosed} onChange={(e) => setHoraireField(i, "isClosed", e.target.checked)} className="accent-red-500" />
                    {tr("Fermé")}
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ MODAL AJOUT RDV MANUEL ══════════════════════════════════════════ */}
      {showAddRdv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(11,31,58,0.55)" }}
          onClick={(e) => { if (e.target === e.currentTarget) setShowAddRdv(false); }}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <h3 className="font-bold text-gray-900">{tr("Ajouter un rendez-vous")}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{tr("Un client qui a appelé ou qui s'est présenté")}</p>
              </div>
              <button onClick={() => setShowAddRdv(false)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg">×</button>
            </div>
            <form onSubmit={saveManualRdvModal} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Date *")}</label>
                  <input className={inputClass} required type="date" value={manualForm.date}
                    onChange={e => setManualForm(f => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Heure *")}</label>
                  <input className={inputClass} required type="time" value={manualForm.startTime}
                    onChange={e => setManualForm(f => ({ ...f, startTime: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Service</label>
                <select className={inputClass} value={manualForm.categoryId}
                  onChange={e => {
                    const cat = services.find(s => s.categoryId === e.target.value);
                    setManualForm(f => ({ ...f, categoryId: e.target.value, serviceName: cat?.categoryName ?? "" }));
                  }}>
                  <option value="">{tr("Autre / non précisé (1 h)")}</option>
                  {services.map(s => {
                    const t = parseInt(String(s.durationMin), 10) || 0;
                    const dur = t > 0 ? ` (${t >= 60 ? `${Math.floor(t / 60)} h${t % 60 ? ` ${t % 60}` : ""}` : `${t} min`})` : "";
                    return <option key={s.categoryId} value={s.categoryId}>{translateServiceName(s.categoryName, tr.en ? "en" : "fr")}{dur}</option>;
                  })}
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Nom du client *")}</label>
                  <input className={inputClass} required value={manualForm.customerName}
                    onChange={e => setManualForm(f => ({ ...f, customerName: e.target.value }))} placeholder="Jean Tremblay" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Téléphone *")}</label>
                  <input className={inputClass} required type="tel" value={manualForm.customerPhone}
                    onChange={e => setManualForm(f => ({ ...f, customerPhone: e.target.value }))} placeholder="514 555-0100" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Courriel")} <span className="font-normal text-gray-400">{tr("(optionnel)")}</span></label>
                <input className={inputClass} type="email" value={manualForm.customerEmail}
                  onChange={e => setManualForm(f => ({ ...f, customerEmail: e.target.value }))} placeholder="jean@exemple.com" />
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Année")}</label>
                  <input className={inputClass} inputMode="numeric" value={manualForm.vehicleYear}
                    onChange={e => setManualForm(f => ({ ...f, vehicleYear: e.target.value }))} placeholder="2020" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Marque")}</label>
                  <input className={inputClass} value={manualForm.vehicleMake}
                    onChange={e => setManualForm(f => ({ ...f, vehicleMake: e.target.value }))} placeholder="Toyota" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">{tr("Modèle")}</label>
                  <input className={inputClass} value={manualForm.vehicleModel}
                    onChange={e => setManualForm(f => ({ ...f, vehicleModel: e.target.value }))} placeholder="Camry" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">Notes <span className="font-normal text-gray-400">{tr("(visibles seulement par vous)")}</span></label>
                <textarea className={inputClass} rows={3} maxLength={1000} style={{ resize: "none" }}
                  value={manualForm.notes ?? ""}
                  onChange={e => setManualForm(f => ({ ...f, notes: e.target.value }))}
                  placeholder={tr("Ex. : client déjà venu, apporte ses pneus, bruit au freinage…")} />
              </div>
              {manualError && (
                <p className="text-sm font-semibold text-red-600 bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">{manualError}</p>
              )}
              <div className="flex gap-2 pt-1">
                <button type="submit" disabled={savingRdv}
                  className="flex-1 text-white px-5 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "#e0600c" }}>
                  {savingRdv ? tr("Ajout…") : tr("Ajouter le rendez-vous")}
                </button>
                <button type="button" onClick={() => setShowAddRdv(false)}
                  className="border border-gray-200 px-4 py-2.5 rounded-xl text-sm hover:bg-gray-50">{tr("Annuler")}</button>
              </div>
            </form>
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
                <h3 className="font-bold text-gray-900">{tr("Déplacer le rendez-vous")}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{rescheduleAppt.customerName} · {translateServiceName(rescheduleAppt.serviceName, tr.en ? "en" : "fr") || "—"}</p>
              </div>
              <button onClick={() => setRescheduleAppt(null)}
                className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg">
                ×
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Date picker */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{tr("Nouvelle date")}</label>
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
                  <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">{tr("Créneau disponible")}</label>
                  {slotsLoading ? (
                    <p className="text-sm text-gray-400 text-center py-3">{tr("Chargement des disponibilités…")}</p>
                  ) : slotsClosed ? (
                    <div className="text-center py-4 rounded-xl" style={{ background: "#fef2f2" }}>
                      <p className="text-sm font-semibold text-red-700">{tr("Fermé ce jour")}</p>
                      <p className="text-xs text-red-500 mt-1">{tr("Choisissez une autre date")}</p>
                    </div>
                  ) : rescheduleSlots.length === 0 ? (
                    <div className="text-center py-4 rounded-xl bg-gray-50">
                      <p className="text-sm text-gray-500">{tr("Aucun créneau disponible ce jour")}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {rescheduleSlots.map(slot => (
                        <button key={slot} type="button"
                          onClick={() => setRescheduleSlot(slot === rescheduleSlot ? "" : slot)}
                          className="py-2 rounded-xl text-sm font-semibold border-2 transition-all"
                          style={slot === rescheduleSlot
                            ? { background: "#e0600c", borderColor: "#f97316", color: "#fff" }
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
                {tr("Annuler")}
              </button>
              <button type="button"
                disabled={!rescheduleSlot || !rescheduleDate || rescheduleLoading}
                onClick={submitReschedule}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-colors"
                style={{ background: "#e0600c" }}>
                {rescheduleLoading ? tr("Déplacement…") : tr("Confirmer le déplacement")}
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
            <h2 className="font-bold text-gray-900 text-lg mb-5">{tr("Images du profil public")}</h2>

            {/* Cover image */}
            <div className="mb-8">
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tr("Image de couverture")}</label>

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
                      <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-lg font-medium">{tr("Glisser pour repositionner")}</span>
                      <span className="bg-black/50 text-white text-xs px-2 py-1 rounded-lg font-mono">{Math.round(coverPos.tx)}% / {Math.round(coverPos.ty)}%</span>
                    </div>
                  </>
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center"
                    style={{ background: "linear-gradient(90deg, #071428 0%, #0b1f3a 60%, #f97316 100%)" }}>
                    <span className="text-white/60 text-sm">{tr("Cliquez pour télécharger une image de couverture")}</span>
                  </div>
                )}
              </div>

              {/* Controls */}
              {garage.coverUrl && (
                <div className="space-y-2">
                  {/* Zoom slider */}
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-gray-500 w-16 flex-shrink-0">Zoom</span>
                    <input
                      type="range" min="0.2" max="3" step="0.01" aria-label="Zoom"
                      value={coverPos.zoom}
                      onChange={e => setCoverPos(p => ({ ...p, zoom: parseFloat(e.target.value) }))}
                      className="flex-1 accent-orange-500 h-2 cursor-pointer"
                    />
                    <span className="text-xs text-gray-500 w-10 text-right font-mono">{Math.round(coverPos.zoom * 100)}%</span>
                  </div>
                  {/* Background color toggle */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs text-gray-500 w-16 flex-shrink-0">{tr("Fond")}</span>
                    <button type="button" aria-expanded={showCoverColorPicker}
                      onClick={() => setShowCoverColorPicker(v => !v)}
                      className="flex items-center gap-1.5 text-xs px-3 min-h-[44px] sm:min-h-0 sm:px-2.5 sm:py-1 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-600 font-medium">
                      <div className="w-4 h-4 rounded border border-gray-300 flex-shrink-0"
                        style={{ background: coverBgColor ?? "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)" }} />
                      {coverBgColor ?? "Auto"}
                    </button>
                    {coverBgColor && (
                      <button type="button" onClick={() => { setCoverBgColor(null); setShowCoverColorPicker(false); }}
                        aria-label={tr("↺ Fond automatique (image floutée)")}
                        className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-xs text-gray-500 hover:text-gray-700 font-bold">✕</button>
                    )}
                    {hasEyeDropper && (
                    <button type="button" title={tr("Pipette : choisir une couleur à l'écran")}
                      onClick={async () => {
                        try { const { sRGBHex } = await (new (window as any).EyeDropper()).open(); setCoverBgColor(sRGBHex); setShowCoverColorPicker(false); } catch { /**/ }
                      }}
                      className="text-xs px-3 min-h-[44px] sm:min-h-0 sm:px-2.5 sm:py-1 rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-600 font-medium">
                      {tr("Pipette")}
                    </button>
                    )}
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
                      className="text-xs px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-lg font-semibold border"
                      style={{ background: "#fff4ed", borderColor: "#fed7aa", color: "#c2410c" }}>
                      {uploadingCover ? tr("Téléchargement…") : "Changer l'image"}
                    </button>
                    <button type="button"
                      onClick={() => setCoverPos({ tx: 0, ty: 0, zoom: 1 })}
                      className="text-xs px-3 py-1.5 min-h-[44px] sm:min-h-0 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                      {tr("Réinitialiser")}
                    </button>
                    <span className="text-xs text-gray-500 ml-1">{tr("Sauvegardez pour appliquer")}</span>
                  </div>
                </div>
              )}
              {!garage.coverUrl && (
                <button type="button" onClick={() => coverInputRef.current?.click()}
                  className="text-sm px-4 py-2 rounded-xl font-semibold border"
                  style={{ background: "#fff4ed", borderColor: "#fed7aa", color: "#c2410c" }}>
                  {uploadingCover ? tr("Téléchargement…") : tr("Télécharger une couverture")}
                </button>
              )}
              <input ref={coverInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, "cover"); e.target.value = ""; }} />
              <p className="text-xs text-gray-400 mt-2">{tr("Recommandé : 1200×400 px, JPG ou PNG.")}</p>
            </div>

            {/* Logo */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">{tr("Logo du garage")}</label>
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
                      <div className="w-full h-full bg-gray-50 flex items-center justify-center"><svg className="w-8 h-8 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94z"/></svg></div>
                    )}
                  </div>

                  {/* Zoom slider for logo */}
                  {garage.logoUrl && (
                    <div className="mt-2 w-24 space-y-1.5 relative">
                      <input
                        type="range" min="0.2" max="3" step="0.01" aria-label="Zoom"
                        value={logoPos.zoom}
                        onChange={e => setLogoPos(p => ({ ...p, zoom: parseFloat(e.target.value) }))}
                        className="w-full accent-orange-500 cursor-pointer"
                      />
                      <p className="text-xs text-gray-400 text-center font-mono">{Math.round(logoPos.zoom * 100)}%</p>
                      {/* Background colour toggle */}
                      <div className="flex items-center gap-1 pt-0.5">
                        <button type="button" aria-expanded={showLogoColorPicker}
                          onClick={() => setShowLogoColorPicker(v => !v)}
                          className="flex items-center gap-1 text-xs px-1.5 py-0.5 min-h-[44px] sm:min-h-0 rounded border border-gray-200 hover:bg-gray-50 text-gray-600 flex-1 justify-center">
                          <div className="w-3.5 h-3.5 rounded border border-gray-300 flex-shrink-0"
                            style={{ background: logoBgColor ?? "conic-gradient(red,yellow,lime,cyan,blue,magenta,red)" }} />
                          {tr("Fond")}
                        </button>
                        {logoBgColor && (
                          <button type="button" onClick={() => { setLogoBgColor(null); setShowLogoColorPicker(false); }}
                            aria-label={tr("↺ Fond automatique (image floutée)")}
                            className="min-w-[44px] min-h-[44px] sm:min-w-0 sm:min-h-0 text-xs text-gray-500 hover:text-gray-700 font-bold">✕</button>
                        )}
                        {hasEyeDropper && (
                        <button type="button" title={tr("Pipette")}
                          onClick={async () => {
                            try { const { sRGBHex } = await (new (window as any).EyeDropper()).open(); setLogoBgColor(sRGBHex); setShowLogoColorPicker(false); } catch { /**/ }
                          }}
                          className="text-xs px-1.5 py-0.5 min-h-[44px] sm:min-h-0 rounded border border-gray-200 hover:bg-gray-50 text-gray-600">
                          {tr("Pipette")}
                        </button>
                        )}
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
                  <p className="text-sm text-gray-600 mb-3">{tr("Votre logo apparaît sur votre profil public à côté de votre nom.")}</p>
                  {garage.logoUrl && (
                    <p className="text-xs text-gray-500 mb-2">
                      <strong>{tr("Glisser")}</strong> {tr("le logo pour le repositionner")}<br />
                      <strong>{tr("Curseur")}</strong> {tr.en ? "to zoom in or out" : "pour zoomer / dézoomer"}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => logoInputRef.current?.click()}
                      className="text-sm px-4 py-2 rounded-xl font-semibold border"
                      style={{ background: "#fff4ed", borderColor: "#fed7aa", color: "#c2410c" }}>
                      {uploadingLogo ? tr("Téléchargement…") : tr("Changer le logo")}
                    </button>
                    {garage.logoUrl && (
                      <button type="button" onClick={() => setLogoPos({ tx: 0, ty: 0, zoom: 1 })}
                        className="text-xs px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:bg-gray-50">
                        {tr("Réinitialiser")}
                      </button>
                    )}
                  </div>
                  {garage.logoUrl && (
                    <p className="text-xs text-gray-400 mt-2">{tr("Cliquez sur")} <strong>{tr("Sauvegarder le profil")}</strong> {tr("pour appliquer.")}</p>
                  )}
                </div>
              </div>
              <input ref={logoInputRef} type="file" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f, "logo"); e.target.value = ""; }} />
            </div>
          </div>

          {/* Profile info form */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-5">{tr("Informations du garage")}</h2>
            <form onSubmit={saveProfile} className="space-y-4 max-w-2xl">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{tr("Nom du garage")}</label>
                  <input type="text" className={inputClass} value={profileData.name ?? ""} onChange={(e) => setProfileData({ ...profileData, name: e.target.value })} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">{tr("Téléphone")}</label>
                  <input type="tel" className={inputClass} value={profileData.phone ?? ""} onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{tr("Adresse")}</label>
                <AddressAutocomplete onSelect={handleAddressSelect} initialValue={profileData.address ?? ""} inputClass={inputClass} />
                {profileData.latitude && profileData.longitude && (
                  <p className="text-xs text-green-600 mt-1 font-medium">{tr("✓ Coordonnées enregistrées : les clients proches vous trouveront en priorité")}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{tr("Courriel public")}</label>
                <input type="email" className={inputClass} value={profileData.email ?? ""} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} />
              </div>
              {/* Langues parlées sur place */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">{tr("Langues parlées sur place")}</label>
                <p className="text-xs text-gray-400 mb-2">{tr("Affichées sur votre profil public pour rassurer les clients.")}</p>
                <div className="flex flex-wrap gap-2">
                  {GARAGE_LANGUAGES.map((l) => {
                    const current = parseLanguages(profileData.languages);
                    const on = current.includes(l.code);
                    return (
                      <button key={l.code} type="button" role="checkbox" aria-checked={on}
                        onClick={() => setProfileData({
                          ...profileData,
                          languages: JSON.stringify(on ? current.filter((c) => c !== l.code) : [...current, l.code]),
                        })}
                        className="px-3 py-1.5 text-sm font-semibold border transition-colors"
                        style={{ borderRadius: 4, ...(on
                          ? { background: "#0b1f3a", color: "#fff", borderColor: "#0b1f3a" }
                          : { background: "#fff", color: "#475569", borderColor: "#cbd5e1" }) }}>
                        {l.fr}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={profileData.acceptsWalkIn ?? true} onChange={(e) => setProfileData({ ...profileData, acceptsWalkIn: e.target.checked })} className="accent-orange-500 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">{tr("Accepte sans rendez-vous")}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={profileData.appointmentOnly ?? false} onChange={(e) => setProfileData({ ...profileData, appointmentOnly: e.target.checked })} className="accent-orange-500 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">{tr("Sur rendez-vous seulement")}</span>
                </label>
              </div>

              {/* Visibilité du courriel */}
              <div className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={profileData.emailPublic ?? false} onChange={(e) => setProfileData({ ...profileData, emailPublic: e.target.checked })} className="accent-orange-500 w-4 h-4" />
                  <span className="text-sm font-medium text-gray-700">{tr("Afficher mon adresse courriel sur mon profil public")}</span>
                </label>
                <p className="text-xs text-gray-400 mt-1 ml-6">{tr("Si désactivé, votre courriel reste visible uniquement pour vous.")}</p>
              </div>

              <button type="submit" disabled={saving} className="text-white px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50" style={{ background: "#e0600c" }}>
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
              <h2 className="font-bold text-gray-900 text-lg mb-1">{tr("Mes garages")}</h2>
              <p className="text-sm text-gray-500 mb-4">
                {tr.en
                  ? "One subscription covers all your garages. First garage $109.99/month, each additional garage +$49.99/month (−20% on an annual plan). Each garage keeps its own profile, hours and calendar."
                  : <>Un seul abonnement couvre tous vos garages. 1<sup>er</sup> garage 109,99 $/mois, chaque garage supplémentaire +49,99 $/mois (−20 % en annuel). Chaque garage garde son profil, ses horaires et son agenda.</>}
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
                          {g.city}{g.parentId === null ? (tr.en ? " · main garage" : " · garage principal") : tr.en ? " · +$49.99/month" : " · +49,99 $/mois"}
                        </p>
                      </div>
                      {!isCurrent && (
                        <button onClick={() => switchGarage(g.id)}
                          className="text-xs font-bold text-orange-600 hover:underline flex-shrink-0">
                          {tr("Gérer")}
                        </button>
                      )}
                      {g.parentId !== null && (
                        <button onClick={() => { if (window.confirm(tr.en ? `Remove "${g.name}"? The profile is hidden right away and your invoice goes down by $49.99/month.` : `Retirer « ${g.name} » ? Le profil est masqué immédiatement et votre facture baisse de 49,99 $/mois.`)) removeBranch(g.id); }}
                          disabled={removingBranch === g.id}
                          className="text-xs font-semibold text-gray-400 hover:text-red-600 flex-shrink-0 disabled:opacity-50">
                          {removingBranch === g.id ? "…" : tr("Retirer")}
                        </button>
                      )}
                      {isCurrent && <span className="text-xs font-semibold text-gray-300 flex-shrink-0">{tr("affiché")}</span>}
                    </div>
                  );
                })}
              </div>
              <button onClick={() => { setBranchError(""); setShowAddBranch(true); }}
                className="mt-4 w-full flex items-center justify-center gap-2 border-[1.5px] border-dashed border-gray-300 rounded-xl py-3 text-sm font-bold text-gray-600 hover:border-orange-400 hover:text-orange-600 hover:bg-orange-50 transition-colors">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                {tr("Ajouter une succursale")}
              </button>
            </div>
          )}

          {/* Modale — ajouter une succursale */}
          {showAddBranch && (
            <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:p-10" style={{ background: "rgba(11,31,58,0.5)" }}
              onClick={() => !branchSaving && setShowAddBranch(false)}>
              <form onSubmit={submitBranch} onClick={(e) => e.stopPropagation()}
                className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
                <h3 className="text-lg font-black text-gray-900 mb-1">{tr("Ajouter une succursale")}</h3>
                <p className="text-sm text-gray-500 mb-4">{tr("Ce garage aura son propre profil, ses horaires et son agenda.")}</p>
                {branchError && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{branchError}</p>}
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{tr("Nom du garage")}</label>
                    <input type="text" required className={inputClass} placeholder="Garage Tremblay Brossard"
                      value={branchForm.name} onChange={(e) => setBranchForm({ ...branchForm, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{tr("Adresse")}</label>
                    <AddressAutocomplete
                      initialValue={branchForm.address}
                      inputClass={inputClass}
                      onSelect={(r: AddressResult) => setBranchForm((f) => ({
                        ...f, address: r.streetAddress, city: r.city,
                        postalCode: r.postalCode, latitude: r.lat, longitude: r.lng,
                      }))} />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">{tr("Téléphone")}</label>
                    <input type="tel" className={inputClass} placeholder="(450) 555-1234"
                      value={branchForm.phone} onChange={(e) => setBranchForm({ ...branchForm, phone: e.target.value })} />
                  </div>
                </div>
                <div className="rounded-xl p-3 mt-4" style={{ background: "#fff4ed", border: "1px solid #fed7aa" }}>
                  <p className="text-sm font-bold" style={{ color: "#ea6c0a" }}>{tr("+ 49,99 $/mois")}</p>
                  <p className="text-xs mt-0.5" style={{ color: "#9a3412" }}>
                    {garage.subscriptionStatus === "ACTIVE"
                      ? "Facturé au prorata dès aujourd'hui, puis à chaque cycle. Le garage principal porte la facture."
                      : tr("Gratuit pendant votre essai. Facturé quand vous activerez votre abonnement.")}
                  </p>
                </div>
                <div className="flex gap-2 mt-5">
                  <button type="button" onClick={() => setShowAddBranch(false)} disabled={branchSaving}
                    className="flex-1 border border-gray-300 rounded-xl py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-50">
                    {tr("Annuler")}
                  </button>
                  <button type="submit" disabled={branchSaving}
                    className="flex-1 text-white rounded-xl py-2.5 text-sm font-black disabled:opacity-50" style={{ background: "#e0600c" }}>
                    {branchSaving ? tr("Ajout…") : tr("Ajouter la succursale")}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Succursale : l'abonnement est géré depuis le garage principal */}
          {garage.parentId !== null && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-1">{tr("Statut")}</h2>
              <p className="text-sm text-gray-500 mb-4">
                {tr("Cette succursale est couverte par l'abonnement de votre garage principal.")}{" "}
                {tr("La facturation, l'activation et la résiliation se gèrent depuis celui-ci.")}
              </p>
              <button
                onClick={() => { const p = myGarages.find(g => g.parentId === null); if (p) switchGarage(p.id); }}
                className="text-sm font-bold text-white rounded-xl px-4 py-2" style={{ background: "#e0600c" }}>
                {tr("Aller au garage principal")}
              </button>
            </div>
          )}

          {/* ── Statut de l'abonnement (garage principal) ── */}
          {garage.parentId === null && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h2 className="font-bold text-gray-900 text-lg mb-4">{tr("Statut")}</h2>

            {garage.subscriptionStatus === "TRIAL" && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#eff6ff", color: "#1d4ed8", border: "1px solid #bfdbfe" }}>
                    {tr("Essai gratuit")}
                  </span>
                  {garage.subscriptionEndAt && (
                    <span className="text-sm text-gray-500">
                      {tr.en ? "until" : "jusqu'au"} {new Date(garage.subscriptionEndAt).toLocaleDateString(tr.locale, { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {tr("Votre garage est visible dans les résultats.")}{" "}
                  {garage.stripePriceId
                    ? "Votre abonnement démarrera automatiquement à la fin de l'essai avec la carte enregistrée."
                    : tr("Aucune carte n'est enregistrée. Ajoutez-en une pour que votre abonnement démarre automatiquement à la fin de l'essai, sans coupure.")}
                </p>
                {!garage.stripePriceId && (
                  <div className="mb-4">
                    <button onClick={() => addTrialCard("monthly")} disabled={addCardLoading}
                      className="text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60" style={{ background: "#e0600c" }}>
                      {addCardLoading ? tr("Redirection…") : tr("Ajouter ma carte")}
                    </button>
                  </div>
                )}
                {payError && <p role="alert" className="text-sm text-red-600 mb-3">{payError}</p>}
                {!garage.stripePriceId && (
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => startCheckout("annual")} disabled={checkoutLoading}
                    className="inline-flex items-center min-h-[44px] sm:min-h-0 text-sm font-semibold underline hover:no-underline disabled:opacity-60" style={{ color: "#c2410c" }}>
                    {checkoutLoading ? tr("Chargement…") : tr("Ou activer immédiatement : 88,00 $/mois (annuel, −20 %)")}
                  </button>
                  <button onClick={() => startCheckout("monthly")} disabled={checkoutLoading}
                    className="inline-flex items-center min-h-[44px] sm:min-h-0 text-sm font-semibold underline hover:no-underline disabled:opacity-60" style={{ color: "#c2410c" }}>
                    {tr("ou payer mensuellement (109,99 $/mois)")}
                  </button>
                </div>
                )}
              </>
            )}

            {garage.subscriptionStatus === "ACTIVE" && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#ecfdf5", color: "#047857", border: "1px solid #6ee7b7" }}>
                    {tr("Actif")}
                  </span>
                  {garage.subscriptionEndAt && (
                    <span className="text-sm text-gray-500">
                      {garage.cancelAtPeriodEnd ? tr("se termine le") : tr("prochain renouvellement le")}{" "}
                      {new Date(garage.subscriptionEndAt).toLocaleDateString(tr.locale, { day: "numeric", month: "long", year: "numeric" })}
                    </span>
                  )}
                </div>
                <p className="text-sm text-gray-500">
                  {garage.cancelAtPeriodEnd
                    ? "Votre abonnement ne se renouvellera pas. Vous gardez l'accès complet jusqu'à la date ci-dessus."
                    : tr("Votre garage apparaît dans les résultats de recherche et reçoit les réservations en ligne.")}
                </p>
              </>
            )}

            {garage.subscriptionStatus === "PAST_DUE" && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
                    {tr("Paiement échoué")}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {tr.en ? "Your last charge did not go through." : "Votre dernier prélèvement n'a pas abouti."} {pastDueDeadline
                    ? (tr.en ? `Update your payment method before ${pastDueDeadline} to stay visible in search.` : `Mettez votre moyen de paiement à jour avant le ${pastDueDeadline} pour rester visible dans la recherche.`)
                    : tr("Mettez votre moyen de paiement à jour pour rester visible dans la recherche.")}
                </p>
                <button onClick={openBillingPortal} disabled={portalLoading}
                  className="text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60" style={{ background: "#e0600c" }}>
                  {portalLoading ? tr("Ouverture…") : tr("Mettre à jour ma carte")}
                </button>
              </>
            )}

            {garage.subscriptionStatus === "EXPIRED" && (
              <>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-bold px-2.5 py-1 rounded-full" style={{ background: "#fef2f2", color: "#b91c1c", border: "1px solid #fecaca" }}>
                    {tr("Expiré")}
                  </span>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  {tr("Votre garage n'apparaît plus dans les résultats de recherche. Activez votre abonnement pour redevenir visible.")}
                </p>
                <div className="flex flex-wrap items-center gap-3">
                  <button onClick={() => startCheckout("annual")} disabled={checkoutLoading}
                    className="text-white px-5 py-2.5 rounded-xl font-bold text-sm disabled:opacity-60" style={{ background: "#e0600c" }}>
                    {checkoutLoading ? tr("Chargement…") : "Activer : 88,00 $/mois (annuel, −20 %)"}
                  </button>
                  <button onClick={() => startCheckout("monthly")} disabled={checkoutLoading}
                    className="inline-flex items-center min-h-[44px] sm:min-h-0 text-sm font-semibold underline hover:no-underline disabled:opacity-60" style={{ color: "#c2410c" }}>
                    {tr("ou payer mensuellement (109,99 $/mois)")}
                  </button>
                </div>
                {payError && <p role="alert" className="text-sm text-red-600 mt-3">{payError}</p>}
              </>
            )}
          </div>
          )}

          {/* ── Facturation + moyen de paiement (garage principal, abonné) ── */}
          {garage.parentId === null && (garage.subscriptionStatus === "ACTIVE" || (garage.subscriptionStatus === "TRIAL" && garage.stripePriceId)) && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-4">{tr("Facturation")}</h2>

              {billing?.hasSubscription ? (
                <>
                  <div className="flex items-baseline justify-between gap-3 pb-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">
                      {billing.cancelAtPeriodEnd
                        ? "Dernière facture avant résiliation"
                        : billing.interval === "year" ? (tr.en ? "Next annual invoice" : "Prochaine facture annuelle") : tr.en ? "Next monthly invoice" : "Prochaine facture mensuelle"}
                    </span>
                    <span className="text-xl font-black text-gray-900" style={{ fontVariantNumeric: "tabular-nums" }}>
                      {billing.nextAmount != null
                        ? `${(billing.nextAmount / 100).toLocaleString(tr.locale, { minimumFractionDigits: 2 })} ${billing.currency ?? "CAD"}`
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-baseline justify-between gap-3 py-3 border-b border-gray-100">
                    <span className="text-sm text-gray-500">
                      {billing.cancelAtPeriodEnd ? tr("Échéance") : tr("Date de prélèvement")}
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {billing.nextDate
                        ? new Date(billing.nextDate).toLocaleDateString(tr.locale, { day: "numeric", month: "long", year: "numeric" })
                        : "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-3 pt-3">
                    <span className="text-sm text-gray-500">{tr("Moyen de paiement")}</span>
                    <span className="text-sm font-bold text-gray-900">
                      {billing.paymentMethod?.type === "card"
                        ? `${(billing.paymentMethod.brand ?? (tr.en ? "card" : "carte")).replace(/^\w/, c => c.toUpperCase())} •••• ${billing.paymentMethod.last4}`
                        : billing.paymentMethod?.type === "acss_debit"
                        ? `${tr.en ? "Bank account" : "Compte bancaire"} •••• ${billing.paymentMethod.last4 ?? ""}`
                        : billing.paymentMethod?.type ?? tr("Non renseigné")}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  {billing === null
                    ? "Chargement…"
                    : tr("Gérez votre moyen de paiement et consultez vos factures sur la page sécurisée de Stripe.")}
                </p>
              )}

              <button onClick={openBillingPortal} disabled={portalLoading || billing === null}
                className="mt-4 text-sm font-semibold text-gray-700 border border-gray-300 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors disabled:opacity-50">
                {portalLoading ? tr("Ouverture…") : tr("Modifier le moyen de paiement")}
              </button>
              {portalError
                ? <p className="text-xs text-red-600 mt-2">{portalError}</p>
                : <p className="text-xs text-gray-400 mt-2">
                    {tr("Vous serez redirigé vers la page sécurisée de Stripe pour mettre à jour votre carte ou vos coordonnées bancaires et consulter vos factures.")}
                  </p>}
            </div>
          )}

          {/* ── Annulation / réactivation (abonnement actif, garage principal) ── */}
          {garage.parentId === null && (garage.subscriptionStatus === "ACTIVE" || (garage.subscriptionStatus === "TRIAL" && garage.stripePriceId)) && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-1">{tr("Renouvellement")}</h2>
              {garage.cancelAtPeriodEnd ? (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    {tr("Le renouvellement automatique est désactivé")}
                    {garage.subscriptionEndAt ? `${tr.en ? ", you keep full access until" : ", votre accès reste complet jusqu'au"} ${new Date(garage.subscriptionEndAt).toLocaleDateString(tr.locale, { day: "numeric", month: "long", year: "numeric" })}` : ""}.
                  </p>
                  {cancelError && <p className="text-xs text-red-600 mb-3">{cancelError}</p>}
                  <button onClick={() => cancelSubscription(true)} disabled={cancelLoading}
                    className="text-sm font-bold text-white rounded-xl px-4 py-2 disabled:opacity-50"
                    style={{ background: "#e0600c" }}>
                    {cancelLoading ? tr("Chargement…") : tr("Réactiver le renouvellement")}
                  </button>
                </>
              ) : (
                <>
                  <p className="text-sm text-gray-500 mb-4">
                    {tr("Vous pouvez annuler à tout moment. Vous garderez l'accès complet jusqu'à la fin de votre période déjà payée, sans renouvellement après.")}
                  </p>
                  {!showCancelConfirm ? (
                    <button onClick={() => setShowCancelConfirm(true)}
                      className="text-sm font-semibold text-gray-600 border border-gray-300 rounded-xl px-4 py-2 hover:bg-gray-50 transition-colors">
                      {tr("Annuler mon abonnement")}
                    </button>
                  ) : (
                    <div className="rounded-xl p-4" style={{ background: "#f8fafc", border: "1px solid #e2e8f0" }}>
                      <p className="text-sm font-semibold text-gray-800 mb-3">
                        {tr("Confirmer l'annulation ? Vous garderez l'accès jusqu'à la fin de la période déjà payée, sans renouvellement ensuite.")}
                      </p>
                      {cancelError && <p className="text-xs text-red-600 mb-3">{cancelError}</p>}
                      <div className="flex gap-3">
                        <button onClick={() => cancelSubscription(false)} disabled={cancelLoading}
                          className="text-sm font-bold text-white bg-gray-800 rounded-xl px-4 py-2 hover:bg-gray-900 disabled:opacity-50">
                          {cancelLoading ? tr("Chargement…") : tr("Oui, annuler")}
                        </button>
                        <button onClick={() => setShowCancelConfirm(false)} disabled={cancelLoading}
                          className="text-sm font-semibold text-gray-600 rounded-xl px-4 py-2 hover:bg-gray-100">
                          {tr("Retour")}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <PasswordChangeCard />

          {/* ── Zone de suppression du compte ── */}
          <div className="bg-white rounded-2xl border border-red-200 shadow-sm p-6">
            <h2 className="font-bold text-red-700 text-lg mb-1">{tr("Supprimer mon compte")}</h2>
            <p className="text-sm text-gray-500 mb-4">
              {tr("Cette action est définitive. Votre abonnement sera annulé automatiquement, votre fiche garage sera retirée des résultats de recherche, et toutes vos données (services, avis, rendez-vous, statistiques) seront effacées. C'est impossible à annuler.")}
            </p>
            {!showDeleteConfirm ? (
              <button onClick={() => setShowDeleteConfirm(true)}
                className="text-sm font-bold text-red-600 border border-red-300 rounded-xl px-4 py-2 hover:bg-red-50 transition-colors">
                {tr("Supprimer définitivement mon compte")}
              </button>
            ) : (
              <div className="rounded-xl p-4" style={{ background: "#fef2f2", border: "1px solid #fecaca" }}>
                <p className="text-sm font-semibold text-red-800 mb-3">{tr("Êtes-vous certain(e) ? Cette action est irréversible et annule votre abonnement.")}</p>
                <div className="mb-3">
                  <label htmlFor="del-pwd-g" className="block text-xs font-semibold text-red-800 mb-1">{tr("Entrez votre mot de passe pour confirmer (laissez vide si vous vous connectez avec Google)")}</label>
                  <input id="del-pwd-g" type="password" autoComplete="current-password" className="w-full border border-red-300 rounded-xl px-3 py-2 text-sm bg-white" value={deletePwd} onChange={(e) => setDeletePwd(e.target.value)} />
                </div>
                {deleteError && <p className="text-xs text-red-600 mb-3" role="alert">{deleteError}</p>}
                <div className="flex gap-3">
                  <button onClick={deleteAccount} disabled={deleting}
                    className="text-sm font-bold text-white bg-red-600 rounded-xl px-4 py-2 hover:bg-red-700 disabled:opacity-50">
                    {deleting ? tr("Suppression…") : tr("Oui, tout supprimer")}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting}
                    className="text-sm font-semibold text-gray-600 rounded-xl px-4 py-2 hover:bg-gray-100">
                    {tr("Annuler")}
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
          onCopyCode={() => { navigator.clipboard.writeText(garage.referralCode!); setSuccess(tr("Code copié ✓")); setTimeout(() => setSuccess(""), 3000); }}
        />
      )}
    </div>
  );
}
