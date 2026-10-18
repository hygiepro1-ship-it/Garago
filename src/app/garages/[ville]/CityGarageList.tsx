"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { GARAGE_TYPE_LABEL, type GarageType } from "@/lib/city-insights";

const GarageMap = dynamic(() => import("@/components/GarageMap"), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-gray-100 animate-pulse" aria-hidden="true" />,
});

export interface CityGarage {
  slug: string; name: string; address: string; postalCode: string | null;
  avg: number | null; reviewCount: number; bookable: boolean; type: GarageType;
  latitude: number | null; longitude: number | null;
}

/** Nombre de garages affichés avant « Afficher les autres » (tous restent dans la page, pour les moteurs de recherche). */
const FIRST = 60;

/** Liste des garages d'une ville : carte, filtre par nom ou rue, filtre par type, affichage progressif. */
export default function CityGarageList({ garages, city }: { garages: CityGarage[]; city: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [type, setType] = useState<GarageType | null>(null);
  const [all, setAll] = useState(false);

  const types = useMemo(() => {
    const m = new Map<GarageType, number>();
    for (const g of garages) m.set(g.type, (m.get(g.type) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }, [garages]);

  const norm = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();
  const nq = norm(q.trim());
  const match = (g: CityGarage) => (!type || g.type === type) && (!nq || norm(`${g.name} ${g.address} ${g.postalCode ?? ""}`).includes(nq));
  const filtering = !!nq || !!type;
  const shown = garages.filter(match);

  const onMap = useMemo(() => shown.filter((g) => g.latitude != null && g.longitude != null)
    .map((g) => ({ slug: g.slug, name: g.name, latitude: g.latitude!, longitude: g.longitude!, online: g.bookable })),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- « shown » découle de garages, nq et type
    [garages, nq, type]);

  return (
    <>
      {onMap.length > 0 && (
        <div className="mb-6 h-80 rounded-2xl overflow-hidden border border-gray-200">
          <GarageMap garages={onMap} userPos={null} radiusKm={0} selectedSlug={null} onSelect={(slug) => router.push(`/garage/${slug}`)} />
        </div>
      )}

      <div className="mb-4 flex flex-col sm:flex-row gap-3 sm:items-center">
        <label className="flex-1">
          <span className="sr-only">Filtrer les garages de {city}</span>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)}
            placeholder="Nom du garage, rue ou code postal"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 text-base sm:text-sm focus:outline-none focus:border-orange-400" />
        </label>
        {types.length > 1 && (
          <div role="group" aria-label="Type de garage" className="flex flex-wrap gap-2">
            {types.map(([t, n]) => (
              <button key={t} type="button" aria-pressed={type === t} onClick={() => setType(type === t ? null : t)}
                className="min-h-[40px] px-3 py-1.5 rounded-full text-xs font-bold border cursor-pointer"
                style={type === t ? { background: "#0b1f3a", color: "#fff", borderColor: "#0b1f3a" } : { background: "#fff", color: "#475569", borderColor: "#e2e8f0" }}>
                {GARAGE_TYPE_LABEL[t]} <span className="opacity-60">{n}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mb-3 text-sm text-gray-500" aria-live="polite">
        {filtering ? `${shown.length} garage${shown.length > 1 ? "s" : ""} sur ${garages.length}` : `${garages.length} garage${garages.length > 1 ? "s" : ""}`}
      </p>

      <ul className="grid gap-3 sm:grid-cols-2">
        {garages.map((g) => {
          const visible = match(g);
          // Sans filtre, seuls les FIRST premiers sont affichés tant qu'on n'a pas demandé la suite.
          const rank = visible ? shown.indexOf(g) : -1;
          const hidden = !visible || (!filtering && !all && rank >= FIRST);
          return (
            <li key={g.slug} hidden={hidden}>
              <Link href={`/garage/${g.slug}`}
                className="block h-full rounded-2xl border border-gray-200 bg-white p-4 hover:border-orange-300 hover:shadow-sm transition">
                <span className="block font-bold text-gray-900">{g.name}</span>
                <span className="block text-sm text-gray-600 mt-0.5">{g.address}, {city}{g.postalCode ? ` ${g.postalCode}` : ""}</span>
                <span className="flex flex-wrap items-center gap-3 mt-2 text-xs text-gray-600">
                  {g.avg !== null
                    ? <span className="font-semibold">★ {g.avg.toFixed(1)} · {g.reviewCount} avis</span>
                    : <span>Aucun avis pour l&apos;instant</span>}
                  {g.bookable && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold" style={{ background: "#dcfce7", color: "#166534" }}>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>
                      Réservation en ligne
                    </span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>

      {!filtering && !all && garages.length > FIRST && (
        <div className="mt-5 text-center">
          <button type="button" onClick={() => setAll(true)}
            className="min-h-[44px] px-5 py-2.5 rounded-xl text-sm font-bold border border-gray-300 bg-white cursor-pointer hover:border-orange-300"
            style={{ color: "#0b1f3a" }}>
            Afficher les {garages.length - FIRST} autres garages
          </button>
        </div>
      )}
      {filtering && shown.length === 0 && (
        <p className="mt-4 text-sm text-gray-600">Aucun garage ne correspond à cette recherche.</p>
      )}
    </>
  );
}
