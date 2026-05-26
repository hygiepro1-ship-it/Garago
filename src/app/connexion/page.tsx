"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ConnexionPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError("Courriel ou mot de passe invalide.");
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  const inputClass = "block w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all";

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔧</div>
          <h1 className="text-2xl font-extrabold text-gray-900">Connexion à Garago</h1>
          <p className="text-gray-500 mt-2">Accédez à votre espace conducteur ou garage</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Adresse courriel</label>
              <input
                type="email"
                required
                className={inputClass}
                placeholder="vous@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Mot de passe</label>
              <input
                type="password"
                required
                className={inputClass}
                placeholder="Votre mot de passe"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-700 text-white font-bold py-3 rounded-xl hover:bg-blue-800 transition-colors disabled:opacity-60"
            >
              {loading ? "Connexion en cours..." : "Se connecter"}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100 space-y-3 text-center text-sm">
            <p className="text-gray-500">
              Pas encore de compte ?{" "}
              <Link href="/inscription/conducteur" className="text-blue-600 font-semibold hover:underline">
                S'inscrire comme conducteur
              </Link>
            </p>
            <p className="text-gray-500">
              Propriétaire d'un garage ?{" "}
              <Link href="/inscription/garage" className="text-blue-600 font-semibold hover:underline">
                Inscrire mon garage
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
