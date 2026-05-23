"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QUEBEC_CITIES } from "@/lib/services";
import { SERVICE_CATEGORIES } from "@/lib/services";
import { VEHICLE_MAKES } from "@/lib/vehicleData";

const PLANS = [
  {
    id: "trial",
    label: "Essai gratuit",
    price: "0 $",
    period: "30 jours",
    tag: null,
    color: "#f8fafc",
    border: "#e2e8f0",
    textColor: "#0b1f3a",
    features: [
      "Profil garage complet",
      "Gestion des services & prix",
      "Marques et modèles configurables",
      "Avis clients vérifiés",
      "Horaires d'ouverture",
      "Visible dans les résultats",
    ],
    cta: "Commencer gratuitement",
    ctaStyle: { backgroundColor: "#0b1f3a", color: "white" },
  },
  {
    id: "monthly",
    label: "Pro Mensuel",
    price: "49 $",
    period: "/mois",
    tag: "POPULAIRE",
    color: "#0b1f3a",
    border: "#f97316",
    textColor: "white",
    features: [
      "Tout inclus dans l'essai",
      "Priorité dans les résultats",
      'Badge "Garage certifié GarageQC"',
      "Réponses aux avis clients",
      "Statistiques détaillées",
      "Support prioritaire 7j/7",
    ],
    cta: "Commencer l'essai 30j gratuit",
    ctaStyle: { backgroundColor: "#f97316", color: "white" },
  },
  {
    id: "annual",
    label: "Pro Annuel",
    price: "39 $",
    period: "/mois",
    tag: "−20%",
    color: "#f8fafc",
    border: "#e2e8f0",
    textColor: "#0b1f3a",
    features: [
      "Tout inclus dans Pro Mensuel",
      "2 mois offerts",
      "Tarif garanti 12 mois",
      "Rapport annuel de performance",
      "Onboarding personnalisé",
    ],
    cta: "Souscrire annuellement",
    ctaStyle: { backgroundColor: "#0b1f3a", color: "white" },
  },
];

