/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

interface NearGarage {
  id: string;
  slug: string;
  name: string;
  city: string;
  logoUrl?: string | null;
  avgRating: number;
  reviewCount: number;
  claimStatus?: string;
  phone?: string;
  distanceKm: number | null;
  nextAvailability: { date: string; slots: string[] } | null;
}

function formatDistance(km: number, fr: boolean): string {
  if (km < 1) return `${Math.round(km * 100) * 10} m`;
  return `${km.toFixed(1).replace(".", fr ? "," : ".")} km`;
}

/** « Demain à 9 h », « Jeu. 15 oct. à 13 h 30 » */
function formatNext(next: { date: string; slots: string[] }, fr: boolean): string {
  const [y, m, d] = next.date.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const diff = Math.round((target.getTime() - new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime()) / 86_400_000);
  const day = diff === 0 ? (fr ? "Aujourd'hui" : "Today") : diff === 1 ? (fr ? "Demain" : "Tomorrow")
    : new Intl.DateTimeFormat(fr ? "fr-CA" : "en-CA", { weekday: "short", day: "numeric", month: "short" }).format(target);
  const slot = next.slots[0];
  if (!slot) return day;
  const [h, min] = slot.split(":").map(Number);
  const time = fr ? (min ? `${h} h ${String(min).padStart(2, "0")}` : `${h} h`) : slot;
  return `${day} ${fr ? "à" : "at"} ${time}`;
}

/**
 * Accueil : les trois garages les plus proches du visiteur, en fiches courtes
 * côte à côte. Sans position (localisation refusée ou pas encore demandée), on
 * ne devine rien : on propose d'activer la localisation ou d'entrer un code
 * postal dans la recherche.
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
  const [garages, setGarages] = useState<NearGarage[] | null>(null);
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
            <Link href={`/rechercher?lat=${pos.lat}&lng=${pos.lng}`} className="text-sm font-bold" style={{ color: "#c2410c" }}>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4" aria-hidden="true">
            {[0, 1, 2].map((i) => <div key={i} className="skel rounded-xl" style={{ height: 150 }} />)}
          </div>
        ) : garages.length === 0 ? (
          <p className="text-sm" style={{ color: "#64748b" }}>
            {fr ? "Aucun garage trouvé près de vous pour l'instant." : "No garage found near you yet."}
          </p>
        ) : (
          <ul className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {garages.map((g) => {
              const unclaimed = g.claimStatus === "non_reclamee" || g.claimStatus === "en_attente";
              return (
                <li key={g.id}>
                  <Link href={`/garage/${g.slug}`} className="garago-card flex flex-col h-full p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-11 h-11 flex-shrink-0 rounded-lg flex items-center justify-center overflow-hidden font-black"
                        style={{ background: "#f1f5f9", color: "#0b1f3a", border: "1px solid #e2e8f0" }}>
                        {g.logoUrl ? <img src={g.logoUrl} alt="" className="w-full h-full object-cover" /> : g.name.trim().charAt(0).toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-black text-sm leading-snug" style={{ color: "#0b1f3a" }}>{g.name}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                          {g.city}{g.distanceKm != null ? ` · ${formatDistance(g.distanceKm, fr)}` : ""}
                        </p>
                      </div>
                    </div>

                    <p className="text-xs mt-3" style={{ color: "#64748b" }}>
                      {g.reviewCount > 0
                        ? <><span style={{ color: "#b45309", fontWeight: 700 }}>★ {g.avgRating.toFixed(1).replace(".", fr ? "," : ".")}</span> · {g.reviewCount} {fr ? "avis" : g.reviewCount > 1 ? "reviews" : "review"}</>
                        : (fr ? "Pas encore d'avis" : "No reviews yet")}
                    </p>

                    <p className="text-sm font-bold mt-auto pt-3" style={{ color: unclaimed || !g.nextAvailability ? "#475569" : "#15803d" }}>
                      {unclaimed
                        ? (fr ? `Sur appel${g.phone ? ` : ${g.phone}` : ""}` : `By phone${g.phone ? `: ${g.phone}` : ""}`)
                        : g.nextAvailability
                          ? `${fr ? "Libre" : "Open"} ${formatNext(g.nextAvailability, fr).replace(/^./, (c) => c.toLowerCase())}`
                          : (fr ? "Voir les disponibilités" : "See availability")}
                    </p>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
