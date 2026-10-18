"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getBestPosition } from "@/lib/geolocate";

/** Recherche de garages autour d'un code postal ou de la position du conducteur (ouvre /rechercher). */
export default function NearbySearch() {
  const router = useRouter();
  const [cp, setCp] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"cp" | "loc" | null>(null);

  function onInput(v: string) {
    const raw = v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6);
    setCp(raw.length > 3 ? `${raw.slice(0, 3)} ${raw.slice(3)}` : raw);
    setError("");
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const compact = cp.replace(/\s/g, "");
    if (!/^[ABCEGHJ-NPRSTVXY]\d[A-Z]\d[A-Z]\d$/.test(compact)) { setError("Entrez un code postal complet, par exemple H2X 1Y4."); return; }
    setBusy("cp");
    try {
      const r = await fetch(`/api/geocode/postal?code=${compact}`);
      const d = r.ok ? await r.json() : null;
      if (!d || typeof d.lat !== "number") { setError("Code postal introuvable. Vérifiez-le ou utilisez votre position."); setBusy(null); return; }
      router.push(`/rechercher?lat=${d.lat}&lng=${d.lng}&cp=${encodeURIComponent(`${compact.slice(0, 3)} ${compact.slice(3)}`)}`);
    } catch { setError("Recherche impossible pour l'instant. Réessayez."); setBusy(null); }
  }

  async function locate() {
    setError("");
    setBusy("loc");
    try {
      const fix = await getBestPosition();
      router.push(`/rechercher?lat=${fix.lat}&lng=${fix.lng}`);
    } catch {
      setError("Position non disponible. Autorisez la localisation ou entrez votre code postal.");
      setBusy(null);
    }
  }

  return (
    <form onSubmit={onSubmit} className="mt-6 max-w-xl">
      <div className="flex flex-col sm:flex-row gap-2">
        <label className="flex-1">
          <span className="sr-only">Votre code postal</span>
          <input value={cp} onChange={(e) => onInput(e.target.value)} placeholder="Votre code postal (ex. H2X 1Y4)"
            autoComplete="postal-code" maxLength={7} aria-invalid={!!error}
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-orange-400" />
        </label>
        <button type="submit" disabled={busy !== null}
          className="min-h-[44px] px-5 py-3 rounded-xl text-sm font-bold text-white cursor-pointer disabled:opacity-60" style={{ background: "#e0600c" }}>
          {busy === "cp" ? "Recherche…" : "Voir les garages proches"}
        </button>
      </div>
      <button type="button" onClick={locate} disabled={busy !== null}
        className="mt-3 inline-flex items-center gap-2 min-h-[44px] text-sm font-bold cursor-pointer disabled:opacity-60" style={{ color: "#c2410c" }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden="true"><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M2 12h3M19 12h3" /><circle cx="12" cy="12" r="8" /></svg>
        {busy === "loc" ? "Localisation…" : "Utiliser ma position"}
      </button>
      {error && <p className="mt-2 text-sm text-red-600" role="alert">{error}</p>}
    </form>
  );
}
