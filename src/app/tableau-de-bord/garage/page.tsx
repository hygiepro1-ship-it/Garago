"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { BRANDS } from "@/lib/vehicleBrands";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { formatPriceRange } from "@/lib/utils";
import AddressAutocomplete, { type AddressResult } from "@/components/AddressAutocomplete";
import BrandLogo from "@/components/BrandLogo";

type Tab = "apercu" | "services" | "marques" | "horaires" | "profil";

// ─── Image position helper ───────────────────────────────────────────────────
function parseImgPos(raw: string | null | undefined): { tx: number; ty: number; zoom: number } {
  const d = { tx: 0, ty: 0, zoom: 1 };
  if (!raw) return d;
  try {
    const p = JSON.parse(raw);
    if (p && typeof p === "object") {
      if ("tx" in p) return { tx: Number(p.tx) || 0, ty: Number(p.ty) || 0, zoom: Math.max(0.1, Number(p.zoom) || 1) };
      if ("x"  in p) return { tx: (Number(p.x) || 50) - 50, ty: (Number(p.y) || 50) - 50, zoom: Math.max(0.1, Number(p.zoom) || 1) };
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
export default function DashboardGaragePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("apercu");
  const [garage, setGarage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  async function startCheckout() {
    setCheckoutLoading(true);
    const res = await fetch("/api/stripe/checkout", { method: "POST" });
    const data = await res.json();
    if (data.url) window.location.href = data.url;
    else setCheckoutLoading(false);
  }

  // ── Appointments + blocked slots state ──────────────────────────────────
  const [appointments, setAppointments] = useState<any[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<any[]>([]);
  const [rdvLoaded, setRdvLoaded] = useState(false);

  // Calendar nav
  const today = new Date();
  const [calYear, setCalYear]   = useState(today.getFullYear());
  const [calMonth, setCalMonth] = useState(today.getMonth()); // 0-based
  const [selectedDay, setSelectedDay] = useState<string | null>(null); // "YYYY-MM-DD"

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
      fetch("/api/garage/profile").then(r => r.json()).then(d => { setGarage(d); setLoading(false); });
    }
  }, [status, router]);

  // ── Services state ────────────────────────────────────────────────────────
  const [services, setServices] = useState<any[]>([]);
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
    await fetch("/api/garage/services", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ services }),
    });
    setSaving(false);
    setSuccess("Services sauvegardés ✓");
    setTimeout(() => setSuccess(""), 3000);
  }

  // ── Brands state ──────────────────────────────────────────────────────────
  const [brands, setBrands] = useState<any[]>([]);
  useEffect(() => { if (garage?.brands) setBrands(garage.brands); }, [garage]);

  function toggleBrand(brand: string, accepts: boolean) {
    const existing = brands.find((b) => b.brand === brand);
    if (existing) {
      if (existing.accepts === accepts) setBrands(brands.filter((b) => b.brand !== brand));
      else setBrands(brands.map((b) => b.brand === brand ? { ...b, accepts } : b));
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
    await fetch("/api/garage/brands", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brands }),
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
    if (garage?.availability?.length > 0) {
      setHoraires(DAYS.map((_, i) => {
        const a = garage.availability.find((x: any) => x.dayOfWeek === i);
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
    await fetch("/api/garage/availability", {
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
  const [coverPos, setCoverPos] = useState({ tx: 0, ty: 0, zoom: 1 });
  const [logoPos,  setLogoPos]  = useState({ tx: 0, ty: 0, zoom: 1 });
  useEffect(() => {
    if (garage) {
      setCoverPos(parseImgPos(garage.coverPosition));
      setLogoPos(parseImgPos(garage.logoPosition));
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
    await fetch("/api/garage/profile", {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...profileData,
        coverPosition: JSON.stringify({ zoom: coverPos.zoom, tx: coverPos.tx, ty: coverPos.ty }),
        logoPosition:  JSON.stringify({ zoom: logoPos.zoom,  tx: logoPos.tx,  ty: logoPos.ty  }),
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
    const res = await fetch("/api/garage/upload", { method: "POST", body: fd });
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
  const [reviews, setReviews] = useState<any[]>([]);
  useEffect(() => { if (garage?.reviews) setReviews(garage.reviews); }, [garage]);

  const [replyingTo, setReplyingTo] = useState<string | null>(null); // reviewId
  const [replyText, setReplyText]   = useState("");
  const [savingReply, setSavingReply] = useState(false);

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

  async function toggleHideReview(reviewId: string, currentlyHidden: boolean) {
    const res = await fetch(`/api/reviews/${reviewId}/hide`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isHidden: !currentlyHidden }),
    });
    if (res.ok) {
      setReviews(prev => prev.map(r => r.id === reviewId ? { ...r, isHidden: !currentlyHidden } : r));
    }
  }

  // ── RDV / Calendar ─────────────────────────────────────────────────────
  useEffect(() => {
    if (activeTab === "apercu" && !rdvLoaded && garage) {
      const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
      Promise.all([
        fetch("/api/garage/appointments").then(r => r.json()),
        fetch(`/api/blocked-slots?month=${monthStr}`).then(r => r.json()),
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
      fetch("/api/garage/appointments").then(r => r.json()),
      fetch(`/api/blocked-slots?month=${monthStr}`).then(r => r.json()),
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
    setSelectedDay(null);
    setRdvLoaded(false); // reload data for new month
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20 text-gray-500">Chargement de votre tableau de bord...</div>;
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
    // Ensure selectedDay is used as date if manualForm.date not set
    const formData = { ...manualForm, date: manualForm.date || selectedDay || "" };
    const res = await fetch("/api/garage/appointments", {
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
    const res = await fetch("/api/blocked-slots", {
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

  const selectedDayAppts  = selectedDay ? appointments.filter(a => a.date === selectedDay) : [];
  const selectedDayBlocks = selectedDay ? blockedSlots.filter(s => s.date === selectedDay) : [];

  const statusColors: Record<string, { bg: string; color: string; label: string }> = {
    PENDING:   { bg: "#fef3c7", color: "#92400e", label: "En attente" },
    CONFIRMED: { bg: "#d1fae5", color: "#065f46", label: "Confirmé"   },
    COMPLETED: { bg: "#ede9fe", color: "#5b21b6", label: "Terminé"    },
    CANCELLED: { bg: "#fee2e2", color: "#991b1b", label: "Annulé"     },
  };

  // ── Computed values ─────────────────────────────────────────────────────
  const avgRating = garage.reviews?.length > 0
    ? (garage.reviews.reduce((s: number, r: any) => s + r.rating, 0) / garage.reviews.length).toFixed(1)
    : null;

  const isTrialExpiring = garage.subscriptionStatus === "TRIAL" && garage.subscriptionEndAt
    && new Date(garage.subscriptionEndAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "apercu",   label: "Aperçu",    icon: "📊" },
    { id: "services", label: "Services",  icon: "🔧" },
    { id: "marques",  label: "Marques",   icon: "🚗" },
    { id: "horaires", label: "Horaires",  icon: "🕐" },
    { id: "profil",   label: "Profil",    icon: "⚙️" },
  ];

  const inputClass = "block w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="text-white rounded-2xl p-6 mb-8"
        style={{ background: "linear-gradient(135deg, #071428 0%, #0b1f3a 100%)", border: "1px solid rgba(249,115,22,0.2)" }}>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">{garage.name}</h1>
            <p className="mt-1" style={{ color: "rgba(255,255,255,0.5)" }}>📍 {garage.city}, {garage.province}</p>
          </div>
          <div className="flex items-center gap-3">
            {garage.subscriptionStatus === "TRIAL" && (
              <span className="bg-yellow-400 text-yellow-900 text-xs font-bold px-3 py-1 rounded-full">
                Essai gratuit {garage.subscriptionEndAt ? `— expire le ${new Date(garage.subscriptionEndAt).toLocaleDateString("fr-CA")}` : ""}
              </span>
            )}
            {garage.subscriptionStatus === "ACTIVE" && (
              <span className="bg-green-400 text-green-900 text-xs font-bold px-3 py-1 rounded-full">Abonnement actif ✓</span>
            )}
            <Link href={`/garage/${garage.slug}`} target="_blank"
              className="bg-white/20 border border-white/30 text-white text-sm px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">
              Voir mon profil →
            </Link>
          </div>
        </div>
      </div>

      {isTrialExpiring && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-yellow-900">Votre essai expire bientôt!</p>
              <p className="text-yellow-700 text-sm">Activez votre abonnement pour continuer à apparaître dans les résultats.</p>
            </div>
          </div>
          <button onClick={startCheckout} disabled={checkoutLoading}
            className="bg-yellow-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-yellow-600 text-sm whitespace-nowrap disabled:opacity-60">
            {checkoutLoading ? "Chargement…" : "S'abonner — 49$/mois"}
          </button>
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
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* ══ APERÇU ══════════════════════════════════════════════════════════ */}
      {activeTab === "apercu" && (
        <div className="space-y-6">
          {/* Stats grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: "⭐", label: "Note moyenne",        value: avgRating ? `${avgRating}/5` : "—" },
              { icon: "💬", label: "Avis reçus",          value: garage._count?.reviews ?? 0 },
              { icon: "🔧", label: "Services actifs",     value: garage.services?.length ?? 0 },
              { icon: "🚗", label: "Marques configurées", value: garage.brands?.length ?? 0 },
            ].map((stat) => (
              <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
                <div className="text-3xl mb-2">{stat.icon}</div>
                <div className="text-2xl font-extrabold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Referral card */}
          <div className="bg-white rounded-2xl border-2 border-dashed border-orange-300 shadow-sm p-6">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Parrainage — Gagnez 1 mois gratuit</h3>
                <p className="text-gray-500 text-sm mb-3">Partagez votre code avec un autre garage. Dès son premier paiement, vous recevez automatiquement 1 mois gratuit.</p>
                <div className="flex items-center gap-3 flex-wrap">
                  <span className="bg-orange-50 border border-orange-200 text-orange-700 font-mono font-bold text-lg px-4 py-2 rounded-xl tracking-widest select-all">
                    {garage.referralCode ?? "—"}
                  </span>
                  {garage.referralCode && (
                    <button type="button"
                      onClick={() => { navigator.clipboard.writeText(garage.referralCode); setSuccess("Code copié ✓"); setTimeout(() => setSuccess(""), 3000); }}
                      className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors">
                      Copier
                    </button>
                  )}
                </div>
              </div>
              <div className="text-4xl">🎁</div>
            </div>
          </div>

          {/* ── Calendrier & Rendez-vous ─────────────────────────────────── */}
          {/* Calendar header */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: "1px solid #f1f5f9" }}>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">
                  {MONTH_NAMES_FR[calMonth]} {calYear}
                </h2>
                <p className="text-gray-500 text-sm">Cliquez sur un jour pour voir les détails</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => changeMonth(-1)}
                  className="w-9 h-9 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 text-gray-600">
                  ←
                </button>
                <button onClick={() => { setCalYear(today.getFullYear()); setCalMonth(today.getMonth()); setSelectedDay(null); setRdvLoaded(false); }}
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
                const isSelected = dayStr === selectedDay;
                const apptCount  = apptCountForDay(dayStr);
                const blockCount = blockCountForDay(dayStr);
                const colIndex = (firstDayOfWeek + i) % 7;
                return (
                  <button key={day}
                    onClick={() => setSelectedDay(isSelected ? null : dayStr)}
                    className={`h-16 flex flex-col items-start p-1.5 text-left transition-colors border-b border-gray-100 ${colIndex < 6 ? "border-r" : ""} ${isSelected ? "bg-orange-50" : "hover:bg-gray-50"}`}
                  >
                    <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full mb-0.5 ${isToday ? "text-white" : isSelected ? "text-orange-600" : "text-gray-700"}`}
                      style={isToday ? { background: "#f97316" } : {}}>
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
                        <span className="text-xs px-1 rounded font-bold leading-tight"
                          style={{ background: "#fee2e2", color: "#991b1b" }}>
                          🔒{blockCount}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-full font-semibold" style={{ background: "#fef3c7", color: "#92400e" }}>RDV — rendez-vous</span>
            <span className="px-2.5 py-1 rounded-full font-semibold" style={{ background: "#fee2e2", color: "#991b1b" }}>🔒 créneau bloqué</span>
          </div>

          {/* Selected day detail */}
          {selectedDay && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <h3 className="font-bold text-gray-900">
                  {new Date(selectedDay + "T12:00:00").toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" })}
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setManualForm(f => ({ ...f, date: selectedDay })); setShowManualForm(true); setShowBlockForm(false); }}
                    className="text-white text-sm px-4 py-2 rounded-xl font-semibold"
                    style={{ background: "#f97316" }}>
                    + Nouveau RDV
                  </button>
                  <button
                    onClick={() => { setBlockForm(f => ({ ...f, date: selectedDay })); setShowBlockForm(true); setShowManualForm(false); }}
                    className="text-sm px-4 py-2 rounded-xl font-semibold border"
                    style={{ background: "#fef2f2", borderColor: "#fca5a5", color: "#dc2626" }}>
                    🔒 Bloquer ce créneau
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
                  <form onSubmit={saveManualRdv} className="space-y-3">
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
                    <h4 className="font-semibold text-gray-900 text-sm">🔒 Bloquer un créneau</h4>
                    <button onClick={() => setShowBlockForm(false)} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
                  </div>
                  <form onSubmit={saveBlockSlot} className="space-y-3">
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
                        {savingBlock ? "Blocage…" : "Bloquer le créneau"}
                      </button>
                      <button type="button" onClick={() => setShowBlockForm(false)} className="border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">Annuler</button>
                    </div>
                  </form>
                </div>
              )}

              {/* Appointments for selected day */}
              {selectedDayAppts.length > 0 && (
                <div className="space-y-3 mb-4">
                  <p className="text-sm font-semibold text-gray-700">Rendez-vous ({selectedDayAppts.length})</p>
                  {selectedDayAppts.map(a => {
                    const sc = statusColors[a.status] ?? statusColors.PENDING;
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

              {/* Blocked slots for selected day */}
              {selectedDayBlocks.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-semibold text-gray-700">Créneaux bloqués</p>
                  {selectedDayBlocks.map(s => (
                    <div key={s.id} className="flex items-center gap-3 rounded-xl p-3" style={{ background: "#fef2f2", border: "1px solid #fca5a5" }}>
                      <span className="text-red-500 text-lg">🔒</span>
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

              {selectedDayAppts.length === 0 && selectedDayBlocks.length === 0 && !showManualForm && !showBlockForm && (
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
                    const sc = statusColors[a.status] ?? statusColors.PENDING;
                    const dateObj = new Date(a.date + "T12:00:00");
                    const dateFr = dateObj.toLocaleDateString("fr-CA", { weekday: "short", day: "numeric", month: "short" });
                    return (
                      <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:bg-gray-50">
                        <div className="text-center bg-gray-50 rounded-xl px-2.5 py-1.5 border border-gray-100 min-w-[64px]">
                          <p className="text-xs text-gray-400 font-medium capitalize">{dateFr.split(" ")[0]}</p>
                          <p className="text-base font-extrabold text-gray-900 leading-none">{dateObj.getDate()}</p>
                          <p className="text-xs font-bold text-orange-500">{a.startTime}</p>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-900 text-sm">{a.customerName}</p>
                          <p className="text-xs text-gray-500">{a.customerPhone}{a.serviceName ? ` · ${a.serviceName}` : ""}</p>
                        </div>
                        <span className="text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0" style={{ backgroundColor: sc.bg, color: sc.color }}>
                          {sc.label}
                        </span>
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
                  <div key={r.id} className={`rounded-xl border p-4 transition-all ${r.isHidden ? "opacity-60 bg-gray-50" : "bg-white border-gray-200"}`}
                    style={r.isHidden ? { border: "1px solid #e2e8f0" } : {}}>
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
                        {r.isHidden && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-gray-200 text-gray-500">Masqué</span>
                        )}
                        <button
                          onClick={() => toggleHideReview(r.id, r.isHidden)}
                          className="text-xs px-2.5 py-1 rounded-lg border font-medium transition-colors"
                          style={r.isHidden
                            ? { background: "#f0fdf4", borderColor: "#86efac", color: "#15803d" }
                            : { background: "#fef2f2", borderColor: "#fca5a5", color: "#dc2626" }}>
                          {r.isHidden ? "👁 Afficher" : "🚫 Masquer"}
                        </button>
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
              <h2 className="font-bold text-gray-900 text-lg">Services offerts</h2>
              <p className="text-gray-500 text-sm">Cochez les services que vous offrez et ajoutez vos prix</p>
            </div>
            <button onClick={saveServices} disabled={saving} className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "#f97316" }}>
              {saving ? "Sauvegarde..." : "Sauvegarder"}
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
                      <span>{cat.icon}</span>{cat.name}
                    </label>
                  </div>
                  {active && (
                    <div className="grid grid-cols-3 gap-2 pl-7">
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Prix min ($)</label>
                        <input type="number" className={inputClass} placeholder="Ex: 50" value={active.priceMin}
                          onChange={(e) => setServices(services.map((s) => s.categoryId === cat.id ? { ...s, priceMin: e.target.value } : s))} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Prix max ($)</label>
                        <input type="number" className={inputClass} placeholder="Ex: 80" value={active.priceMax}
                          onChange={(e) => setServices(services.map((s) => s.categoryId === cat.id ? { ...s, priceMax: e.target.value } : s))} />
                      </div>
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
              <h2 className="font-bold text-gray-900 text-lg">Marques de véhicules</h2>
              <p className="text-gray-500 text-sm mt-0.5">Cliquez ✓ pour accepter, ✗ pour refuser.</p>
            </div>
            <button onClick={saveBrands} disabled={saving}
              className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50 flex-shrink-0" style={{ background: "#f97316" }}>
              {saving ? "Sauvegarde..." : "Sauvegarder"}
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
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ══ HORAIRES ════════════════════════════════════════════════════════ */}
      {activeTab === "horaires" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Horaires d'ouverture</h2>
              <p className="text-gray-500 text-sm">Configurez vos heures d'ouverture pour chaque jour</p>
            </div>
            <button onClick={saveHoraires} disabled={saving} className="text-white px-5 py-2 rounded-xl text-sm font-semibold disabled:opacity-50" style={{ background: "#f97316" }}>
              {saving ? "Sauvegarde..." : "Sauvegarder"}
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
                    <img
                      src={garage.coverUrl}
                      alt="Cover"
                      draggable={false}
                      style={{
                        position: "absolute",
                        inset: 0,
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
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
                    ) : (
                      <div className="w-full h-full bg-gray-50 flex items-center justify-center text-3xl">🔧</div>
                    )}
                  </div>

                  {/* Zoom slider for logo */}
                  {garage.logoUrl && (
                    <div className="mt-2 w-24 space-y-0.5">
                      <input
                        type="range" min="0.2" max="3" step="0.01"
                        value={logoPos.zoom}
                        onChange={e => setLogoPos(p => ({ ...p, zoom: parseFloat(e.target.value) }))}
                        className="w-full accent-orange-500 cursor-pointer"
                      />
                      <p className="text-xs text-gray-400 text-center font-mono">{Math.round(logoPos.zoom * 100)}%</p>
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
                <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
                <textarea className={`${inputClass} min-h-[100px]`} value={profileData.description ?? ""} onChange={(e) => setProfileData({ ...profileData, description: e.target.value })} placeholder="Décrivez votre garage, votre expertise..." />
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

              {/* Mobile agenda shortcut */}
              <div className="rounded-xl p-4 flex items-start gap-3" style={{ background: "#fff4ed", border: "1px solid #fed7aa" }}>
                <span className="text-2xl">📱</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Agenda mobile</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">Gérez vos rendez-vous depuis votre téléphone — confirmez ou annulez en un tap.</p>
                  <a href="/tableau-de-bord/garage/agenda"
                    className="inline-flex items-center gap-1.5 mt-2 text-xs px-3 py-1.5 rounded-lg text-white font-semibold" style={{ background: "#f97316" }}>
                    📅 Ouvrir l'agenda →
                  </a>
                </div>
              </div>

              <button type="submit" disabled={saving} className="text-white px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50" style={{ background: "#f97316" }}>
                {saving ? "Sauvegarde..." : "Sauvegarder le profil"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
