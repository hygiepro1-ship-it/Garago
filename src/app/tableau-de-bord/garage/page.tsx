"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { VEHICLE_MAKES } from "@/lib/vehicleData";
import { BRANDS } from "@/lib/vehicleBrands";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { formatPriceRange } from "@/lib/utils";
import AddressAutocomplete, { type AddressResult } from "@/components/AddressAutocomplete";
import BrandLogo from "@/components/BrandLogo";

type Tab = "apercu" | "services" | "marques" | "horaires" | "profil" | "rdv";

export default function DashboardGaragePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("apercu");
  const [garage, setGarage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

  // ---- Appointments state ----
  const [appointments, setAppointments] = useState<any[]>([]);
  const [rdvLoaded, setRdvLoaded] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualForm, setManualForm] = useState({
    customerName: "", customerPhone: "", customerEmail: "",
    vehicleYear: "", vehicleMake: "", vehicleModel: "",
    serviceName: "", date: "", startTime: "", notes: "",
  });
  const [savingRdv, setSavingRdv] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") { router.push("/connexion"); return; }
    if (status === "authenticated") {
      fetch("/api/garage/profile").then(r => r.json()).then(d => { setGarage(d); setLoading(false); });
    }
  }, [status, router]);

  // ---- Services state ----
  const [services, setServices] = useState<any[]>([]);
  useEffect(() => { if (garage?.services) setServices(garage.services); }, [garage]);

  function toggleService(catId: string, cat: any) {
    const existing = services.find((s) => s.categoryId === catId);
    if (existing) {
      setServices(services.filter((s) => s.categoryId !== catId));
    } else {
      setServices([...services, {
        categoryId: catId,
        categoryName: cat.name,
        icon: cat.icon,
        name: cat.name,
        priceMin: "", priceMax: "", durationMin: "",
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

  // ---- Brands state ----
  const [brands, setBrands] = useState<any[]>([]);
  useEffect(() => { if (garage?.brands) setBrands(garage.brands); }, [garage]);

  function toggleBrand(brand: string, accepts: boolean) {
    const existing = brands.find((b) => b.brand === brand);
    if (existing) {
      if (existing.accepts === accepts) {
        setBrands(brands.filter((b) => b.brand !== brand));
      } else {
        setBrands(brands.map((b) => b.brand === brand ? { ...b, accepts } : b));
      }
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
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ brands }),
    });
    setSaving(false);
    setSuccess("Marques sauvegardées ✓");
    setTimeout(() => setSuccess(""), 3000);
  }

  // ---- Horaires state ----
  const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
  const [horaires, setHoraires] = useState<{ dayOfWeek: number; openTime: string; closeTime: string; isClosed: boolean }[]>(
    DAYS.map((_, i) => ({ dayOfWeek: i, openTime: "08:00", closeTime: "17:00", isClosed: i === 0 }))
  );
  useEffect(() => {
    if (garage?.availability && garage.availability.length > 0) {
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
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ horaires }),
    });
    setSaving(false);
    setSuccess("Horaires sauvegardés ✓");
    setTimeout(() => setSuccess(""), 3000);
  }

  // ---- Profile state ----
  const [profileData, setProfileData] = useState<any>({});
  useEffect(() => { if (garage) setProfileData({ ...garage }); }, [garage]);

  function handleAddressSelect(r: AddressResult) {
    setProfileData((prev: any) => ({
      ...prev,
      address:   r.streetAddress,
      city:      r.city,
      postalCode: r.postalCode,
      latitude:  r.lat,
      longitude: r.lng,
    }));
  }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/garage/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profileData),
    });
    setSaving(false);
    setSuccess("Profil sauvegardé ✓");
    setTimeout(() => setSuccess(""), 3000);
  }

  // Load appointments when tab opens — must be before any early return
  useEffect(() => {
    if (activeTab === "rdv" && !rdvLoaded && garage) {
      fetch("/api/garage/appointments")
        .then(r => r.json())
        .then(d => { setAppointments(Array.isArray(d) ? d : []); setRdvLoaded(true); });
    }
  }, [activeTab, rdvLoaded, garage]);

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-500">Chargement de votre tableau de bord...</div>;

  async function updateApptStatus(id: string, status: string) {
    await fetch(`/api/appointments/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  }

  async function saveManualRdv(e: React.FormEvent) {
    e.preventDefault();
    setSavingRdv(true);
    const res = await fetch("/api/garage/appointments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(manualForm),
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

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "apercu",   label: "Aperçu",        icon: "📊" },
    { id: "rdv",      label: "Rendez-vous",   icon: "📅" },
    { id: "services", label: "Services",       icon: "🔧" },
    { id: "marques",  label: "Marques",        icon: "🚗" },
    { id: "horaires", label: "Horaires",       icon: "🕐" },
    { id: "profil",   label: "Profil",         icon: "⚙️" },
  ];

  const inputClass = "block w-full border border-gray-300 rounded-xl px-4 py-2.5 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  const avgRating = garage.reviews?.length > 0
    ? (garage.reviews.reduce((s: number, r: any) => s + r.rating, 0) / garage.reviews.length).toFixed(1)
    : null;

  const isTrialExpiring = garage.subscriptionStatus === "TRIAL" && garage.subscriptionEndAt
    && new Date(garage.subscriptionEndAt) < new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-2xl p-6 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-2xl font-extrabold">{garage.name}</h1>
            <p className="text-blue-200 mt-1">📍 {garage.city}, {garage.province}</p>
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
            <Link href={`/garage/${garage.slug}`} target="_blank" className="bg-white/20 border border-white/30 text-white text-sm px-4 py-2 rounded-xl hover:bg-white/30 transition-colors">
              Voir mon profil →
            </Link>
          </div>
        </div>
      </div>

      {/* Trial expiry warning */}
      {isTrialExpiring && (
        <div className="bg-yellow-50 border border-yellow-300 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-yellow-900">Votre essai expire bientôt!</p>
              <p className="text-yellow-700 text-sm">Activez votre abonnement pour continuer à apparaître dans les résultats.</p>
            </div>
          </div>
          <button className="bg-yellow-500 text-white px-5 py-2 rounded-xl font-bold hover:bg-yellow-600 text-sm whitespace-nowrap">
            S'abonner — 49$/mois
          </button>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl mb-4 text-sm font-medium">{success}</div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto mb-6 pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${activeTab === tab.id ? "bg-blue-700 text-white" : "bg-white border border-gray-200 text-gray-600 hover:border-blue-300 hover:text-blue-700"}`}
          >
            <span>{tab.icon}</span>{tab.label}
          </button>
        ))}
      </div>

      {/* Aperçu */}
      {activeTab === "apercu" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[
            { icon: "⭐", label: "Note moyenne", value: avgRating ? `${avgRating}/5` : "—", color: "yellow" },
            { icon: "💬", label: "Avis reçus", value: garage._count?.reviews ?? 0, color: "blue" },
            { icon: "🔧", label: "Services actifs", value: garage.services?.length ?? 0, color: "green" },
            { icon: "🚗", label: "Marques configurées", value: garage.brands?.length ?? 0, color: "purple" },
          ].map((stat) => (
            <div key={stat.label} className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <div className="text-3xl mb-2">{stat.icon}</div>
              <div className="text-2xl font-extrabold text-gray-900">{stat.value}</div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </div>
          ))}

          {/* Recent reviews */}
          <div className="sm:col-span-2 lg:col-span-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <h3 className="font-bold text-gray-900 mb-4">Avis récents</h3>
            {!garage.reviews || garage.reviews.length === 0 ? (
              <p className="text-gray-400 text-sm">Aucun avis pour l'instant. Encouragez vos clients à laisser un avis!</p>
            ) : (
              <div className="space-y-3">
                {garage.reviews.slice(0, 3).map((r: any) => (
                  <div key={r.id} className="border-b border-gray-100 pb-3 last:border-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm text-gray-900">{r.user?.name ?? "Anonyme"}</span>
                      <span className="text-yellow-400">{"★".repeat(r.rating)}</span>
                    </div>
                    {r.comment && <p className="text-sm text-gray-600 mt-1">{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Rendez-vous ────────────────────────────────────────────────── */}
      {activeTab === "rdv" && (
        <div className="space-y-4">
          {/* Header + add button */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Rendez-vous</h2>
              <p className="text-gray-500 text-sm">Demandes en ligne et réservations manuelles</p>
            </div>
            <button
              onClick={() => setShowManualForm(true)}
              className="bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-blue-800 flex items-center gap-2"
            >
              + Nouveau RDV manuel
            </button>
          </div>

          {/* Manual booking form */}
          {showManualForm && (
            <div className="bg-white rounded-2xl border border-blue-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Ajouter un rendez-vous</h3>
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Année véhicule</label>
                    <input className={inputClass} value={manualForm.vehicleYear} onChange={e=>setManualForm(f=>({...f,vehicleYear:e.target.value}))} placeholder="2022" maxLength={4} />
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
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Service</label>
                    <input className={inputClass} value={manualForm.serviceName} onChange={e=>setManualForm(f=>({...f,serviceName:e.target.value}))} placeholder="Vidange d'huile" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Date *</label>
                    <input className={inputClass} required type="date" value={manualForm.date} onChange={e=>setManualForm(f=>({...f,date:e.target.value}))} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">Heure *</label>
                    <input className={inputClass} required type="time" value={manualForm.startTime} onChange={e=>setManualForm(f=>({...f,startTime:e.target.value}))} />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">Notes internes</label>
                  <textarea className={`${inputClass} min-h-[60px]`} value={manualForm.notes} onChange={e=>setManualForm(f=>({...f,notes:e.target.value}))} placeholder="Notes visibles seulement par le garage…" />
                </div>
                <div className="flex gap-2 pt-1">
                  <button type="submit" disabled={savingRdv} className="bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
                    {savingRdv ? "Ajout…" : "Ajouter le rendez-vous"}
                  </button>
                  <button type="button" onClick={() => setShowManualForm(false)} className="border border-gray-200 px-4 py-2 rounded-xl text-sm hover:bg-gray-50">
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap gap-3 text-xs">
            {[
              { status: "PENDING",   label: "En attente",  bg: "#fef3c7", color: "#92400e" },
              { status: "CONFIRMED", label: "Confirmé",    bg: "#d1fae5", color: "#065f46" },
              { status: "COMPLETED", label: "Terminé",     bg: "#ede9fe", color: "#5b21b6" },
              { status: "CANCELLED", label: "Annulé",      bg: "#fee2e2", color: "#991b1b" },
            ].map(s => (
              <span key={s.status} className="px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: s.bg, color: s.color }}>
                {s.label}
              </span>
            ))}
          </div>

          {/* Appointment list */}
          {!rdvLoaded ? (
            <div className="text-gray-400 text-sm text-center py-8">Chargement…</div>
          ) : appointments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-gray-200 p-10 text-center">
              <p className="text-4xl mb-3">📅</p>
              <p className="text-gray-500 text-sm">Aucun rendez-vous pour l'instant.</p>
              <p className="text-gray-400 text-xs mt-1">Les demandes en ligne et manuelles apparaîtront ici.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {appointments.map(a => {
                const statusColors: Record<string, { bg: string; color: string; label: string }> = {
                  PENDING:   { bg: "#fef3c7", color: "#92400e", label: "En attente" },
                  CONFIRMED: { bg: "#d1fae5", color: "#065f46", label: "Confirmé"   },
                  COMPLETED: { bg: "#ede9fe", color: "#5b21b6", label: "Terminé"    },
                  CANCELLED: { bg: "#fee2e2", color: "#991b1b", label: "Annulé"     },
                };
                const sc = statusColors[a.status] ?? statusColors.PENDING;
                const dateObj = new Date(a.date + "T12:00:00");
                const dateFr = dateObj.toLocaleDateString("fr-CA", { weekday:"short", day:"numeric", month:"short" });

                return (
                  <div key={a.id} className="bg-white rounded-2xl border border-gray-200 p-4 flex items-start gap-4">
                    {/* Date block */}
                    <div className="flex-shrink-0 text-center bg-gray-50 rounded-xl px-3 py-2 border border-gray-100 min-w-[70px]">
                      <p className="text-xs text-gray-400 font-medium capitalize">{dateFr.split(" ")[0]}</p>
                      <p className="text-xl font-extrabold text-gray-900 leading-none">{dateObj.getDate()}</p>
                      <p className="text-xs text-gray-500">{dateObj.toLocaleDateString("fr-CA",{month:"short"})}</p>
                      <p className="text-sm font-bold text-orange-500 mt-0.5">{a.startTime}</p>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="font-bold text-gray-900 text-sm">{a.customerName}</p>
                          <p className="text-xs text-gray-500">{a.customerPhone}{a.customerEmail ? ` · ${a.customerEmail}` : ""}</p>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs px-2.5 py-1 rounded-full font-semibold" style={{ backgroundColor: sc.bg, color: sc.color }}>
                            {sc.label}
                          </span>
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: a.source === "MANUAL" ? "#f1f5f9" : "#eff6ff", color: a.source === "MANUAL" ? "#64748b" : "#1d4ed8" }}>
                            {a.source === "MANUAL" ? "Manuel" : "En ligne"}
                          </span>
                        </div>
                      </div>
                      {(a.vehicleMake || a.serviceName) && (
                        <p className="text-xs text-gray-500 mb-2">
                          {[a.vehicleYear, a.vehicleMake, a.vehicleModel].filter(Boolean).join(" ")}
                          {a.serviceName ? ` · ${a.serviceName}` : ""}
                        </p>
                      )}
                      {a.notes && <p className="text-xs text-gray-400 italic mb-2">"{a.notes}"</p>}

                      {/* Actions */}
                      <div className="flex flex-wrap gap-1.5">
                        {a.status === "PENDING" && (
                          <>
                            <button onClick={() => updateApptStatus(a.id, "CONFIRMED")}
                              className="text-xs px-3 py-1 rounded-lg font-semibold bg-green-50 text-green-700 hover:bg-green-100 border border-green-200">
                              ✓ Confirmer
                            </button>
                            <button onClick={() => updateApptStatus(a.id, "CANCELLED")}
                              className="text-xs px-3 py-1 rounded-lg font-semibold bg-red-50 text-red-600 hover:bg-red-100 border border-red-200">
                              ✗ Refuser
                            </button>
                          </>
                        )}
                        {a.status === "CONFIRMED" && (
                          <>
                            <button onClick={() => updateApptStatus(a.id, "COMPLETED")}
                              className="text-xs px-3 py-1 rounded-lg font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200">
                              ✓ Marquer terminé
                            </button>
                            <button onClick={() => updateApptStatus(a.id, "CANCELLED")}
                              className="text-xs px-3 py-1 rounded-lg font-semibold bg-gray-50 text-gray-500 hover:bg-gray-100 border border-gray-200">
                              Annuler
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Services */}
      {activeTab === "services" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Services offerts</h2>
              <p className="text-gray-500 text-sm">Cochez les services que vous offrez et ajoutez vos prix</p>
            </div>
            <button onClick={saveServices} disabled={saving} className="bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {SERVICE_CATEGORIES.map((cat) => {
              const active = services.find((s) => s.categoryId === cat.id);
              return (
                <div key={cat.id} className={`border rounded-xl p-4 transition-all ${active ? "border-blue-300 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <input
                      type="checkbox"
                      id={cat.id}
                      checked={!!active}
                      onChange={() => toggleService(cat.id, cat)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <label htmlFor={cat.id} className="flex items-center gap-2 cursor-pointer font-semibold text-gray-900 text-sm">
                      <span>{cat.icon}</span>{cat.name}
                    </label>
                  </div>
                  {active && (
                    <div className="grid grid-cols-3 gap-2 pl-7">
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Prix min ($)</label>
                        <input type="number" className={inputClass} placeholder="Ex: 50" value={active.priceMin} onChange={(e) => setServices(services.map((s) => s.categoryId === cat.id ? { ...s, priceMin: e.target.value } : s))} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Prix max ($)</label>
                        <input type="number" className={inputClass} placeholder="Ex: 80" value={active.priceMax} onChange={(e) => setServices(services.map((s) => s.categoryId === cat.id ? { ...s, priceMax: e.target.value } : s))} />
                      </div>
                      <div>
                        <label className="block text-xs text-gray-500 mb-0.5">Durée (min)</label>
                        <input type="number" className={inputClass} placeholder="Ex: 45" value={active.durationMin} onChange={(e) => setServices(services.map((s) => s.categoryId === cat.id ? { ...s, durationMin: e.target.value } : s))} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Marques */}
      {activeTab === "marques" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Marques de véhicules</h2>
              <p className="text-gray-500 text-sm mt-0.5">
                Cliquez sur ✓ pour les marques que vous acceptez, ✗ pour celles que vous refusez.
              </p>
            </div>
            <button
              onClick={saveBrands}
              disabled={saving}
              className="bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-800 disabled:opacity-50 flex-shrink-0"
            >
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-4 text-xs text-gray-500 mb-5 pb-4 border-b border-gray-100">
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-green-500 inline-flex items-center justify-center text-white font-bold text-xs">✓</span>
              Acceptée
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-red-500 inline-flex items-center justify-center text-white font-bold text-xs">✗</span>
              Refusée
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-5 rounded-full bg-gray-200 inline-block" />
              Non configurée (neutre)
            </span>
            <span className="ml-auto text-gray-400">
              {brands.filter(b => b.accepts).length} acceptée{brands.filter(b => b.accepts).length !== 1 ? "s" : ""} ·{" "}
              {brands.filter(b => !b.accepts).length} refusée{brands.filter(b => !b.accepts).length !== 1 ? "s" : ""}
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-3">
            {BRANDS.map(({ name: brand, logoUrl, color }) => {
              const status = getBrandStatus(brand);
              const isAccepted = status === "accepts";
              const isRefused  = status === "refuses";

              return (
                <div
                  key={brand}
                  className="relative flex flex-col items-center rounded-2xl border-2 transition-all duration-150 overflow-hidden"
                  style={
                    isAccepted ? { borderColor: "#22c55e", backgroundColor: "#f0fdf4" } :
                    isRefused  ? { borderColor: "#ef4444", backgroundColor: "#fef2f2" } :
                    { borderColor: "#e2e8f0", backgroundColor: "#fafafa" }
                  }
                >
                  {/* Status ribbon */}
                  {isAccepted && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs font-bold leading-none">✓</span>
                    </div>
                  )}
                  {isRefused && (
                    <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shadow-sm">
                      <span className="text-white text-xs font-bold leading-none">✗</span>
                    </div>
                  )}

                  {/* Logo area */}
                  <div className="w-full flex items-center justify-center pt-4 pb-2 px-3">
                    <div
                      className="w-14 h-14 rounded-xl bg-white flex items-center justify-center"
                      style={{ boxShadow: "0 1px 6px rgba(0,0,0,0.10)", padding: 6 }}
                    >
                      <BrandLogo brand={brand} size={44} />
                    </div>
                  </div>

                  {/* Name */}
                  <p className="text-center font-semibold text-gray-800 px-2 pb-2 leading-tight" style={{ fontSize: 11 }}>
                    {brand}
                  </p>

                  {/* Buttons */}
                  <div className="flex w-full border-t border-gray-100">
                    <button
                      onClick={() => toggleBrand(brand, true)}
                      title="Accepter cette marque"
                      className="flex-1 py-2 text-xs font-bold transition-colors"
                      style={isAccepted
                        ? { backgroundColor: "#22c55e", color: "white" }
                        : { backgroundColor: "transparent", color: "#6b7280" }}
                    >
                      ✓
                    </button>
                    <div className="w-px bg-gray-100" />
                    <button
                      onClick={() => toggleBrand(brand, false)}
                      title="Refuser cette marque"
                      className="flex-1 py-2 text-xs font-bold transition-colors"
                      style={isRefused
                        ? { backgroundColor: "#ef4444", color: "white" }
                        : { backgroundColor: "transparent", color: "#6b7280" }}
                    >
                      ✗
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Horaires */}
      {activeTab === "horaires" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Horaires d'ouverture</h2>
              <p className="text-gray-500 text-sm">Configurez vos heures d'ouverture pour chaque jour de la semaine</p>
            </div>
            <button onClick={saveHoraires} disabled={saving} className="bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
          <div className="space-y-3 mt-5">
            {DAYS.map((day, i) => {
              const h = horaires[i];
              return (
                <div key={day} className={`flex items-center gap-4 p-3 rounded-xl border ${h.isClosed ? "border-gray-100 bg-gray-50" : "border-gray-200"}`}>
                  <span className="w-24 text-sm font-semibold text-gray-700">{day}</span>
                  <input
                    type="time"
                    value={h.openTime}
                    onChange={(e) => setHoraireField(i, "openTime", e.target.value)}
                    disabled={h.isClosed}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm disabled:opacity-40"
                  />
                  <span className="text-gray-400 text-sm">—</span>
                  <input
                    type="time"
                    value={h.closeTime}
                    onChange={(e) => setHoraireField(i, "closeTime", e.target.value)}
                    disabled={h.isClosed}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm disabled:opacity-40"
                  />
                  <label className="flex items-center gap-2 text-sm text-gray-600 ml-auto cursor-pointer">
                    <input
                      type="checkbox"
                      checked={h.isClosed}
                      onChange={(e) => setHoraireField(i, "isClosed", e.target.checked)}
                      className="accent-red-500"
                    />
                    Fermé
                  </label>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Profil */}
      {activeTab === "profil" && (
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
              <AddressAutocomplete
                onSelect={handleAddressSelect}
                initialValue={profileData.address ?? ""}
                inputClass={inputClass}
              />
              {profileData.latitude && profileData.longitude && (
                <p className="text-xs text-green-600 mt-1 font-medium">
                  ✓ Coordonnées enregistrées — les clients proches vous trouveront en priorité
                </p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Courriel public</label>
                <input type="email" className={inputClass} value={profileData.email ?? ""} onChange={(e) => setProfileData({ ...profileData, email: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Site web</label>
                <input type="url" className={inputClass} value={profileData.website ?? ""} onChange={(e) => setProfileData({ ...profileData, website: e.target.value })} placeholder="https://" />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={profileData.acceptsWalkIn ?? true} onChange={(e) => setProfileData({ ...profileData, acceptsWalkIn: e.target.checked })} className="accent-blue-600 w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">Accepte sans rendez-vous</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={profileData.appointmentOnly ?? false} onChange={(e) => setProfileData({ ...profileData, appointmentOnly: e.target.checked })} className="accent-blue-600 w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">Sur rendez-vous seulement</span>
              </label>
            </div>

            {/* Cal.com integration */}
            <div className="border border-orange-200 rounded-xl p-4 bg-orange-50">
              <div className="flex items-start gap-3 mb-3">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="font-bold text-gray-900 text-sm">Calendrier Cal.com (recommandé)</p>
                  <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
                    Connectez votre compte Cal.com pour que vos clients réservent directement depuis votre profil.
                    L'application mobile Cal.com vous permet de gérer vos disponibilités depuis votre téléphone.
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">
                    Lien Cal.com <span className="font-normal text-gray-400">(ex : <code className="bg-white px-1 rounded">mon-garage/rendez-vous</code>)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-400 flex-shrink-0">cal.com/</span>
                    <input
                      className={inputClass}
                      value={profileData.calcomLink ?? ""}
                      onChange={(e) => setProfileData({ ...profileData, calcomLink: e.target.value })}
                      placeholder="mon-garage/rendez-vous"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a
                    href="https://cal.com/signup"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-colors"
                  >
                    Créer un compte Cal.com gratuit →
                  </a>
                  <a
                    href="https://apps.apple.com/app/cal-com/id1615858471"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg border border-orange-300 text-orange-700 font-semibold hover:bg-orange-100 transition-colors"
                  >
                    📱 App iOS
                  </a>
                  <a
                    href="https://play.google.com/store/apps/details?id=com.cal.calcom"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs px-3 py-1.5 rounded-lg border border-orange-300 text-orange-700 font-semibold hover:bg-orange-100 transition-colors"
                  >
                    📱 App Android
                  </a>
                </div>
                {profileData.calcomLink && (
                  <p className="text-xs text-green-700 bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 flex items-center gap-1.5">
                    ✓ Le widget Cal.com s'affichera sur votre profil public à la place du formulaire par défaut.
                  </p>
                )}
              </div>
            </div>

            <button type="submit" disabled={saving} className="bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-800 disabled:opacity-50">
              {saving ? "Sauvegarde..." : "Sauvegarder le profil"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
