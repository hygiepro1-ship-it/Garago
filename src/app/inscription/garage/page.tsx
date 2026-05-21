"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { QUEBEC_CITIES } from "@/lib/services";

export default function InscriptionGaragePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Step 1 — Compte
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Step 2 — Garage
  const [garageName, setGarageName] = useState("");
  const [garageAddress, setGarageAddress] = useState("");
  const [garageCity, setGarageCity] = useState("");
  const [garagePostalCode, setGaragePostalCode] = useState("");
  const [garagePhone, setGaragePhone] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (step === 1) { setStep(2); return; }

    setLoading(true);
    setError("");

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

    await signIn("credentials", { email, password, redirect: false });
    router.push("/tableau-de-bord/garage");
  }

  const inputClass = "block w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔧</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Inscrire mon garage</h1>
          <p className="text-gray-500 mt-2">30 jours d'essai gratuit — Aucune carte de crédit requise</p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-8">
          {[1, 2].map((s) => (
            <div key={s} className="flex items-center gap-3 flex-1">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= s ? "bg-blue-700 text-white" : "bg-gray-200 text-gray-500"}`}>
                {step > s ? "✓" : s}
              </div>
              <span className={`text-sm font-medium ${step >= s ? "text-gray-900" : "text-gray-400"}`}>
                {s === 1 ? "Votre compte" : "Votre garage"}
              </span>
              {s < 2 && <div className="flex-1 h-0.5 bg-gray-200 rounded" />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}

            {step === 1 && (
              <>
                <h2 className="font-bold text-gray-900 text-lg mb-4">Informations de connexion</h2>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Votre nom</label>
                  <input type="text" required className={inputClass} placeholder="Jean Tremblay" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Adresse courriel</label>
                  <input type="email" required className={inputClass} placeholder="vous@garage.com" value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone</label>
                  <input type="tel" required className={inputClass} placeholder="(514) 555-1234" value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Mot de passe</label>
                  <input type="password" required minLength={8} className={inputClass} placeholder="Minimum 8 caractères" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <h2 className="font-bold text-gray-900 text-lg mb-4">Informations de votre garage</h2>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Nom du garage</label>
                  <input type="text" required className={inputClass} placeholder="Garage Tremblay & Fils" value={garageName} onChange={(e) => setGarageName(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Adresse complète</label>
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
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone du garage</label>
                  <input type="tel" className={inputClass} placeholder="(514) 555-5678" value={garagePhone} onChange={(e) => setGaragePhone(e.target.value)} />
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
                  <p className="font-semibold mb-1">🎉 30 jours d'essai gratuit!</p>
                  <p>Configurez vos services, marques et disponibilités depuis votre tableau de bord. Aucune carte de crédit requise pour commencer.</p>
                </div>
              </>
            )}

            <div className="flex gap-3">
              {step > 1 && (
                <button type="button" onClick={() => setStep(1)} className="flex-1 border border-gray-300 text-gray-700 font-semibold py-3 rounded-xl hover:bg-gray-50 transition-colors">
                  Retour
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60"
              >
                {loading ? "Création..." : step === 1 ? "Continuer →" : "Créer mon compte et mon garage"}
              </button>
            </div>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Déjà inscrit ?{" "}
            <Link href="/connexion" className="text-blue-600 font-semibold hover:underline">Se connecter</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
