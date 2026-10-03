/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import ServiceIcon from "@/components/ServiceIcon";
import { useLang } from "@/contexts/LanguageContext";

interface GarageCardProps {
  garage: {
    slug: string; name: string; city: string; province: string;
    address?: string; description?: string | null; logoUrl?: string | null;
    avgRating: number; reviewCount: number; subscriptionStatus: string;
    isAmbassador?: boolean;
    services: Array<{ category: { name: string; icon?: string | null }; priceMin?: number | null; priceMax?: number | null }>;
    brands: Array<{ brand: string; accepts: boolean }>;
    acceptsWalkIn: boolean; appointmentOnly: boolean;
    claimStatus?: string;
    phone?: string;
  };
  highlightService?: string;
  distance?: string;
  nextAvailability?: { date: string; slots: string[] } | null;
}

// "Aujourd'hui" / "Demain" / nom du jour (ex. "jeu.") selon l'écart avec la date
// du jour courant — calculé côté client pour rester correct quel que soit le
// fuseau du navigateur et suivre la langue active sans dupliquer de traductions.
function formatSlotDay(dateStr: string, lang: "fr" | "en", today: string, tomorrow: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const target = new Date(y, m - 1, d);
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const diffDays = Math.round((target.getTime() - startOfToday.getTime()) / 86_400_000);
  if (diffDays === 0) return today;
  if (diffDays === 1) return tomorrow;
  return new Intl.DateTimeFormat(lang === "fr" ? "fr-CA" : "en-CA", { weekday: "short" }).format(target);
}


// « 08:00 » -> « 8 h », « 14:30 » -> « 14 h 30 » en français ; inchangée en anglais.
function formatSlotTime(time: string, lang: "fr" | "en"): string {
  if (lang !== "fr") return time;
  const [h, m] = time.split(":").map(Number);
  return m ? `${h} h ${String(m).padStart(2, "0")}` : `${h} h`;
}

