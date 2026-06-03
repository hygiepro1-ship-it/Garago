"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { VEHICLE_MAKES, getModelsForMake, getYears } from "@/lib/vehicleData";
import { useLang } from "@/contexts/LanguageContext";

type Tab = "vehicules" | "favoris" | "rappels";

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
  const [tab, setTab] = useState<Tab>("vehicules");

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
    }
  }, [status, router]);

  useEffect(() => {
    if (tab === "favoris" && !favsLoaded && status === "authenticated") {
      fetch("/api/favorites").then(r => r.json()).then(d => { setFavorites(Array.isArray(d) ? d : []); setFavsLoaded(true); });
    }
    if (tab === "rappels" && !remindersLoaded && status === "authenticated") {
      fetch("/api/reminders").then(r => r.json()).then(d => { setReminders(Array.isArray(d) ? d : []); setRemindersLoaded(true); });
    }
  }, [tab, status, favsLoaded, remindersLoaded]);

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
          <div className="flex gap-2">
            {([
              { id: "vehicules", label: d.vehicles },
              { id: "favoris",   label: d.favorites },
              { id: "rappels",   label: d.reminders + (pending.length ? ` (${pending.length})` : "") },
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
                <div className="space-y-3">
                  {vehicles.map(v => (
                    <div key={v.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                      <p className="font-semibold text-gray-900">{v.year} {v.make} {v.model}</p>
                      <Link href={`/rechercher?year=${v.year}&make=${v.make}&model=${v.model}`} className="text-sm font-medium hover:underline" style={{ color: "#f97316" }}>{d.findGarage}</Link>
                    </div>
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
