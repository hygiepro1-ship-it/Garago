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
import { useLang } from "@/contexts/LanguageContext";

type Tab = "apercu" | "services" | "marques" | "horaires" | "profil";

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
export default function DashboardGaragePage() {
  const { t } = useLang();
  const d = t.dash;
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
  const [multiSelectMode, setMultiSelectMode] = useState(false);
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
    await fetch("/api/garage/profile", {
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
    setSelectedDays([]);
    setRdvLoaded(false); // reload data for new month
  }

  if (loading) {
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
    if (multiSelectMode || e.shiftKey || e.ctrlKey || e.metaKey) {
      if (e.shiftKey && lastClickedDay.current) {
        // Shift: select range
        const range = getAllDaysInRange(lastClickedDay.current, dayStr);
        setSelectedDays(prev => {
          const set = new Set(prev);
          range.forEach(d => set.add(d));
          return Array.from(set).sort();
        });
      } else {
        // Ctrl / Cmd / multiSelectMode: toggle individual day
        setSelectedDays(prev =>
          prev.includes(dayStr) ? prev.filter(d => d !== dayStr) : [...prev, dayStr].sort()
        );
      }
    } else {
      // Simple click (normal mode): deselect if sole selection, otherwise select only this
      setSelectedDays(prev => prev.length === 1 && prev[0] === dayStr ? [] : [dayStr]);
    }
    lastClickedDay.current = dayStr;
  }

  async function saveBulkBlock(e: React.FormEvent) {
    e.preventDefault();
    setSavingBlock(true);
    for (const date of selectedDays) {
      const res = await fetch("/api/blocked-slots", {
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
      const res = await fetch("/api/garage/appointments", {
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
    { id: "apercu",   label: d.overview,  icon: "📊" },
    { id: "services", label: d.services,  icon: "🔧" },
    { id: "marques",  label: d.brands,    icon: "🚗" },
    { id: "horaires", label: d.hours,     icon: "🕐" },
    { id: "profil",   label: d.profile,   icon: "⚙️" },
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
            <Link href={`/garage/${garage.slug}?from=dashboard`}
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
                <p className="text-gray-500 text-sm">Cliquez sur un jour pour voir les détails</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    setMultiSelectMode(v => {
                      if (v) setSelectedDays([]); // désélectionner tout en quittant le mode
                      return !v;
                    });
                  }}
                  title="Sélectionner plusieurs jours pour effectuer la même action"
                  className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${multiSelectMode ? "text-white border-transparent" : "border-gray-200 text-gray-600 hover:bg-gray-50"}`}
                  style={multiSelectMode ? { background: "#f97316", borderColor: "#f97316" } : {}}>
                  {multiSelectMode ? `✓ Multi (${selectedDays.length})` : "☐ Multi-jours"}
                </button>
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
          <div className="flex flex-wrap items-center gap-3 text-xs">
            <span className="px-2.5 py-1 rounded-full font-semibold" style={{ background: "#fef3c7", color: "#92400e" }}>RDV — rendez-vous</span>
            <span className="px-2.5 py-1 rounded-full font-semibold" style={{ background: "#fee2e2", color: "#991b1b" }}>🔒 créneau bloqué</span>
            {multiSelectMode && (
              <span className="px-2.5 py-1 rounded-full font-semibold" style={{ background: "#fff4ed", color: "#c2410c" }}>
                Mode multi-jours actif — cliquez les jours à sélectionner
              </span>
            )}
            {selectedDays.length > 1 && (
              <button onClick={() => { setSelectedDays([]); }}
                className="ml-auto text-gray-400 hover:text-gray-600 font-semibold underline">
                Effacer ({selectedDays.length} jours)
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
                    {isMultiSelect ? `🔒 Bloquer ${selectedDays.length} jours` : "🔒 Bloquer ce créneau"}
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
                    <h4 className="font-semibold text-gray-900 text-sm">🔒 Bloquer un créneau</h4>
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
              {isMultiSelect && !showManualForm && !showBlockForm && (() => {
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
                              const sc = statusColors[a.status] ?? statusColors.PENDING;
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
                                  <span className="text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0" style={{ backgroundColor: sc.bg, color: sc.color }}>{sc.label}</span>
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
                                  <span className="text-red-500">🔒</span>
                                  <div className="flex-1">
                                    <p className="text-xs font-semibold text-red-800">{dFr} — {s.allDay ? "Journée entière" : `${s.startTime} – ${s.endTime}`}</p>
                                    {s.reason && <p className="text-xs text-red-600">{s.reason}</p>}
                                  </div>
                                  <button onClick={() => deleteBlockSlot(s.id)} className="text-xs text-red-400 hover:text-red-600 font-semibold px-2">Retirer</button>
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
              })()}

              {/* Single-day: appointments */}
              {!isMultiSelect && selectedDayAppts.length > 0 && (
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

              {/* Single-day: blocked slots */}
              {!isMultiSelect && selectedDayBlocks.length > 0 && (
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
                    const sc = statusColors[a.status] ?? statusColors.PENDING;
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
                      <p className="text-sm font-semibold text-red-700">🔒 Fermé ce jour</p>
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
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-semibold text-gray-700">Description</label>
                  {profileData.descriptionStatus === "PENDING" && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fef3c7", color: "#92400e" }}>
                      ⏳ En attente de validation
                    </span>
                  )}
                  {profileData.descriptionStatus === "REJECTED" && (
                    <span className="text-xs font-semibold px-2 py-0.5 rounded-full" style={{ background: "#fee2e2", color: "#991b1b" }}>
                      ✗ Description refusée — modifiez-la et sauvegardez
                    </span>
                  )}
                </div>
                <textarea className={`${inputClass} min-h-[100px]`} value={profileData.description ?? ""} onChange={(e) => setProfileData({ ...profileData, description: e.target.value })} placeholder="Décrivez votre garage, votre expertise..." />
                {profileData.descriptionStatus === "PENDING" && profileData.descriptionDraft && (
                  <p className="text-xs mt-1" style={{ color: "#78350f" }}>
                    Votre modification est en cours de révision et sera affichée publiquement une fois approuvée.
                  </p>
                )}
                <p className="text-xs text-gray-400 mt-1">Texte descriptif uniquement — les liens, courriels, numéros de téléphone et mentions ne sont pas autorisés.</p>
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

              <button type="submit" disabled={saving} className="text-white px-6 py-2.5 rounded-xl font-semibold disabled:opacity-50" style={{ background: "#f97316" }}>
                {saving ? d.saving : d.save}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