export default function GarageCard({ garage, highlightService, distance, nextAvailability }: GarageCardProps) {
  const { t, lang } = useLang();
  const c = t.card;

  const acceptedBrands  = garage.brands.filter((b) => b.accepts).slice(0, 5);
  const services        = garage.services.slice(0, 3);
  const rating          = Math.round(garage.avgRating * 10) / 10;
  const ratingFull      = Math.round(rating);
  const slots           = nextAvailability
    ? nextAvailability.slots.map((s) => `${formatSlotDay(nextAvailability.date, lang, c.today, c.tomorrow)} ${formatSlotTime(s, lang)}`)
    : [];
  const isUnclaimed = garage.claimStatus === "non_reclamee" || garage.claimStatus === "en_attente";

  const fr = lang === "fr";
  const brandsAll = garage.brands.filter((b) => b.accepts);

  return (
    <Link href={`/garage/${garage.slug}`} className="block group">
      <div
        className="bg-white overflow-hidden transition-colors"
        style={{ border: "1px solid #cfd7e3", borderRadius: 6 }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#0b1f3a"; }}
        onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = "#cfd7e3"; }}
      >
        <div className="p-4 grid gap-3">

          {/* En-tête : avatar, nom, adresse et distance */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 flex-shrink-0 flex items-center justify-center font-extrabold text-base overflow-hidden"
              style={garage.logoUrl
                ? { background: "#fff", border: "1px solid #e3e8ef", borderRadius: 5 }
                : isUnclaimed
                ? { background: "#e2e7ee", color: "#475569", borderRadius: 5 }
                : { background: "#0b1f3a", color: "#fff", borderRadius: 5 }}>
              {garage.logoUrl
                ? <img src={garage.logoUrl} alt={garage.name} className="w-full h-full object-contain p-0.5" />
                : garage.name.slice(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <h3 className="text-base font-bold leading-snug" style={{ color: "#0f1e33" }}>{garage.name}</h3>
                {garage.isAmbassador && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 font-semibold"
                    style={{ fontSize: 11, borderRadius: 3, background: "#fff7ed", color: "#9a3a00", border: "1px solid #fed7aa" }}>
                    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/>
                    </svg>
                    Ambassadeur
                  </span>
                )}
              </div>
              <p className="text-sm mt-0.5 flex items-start gap-1.5" style={{ color: "#47586f" }}>
                <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                </svg>
                <span>
                  {garage.address ? `${garage.address}, ` : ""}{garage.city}
                  {distance && <span className="font-bold whitespace-nowrap" style={{ color: "#166534" }}> · {distance}</span>}
                </span>
              </p>
            </div>
          </div>

          {/* État : toujours en mots, avec une icône */}
          <div>
            {isUnclaimed ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-bold"
                style={{ borderRadius: 4, background: "#eef1f5", color: "#475569", border: "1px solid #cbd3df" }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h4l2 5-2.5 1.5a11 11 0 005 5L15 13l5 2v4a2 2 0 01-2 2A16 16 0 013 6a2 2 0 012-2z"/></svg>
                {fr ? "À appeler" : "Call to book"}
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-sm font-bold"
                style={{ borderRadius: 4, background: "#e8f6ee", color: "#15803d", border: "1px solid #a6dbb9" }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4M9 15l2 2 4-4"/></svg>
                {fr ? "Réservation en ligne" : "Online booking"}
              </span>
            )}
          </div>

          {/* Avis, marques (logos) et services */}
          <div className="flex flex-wrap items-center gap-1.5">
            {garage.reviewCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold"
                style={{ borderRadius: 4, border: "1px solid #e3e8ef", color: "#47586f" }}>
                <span style={{ color: "#f59e0b" }}>★</span> {rating} {fr ? "sur 5" : "of 5"} · {garage.reviewCount} {fr ? (garage.reviewCount > 1 ? "avis" : "avis") : (garage.reviewCount > 1 ? "reviews" : "review")}
              </span>
            ) : !isUnclaimed ? (
              <span className="text-xs font-medium" style={{ color: "#64748b" }}>{c.newGarage}</span>
            ) : null}
            {acceptedBrands.map((b, i) => (
              <div key={i} title={b.brand}
                className="w-7 h-7 flex items-center justify-center bg-white p-0.5"
                style={{ border: "1px solid #e3e8ef", borderRadius: 4 }}>
                <BrandLogo brand={b.brand} size={20} />
              </div>
            ))}
            {brandsAll.length > 5 && <span className="badge badge-gray">+{brandsAll.length - 5}</span>}
            {services.map((s, i) => (
              <span key={`s${i}`} className="badge badge-navy">
                <ServiceIcon name={s.category.name} size={12} />
                {s.category.name}
              </span>
            ))}
            {garage.services.length > 3 && <span className="badge badge-gray">+{garage.services.length - 3}</span>}
          </div>

          {isUnclaimed ? (
            <>
              <p className="text-sm" style={{ color: "#47586f" }}>
                {fr ? "Pas encore de réservation en ligne pour ce garage." : "No online booking for this garage yet."}
              </p>
              {garage.phone && (
                // Pas de <a> ici : toute la carte est déjà un lien, et deux liens imbriqués
                // sont invalides en HTML (erreur d'hydratation React).
                <span role="link" tabIndex={0}
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); window.location.href = `tel:${garage.phone}`; }}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); window.location.href = `tel:${garage.phone}`; } }}
                  className="w-full py-3 text-center text-sm font-bold block cursor-pointer transition-opacity hover:opacity-90"
                  style={{ background: "#f97316", color: "#1c0a00", borderRadius: 5 }}>
                  {fr ? "Appeler" : "Call"} · {garage.phone}
                </span>
              )}
            </>
          ) : (
            <>
              <div>
                <p className="text-sm font-bold mb-1.5" style={{ color: "#0f1e33" }}>{c.nextSlots}</p>
                {slots.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5">
                    {slots.map((slot) => <div key={slot} className="slot-pill">{slot}</div>)}
                    {garage.acceptsWalkIn && <span className="badge badge-green self-center">{c.walkIn}</span>}
                    {garage.appointmentOnly && <span className="badge badge-navy self-center">{c.byAppt}</span>}
                  </div>
                ) : (
                  <p className="text-sm" style={{ color: "#64748b" }}>{c.noSlots}</p>
                )}
              </div>
              <div className="w-full py-3 text-center text-sm font-bold transition-opacity hover:opacity-90"
                style={{ background: "#f97316", color: "#1c0a00", borderRadius: 5 }}>
                {fr ? "Réserver un rendez-vous" : c.bookAppt}
              </div>
            </>
          )}
        </div>
      </div>
    </Link>
  );
}
