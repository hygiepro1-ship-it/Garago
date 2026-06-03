"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { VEHICLE_MAKES, getModelsForMake, getYears } from "@/lib/vehicleData";
import { useLang } from "@/contexts/LanguageContext";

// ── Carte véhicule avec vraie photo Wikipedia ─────────────────────────────────
function VehicleCard({ v, findGarageLabel }: { v: any; findGarageLabel: string }) {
  const [imgUrl,    setImgUrl]    = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    // Nettoie le nom du modèle pour correspondre aux titres Wikipedia
    const modelClean = (v.model as string)
      .replace(/\s*(Classic|Limited|Sport|XLE|XSE|Touring|EX|LX|SE|LE|XL|SL|SV|SR|SR5|TRD|Pro|Crew|Quad|Double|King|Regular|Cab)\b.*/i, "")
      .trim();
    const term = `${v.make}_${modelClean}`.replace(/\s+/g, "_");
    fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(term)}?redirect=true`)
      .then(r => r.json())
      .then(data => {
        const url = data.originalimage?.source ?? data.thumbnail?.source ?? null;
        setImgUrl(url);
      })
      .catch(() => setImgFailed(true));
  }, [v.make, v.model]);

  const brandAccent: Record<string, string> = {
    "Toyota": "#eb0a1e", "Honda": "#cc0000", "Ford": "#003087",
    "Chevrolet": "#d4a017", "GMC": "#c8102e", "Dodge": "#c8102e",
    "Ram": "#b22222", "Jeep": "#4a7c3f", "Nissan": "#c3002f",
    "Hyundai": "#002c5f", "Kia": "#bb162b", "Mazda": "#910000",
    "Subaru": "#003c8f", "Volkswagen": "#001e50", "BMW": "#1c69d4",
    "Mercedes-Benz": "#9a9a9a", "Audi": "#bb0a14", "Lexus": "#8b0000",
    "Acura": "#cc0000", "Infiniti": "#8a8a8a", "Cadillac": "#9a7d4f",
    "Tesla": "#cc0000", "Porsche": "#c00", "Volvo": "#1c6bba",
    "Mitsubishi": "#c8102e", "Buick": "#4a6fa5",
  };
  const accent = brandAccent[v.make] ?? "#f97316";
  const showFallback = !imgUrl || imgFailed;

  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white shadow-sm">
      {/* Zone image */}
      <div className="relative h-40 overflow-hidden flex items-center justify-center"
        style={{ background: showFallback ? `linear-gradient(135deg, #0b1f3a 0%, ${accent}55 100%)` : "#f0f0f0" }}>
        {imgUrl && !imgFailed ? (
          <img
            src={imgUrl}
            alt={`${v.year} ${v.make} ${v.model}`}
            className="w-full h-full object-cover"
            onError={() => setImgFailed(true)}
          />
        ) : (
          <div className="flex flex-col items-center justify-center opacity-60">
            <span className="text-5xl mb-1">🚗</span>
            <span className="text-xs text-white font-semibold">{v.make}</span>
          </div>
        )}
        {/* Badges overlay */}
        <span className="absolute top-2 left-3 text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: "rgba(0,0,0,0.55)", color: "#fff" }}>{v.year}</span>
        <span className="absolute top-2 right-3 text-xs font-bold px-2 py-0.5 rounded-full"
          style={{ background: accent, color: "#fff" }}>{v.make}</span>
      </div>
      {/* Infos + actions */}
      <div className="px-4 py-3 flex items-center justify-between gap-2">
        <div>
          <p className="font-bold text-gray-900 text-sm">{v.make} {v.model}</p>
          <p className="text-xs text-gray-400">{v.year}</p>
        </div>
        <Link
          href={`/rechercher?year=${v.year}&make=${v.make}&model=${v.model}`}
          className="text-xs font-semibold px-3 py-1.5 rounded-lg flex-shrink-0"
          style={{ background: "#fff7ed", color: "#f97316", border: "1px solid #fed7aa" }}
        >{findGarageLabel}</Link>
      </div>
    </div>
  );
}

type Tab = "rdv" | "vehicules" | "favoris" | "rappels" | "preferences";

interface ClientAppt {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  source: string;
  serviceName?: string;
  vehicleYear?: number;
  vehicleMake?: string;
  vehicleModel?: string;
  completionNote?: string;
  garage: { name: string; address: string; city: string; phone: string; slug: string };
}

const PRESET_REMINDERS = [
  "Vidange d'huile", "Pneus d'hiver", "Pneus d'été", "Freins",
  "Inspection mécanique", "Courroie de distribution", "Filtre à air",
  "Liquide de refroidissement", "Autre",
];