export default function InscriptionGaragePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Compte + garage
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [garageName, setGarageName] = useState("");
  const [garageAddress, setGarageAddress] = useState("");
  const [garageCity, setGarageCity] = useState("");
  const [garagePostalCode, setGaragePostalCode] = useState("");
  const [garagePhone, setGaragePhone] = useState("");

  // Step 2 — Services + marques exclues
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [excludedBrands, setExcludedBrands] = useState<string[]>([]);
  const [savingConfig, setSavingConfig] = useState(false);

  // Step 3 — Plan
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  function toggleService(id: string) {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function toggleExcludedBrand(brand: string) {
    setExcludedBrands((prev) =>
      prev.includes(brand) ? prev.filter((b) => b !== brand) : [...prev, brand]
    );
  }

  async function handleStep1(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, email, phone, password,
        role: "GARAGE_OWNER",
        garageName, garageAddress, garageCity, garagePostalCode, garagePhone,
      }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue");
      setLoading(false);
      return;
    }

    // Auto sign-in
    await signIn("credentials", { email, password, redirect: false });
    setLoading(false);
    setStep(2);
  }

  async function handleStep2() {
    setSavingConfig(true);

    // Save services
    if (selectedServices.length > 0) {
      const servicesPayload = selectedServices.map((id) => {
        const cat = SERVICE_CATEGORIES.find((s) => s.id === id);
        return { categoryId: id, categoryName: cat?.name, icon: cat?.icon, name: cat?.name, priceMin: "", priceMax: "", durationMin: "" };
      });
      await fetch("/api/garage/services", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ services: servicesPayload }),
      });
    }

    // Save excluded brands
    if (excludedBrands.length > 0) {
      const brandsPayload = excludedBrands.map((brand) => ({ brand, accepts: false }));
      await fetch("/api/garage/brands", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brands: brandsPayload }),
      });
    }

    setSavingConfig(false);
    setStep(3);
  }

  const inputClass =
    "block w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all text-sm bg-white";

  const totalSteps = 3;

  return (
    <div style={{ backgroundColor: "#f8fafc", minHeight: "100vh" }}>
      {/* Top bar */}
      <div style={{ backgroundColor: "#0b1f3a" }} className="py-4 px-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-sm" style={{ backgroundColor: "#f97316" }}>G</div>
            <span className="text-white font-black text-base">GarageQC</span>
          </Link>
          <span className="text-blue-300 text-sm">
            Déjà inscrit ? <Link href="/connexion" className="text-orange-400 font-semibold hover:underline">Se connecter</Link>
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10">

        {/* Progress steps */}
        <div className="flex items-center justify-center gap-0 mb-10">
          {[
            { num: 1, label: "Compte & garage" },
            { num: 2, label: "Services & marques" },
            { num: 3, label: "Votre formule" },
          ].map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-black transition-all"
                  style={
                    step > s.num
                      ? { backgroundColor: "#22c55e", color: "white" }
                      : step === s.num
                      ? { backgroundColor: "#f97316", color: "white" }
                      : { backgroundColor: "#e2e8f0", color: "#94a3b8" }
                  }
                >
                  {step > s.num ? "✓" : s.num}
                </div>
                <span className={`text-xs mt-1 font-semibold ${step >= s.num ? "text-gray-700" : "text-gray-400"}`}>{s.label}</span>
              </div>
              {i < totalSteps - 1 && (
                <div className="w-20 h-0.5 mx-2 mb-4 rounded" style={{ backgroundColor: step > s.num ? "#22c55e" : "#e2e8f0" }} />
              )}
            </div>
          ))}
        </div>

        {/* ── STEP 1 ─────────────────────────────────── */}
        {step === 1 && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
            {/* Form */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-2xl border border-gray-200 p-8" style={{ boxShadow: "0 4px 24px rgba(0,0,0,0.07)" }}>
                <h1 className="text-2xl font-black text-gray-900 mb-1">Créez votre profil garage</h1>
                <p className="text-gray-500 text-sm mb-6">30 jours d'essai gratuit — aucune carte de crédit requise</p>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm mb-4">{error}</div>
                )}

                <form onSubmit={handleStep1} className="space-y-4">
                  <div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Vos informations</p>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Votre nom complet</label>
                        <input type="text" required className={inputClass} placeholder="Jean Tremblay" value={name} onChange={(e) => setName(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Courriel</label>
                        <input type="email" required className={inputClass} placeholder="vous@garage.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone</label>
                        <input type="tel" required className={inputClass} placeholder="(514) 555-1234" value={phone} onChange={(e) => setPhone(e.target.value)} />
                      </div>
                      <div className="col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Mot de passe</label>
                        <input type="password" required minLength={8} className={inputClass} placeholder="Minimum 8 caractères" value={password} onChange={(e) => setPassword(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <div className="border-t border-gray-100 pt-4">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3">Votre garage</p>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Nom du garage</label>
                        <input type="text" required className={inputClass} placeholder="Garage Tremblay & Fils" value={garageName} onChange={(e) => setGarageName(e.target.value)} />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Adresse</label>
                        <input type="text" required className={inputClass} placeholder="1234 Rue Saint-Denis" value={garageAddress} onChange={(e) => setGarageAddress(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Ville</label>
                          <select required className={inputClass} value={garageCity} onChange={(e) => setGarageCity(e.target.value)}>
                            <option value="">Choisir</option>
                            {QUEBEC_CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-1">Code postal</label>
                          <input type="text" required className={inputClass} placeholder="H2X 1Y4" value={garagePostalCode} onChange={(e) => setGaragePostalCode(e.target.value)} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone du garage <span className="text-gray-400 font-normal">(optionnel)</span></label>
                        <input type="tel" className={inputClass} placeholder="(514) 555-5678" value={garagePhone} onChange={(e) => setGaragePhone(e.target.value)} />
                      </div>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-black text-white text-base transition-all hover:opacity-90 disabled:opacity-60"
                    style={{ backgroundColor: "#f97316" }}
                  >
                    {loading ? "Création en cours..." : "Continuer →"}
                  </button>
                  <p className="text-xs text-center text-gray-400">
                    En continuant, vous acceptez nos{" "}
                    <span className="underline cursor-pointer">conditions d'utilisation</span>
                  </p>
                </form>
              </div>
            </div>

            {/* Benefits sidebar */}
            <div className="lg:col-span-2 space-y-4">
              <div className="rounded-2xl p-6 text-white" style={{ backgroundColor: "#0b1f3a" }}>
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🚀</span>
                  <span className="font-black text-lg">Pourquoi GarageQC?</span>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: "👁️", text: "Visibilité auprès de milliers de conducteurs québécois chaque jour" },
                    { icon: "📅", text: "Gérez vos horaires et disponibilités en temps réel" },
                    { icon: "⭐", text: "Accumulez des avis vérifiés qui construisent votre réputation" },
                    { icon: "💰", text: "Affichez vos prix — attirez des clients qui savent ce qu'ils veulent" },
                    { icon: "🚗", text: "Indiquez les marques que vous traitez (et celles que vous ne traitez pas)" },
                    { icon: "📊", text: "Tableau de bord centralisé pour tout gérer" },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2.5">
                      <span className="text-lg mt-0.5">{item.icon}</span>
                      <span className="text-blue-200 text-sm leading-relaxed">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-lg" style={{ backgroundColor: "#fff7ed" }}>💬</div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">"Un client de plus par semaine couvre largement l'abonnement"</p>
                  </div>
                </div>
                <p className="text-gray-500 text-xs leading-relaxed">— Patrick G., Garage Auto-Sport, Laval</p>
                <div className="mt-3 flex">
                  {"★★★★★".split("").map((_, i) => <span key={i} style={{ color: "#f59e0b" }}>★</span>)}
                </div>
              </div>

              <div className="rounded-2xl p-4 text-sm" style={{ backgroundColor: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.2)" }}>
                <p className="font-bold text-green-700 mb-1">✓ Aucune carte de crédit requise</p>
                <p className="text-green-600">30 jours complets pour tester la plateforme. Résiliez en 1 clic si ce n'est pas pour vous.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── STEP 2 ─────────────────────────────────── */}
        {step === 2 && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-black text-gray-900 mb-2">Configurez votre garage en 2 minutes</h2>
              <p className="text-gray-500">Indiquez vos spécialités et les marques que vous ne traitez pas. Vous pourrez tout modifier après.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Services */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 className="font-black text-gray-900 mb-1">Services offerts</h3>
                <p className="text-xs text-gray-500 mb-4">Cochez ce que votre garage fait — les clients filtreront par ces services</p>
                <div className="grid grid-cols-1 gap-2 max-h-[420px] overflow-y-auto pr-1">
                  {SERVICE_CATEGORIES.map((cat) => {
                    const active = selectedServices.includes(cat.id);
                    return (
                      <label
                        key={cat.id}
                        className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border"
                        style={active
                          ? { backgroundColor: "#fff7ed", borderColor: "#fed7aa" }
                          : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0" }
                        }
                      >
                        <input
                          type="checkbox"
                          checked={active}
                          onChange={() => toggleService(cat.id)}
                          className="w-4 h-4 rounded"
                          style={{ accentColor: "#f97316" }}
                        />
                        <span className="text-lg">{cat.icon}</span>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-800">{cat.name}</p>
                          <p className="text-xs text-gray-400 truncate">{cat.description}</p>
                        </div>
                        {active && <span className="text-orange-500 font-bold text-sm">✓</span>}
                      </label>
                    );
                  })}
                </div>
                {selectedServices.length > 0 && (
                  <p className="text-xs text-orange-600 font-semibold mt-2">{selectedServices.length} service{selectedServices.length > 1 ? "s" : ""} sélectionné{selectedServices.length > 1 ? "s" : ""}</p>
                )}
              </div>

              {/* Excluded brands */}
              <div className="bg-white rounded-2xl border border-gray-200 p-6" style={{ boxShadow: "0 2px 12px rgba(0,0,0,0.06)" }}>
                <h3 className="font-black text-gray-900 mb-1">Marques non traitées</h3>
                <p className="text-xs text-gray-500 mb-4">Sélectionnez les marques que vous <strong>refusez ou ne traitez pas</strong>. Les clients le sauront dès la recherche.</p>
                <div className="flex flex-wrap gap-2 max-h-[380px] overflow-y-auto">
                  {VEHICLE_MAKES.map((brand) => {
                    const excluded = excludedBrands.includes(brand);
                    return (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => toggleExcludedBrand(brand)}
                        className="px-3 py-1.5 rounded-lg text-sm font-semibold transition-all border"
                        style={excluded
                          ? { backgroundColor: "#fef2f2", borderColor: "#fca5a5", color: "#dc2626" }
                          : { backgroundColor: "#f8fafc", borderColor: "#e2e8f0", color: "#475569" }
                        }
                      >
                        {excluded ? "✗ " : ""}{brand}
                      </button>
                    );
                  })}
                </div>
                {excludedBrands.length > 0 && (
                  <p className="text-xs text-red-500 font-semibold mt-3">{excludedBrands.length} marque{excludedBrands.length > 1 ? "s" : ""} exclue{excludedBrands.length > 1 ? "s" : ""}</p>
                )}
                <div className="mt-4 p-3 rounded-xl text-xs" style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0" }}>
                  <p className="text-green-700 font-semibold">💡 Conseil</p>
                  <p className="text-green-600 mt-0.5">Les garages avec des marques configurées reçoivent 40% plus de clics car les conducteurs savent qu'ils seront accueillis.</p>
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-6">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors"
              >
                ← Retour
              </button>
              <button
                onClick={handleStep2}
                disabled={savingConfig}
                className="flex-1 py-3 rounded-xl font-black text-white transition-all hover:opacity-90 disabled:opacity-60"
                style={{ backgroundColor: "#f97316" }}
              >
                {savingConfig ? "Sauvegarde..." : "Continuer →"}
              </button>
              <button
                onClick={() => setStep(3)}
                className="px-6 py-3 rounded-xl border border-gray-200 text-gray-400 font-medium hover:text-gray-600 transition-colors text-sm"
              >
                Passer
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3 ─────────────────────────────────── */}
        {step === 3 && (
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold mb-4"
                style={{ backgroundColor: "rgba(34,197,94,0.1)", border: "1px solid rgba(34,197,94,0.3)", color: "#16a34a" }}>
                ✓ Votre garage est créé et configuré!
              </div>
              <h2 className="text-2xl font-black text-gray-900 mb-2">Choisissez votre formule</h2>
              <p className="text-gray-500">Démarrez avec 30 jours gratuits — aucune carte requise. Passez au Pro quand vous voulez.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
              {PLANS.map((plan) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className="text-left rounded-2xl p-6 border-2 transition-all card-hover relative"
                    style={{
                      backgroundColor: plan.color,
                      borderColor: isSelected ? "#f97316" : plan.border,
                      boxShadow: isSelected ? "0 0 0 3px rgba(249,115,22,0.2)" : "none",
                    }}
                  >
                    {plan.tag && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-black text-white" style={{ backgroundColor: "#f97316" }}>
                        {plan.tag}
                      </div>
                    )}
                    {isSelected && (
                      <div className="absolute top-4 right-4 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-black" style={{ backgroundColor: "#f97316" }}>✓</div>
                    )}
                    <h3 className="font-black text-lg mb-1" style={{ color: plan.textColor }}>{plan.label}</h3>
                    <div className="flex items-baseline gap-1 mb-4">
                      <span className="text-4xl font-black" style={{ color: plan.textColor }}>{plan.price}</span>
                      <span className="text-sm" style={{ color: plan.textColor, opacity: 0.6 }}>{plan.period}</span>
                    </div>
                    <ul className="space-y-2">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm" style={{ color: plan.textColor, opacity: plan.id === "monthly" ? 0.9 : 0.7 }}>
                          <span className="text-green-400 font-bold mt-0.5">✓</span>
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </button>
                );
              })}
            </div>

            {/* ROI callout */}
            <div className="rounded-2xl p-5 mb-6 flex items-start gap-4" style={{ backgroundColor: "#fff7ed", border: "1px solid #fed7aa" }}>
              <span className="text-3xl">💡</span>
              <div>
                <p className="font-black text-gray-900 mb-1">Le retour sur investissement est immédiat</p>
                <p className="text-gray-600 text-sm">À 49 $/mois, il suffit d'<strong>un seul nouveau client par mois</strong> pour rentabiliser votre abonnement. La majorité de nos garages partenaires déclarent avoir récupéré leur investissement dès la première semaine.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setStep(2)} className="px-6 py-3 rounded-xl border border-gray-300 text-gray-600 font-semibold hover:bg-gray-50 transition-colors">
                ← Retour
              </button>
              <button
                onClick={() => router.push("/tableau-de-bord/garage")}
                className="flex-1 py-4 rounded-xl font-black text-white text-base transition-all hover:opacity-90"
                style={{ backgroundColor: "#f97316" }}
              >
                Accéder à mon tableau de bord →
              </button>
            </div>

            <p className="text-center text-xs text-gray-400 mt-4">
              La facturation du plan Pro commence après les 30 jours d'essai gratuit. Résiliez à tout moment.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
