"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import GarageCard from "@/components/GarageCard";
import GarageCardSkeleton from "@/components/GarageCardSkeleton";

type CardGarage = React.ComponentProps<typeof GarageCard>["garage"] & {
  id: string;
  distanceKm: number | null;
  nextAvailability: React.ComponentProps<typeof GarageCard>["nextAvailability"];
};

function formatDistance(km: number): string {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace(".", ",")} km`;
}

/**
 * Accueil : les trois garages les plus proches du visiteur. Sans position
 * (localisation refusée ou pas encore demandée), on ne devine rien : on propose
 * d'activer la localisation ou d'entrer un code postal dans la recherche.
 */
export default function HomeNearbyGarages({
  pos, onLocate, locating, locError, lang,
}: {
  pos: { lat: number; lng: number } | null;
  onLocate: () => void;
  locating: boolean;
  locError: string;
  lang: string;
}) {
  const fr = lang === "fr";
  const [garages, setGarages] = useState<CardGarage[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!pos) return;
    let cancelled = false;
    fetch(`/api/garages?lat=${pos.lat}&lng=${pos.lng}&limit=3`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => { if (!cancelled) { setGarages(Array.isArray(d.garages) ? d.garages.slice(0, 3) : []); setFailed(false); } })
      .catch(() => { if (!cancelled) setFailed(true); });
    return () => { cancelled = true; };
  }, [pos]);

  return (
    <section className="py-10 sm:py-14" style={{ background: "#f8fafc" }} aria-labelledby="near-title">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4 flex-wrap mb-5">
          <h2 id="near-title" className="text-xl sm:text-2xl font-black" style={{ color: "#0b1f3a" }}>
            {fr ? "Les garages les plus proches de vous" : "The garages closest to you"}
          </h2>
          {pos && (
            <Link href={`/rechercher?lat=${pos.lat}&lng=${pos.lng}`} className="text-sm font-bold" style={{ color: "#f97316" }}>
              {fr ? "Voir tous les garages autour" : "See all garages nearby"}
            </Link>
          )}
        </div>

        {!pos ? (
          <div className="bg-white rounded-2xl p-6 sm:p-8 text-center" style={{ border: "1px solid #e2e8f0" }}>
            <p className="text-sm sm:text-base mb-4" style={{ color: "#334155" }}>
              {fr
                ? "Activez la localisation pour voir les trois garages les plus proches, ou entrez votre code postal dans la recherche en haut de la page."
                : "Turn on location to see the three closest garages, or enter your postal code in the search at the top of the page."}
            </p>
            <button type="button" onClick={onLocate} disabled={locating}
              className="px-6 py-3 rounded-xl font-black text-white text-sm disabled:opacity-60" style={{ background: "#f97316" }}>
              {locating ? (fr ? "Localisation en cours…" : "Locating…") : (fr ? "Utiliser ma position" : "Use my location")}
            </button>
            {locError && (
              <p className="text-sm mt-3" role="alert" style={{ color: "#b91c1c" }}>
                {fr
                  ? "La localisation est bloquée par votre navigateur. Autorisez-la dans ses réglages, ou utilisez votre code postal."
                  : "Location is blocked by your browser. Allow it in your browser settings, or use your postal code."}
              </p>
            )}
          </div>
        ) : failed ? (
          <p className="text-sm" style={{ color: "#64748b" }}>
            {fr ? "Impossible de charger les garages pour le moment." : "Garages could not be loaded right now."}
          </p>
        ) : garages === null ? (
          <div className="space-y-4">{[0, 1, 2].map((i) => <GarageCardSkeleton key={i} />)}</div>
        ) : garages.length === 0 ? (
          <p className="text-sm" style={{ color: "#64748b" }}>
            {fr ? "Aucun garage trouvé près de vous pour l'instant." : "No garage found near you yet."}
          </p>
        ) : (
          <div className="space-y-4">
            {garages.map((g) => (
              <GarageCard key={g.id} garage={g}
                distance={g.distanceKm != null ? formatDistance(g.distanceKm) : undefined}
                nextAvailability={g.nextAvailability} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