const PRIORITY_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  URGENT: { label: "Urgent",      color: "#dc2626", bg: "#fef2f2" },
  SOON:   { label: "Bientôt",     color: "#d97706", bg: "#fffbeb" },
  LOW:    { label: "Non urgent",  color: "#6b7280", bg: "#f9fafb" },
};

export default function DashboardConducteurPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const { t } = useLang();
  const d = t.driver;
  const [tab, setTab] = useState<Tab>("rdv");

  // ── Appointments ──────────────────────────────────────────────────────────
  const [appts,       setAppts]       = useState<ClientAppt[]>([]);
  const [apptsLoaded, setApptsLoaded] = useState(false);
  const [rescheduleAppt,  setRescheduleAppt]  = useState<ClientAppt | null>(null);
  const [rescheduleDate,  setRescheduleDate]  = useState("");
  const [rescheduleSlots, setRescheduleSlots] = useState<string[]>([]);
  const [slotsLoading,    setSlotsLoading]    = useState(false);
  const [slotsClosed,     setSlotsClosed]     = useState(false);
  const [rescheduleSlot,  setRescheduleSlot]  = useState("");
  const [rescheduling,    setRescheduling]    = useState(false);
  const [rescheduleErr,   setRescheduleErr]   = useState("");

  // ── Vehicles ──────────────────────────────────────────────────────────────
  const [vehicles, setVehicles]       = useState<any[]>([]);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [year, setYear]   = useState("");
  const [make, setMake]   = useState("");
  const [model, setModel] = useState("");
  const [savingVehicle, setSavingVehicle] = useState(false);
  const years  = getYears();
  const models = make ? getModelsForMake(make) : [];

  // ── Favorites ─────────────────────────────────────────────────────────────
  const [favorites, setFavorites]     = useState<any[]>([]);
  const [favsLoaded, setFavsLoaded]   = useState(false);

  // ── Préférences de notification ───────────────────────────────────────────
  const [notifPref,      setNotifPref]      = useState<"EMAIL"|"SMS"|"BOTH">("EMAIL");
  const [notifPhone,     setNotifPhone]     = useState("");
  const [prefLoaded,     setPrefLoaded]     = useState(false);
  const [prefSaving,     setPrefSaving]     = useState(false);
  const [prefSaved,      setPrefSaved]      = useState(false);
  const [prefErr,        setPrefErr]        = useState("");

  // ── Reminders ─────────────────────────────────────────────────────────────
  const [reminders, setReminders]       = useState<any[]>([]);
  const [remindersLoaded, setRemindersLoaded] = useState(false);
  const [showAddReminder, setShowAddReminder] = useState(false);
  const [rTitle, setRTitle]     = useState("");
  const [rCustom, setRCustom]   = useState("");
  const [rNotes, setRNotes]     = useState("");
  const [rDate, setRDate]       = useState("");
  const [rVehicle, setRVehicle] = useState("");
  const [rPriority, setRPriority] = useState("SOON");
  const [savingReminder, setSavingReminder] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion");
    if (status === "authenticated") {
      fetch("/api/vehicles").then(r => r.json()).then(d => { if (Array.isArray(d)) setVehicles(d); });
      fetch("/api/appointments").then(r => r.json()).then(d => { if (Array.isArray(d)) { setAppts(d); setApptsLoaded(true); } });
    }
  }, [status, router]);

  useEffect(() => {
    if (tab === "preferences" && !prefLoaded && status === "authenticated") {
      fetch("/api/user/profile").then(r => r.json()).then(d => {
        if (d.notifPref) setNotifPref(d.notifPref as "EMAIL"|"SMS"|"BOTH");
        if (d.phone)     setNotifPhone(d.phone);
        setPrefLoaded(true);
      });
    }
    if (tab === "favoris" && !favsLoaded && status === "authenticated") {
      fetch("/api/favorites").then(r => r.json()).then(d => { setFavorites(Array.isArray(d) ? d : []); setFavsLoaded(true); });
    }
    if (tab === "rappels" && !remindersLoaded && status === "authenticated") {
      fetch("/api/reminders").then(r => r.json()).then(d => { setReminders(Array.isArray(d) ? d : []); setRemindersLoaded(true); });
    }
  }, [tab, status, favsLoaded, remindersLoaded]);

  function canModify(appt: ClientAppt) {
    if (appt.source !== "ONLINE") return false;
    if (appt.status === "CANCELLED" || appt.status === "COMPLETED") return false;
    const dt = new Date(`${appt.date}T${appt.startTime}:00`);
    return (dt.getTime() - Date.now()) > 24 * 3600 * 1000;
  }

  function openReschedule(appt: ClientAppt) {
    setRescheduleAppt(appt);
    setRescheduleDate("");
    setRescheduleSlots([]);
    setRescheduleSlot("");
    setSlotsClosed(false);
    setRescheduleErr("");
  }

  async function fetchSlots(date: string) {
    if (!rescheduleAppt) return;
    setSlotsLoading(true); setRescheduleSlots([]); setRescheduleSlot(""); setSlotsClosed(false);
    const res = await fetch(`/api/garages/${rescheduleAppt.garage.slug}/slots?date=${date}&excludeId=${rescheduleAppt.id}`);
    const data = await res.json();
    if (data.closed) { setSlotsClosed(true); }
    else { setRescheduleSlots(data.slots ?? []); }
    setSlotsLoading(false);
  }

  async function submitReschedule(e: React.FormEvent) {
    e.preventDefault();
    if (!rescheduleAppt || !rescheduleSlot) return;
    setRescheduling(true); setRescheduleErr("");
    // Calcule endTime (+60 min)
    const [h, m] = rescheduleSlot.split(":").map(Number);
    const endMin = h * 60 + m + 60;
    const endTime = `${String(Math.floor(endMin / 60)).padStart(2, "0")}:${String(endMin % 60).padStart(2, "0")}`;
    try {
      const res = await fetch(`/api/appointments/${rescheduleAppt.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: rescheduleDate, startTime: rescheduleSlot, endTime }),
      });
      const data = await res.json();
      if (!res.ok) { setRescheduleErr(data.error ?? "Erreur"); return; }
      setAppts(prev => prev.map(a => a.id === rescheduleAppt.id ? { ...a, date: rescheduleDate, startTime: rescheduleSlot, endTime } : a));
      setRescheduleAppt(null);
    } finally { setRescheduling(false); }
  }

  async function cancelAppt(id: string) {
    if (!confirm("Confirmer l'annulation de ce rendez-vous ?")) return;
    const res = await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CANCELLED" }),
    });
    if (res.ok) setAppts(prev => prev.map(a => a.id === id ? { ...a, status: "CANCELLED" } : a));
  }

  async function savePreferences(e: React.FormEvent) {
    e.preventDefault();
    setPrefSaving(true); setPrefErr(""); setPrefSaved(false);
    const res = await fetch("/api/user/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ notifPref, phone: notifPhone || undefined }),
    });
    const data = await res.json();
    if (!res.ok) { setPrefErr(data.error ?? "Erreur"); }
    else { setPrefSaved(true); setTimeout(() => setPrefSaved(false), 3000); }
    setPrefSaving(false);
  }

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault();
    setSavingVehicle(true);
    const res = await fetch("/api/vehicles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ year: parseInt(year), make, model }) });
    if (res.ok) { const v = await res.json(); setVehicles(prev => [...prev, v]); setShowAddVehicle(false); setYear(""); setMake(""); setModel(""); }
    setSavingVehicle(false);
  }

  async function removeFav(garageId: string) {
    await fetch(`/api/favorites/${garageId}`, { method: "DELETE" });
    setFavorites(prev => prev.filter(f => f.garageId !== garageId));
  }

  async function addReminder(e: React.FormEvent) {
    e.preventDefault();
    setSavingReminder(true);
    const title = rTitle === "Autre" ? rCustom : rTitle;
    const res = await fetch("/api/reminders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, notes: rNotes || null, dueDate: rDate || null, vehicleId: rVehicle || null, priority: rPriority }),
    });
    if (res.ok) {
      const r = await res.json();
      setReminders(prev => [r, ...prev]);
      setShowAddReminder(false);
      setRTitle(""); setRCustom(""); setRNotes(""); setRDate(""); setRVehicle(""); setRPriority("SOON");
    }
    setSavingReminder(false);
  }

  async function toggleDone(id: string, done: boolean) {
    await fetch(`/api/reminders/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ done: !done }) });
    setReminders(prev => prev.map(r => r.id === id ? { ...r, done: !done } : r));
  }

  async function deleteReminder(id: string) {
    await fetch(`/api/reminders/${id}`, { method: "DELETE" });
    setReminders(prev => prev.filter(r => r.id !== id));
  }

  if (status === "loading") return <div className="flex items-center justify-center py-20 text-gray-500">{t.common.loading}</div>;

  const inputClass = "block w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-orange-400";

  const pending  = reminders.filter(r => !r.done);
  const done     = reminders.filter(r => r.done);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Header */}
      <div className="text-white rounded-2xl p-6 mb-8"
        style={{ background: "linear-gradient(135deg, #071428 0%, #0b1f3a 100%)", border: "1px solid rgba(249,115,22,0.2)" }}>
        <h1 className="text-2xl font-extrabold mb-1">{d.title}, {session?.user?.name} 👋</h1>
        <p style={{ color: "rgba(255,255,255,0.5)" }}>{d.subtitle}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

        {/* Main panel */}
        <div className="md:col-span-2 space-y-4">

          {/* Tabs */}
          <div className="flex gap-2 flex-wrap">
            {([
              { id: "rdv",       label: "📅 Rendez-vous" + (appts.filter(a => a.status !== "CANCELLED" && a.status !== "COMPLETED").length ? ` (${appts.filter(a => a.status !== "CANCELLED" && a.status !== "COMPLETED").length})` : "") },
              { id: "vehicules", label: d.vehicles },
              { id: "favoris",   label: d.favorites },
              { id: "rappels",     label: d.reminders + (pending.length ? ` (${pending.length})` : "") },
              { id: "preferences", label: "⚙️ Préférences" },
            ] as { id: Tab; label: string }[]).map(tb => (
              <button
                key={tb.id}
                onClick={() => setTab(tb.id)}
                className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === tb.id ? "text-white" : "bg-white border border-gray-200 text-gray-600"}`}
                style={tab === tb.id ? { background: "#f97316" } : {}}
              >
                {tb.label}
              </button>
            ))}
          </div>

          {/* ── Rendez-vous ── */}
          {tab === "rdv" && (() => {
            const now = new Date();
            const todayStr = now.toISOString().slice(0, 10);
            const upcoming  = appts.filter(a => a.status !== "CANCELLED" && a.status !== "COMPLETED" && a.date >= todayStr);
            const active    = appts.filter(a => a.status === "CONFIRMED" && a.date === todayStr);
            const past      = appts.filter(a => a.status === "COMPLETED" || (a.date < todayStr && a.status !== "CANCELLED"));
            const cancelled = appts.filter(a => a.status === "CANCELLED");

            const statusBadge: Record<string, { label: string; color: string; bg: string }> = {
              PENDING:   { label: "En attente",  color: "#d97706", bg: "#fffbeb" },
              CONFIRMED: { label: "Confirmé",    color: "#2563eb", bg: "#eff6ff" },
              COMPLETED: { label: "Terminé",     color: "#16a34a", bg: "#f0fdf4" },
              CANCELLED: { label: "Annulé",      color: "#dc2626", bg: "#fef2f2" },
            };

            function ApptRow({ appt }: { appt: ClientAppt }) {
              const s = statusBadge[appt.status] ?? statusBadge.PENDING;
              const modifiable = canModify(appt);
              return (
                <div className="border border-gray-200 rounded-xl p-4 space-y-2 bg-white">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/garage/${appt.garage.slug}`} className="group flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm group-hover:underline" style={{ color: "#1e3a5f" }}>{appt.garage.name} <span className="text-gray-400 font-normal text-xs">→</span></p>
                      <p className="text-xs text-gray-500">{new Date(appt.date + "T12:00:00").toLocaleDateString("fr-CA", { weekday: "long", day: "numeric", month: "long" })} · {appt.startTime} – {appt.endTime}</p>
                      {appt.serviceName && <p className="text-xs text-gray-500 mt-0.5">🔧 {appt.serviceName}</p>}
                      {(appt.vehicleMake || appt.vehicleYear) && (
                        <p className="text-xs text-gray-400">{[appt.vehicleYear, appt.vehicleMake, appt.vehicleModel].filter(Boolean).join(" ")}</p>
                      )}
                    </Link>
                    <span className="text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0" style={{ color: s.color, background: s.bg }}>{s.label}</span>
                  </div>
                  {appt.completionNote && (
                    <div className="rounded-lg px-3 py-2.5 text-xs" style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534" }}>
                      <p className="font-semibold mb-1">📋 Note du garage</p>
                      <p className="leading-relaxed">{appt.completionNote}</p>
                    </div>
                  )}
                  {!modifiable && appt.status !== "CANCELLED" && appt.status !== "COMPLETED" && (
                    <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-1.5">
                      ⚠️ Pour modifier, appelez le garage : <a href={`tel:${appt.garage.phone}`} className="font-semibold underline">{appt.garage.phone}</a>
                    </p>
                  )}
                  {modifiable && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => openReschedule(appt)}
                        className="text-xs px-3 py-2 rounded-lg font-semibold border border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors"
                      >✏️ Modifier</button>
                      <button
                        onClick={() => cancelAppt(appt.id)}
                        className="text-xs px-3 py-2 rounded-lg font-semibold border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
                      >✕ Annuler</button>
                    </div>
                  )}
                </div>
              );
            }

            return (
              <div className="space-y-4">
                {!apptsLoaded ? (
                  <p className="text-gray-400 text-sm text-center py-8">{t.common.loading}</p>
                ) : appts.length === 0 ? (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 text-center">
                    <div className="text-4xl mb-3">📅</div>
                    <p className="font-bold text-gray-700 mb-1">Aucun rendez-vous</p>
                    <p className="text-sm text-gray-400 mb-4">Vos réservations en ligne apparaîtront ici.</p>
                    <Link href="/rechercher" className="text-sm font-semibold hover:underline" style={{ color: "#f97316" }}>Trouver un garage →</Link>
                  </div>
                ) : (
                  <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 space-y-5">
                    {upcoming.length > 0 && (
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">À venir ({upcoming.length})</p>
                        <div className="space-y-3">{upcoming.map(a => <ApptRow key={a.id} appt={a} />)}</div>
                      </div>
                    )}
                    {active.length > 0 && (
                      <div>
                        <p className="text-xs font-black text-orange-500 uppercase tracking-widest mb-3">Aujourd'hui</p>
                        <div className="space-y-3">{active.map(a => <ApptRow key={a.id} appt={a} />)}</div>
                      </div>
                    )}
                    {past.length > 0 && (
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Passés</p>
                        <div className="space-y-3">{past.map(a => <ApptRow key={a.id} appt={a} />)}</div>
                      </div>
                    )}
                    {cancelled.length > 0 && (
                      <div>
                        <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Annulés</p>
                        <div className="space-y-3 opacity-60">{cancelled.map(a => <ApptRow key={a.id} appt={a} />)}</div>
                      </div>
                    )}
                  </div>
                )}

                {/* Modal modifier RDV — créneaux disponibles */}
                {rescheduleAppt && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.5)" }}>
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
                      <h3 className="font-black text-gray-900 text-lg mb-1">✏️ Modifier le rendez-vous</h3>
                      <p className="text-xs text-gray-400 mb-4">{rescheduleAppt.garage.name}</p>
                      <form onSubmit={submitReschedule} className="space-y-4">
                        {/* Sélection de la date */}
                        <div>
                          <label className="block text-xs font-semibold text-gray-500 mb-1">Nouvelle date</label>
                          <input
                            type="date"
                            required
                            className={inputClass}
                            value={rescheduleDate}
                            min={new Date(Date.now() + 25 * 3600000).toISOString().slice(0, 10)}
                            onChange={e => {
                              setRescheduleDate(e.target.value);
                              if (e.target.value) fetchSlots(e.target.value);
                            }}
                          />
                        </div>

                        {/* Créneaux disponibles */}
                        {rescheduleDate && (
                          <div>
                            <label className="block text-xs font-semibold text-gray-500 mb-2">Choisir un créneau</label>
                            {slotsLoading ? (
                              <p className="text-xs text-gray-400 text-center py-3">Chargement des créneaux…</p>
                            ) : slotsClosed ? (
                              <div className="rounded-xl p-3 text-xs text-center" style={{ background: "#fef2f2", color: "#dc2626" }}>
                                🚫 Le garage est fermé ce jour-là. Choisissez une autre date.
                              </div>
                            ) : rescheduleSlots.length === 0 ? (
                              <div className="rounded-xl p-3 text-xs text-center" style={{ background: "#fffbeb", color: "#92400e" }}>
                                ⚠️ Aucun créneau disponible ce jour-là. Essayez une autre date.
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-2">
                                {rescheduleSlots.map(slot => (
                                  <button
                                    key={slot}
                                    type="button"
                                    onClick={() => setRescheduleSlot(slot)}
                                    className="py-2 rounded-xl text-sm font-bold border-2 transition-all"
                                    style={rescheduleSlot === slot
                                      ? { borderColor: "#f97316", background: "#f97316", color: "#fff" }
                                      : { borderColor: "#e5e7eb", background: "#fff", color: "#374151" }}
                                  >
                                    {slot}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {rescheduleErr && <p className="text-xs text-red-600 bg-red-50 rounded-lg px-3 py-2">{rescheduleErr}</p>}
                        <div className="flex gap-2 pt-1">
                          <button type="button" onClick={() => setRescheduleAppt(null)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm">Annuler</button>
                          <button
                            type="submit"
                            disabled={rescheduling || !rescheduleSlot}
                            className="flex-1 py-2.5 rounded-xl text-white font-bold text-sm disabled:opacity-40"
                            style={{ background: "#f97316" }}
                          >
                            {rescheduling ? "…" : "Confirmer"}
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            );
          })()}

          {/* ── Préférences de notification ── */}
          {tab === "preferences" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-1">⚙️ Préférences de notification</h2>
              <p className="text-sm text-gray-400 mb-6">Choisissez comment vous souhaitez être informé de vos rendez-vous.</p>

              {!prefLoaded ? (
                <p className="text-gray-400 text-sm text-center py-8">{t.common.loading}</p>
              ) : (
                <form onSubmit={savePreferences} className="space-y-6">
                  {/* Choix du mode */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {([
                      { value: "EMAIL", icon: "📧", label: "Courriel", desc: "Confirmation et rappels par email" },
                      { value: "SMS",   icon: "📱", label: "SMS",      desc: "Messages texte sur votre téléphone" },
                      { value: "BOTH",  icon: "🔔", label: "Les deux", desc: "Courriel + SMS pour ne rien manquer" },
                    ] as { value: "EMAIL"|"SMS"|"BOTH"; icon: string; label: string; desc: string }[]).map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setNotifPref(opt.value)}
                        className="text-left p-4 rounded-xl border-2 transition-all"
                        style={notifPref === opt.value
                          ? { borderColor: "#f97316", background: "#fff7ed" }
                          : { borderColor: "#e5e7eb", background: "#fff" }}
                      >
                        <div className="text-2xl mb-2">{opt.icon}</div>
                        <p className="font-bold text-gray-900 text-sm">{opt.label}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{opt.desc}</p>
                        {notifPref === opt.value && (
                          <span className="mt-2 inline-block text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: "#f97316", color: "#fff" }}>✓ Sélectionné</span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* Numéro de téléphone (requis si SMS ou BOTH) */}
                  {(notifPref === "SMS" || notifPref === "BOTH") && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 mb-1">
                        Numéro de téléphone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="Ex : 514-555-1234"
                        className={inputClass}
                        value={notifPhone}
                        onChange={e => setNotifPhone(e.target.value)}
                      />
                      <p className="text-xs text-gray-400 mt-1">Numéro canadien utilisé uniquement pour les notifications Garago.</p>
                    </div>
                  )}

                  {prefErr && (
                    <p className="text-sm text-red-600 bg-red-50 rounded-xl px-4 py-3">{prefErr}</p>
                  )}
                  {prefSaved && (
                    <p className="text-sm text-green-700 bg-green-50 rounded-xl px-4 py-3">✅ Préférences sauvegardées !</p>
                  )}

                  <button
                    type="submit"
                    disabled={prefSaving}
                    className="w-full py-3 rounded-xl text-white font-bold text-sm disabled:opacity-50 transition-opacity"
                    style={{ background: "#f97316" }}
                  >
                    {prefSaving ? "Sauvegarde…" : "Sauvegarder mes préférences"}
                  </button>

                  {/* Info Twilio */}
                  {(notifPref === "SMS" || notifPref === "BOTH") && (
                    <div className="rounded-xl p-4 text-xs text-blue-800" style={{ background: "#eff6ff", border: "1px solid #bfdbfe" }}>
                      <p className="font-semibold mb-1">📱 À propos des SMS</p>
                      <p>Les notifications par SMS seront disponibles très prochainement. En attendant, vos confirmations seront envoyées par courriel.</p>
                    </div>
                  )}
                </form>
              )}
            </div>
          )}

          {/* ── Véhicules ── */}
          {tab === "vehicules" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900 text-lg">{d.myVehicles}</h2>
                <button onClick={() => setShowAddVehicle(!showAddVehicle)} className="text-sm text-white px-4 py-2 rounded-xl" style={{ background: "#f97316" }}>{d.addVehicle}</button>
              </div>
              {showAddVehicle && (
                <form onSubmit={addVehicle} className="rounded-xl p-4 mb-4 space-y-3" style={{ background: "#fff4ed", border: "1px solid #fed7aa" }}>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">{d.year}</label>
                      <select className={inputClass} value={year} onChange={e => setYear(e.target.value)} required>
                        <option value="">{d.year}</option>
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">{d.make}</label>
                      <select className={inputClass} value={make} onChange={e => { setMake(e.target.value); setModel(""); }} required>
                        <option value="">{d.make}</option>
                        {VEHICLE_MAKES.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">{d.model}</label>
                      <select className={inputClass} value={model} onChange={e => setModel(e.target.value)} disabled={!make} required>
                        <option value="">{d.model}</option>
                        {models.map(m => <option key={m} value={m}>{m}</option>)}
                      </select>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={savingVehicle} className="text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "#f97316" }}>{savingVehicle ? d.adding : d.add}</button>
                    <button type="button" onClick={() => setShowAddVehicle(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">{d.cancel}</button>
                  </div>
                </form>
              )}
              {vehicles.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <div className="text-4xl mb-2">🚗</div>
                  <p className="text-sm">{d.noVehicles}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {vehicles.map(v => (
                    <VehicleCard key={v.id} v={v} findGarageLabel={d.findGarage} />
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Favoris ── */}
          {tab === "favoris" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <h2 className="font-bold text-gray-900 text-lg mb-5">{d.myFavourites}</h2>
              {!favsLoaded ? (
                <p className="text-gray-400 text-sm text-center py-6">{t.common.loading}</p>
              ) : favorites.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <div className="text-4xl mb-3">♡</div>
                  <p className="text-sm font-medium mb-1">{d.noFavourites}</p>
                  <p className="text-xs mb-4">{d.noFavouritesSub}</p>
                  <Link href="/rechercher" className="text-sm hover:underline" style={{ color: "#f97316" }}>{d.findGarage}</Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {favorites.map(f => (
                    <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3 gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-lg bg-white border border-gray-200 flex items-center justify-center text-lg flex-shrink-0">
                          {f.garage.logoUrl ? <img src={f.garage.logoUrl} alt="" className="w-7 h-7 object-cover rounded" /> : "🔧"}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-gray-900 text-sm truncate">{f.garage.name}</p>
                          <p className="text-xs text-gray-500">{f.garage.city}, {f.garage.province}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Link href={`/garage/${f.garage.slug}`} className="text-xs font-medium hover:underline" style={{ color: "#f97316" }}>Voir →</Link>
                        <button onClick={() => removeFav(f.garageId)} className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none" title="Retirer des favoris">♥</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Rappels ── */}
          {tab === "rappels" && (
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-gray-900 text-lg">{d.maintenanceReminders}</h2>
                <button onClick={() => setShowAddReminder(!showAddReminder)} className="text-sm text-white px-4 py-2 rounded-xl" style={{ background: "#f97316" }}>{d.newReminder}</button>
              </div>

              {/* Add form */}
              {showAddReminder && (
                <form onSubmit={addReminder} className="rounded-xl p-4 mb-5 space-y-3" style={{ background: "#fff4ed", border: "1px solid #fed7aa" }}>
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{d.maintenanceType}</label>
                    <select className={inputClass} value={rTitle} onChange={e => setRTitle(e.target.value)} required>
                      <option value="">{d.choose}</option>
                      {PRESET_REMINDERS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  {rTitle === "Autre" && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">{d.specify}</label>
                      <input className={inputClass} value={rCustom} onChange={e => setRCustom(e.target.value)} placeholder="Ex: Révision complète" required />
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">{d.dueDate}</label>
                      <input type="date" className={inputClass} value={rDate} onChange={e => setRDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">{d.priority}</label>
                      <select className={inputClass} value={rPriority} onChange={e => setRPriority(e.target.value)}>
                        <option value="URGENT">{d.urgent}</option>
                        <option value="SOON">{d.soon}</option>
                        <option value="LOW">{d.low}</option>
                      </select>
                    </div>
                  </div>
                  {vehicles.length > 0 && (
                    <div>
                      <label className="block text-xs font-semibold text-gray-600 mb-1">{d.vehicleConcerned}</label>
                      <select className={inputClass} value={rVehicle} onChange={e => setRVehicle(e.target.value)}>
                        <option value="">{d.allVehicles}</option>
                        {vehicles.map(v => <option key={v.id} value={v.id}>{v.year} {v.make} {v.model}</option>)}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="block text-xs font-semibold text-gray-600 mb-1">{d.notes}</label>
                    <input className={inputClass} value={rNotes} onChange={e => setRNotes(e.target.value)} placeholder="Ex: Faire vérifier les plaquettes en même temps" />
                  </div>
                  <div className="flex gap-2">
                    <button type="submit" disabled={savingReminder} className="text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50" style={{ background: "#f97316" }}>{savingReminder ? d.adding : d.add}</button>
                    <button type="button" onClick={() => setShowAddReminder(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">{d.cancel}</button>
                  </div>
                </form>
              )}

              {!remindersLoaded ? (
                <p className="text-gray-400 text-sm text-center py-6">{t.common.loading}</p>
              ) : reminders.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <div className="text-4xl mb-3">🔔</div>
                  <p className="text-sm font-medium mb-1">{d.noReminders}</p>
                  <p className="text-xs">{d.noRemindersSub}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {pending.map(r => {
                    const p = PRIORITY_LABELS[r.priority] ?? PRIORITY_LABELS.SOON;
                    const isOverdue = r.dueDate && new Date(r.dueDate) < new Date();
                    return (
                      <div key={r.id} className="flex items-start gap-3 bg-white border border-gray-200 rounded-xl px-4 py-3 hover:border-gray-300 transition-colors">
                        <button onClick={() => toggleDone(r.id, r.done)} className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 hover:border-orange-400 flex-shrink-0 transition-colors" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-gray-900 text-sm">{r.title}</p>
                            <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ color: p.color, background: p.bg }}>{p.label}</span>
                            {isOverdue && <span className="text-xs text-red-500 font-medium">{d.overdue}</span>}
                          </div>
                          {r.vehicle && <p className="text-xs text-gray-500 mt-0.5">{r.vehicle.year} {r.vehicle.make} {r.vehicle.model}</p>}
                          {r.dueDate && <p className="text-xs text-gray-400 mt-0.5">📅 {new Date(r.dueDate).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" })}</p>}
                          {r.notes && <p className="text-xs text-gray-500 mt-1 italic">{r.notes}</p>}
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Link
                            href={`/rechercher${r.title ? `?service=${encodeURIComponent(r.title)}` : ""}`}
                            className="text-xs font-medium hover:underline whitespace-nowrap" style={{ color: "#f97316" }}
                            title="Trouver un garage pour ce service"
                          >
                            {d.book}
                          </Link>
                          <button onClick={() => deleteReminder(r.id)} className="text-gray-300 hover:text-red-400 transition-colors ml-2 text-lg leading-none">×</button>
                        </div>
                      </div>
                    );
                  })}

                  {done.length > 0 && (
                    <>
                      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide pt-3 pb-1">{d.completed}</p>
                      {done.map(r => (
                        <div key={r.id} className="flex items-start gap-3 bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 opacity-60">
                          <button onClick={() => toggleDone(r.id, r.done)} className="mt-0.5 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <span className="text-white text-xs leading-none">✓</span>
                          </button>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-gray-500 text-sm line-through">{r.title}</p>
                            {r.vehicle && <p className="text-xs text-gray-400">{r.vehicle.year} {r.vehicle.make} {r.vehicle.model}</p>}
                          </div>
                          <button onClick={() => deleteReminder(r.id)} className="text-gray-300 hover:text-red-400 transition-colors text-lg leading-none">×</button>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4">{d.quickActions}</h3>
            <div className="space-y-2">
              <Link href="/rechercher" className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition-colors group">
                <span className="text-xl">🔍</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">{d.findGarage}</span>
              </Link>
              <Link href="/rechercher?service=tires-winter" className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition-colors group">
                <span className="text-xl">❄️</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">{d.winterTires}</span>
              </Link>
              <Link href="/rechercher?service=oil" className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition-colors group">
                <span className="text-xl">🛢️</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">{d.oilChange}</span>
              </Link>
              <Link href="/rechercher?service=inspection" className="flex items-center gap-3 p-3 rounded-xl hover:bg-orange-50 transition-colors group">
                <span className="text-xl">🔍</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-orange-600">{d.inspection}</span>
              </Link>
            </div>
          </div>

          <div className="text-white rounded-2xl p-5" style={{ background: "linear-gradient(135deg, #071428 0%, #0b1f3a 100%)", border: "1px solid rgba(249,115,22,0.2)" }}>
            <div className="text-2xl mb-2">🏆</div>
            <h3 className="font-bold mb-1">{d.loyalty}</h3>
            <p className="text-sm" style={{ color: "rgba(255,255,255,0.5)" }}>{d.loyaltySub}</p>
          </div>

          <Link
            href="/suggestions"
            className="flex items-center justify-center gap-2 w-full py-3 px-4 rounded-2xl border-2 text-sm font-semibold transition-all hover:opacity-80"
            style={{ borderColor: "#f97316", color: "#f97316", background: "rgba(249,115,22,0.05)" }}
          >
            {d.suggestionLink}
          </Link>
        </div>
      </div>
    </div>
  );
}
