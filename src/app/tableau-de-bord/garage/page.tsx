"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { VEHICLE_MAKES } from "@/lib/vehicleData";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { formatPriceRange } from "@/lib/utils";

type Tab = "apercu" | "services" | "marques" | "horaires" | "profil";

export default function DashboardGaragePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("apercu");
  const [garage, setGarage] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");

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

  // ---- Profile state ----
  const [profileData, setProfileData] = useState<any>({});
  useEffect(() => { if (garage) setProfileData({ ...garage }); }, [garage]);

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

  if (loading) return <div className="flex items-center justify-center py-20 text-gray-500">Chargement de votre tableau de bord...</div>;

  const tabs: { id: Tab; label: string; icon: string }[] = [
    { id: "apercu", label: "Aperçu", icon: "📊" },
    { id: "services", label: "Services", icon: "🔧" },
    { id: "marques", label: "Marques", icon: "🚗" },
    { id: "horaires", label: "Horaires", icon: "🕐" },
    { id: "profil", label: "Profil", icon: "⚙️" },
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
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="font-bold text-gray-900 text-lg">Marques de véhicules</h2>
              <p className="text-gray-500 text-sm">Indiquez les marques que vous acceptez ou refusez</p>
            </div>
            <button onClick={saveBrands} disabled={saving} className="bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
              {saving ? "Sauvegarde..." : "Sauvegarder"}
            </button>
          </div>
          <div className="flex gap-4 text-sm mb-4">
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500 inline-block" /> Acceptée</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400 inline-block" /> Refusée</span>
            <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-gray-300 inline-block" /> Non configurée</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {VEHICLE_MAKES.map((brand) => {
              const status = getBrandStatus(brand);
              return (
                <div key={brand} className={`border rounded-xl p-3 transition-all ${status === "accepts" ? "border-green-300 bg-green-50" : status === "refuses" ? "border-red-200 bg-red-50" : "border-gray-200"}`}>
                  <p className="font-semibold text-gray-900 text-sm mb-2">{brand}</p>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleBrand(brand, true)}
                      className={`flex-1 text-xs py-1 rounded-lg font-medium transition-colors ${status === "accepts" ? "bg-green-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-green-100"}`}
                    >✓ Oui</button>
                    <button
                      onClick={() => toggleBrand(brand, false)}
                      className={`flex-1 text-xs py-1 rounded-lg font-medium transition-colors ${status === "refuses" ? "bg-red-400 text-white" : "bg-gray-100 text-gray-600 hover:bg-red-100"}`}
                    >✗ Non</button>
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
          <h2 className="font-bold text-gray-900 text-lg mb-2">Horaires d'ouverture</h2>
          <p className="text-gray-500 text-sm mb-5">Configurez vos heures d'ouverture pour chaque jour de la semaine</p>
          <div className="space-y-3">
            {["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"].map((day, i) => {
              const avail = garage.availability?.find((a: any) => a.dayOfWeek === i);
              return (
                <div key={day} className="flex items-center gap-4 p-3 rounded-xl border border-gray-200">
                  <span className="w-24 text-sm font-semibold text-gray-700">{day}</span>
                  <input type="time" defaultValue={avail?.openTime ?? "08:00"} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" disabled={avail?.isClosed} />
                  <span className="text-gray-400 text-sm">—</span>
                  <input type="time" defaultValue={avail?.closeTime ?? "17:00"} className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm" disabled={avail?.isClosed} />
                  <label className="flex items-center gap-2 text-sm text-gray-600 ml-auto">
                    <input type="checkbox" defaultChecked={avail?.isClosed} className="accent-red-500" />
                    Fermé
                  </label>
                </div>
              );
            })}
          </div>
          <button className="mt-4 bg-blue-700 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-blue-800">
            Sauvegarder les horaires
          </button>
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
              <input type="text" className={inputClass} value={profileData.address ?? ""} onChange={(e) => setProfileData({ ...profileData, address: e.target.value })} />
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
            <button type="submit" disabled={saving} className="bg-blue-700 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-800 disabled:opacity-50">
              {saving ? "Sauvegarde..." : "Sauvegarder le profil"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
