"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function InscriptionConducteurPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, password, role: "DRIVER" }),
    });

    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Une erreur est survenue");
      setLoading(false);
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    router.push("/tableau-de-bord/conducteur");
  }

  const inputClass = "block w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🚗</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Créer mon compte conducteur</h1>
          <p className="text-gray-500 mt-2">Gratuit — Trouvez les meilleurs garages pour votre véhicule</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">{error}</div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Nom complet</label>
              <input type="text" required className={inputClass} placeholder="Jean Tremblay" value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Adresse courriel</label>
              <input type="email" required className={inputClass} placeholder="vous@exemple.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Téléphone (optionnel)</label>
              <input type="tel" className={inputClass} placeholder="(514) 555-1234" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mot de passe</label>
              <input type="password" required minLength={8} className={inputClass} placeholder="Minimum 8 caractères" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60"
            >
              {loading ? "Création du compte..." : "Créer mon compte gratuitement"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-500">
            Déjà un compte ?{" "}
            <Link href="/connexion" className="text-blue-600 font-semibold hover:underline">Se connecter</Link>
          </p>
          <p className="mt-2 text-center text-sm text-gray-500">
            Propriétaire d'un garage ?{" "}
            <Link href="/inscription/garage" className="text-blue-600 font-semibold hover:underline">Inscrire mon garage</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
