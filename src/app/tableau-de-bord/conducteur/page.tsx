"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { VEHICLE_MAKES, getModelsForMake, getYears } from "@/lib/vehicleData";

export default function DashboardConducteurPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [year, setYear] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [saving, setSaving] = useState(false);
  const years = getYears();
  const models = make ? getModelsForMake(make) : [];

  useEffect(() => {
    if (status === "unauthenticated") router.push("/connexion");
    if (status === "authenticated") {
      fetch("/api/vehicles")
        .then((r) => r.json())
        .then((data) => { if (Array.isArray(data)) setVehicles(data); });
    }
  }, [status, router]);

  async function addVehicle(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/vehicles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ year: parseInt(year), make, model }),
    });
    if (res.ok) {
      const v = await res.json();
      setVehicles((prev) => [...prev, v]);
      setShowAddVehicle(false);
      setYear(""); setMake(""); setModel("");
    }
    setSaving(false);
  }

  if (status === "loading") {
    return <div className="flex items-center justify-center py-20 text-gray-500">Chargement...</div>;
  }

  const inputClass = "block w-full border border-gray-300 rounded-xl px-4 py-2.5 bg-white text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500";

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-700 to-indigo-700 text-white rounded-2xl p-6 mb-8">
        <h1 className="text-2xl font-extrabold mb-1">Bonjour, {session?.user?.name} 👋</h1>
        <p className="text-blue-200">Bienvenue sur votre espace conducteur GarageQC</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Mes véhicules */}
        <div className="md:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-gray-900 text-lg">🚗 Mes véhicules</h2>
            <button
              onClick={() => setShowAddVehicle(!showAddVehicle)}
              className="text-sm bg-blue-700 text-white px-4 py-2 rounded-xl hover:bg-blue-800 transition-colors"
            >
              + Ajouter
            </button>
          </div>

          {showAddVehicle && (
            <form onSubmit={addVehicle} className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Année</label>
                  <select className={inputClass} value={year} onChange={(e) => setYear(e.target.value)} required>
                    <option value="">Année</option>
                    {years.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Marque</label>
                  <select className={inputClass} value={make} onChange={(e) => { setMake(e.target.value); setModel(""); }} required>
                    <option value="">Marque</option>
                    {VEHICLE_MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1">Modèle</label>
                  <select className={inputClass} value={model} onChange={(e) => setModel(e.target.value)} disabled={!make} required>
                    <option value="">Modèle</option>
                    {models.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button type="submit" disabled={saving} className="bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-blue-800 disabled:opacity-50">
                  {saving ? "Ajout..." : "Ajouter"}
                </button>
                <button type="button" onClick={() => setShowAddVehicle(false)} className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                  Annuler
                </button>
              </div>
            </form>
          )}

          {vehicles.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <div className="text-4xl mb-2">🚗</div>
              <p className="text-sm">Ajoutez votre véhicule pour des recherches personnalisées</p>
            </div>
          ) : (
            <div className="space-y-3">
              {vehicles.map((v) => (
                <div key={v.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-4 py-3">
                  <div>
                    <p className="font-semibold text-gray-900">{v.year} {v.make} {v.model}</p>
                  </div>
                  <Link
                    href={`/rechercher?year=${v.year}&make=${v.make}&model=${v.model}`}
                    className="text-sm text-blue-600 hover:underline font-medium"
                  >
                    Trouver un garage →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions rapides */}
        <div className="space-y-4">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
            <h3 className="font-bold text-gray-900 mb-4">Actions rapides</h3>
            <div className="space-y-2">
              <Link href="/rechercher" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                <span className="text-xl">🔍</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Trouver un garage</span>
              </Link>
              <Link href="/rechercher?service=tires-winter" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                <span className="text-xl">❄️</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Pneus d'hiver</span>
              </Link>
              <Link href="/rechercher?service=oil" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                <span className="text-xl">🛢️</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Vidange d'huile</span>
              </Link>
              <Link href="/rechercher?service=inspection" className="flex items-center gap-3 p-3 rounded-xl hover:bg-blue-50 transition-colors group">
                <span className="text-xl">🔍</span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-700">Inspection mécanique</span>
              </Link>
            </div>
          </div>

          <div className="bg-blue-700 text-white rounded-2xl p-5">
            <div className="text-2xl mb-2">🏆</div>
            <h3 className="font-bold mb-1">Programme fidélité</h3>
            <p className="text-blue-200 text-sm">Bientôt disponible — Gagnez des points à chaque visite chez nos garages partenaires!</p>
            <button className="mt-3 text-xs bg-white/20 border border-white/30 px-3 py-1.5 rounded-lg font-medium">
              M'avertir au lancement
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
